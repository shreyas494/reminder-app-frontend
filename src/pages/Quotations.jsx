import { useEffect, useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import dayjs from "dayjs";
import API from "../services/api";
import { useLocation, useNavigate } from "react-router-dom";

const FIXED_LOGO_STORAGE_KEY = "fixedQuotationLogo";
const FIXED_LOGO_URL = "https://reminder-app-backend-u8wb.onrender.com/assets/company-logo.png";

function resolveLogoUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.includes("yourdomain.com")) return "";
  return raw;
}

function formatCurrency(value) {
  const amount = Math.round(Number(value || 0));
  return `Rs. ${amount}/-`;
}

export default function Quotations() {
  const location = useLocation();
  const navigate = useNavigate();
  const [reminders, setReminders] = useState([]);
  const [reminderPage, setReminderPage] = useState(1);
  const [reminderTotalPages, setReminderTotalPages] = useState(1);
  const [reminderSearch, setReminderSearch] = useState("");

  const [quotations, setQuotations] = useState([]);
  const [quotationPage, setQuotationPage] = useState(1);
  const [quotationTotalPages, setQuotationTotalPages] = useState(1);
  const [quotationTab, setQuotationTab] = useState("all");
  const [quotationSearch, setQuotationSearch] = useState("");

  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState(null);
  const [editorView, setEditorView] = useState("edit");
  const [previewHtml, setPreviewHtml] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);

  const alertAnchorRef = useRef(null);
  const previewSectionRef = useRef(null);

  const isReviewed = Boolean(form?.reviewed);

  useEffect(() => {
    fetchReminders(reminderPage);
  }, [reminderPage]);

  useEffect(() => {
    fetchQuotations(quotationPage, quotationTab);
  }, [quotationPage, quotationTab]);

  useEffect(() => {
    const openQuotationId = location.state?.openQuotationId;
    if (!openQuotationId) return;

    const openFromRedirect = async () => {
      await fetchQuotations(1, quotationTab);
      await openQuotation(openQuotationId);
      if (location.state?.notice) {
        setMessage(location.state.notice);
      }
      navigate(location.pathname, { replace: true, state: null });
    };

    openFromRedirect();
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    if (!message && !error) return;
    if (!alertAnchorRef.current) return;
    alertAnchorRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [message, error]);

  const totals = useMemo(() => {
    if (!form) return { gstAmount: 0, totalAmount: 0 };
    const amount = Number(form.amount || 0);
    const gstPercent = Number(form.gstPercent || 0);
    const gstAmount = form.quotationType === "with-gst" ? (amount * gstPercent) / 100 : 0;
    return { gstAmount, totalAmount: amount + gstAmount };
  }, [form]);

  const filteredReminders = useMemo(() => {
    const term = reminderSearch.trim().toLowerCase();
    if (!term) return reminders;
    return reminders.filter((r) => {
      const haystack = [
        r.clientName,
        r.projectName,
        r.domainName,
        r.email,
        r.mobile1,
        r.mobile2,
        r.serviceType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [reminders, reminderSearch]);

  const filteredQuotations = useMemo(() => {
    const term = quotationSearch.trim().toLowerCase();
    if (!term) return quotations;
    return quotations.filter((q) => {
      const haystack = [
        q.quotationNumber,
        q.recipientName,
        q.clientEmail,
        q.quotationType,
        q.paymentStatus,
        q.subject,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [quotations, quotationSearch]);

  const buildSavePayload = (sourceForm) => ({
    quotationType: sourceForm.quotationType,
    quotationDate: sourceForm.quotationDate,
    clientEmail: sourceForm.clientEmail,
    recipientName: sourceForm.recipientName,
    recipientAddress: sourceForm.recipientAddress,
    subject: sourceForm.subject,
    introText: sourceForm.introText,
    serviceDescription: sourceForm.serviceDescription,
    expiryText: sourceForm.expiryText,
    paymentTerms: sourceForm.paymentTerms,
    amount: Number(sourceForm.amount || 0),
    gstPercent: Number(sourceForm.gstPercent || 0),
    senderName: sourceForm.senderName,
    senderPhone: sourceForm.senderPhone,
    companyName: sourceForm.companyName,
    companyAddress: sourceForm.companyAddress,
    companyRegistration: sourceForm.companyRegistration,
    companyPhone: sourceForm.companyPhone,
    companyTagline: sourceForm.companyTagline,
    companyLogoUrl:
      resolveLogoUrl(sourceForm.companyLogoUrl) ||
      localStorage.getItem(FIXED_LOGO_STORAGE_KEY) ||
      FIXED_LOGO_URL,
  });

  async function fetchReminders(page) {
    try {
      const res = await API.get(`/reminders?page=${page}`);
      setReminders(res.data.data || []);
      setReminderPage(res.data.page || 1);
      setReminderTotalPages(res.data.totalPages || 1);
    } catch {
      setError("Failed to load reminders");
    }
  }

  async function fetchQuotations(page, tab = "all") {
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (tab === "paid") {
        params.set("status", "paid");
      } else if (tab === "gst") {
        params.set("quotationType", "with-gst");
      } else if (tab === "non-gst") {
        params.set("quotationType", "without-gst");
      }

      const res = await API.get(`/quotations?${params.toString()}`);
      setQuotations(res.data.data || []);
      setQuotationPage(res.data.page || 1);
      setQuotationTotalPages(res.data.totalPages || 1);
    } catch {
      setError("Failed to load quotations");
    }
  }

  async function createQuotation(reminderId, quotationType) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await API.post(`/quotations/from-reminder/${reminderId}`, { quotationType });
      await fetchQuotations(1);
      await openQuotation(res.data._id);
      setMessage("Quotation draft created. Please edit and save before download/send.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create quotation");
    } finally {
      setBusy(false);
    }
  }

  async function fetchQuotationRecord(id) {
    const res = await API.get(`/quotations/${id}`);
    const fixedLogo = localStorage.getItem(FIXED_LOGO_STORAGE_KEY) || FIXED_LOGO_URL;
    return {
      ...res.data,
      companyLogoUrl: resolveLogoUrl(res.data.companyLogoUrl) || fixedLogo,
    };
  }

  async function generatePaymentLinkForQuotation(id) {
    try {
      return await API.post(`/quotations/${id}/payment-link`);
    } catch (linkErr) {
      if (linkErr?.response?.status === 404) {
        return await API.post(`/quotations/payment-link/${id}`);
      }
      throw linkErr;
    }
  }

  async function downloadQuotationFromList(id) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const quotation = await fetchQuotationRecord(id);
      const paymentRes = await generatePaymentLinkForQuotation(id);
      const paymentLinkUrl = paymentRes?.data?.paymentLinkUrl || "";
      const paymentMessage = String(paymentRes?.data?.message || "").toLowerCase();
      const noPaymentDue = paymentMessage.includes("no payment due");

      if (!paymentLinkUrl && !noPaymentDue) {
        throw new Error("Payment link URL is empty. This may be a temporary issue with the payment gateway. Please try again in a moment.");
      }

      const doc = await buildPdfDocument(paymentLinkUrl, quotation);
      doc.save(`${quotation.quotationNumber || "quotation"}.pdf`);

      await fetchQuotations(quotationPage, quotationTab);
      setMessage("Quotation downloaded successfully.");
    } catch (err) {
      const serverMessage = err?.response?.data?.message;
      if (err.message?.includes("Payment link")) {
        setError(err.message);
      } else {
        setError(serverMessage || err.message || "Failed to download quotation");
      }
    } finally {
      setBusy(false);
    }
  }

  async function sendQuotationFromList(id) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const quotation = await fetchQuotationRecord(id);
      if (!quotation.reviewed) {
        throw new Error("Manual edit/review is required before sending quotation");
      }

      const paymentRes = await generatePaymentLinkForQuotation(id);
      const paymentLinkUrl = paymentRes?.data?.paymentLinkUrl || "";
      const paymentLinkId = paymentRes?.data?.paymentLinkId || "";
      const paymentMessage = String(paymentRes?.data?.message || "").toLowerCase();
      const noPaymentDue = paymentMessage.includes("no payment due");

      if (!paymentLinkUrl && !noPaymentDue) {
        throw new Error("Payment link URL is empty. This may be a temporary issue with the payment gateway. Please try again in a moment.");
      }

      const pdfDoc = await buildPdfDocument(paymentLinkUrl, quotation);
      const pdfDataUri = pdfDoc.output("datauristring");
      const pdfBase64 = pdfDataUri.includes(",") ? pdfDataUri.split(",")[1] : "";

      await API.post(`/quotations/${id}/send`, { pdfBase64, paymentLinkUrl, paymentLinkId });
      await fetchQuotations(quotationPage, quotationTab);
      setMessage(noPaymentDue ? "Quotation email sent successfully (payment already completed)." : "Quotation email sent successfully.");
    } catch (err) {
      const serverMessage = err?.response?.data?.message;
      if (err.message?.includes("Payment link")) {
        setError(err.message);
      } else {
        setError(serverMessage || err.message || "Failed to send quotation");
      }
    } finally {
      setBusy(false);
    }
  }

  async function openQuotation(id, options = {}) {
    const shouldScrollToPreview = options.scrollToPreview !== false;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await API.get(`/quotations/${id}`);
      setSelectedId(id);
      setEditorView("edit");
      const fixedLogo = localStorage.getItem(FIXED_LOGO_STORAGE_KEY) || FIXED_LOGO_URL;
      const resolvedLogo = resolveLogoUrl(res.data.companyLogoUrl) || fixedLogo;
      setForm({
        ...res.data,
        companyLogoUrl: resolvedLogo,
      });
      setPreviewHtml(res.data.previewHtml || "");
      setIsPreviewOpen(true);

      if (shouldScrollToPreview) {
        setTimeout(() => {
          previewSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 120);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load quotation");
    } finally {
      setBusy(false);
    }
  }

  async function saveQuotation() {
    if (!form) return;
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const payload = buildSavePayload(form);
      const saveRes = await API.put(`/quotations/${form._id}`, payload);
      const activeQuotationId = saveRes?.data?._id || form._id;

      await openQuotation(activeQuotationId, { scrollToPreview: false });
      await fetchQuotations(quotationPage, quotationTab);
      setIsPreviewOpen(false);
      setMessage("Quotation saved as a new version.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save quotation");
    } finally {
      setBusy(false);
    }
  }

  async function sendQuotation() {
    if (!form) return;
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const savePayload = buildSavePayload(form);
      const saveRes = await API.put(`/quotations/${form._id}`, savePayload);
      const activeQuotationId = saveRes?.data?._id || form._id;
      const activeForm = { ...form, ...(saveRes?.data || {}), _id: activeQuotationId };

      let paymentRes;
      let linkError;
      try {
        paymentRes = await API.post(`/quotations/${activeQuotationId}/payment-link`);
      } catch (linkErr) {
        linkError = linkErr;
        if (linkErr?.response?.status === 404) {
          try {
            paymentRes = await API.post(`/quotations/payment-link/${activeQuotationId}`);
            linkError = null;
          } catch (fallbackErr) {
            linkError = fallbackErr;
          }
        }
      }

      if (linkError) {
        const errorMsg = linkError?.response?.data?.message || linkError?.message;
        throw new Error(`Payment link generation failed: ${errorMsg || "Unknown error from Razorpay"}`);
      }

      const paymentLinkUrl = paymentRes?.data?.paymentLinkUrl || "";
      const paymentLinkId = paymentRes?.data?.paymentLinkId || "";
      const paymentMessage = String(paymentRes?.data?.message || "").toLowerCase();
      const noPaymentDue = paymentMessage.includes("no payment due");

      if (!paymentLinkUrl && !noPaymentDue) {
        throw new Error("Payment link URL is empty. This may be a temporary issue with the payment gateway. Please try again in a moment.");
      }

      const pdfDoc = await buildPdfDocument(paymentLinkUrl, activeForm);
      const pdfDataUri = pdfDoc.output("datauristring");
      const pdfBase64 = pdfDataUri.includes(",") ? pdfDataUri.split(",")[1] : "";

      await API.post(`/quotations/${activeQuotationId}/send`, { pdfBase64, paymentLinkUrl, paymentLinkId });
      await openQuotation(activeQuotationId, { scrollToPreview: false });
      await fetchQuotations(quotationPage, quotationTab);
      setMessage(noPaymentDue ? "Quotation email sent successfully (payment already completed)." : "Quotation email sent successfully.");
    } catch (err) {
      const status = err?.response?.status;
      const serverMessage = err?.response?.data?.message;
      if (status === 404) {
        setError(serverMessage || "Quotation API endpoint not found on deployed backend. Please redeploy backend and try again.");
      } else if (err.message?.includes("Payment link")) {
        setError(err.message);
      } else {
        setError(serverMessage || err.message || "Failed to send quotation");
      }
    } finally {
      setBusy(false);
    }
  }

  async function toDataUrl(imageUrl) {
    if (!imageUrl) return null;
    if (String(imageUrl).startsWith("data:image")) {
      return imageUrl;
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  const buildPaymentQrUrl = (url) => {
    const encoded = encodeURIComponent(String(url || "").trim());
    if (!encoded) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=0&data=${encoded}`;
  };

  async function downloadPdf() {
    if (!form) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      const savePayload = buildSavePayload(form);
      const saveRes = await API.put(`/quotations/${form._id}`, savePayload);
      const activeQuotationId = saveRes?.data?._id || form._id;
      const activeForm = { ...form, ...(saveRes?.data || {}), _id: activeQuotationId };

      let paymentRes;
      let linkError;
      try {
        paymentRes = await API.post(`/quotations/${activeQuotationId}/payment-link`);
      } catch (linkErr) {
        linkError = linkErr;
        if (linkErr?.response?.status === 404) {
          try {
            paymentRes = await API.post(`/quotations/payment-link/${activeQuotationId}`);
            linkError = null;
          } catch (fallbackErr) {
            linkError = fallbackErr;
          }
        }
      }

      if (linkError) {
        const errorMsg = linkError?.response?.data?.message || linkError?.message;
        throw new Error(`Payment link generation failed: ${errorMsg || "Unknown error from Razorpay"}`);
      }

      const paymentLinkUrl = paymentRes?.data?.paymentLinkUrl || "";
      const paymentMessage = String(paymentRes?.data?.message || "").toLowerCase();
      const noPaymentDue = paymentMessage.includes("no payment due");

      if (!paymentLinkUrl && !noPaymentDue) {
        throw new Error("Payment link URL is empty. This may be a temporary issue with the payment gateway. Please try again in a moment.");
      }

      const doc = await buildPdfDocument(paymentLinkUrl, activeForm);
      doc.save(`${activeForm.quotationNumber || "quotation"}.pdf`);

      await openQuotation(activeQuotationId, { scrollToPreview: false });
      await fetchQuotations(quotationPage, quotationTab);
      setMessage("Quotation downloaded successfully.");
    } catch (err) {
      const serverMessage = err?.response?.data?.message;
      if (err.message?.includes("Payment link")) {
        setError(err.message);
      } else {
        setError(serverMessage || err.message || "Failed to download quotation");
      }
    } finally {
      setBusy(false);
    }
  }

  async function buildPdfDocument(paymentLinkUrl = "", sourceForm = null) {
    const q = sourceForm || form;
    if (!q) throw new Error("No quotation selected");

    const doc = new jsPDF("p", "pt", "a4");
    const pageW = 595;
    const pageH = 842;
    const margin = 28;
    const contentW = pageW - margin * 2;
    const showGst = q.quotationType === "with-gst";
    const localAmount = Number(q.amount || 0);
    const localGstPercent = Number(q.gstPercent || 0);
    const localGstAmount = showGst ? (localAmount * localGstPercent) / 100 : 0;
    const localTotals = { gstAmount: localGstAmount, totalAmount: localAmount + localGstAmount };

    const txt = (text, x, y, opts = {}) => {
      doc.setFont("helvetica", opts.bold ? "bold" : "normal");
      doc.setFontSize(opts.size || 10);
      doc.setTextColor(...(opts.color || [26, 26, 26]));
      doc.text(String(text || ""), x, y, opts.align ? { align: opts.align } : undefined);
    };

    const ensureSpace = (requiredHeight = 80) => {
      if (y + requiredHeight <= pageH - 90) return;
      doc.addPage();
      y = margin + 20;
    };

    const headerH = 84;
    doc.setFillColor(15, 44, 92);
    doc.rect(0, 0, pageW, headerH, "F");
    doc.setFillColor(29, 79, 145);
    doc.triangle(pageW - 170, 0, pageW, 0, pageW, headerH, "F");
    doc.triangle(pageW - 230, 0, pageW - 160, 0, pageW, headerH, "F");

    const logoSource =
      resolveLogoUrl(q.companyLogoUrl) ||
      localStorage.getItem(FIXED_LOGO_STORAGE_KEY) ||
      FIXED_LOGO_URL;
    try {
      const logoDataUrl = await toDataUrl(logoSource);
      if (logoDataUrl) {
        const fmt = logoDataUrl.includes("image/png") ? "PNG" : "JPEG";
        doc.setFillColor(255, 255, 255);
        doc.rect(16, 12, 78, 58, "F");
        doc.addImage(logoDataUrl, fmt, 20, 16, 70, 50);
      }
    } catch (logoError) {
      console.warn("[QUOTATION_PDF] Failed to load logo:", logoError);
    }

    txt(q.companyName || "", 104, 28, { bold: true, size: 14, color: [255, 255, 255] });
    txt(q.companyAddress || "", 104, 42, { size: 8, color: [208, 221, 242] });
    if (q.companyRegistration) {
      txt(`Reg. No: ${q.companyRegistration}  ·  Mobile: ${q.companyPhone || ""}`, 104, 53, {
        size: 8,
        color: [208, 221, 242],
      });
    }
    if (q.companyTagline) {
      txt(q.companyTagline, 104, 64, { bold: true, size: 8, color: [234, 241, 255] });
    }

    txt("QUOTATION", pageW - margin, 30, { bold: true, size: 20, align: "right", color: [255, 255, 255] });
    txt(`Ref No: ${q.quotationNumber || "-"}`, pageW - margin, 47, {
      size: 8,
      align: "right",
      color: [208, 221, 242],
    });
    txt(`Date: ${dayjs(q.quotationDate).format("DD/MM/YYYY")}`, pageW - margin, 58, {
      size: 8,
      align: "right",
      color: [208, 221, 242],
    });

    let y = headerH + 14;

    const blockGap = 16;
    const blockW = (contentW - blockGap) / 2;
    const blockH = 78;
    doc.setDrawColor(212, 222, 238);
    doc.rect(margin, y, blockW, blockH);
    doc.rect(margin + blockW + blockGap, y, blockW, blockH);
    txt("Bill To", margin + 8, y + 14, { bold: true, size: 9, color: [55, 91, 145] });
    txt(q.recipientName || "", margin + 8, y + 28, { bold: true, size: 10, color: [17, 24, 39] });
    if (q.recipientAddress) {
      const billAddress = doc.splitTextToSize(q.recipientAddress, blockW - 16);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(75, 85, 99);
      doc.text(billAddress, margin + 8, y + 42);
    }

    txt("From", margin + blockW + blockGap + 8, y + 14, { bold: true, size: 9, color: [55, 91, 145] });
    txt(q.companyName || "", margin + blockW + blockGap + 8, y + 28, { bold: true, size: 10, color: [17, 24, 39] });
    const fromLines = doc.splitTextToSize(q.companyAddress || "", blockW - 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(75, 85, 99);
    doc.text(fromLines, margin + blockW + blockGap + 8, y + 41);
    const signerLine = [q.senderName, q.senderPhone].filter(Boolean).join(" · ");
    if (signerLine) {
      txt(signerLine, margin + blockW + blockGap + 8, y + 67, { size: 8.5, color: [75, 85, 99] });
    }
    y += blockH + 14;

    txt(q.subject || "", margin, y, { bold: true, size: 13, color: [15, 44, 92] });
    y += 14;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    const introLines = doc.splitTextToSize(q.introText || "", contentW);
    doc.text(introLines, margin, y);
    y += introLines.length * 11 + 14;

    const srW = 52;
    const descW = 330;
    const chargeW = contentW - srW - descW;
    const rowH = 24;

    const drawRow = (top, sr, desc, charge, bold = false, shade = false) => {
      if (shade) {
        doc.setFillColor(241, 246, 255);
        doc.rect(margin, top, contentW, rowH, "F");
      }
      doc.setDrawColor(201, 215, 238);
      doc.rect(margin, top, srW, rowH);
      doc.rect(margin + srW, top, descW, rowH);
      doc.rect(margin + srW + descW, top, chargeW, rowH);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(9);
      doc.setTextColor(26, 26, 26);
      doc.text(String(sr), margin + 6, top + 15);
      doc.text(String(desc), margin + srW + 6, top + 15);
      doc.text(String(charge), margin + srW + descW + chargeW - 6, top + 15, { align: "right" });
    };

    doc.setFillColor(23, 58, 115);
    doc.rect(margin, y, contentW, rowH, "F");
    doc.setDrawColor(201, 215, 238);
    doc.rect(margin, y, srW, rowH);
    doc.rect(margin + srW, y, descW, rowH);
    doc.rect(margin + srW + descW, y, chargeW, rowH);
    txt("No.", margin + 6, y + 15, { bold: true, size: 9, color: [255, 255, 255] });
    txt("Description", margin + srW + 6, y + 15, { bold: true, size: 9, color: [255, 255, 255] });
    txt("Amount", margin + srW + descW + chargeW - 6, y + 15, { bold: true, size: 9, align: "right", color: [255, 255, 255] });
    y += rowH;

    drawRow(y, "1", String(q.serviceDescription || ""), formatCurrency(q.amount)); y += rowH;
    if (showGst) {
      drawRow(y, "", `GST (${q.gstPercent}%)`, formatCurrency(localTotals.gstAmount)); y += rowH;
    }
    drawRow(y, "", "Total", formatCurrency(localTotals.totalAmount), true, true); y += rowH + 10;

    const amountBoxW = 220;
    const amountBoxH = 30;
    doc.setFillColor(29, 79, 145);
    doc.rect(pageW - margin - amountBoxW, y, amountBoxW, amountBoxH, "F");
    txt(`Amount Due: ${formatCurrency(localTotals.totalAmount)}`, pageW - margin - 10, y + 19, {
      bold: true,
      size: 10,
      align: "right",
      color: [255, 255, 255],
    });
    y += amountBoxH + 12;

    if (showGst) {
      const noteH = 20;
      doc.setFillColor(243, 247, 255);
      doc.setDrawColor(201, 215, 238);
      doc.rect(margin, y, contentW, noteH, "FD");
      txt(`Note: GST @ ${q.gstPercent}% is included in the above total.`, margin + 8, y + 14, {
        size: 8.5,
        color: [75, 85, 99],
      });
      y += noteH + 10;
    }

    ensureSpace(120);
    txt("Payment Info", margin, y, { bold: true, size: 9, color: [55, 91, 145] });
    y += 12;

    const paymentTermLines = doc.splitTextToSize(q.paymentTerms || "", contentW);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(75, 85, 99);
    doc.text(paymentTermLines, margin, y);
    y += paymentTermLines.length * 10 + 6;

    const finalPaymentLinkUrl = paymentLinkUrl || q.paymentLinkUrl || "";
    const paymentLinkRaw = `Payment Link: ${finalPaymentLinkUrl || "Not available"}`;
    const paymentLinkLines = doc.splitTextToSize(paymentLinkRaw, contentW);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(finalPaymentLinkUrl ? 37 : 75, finalPaymentLinkUrl ? 99 : 85, finalPaymentLinkUrl ? 235 : 99);
    doc.text(paymentLinkLines, margin, y);
    doc.setTextColor(75, 85, 99);

    y += paymentLinkLines.length * 10 + 10;

    if (finalPaymentLinkUrl) {
      try {
        ensureSpace(120);
        txt("Scan to Pay", margin, y, { bold: true, size: 8.5, color: [55, 91, 145] });
        y += 8;
        const qrDataUrl = await toDataUrl(buildPaymentQrUrl(finalPaymentLinkUrl));
        if (qrDataUrl) {
          doc.setDrawColor(201, 215, 238);
          doc.rect(margin, y, 72, 72);
          doc.addImage(qrDataUrl, "PNG", margin + 2, y + 2, 68, 68);
          y += 82;
        }
      } catch (qrError) {
        console.warn("[QUOTATION_PDF] Failed to generate payment QR:", qrError);
      }
    }

    ensureSpace(40);
    txt("Notes", margin, y, { bold: true, size: 9, color: [55, 91, 145] });
    txt("Please give us your confirmation for the renewal as soon as possible.", margin, y + 12, {
      size: 8.5,
      color: [75, 85, 99],
    });

    const signBaseY = pageH - 86;
    txt("Authorized Signatory", pageW - margin, signBaseY, { size: 8.5, align: "right", color: [107, 114, 128] });
    txt(q.senderName || q.companyName || "", pageW - margin, signBaseY + 14, {
      bold: true,
      size: 10,
      align: "right",
      color: [17, 24, 39],
    });

    const footerY = pageH - 30;
    doc.setDrawColor(201, 215, 238);
    doc.line(margin, footerY, pageW - margin, footerY);

    return doc;
  }

  return (
    <div className="min-h-[calc(100vh-64px)] px-3 sm:px-6 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-white">Manual Quotations</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create quotation from reminder, manually edit, review, then download PDF or send email.
          </p>
        </div>

        <div ref={alertAnchorRef} />

        {error && <div className="rounded-xl p-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm">{error}</div>}
        {message && <div className="rounded-xl p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{message}</div>}

        <section className="rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-white/85 dark:bg-slate-900/80 backdrop-blur-sm p-3 sm:p-4 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Reminders (Create Quotation)</h2>
          <div className="max-w-sm">
            <label className="space-y-1 block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Search reminders</span>
              <input
                type="text"
                value={reminderSearch}
                onChange={(e) => setReminderSearch(e.target.value)}
                placeholder="Search client, project, email, service type"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              />
            </label>
          </div>
          <div className="overflow-x-auto rounded-xl border border-indigo-100 dark:border-indigo-900/40">
            <table className="min-w-[760px] w-full text-sm">
              <thead className="bg-indigo-50/70 dark:bg-indigo-950/30">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Client</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Project</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Email</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReminders.map((r) => (
                  <tr key={r._id} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-100">{r.clientName}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{r.projectName}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300 break-all">{r.email || "No email"}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          disabled={busy}
                          onClick={() => createQuotation(r._id, "with-gst")}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                          Create GST
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => createQuotation(r._id, "without-gst")}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-60"
                        >
                          Create Non-GST
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredReminders.length === 0 && (
                  <tr>
                    <td className="px-3 py-4 text-slate-500" colSpan={4}>No reminders found on this page.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pager page={reminderPage} totalPages={reminderTotalPages} onPrev={() => setReminderPage((p) => Math.max(1, p - 1))} onNext={() => setReminderPage((p) => Math.min(reminderTotalPages, p + 1))} />
        </section>

        <section className="rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-white/85 dark:bg-slate-900/80 backdrop-blur-sm p-3 sm:p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-2">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Quotation Records</h2>
              <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    setQuotationTab("all");
                    setQuotationPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold ${quotationTab === "all" ? "bg-indigo-600 text-white" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"}`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuotationTab("paid");
                    setQuotationPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold ${quotationTab === "paid" ? "bg-emerald-600 text-white" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"}`}
                >
                  Paid
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuotationTab("gst");
                    setQuotationPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold ${quotationTab === "gst" ? "bg-amber-600 text-white" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"}`}
                >
                  GST
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuotationTab("non-gst");
                    setQuotationPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold ${quotationTab === "non-gst" ? "bg-slate-700 text-white" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"}`}
                >
                  Non-GST
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full sm:w-auto">
              <button disabled={!form || !isReviewed || busy} onClick={downloadPdf} className="w-full px-3 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white disabled:opacity-50">Download PDF</button>
              <button disabled={!form || !isReviewed || busy} onClick={sendQuotation} className="w-full px-3 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white disabled:opacity-50">Send Email</button>
            </div>
          </div>

          <div className="max-w-sm">
            <label className="space-y-1 block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Search quotations</span>
              <input
                type="text"
                value={quotationSearch}
                onChange={(e) => setQuotationSearch(e.target.value)}
                placeholder="Search quotation no, client, email, status"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              />
            </label>
          </div>

          <div className="overflow-x-auto rounded-xl border border-indigo-100 dark:border-indigo-900/40">
            <table className="min-w-[880px] w-full text-sm">
              <thead className="bg-indigo-50/70 dark:bg-indigo-950/30">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Quotation No</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Client</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Type</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Email</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Total</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Payment</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Reviewed</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Sent</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotations.map((q) => (
                  <tr
                    key={q._id}
                    className={`border-t border-slate-200 dark:border-slate-700 ${selectedId === q._id ? "bg-indigo-50/60 dark:bg-indigo-900/20" : ""}`}
                  >
                    <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-100">{q.quotationNumber}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{q.recipientName || "-"}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{q.quotationType === "with-gst" ? "With GST" : "Without GST"}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300 break-all">{q.clientEmail || "-"}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{formatCurrency(q.totalAmount || 0)}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${q.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-700" : q.paymentStatus === "partial" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"}`}>
                        {String(q.paymentStatus || "unpaid").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${q.reviewed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {q.reviewed ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${q.sent ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"}`}>
                        {q.sent ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <IconButton
                          label="Open quotation"
                          title="Open"
                          className="bg-indigo-600 text-white hover:bg-indigo-700"
                          onClick={() => openQuotation(q._id)}
                        >
                          <OpenIcon />
                        </IconButton>
                        <IconButton
                          label="Download quotation"
                          title="Download"
                          className="bg-blue-600 text-white hover:bg-blue-700"
                          onClick={() => downloadQuotationFromList(q._id)}
                        >
                          <DownloadIcon />
                        </IconButton>
                        <IconButton
                          label="Email quotation"
                          title="Email"
                          className="bg-emerald-600 text-white hover:bg-emerald-700"
                          onClick={() => sendQuotationFromList(q._id)}
                        >
                          <MailIcon />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredQuotations.length === 0 && (
                  <tr>
                    <td className="px-3 py-4 text-slate-500" colSpan={10}>No quotation records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pager page={quotationPage} totalPages={quotationTotalPages} onPrev={() => setQuotationPage((p) => Math.max(1, p - 1))} onNext={() => setQuotationPage((p) => Math.min(quotationTotalPages, p + 1))} />
        </section>

        <section className="rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-white/85 dark:bg-slate-900/80 backdrop-blur-sm p-3 sm:p-4 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Selected Quotation Record</h2>
          {!form ? (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-sm text-slate-500">
              Select a quotation record from the table above to edit and review.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-slate-600">Quotation Details</h3>
                  <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setEditorView("static")}
                      className={`px-3 py-1.5 text-xs font-semibold ${editorView === "static" ? "bg-indigo-600 text-white" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"}`}
                    >
                      Static Info
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorView("edit")}
                      className={`px-3 py-1.5 text-xs font-semibold ${editorView === "edit" ? "bg-indigo-600 text-white" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"}`}
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {editorView === "static" ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input label="Quotation Number" value={form.quotationNumber || ""} readOnly />
                      <Input label="Quotation Date" value={dayjs(form.quotationDate).format("DD MMM YYYY")} readOnly />
                      <Input label="Quotation Type" value={form.quotationType === "with-gst" ? "With GST" : "Without GST"} readOnly />
                      <Input label="Client Email" value={form.clientEmail || ""} readOnly />
                      <Input label="Recipient Name" value={form.recipientName || ""} onChange={(v) => setForm({ ...form, recipientName: v })} />
                      <Input label="Recipient Address" value={form.recipientAddress || ""} onChange={(v) => setForm({ ...form, recipientAddress: v })} />
                      <Input label="Subject" value={form.subject || ""} onChange={(v) => setForm({ ...form, subject: v })} />
                      <Input label="Service Description" value={form.serviceDescription || ""} onChange={(v) => setForm({ ...form, serviceDescription: v })} />
                    </div>

                    <button
                      disabled={busy}
                      onClick={saveQuotation}
                      className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Save Manual Edits (Required)
                    </button>
                  </>
                ) : (
                  <>
                    <TextArea label="Intro Text" value={form.introText || ""} onChange={(v) => setForm({ ...form, introText: v })} />
                    <Input
                      label="Client Name"
                      value={form.recipientName || ""}
                      onChange={(v) => setForm({ ...form, recipientName: v })}
                    />
                    <Input label="Amount" type="number" value={form.amount ?? 0} onChange={(v) => setForm({ ...form, amount: v })} />

                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-sm">
                      {form.quotationType === "with-gst" && (
                        <p><strong>Calculated GST:</strong> {formatCurrency(totals.gstAmount)}</p>
                      )}
                      <p><strong>Calculated Total:</strong> {formatCurrency(totals.totalAmount)}</p>
                    </div>

                    <button
                      disabled={busy}
                      onClick={saveQuotation}
                      className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Save Manual Edits (Required)
                    </button>
                  </>
                )}
              </div>

              <div ref={previewSectionRef} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="text-sm font-bold text-slate-600">Review Preview</h3>
                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen((prev) => !prev)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 text-slate-600 hover:bg-slate-100"
                  >
                    {isPreviewOpen ? "Close Preview" : "Open Preview"}
                  </button>
                </div>

                {isPreviewOpen ? (
                  <div className="max-h-[520px] overflow-auto bg-white rounded-lg border border-slate-200">
                    <div className="min-w-[760px]" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                    Preview is closed.
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, readOnly = false, type = "text" }) {
  return (
    <label className="space-y-1 block">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
      />
    </label>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <label className="space-y-1 block">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <textarea
        value={value}
        rows={4}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
      />
    </label>
  );
}

function Pager({ page, totalPages, onPrev, onNext }) {
  return (
    <div className="flex items-center justify-between pt-2">
      <button onClick={onPrev} disabled={page <= 1} className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 disabled:opacity-50">
        Prev
      </button>
      <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
      <button onClick={onNext} disabled={page >= totalPages} className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 disabled:opacity-50">
        Next
      </button>
    </div>
  );
}

function IconButton({ children, label, title, className, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${className}`}
    >
      {children}
    </button>
  );
}

function OpenIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[2]" aria-hidden="true">
      <path d="M14 3h7v7" />
      <path d="M10 14L21 3" />
      <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[2]" aria-hidden="true">
      <path d="M12 3v10" />
      <path d="M8 9l4 4 4-4" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[2]" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}
