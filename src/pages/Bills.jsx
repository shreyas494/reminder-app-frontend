import { useEffect, useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import dayjs from "dayjs";
import API from "../services/api";

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

export default function Bills() {
  const [paidQuotations, setPaidQuotations] = useState([]);
  const [paidPage, setPaidPage] = useState(1);
  const [paidTotalPages, setPaidTotalPages] = useState(1);
  const [paidSearch, setPaidSearch] = useState("");

  const [bills, setBills] = useState([]);
  const [billPage, setBillPage] = useState(1);
  const [billTotalPages, setBillTotalPages] = useState(1);
  const [billSearch, setBillSearch] = useState("");

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
    fetchPaidQuotations(paidPage);
  }, [paidPage]);

  useEffect(() => {
    fetchBills(billPage);
  }, [billPage]);

  useEffect(() => {
    if (!message && !error) return;
    if (!alertAnchorRef.current) return;
    alertAnchorRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [message, error]);

  const totals = useMemo(() => {
    if (!form) return { gstAmount: 0, totalAmount: 0 };
    const amount = Number(form.amount || 0);
    const gstPercent = Number(form.gstPercent || 0);
    const gstAmount = form.billType === "with-gst" ? (amount * gstPercent) / 100 : 0;
    return { gstAmount, totalAmount: amount + gstAmount };
  }, [form]);

  const filteredPaidQuotations = useMemo(() => {
    const term = paidSearch.trim().toLowerCase();
    if (!term) return paidQuotations;
    return paidQuotations.filter((q) => {
      const haystack = [
        q.quotationNumber,
        q.recipientName,
        q.clientEmail,
        q.serviceType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [paidQuotations, paidSearch]);

  const filteredBills = useMemo(() => {
    const term = billSearch.trim().toLowerCase();
    if (!term) return bills;
    return bills.filter((b) => {
      const haystack = [
        b.billNumber,
        b.recipientName,
        b.clientEmail,
        b.subject,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [bills, billSearch]);

  const buildSavePayload = (sourceForm) => ({
    billType: sourceForm.billType,
    billDate: sourceForm.billDate,
    serviceType: sourceForm.serviceType,
    clientEmail: sourceForm.clientEmail,
    recipientName: sourceForm.recipientName,
    recipientAddress: sourceForm.recipientAddress,
    subject: sourceForm.subject,
    introText: sourceForm.introText,
    serviceDescription: sourceForm.serviceDescription,
    paymentTerms: sourceForm.paymentTerms,
    amount: Number(sourceForm.amount || 0),
    gstPercent: Number(sourceForm.gstPercent || 0),
    amountPaid: Number(sourceForm.amountPaid || 0),
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

  async function fetchPaidQuotations(page) {
    try {
      const res = await API.get(`/bills/paid-quotations?page=${page}`);
      setPaidQuotations(res.data.data || []);
      setPaidPage(res.data.page || 1);
      setPaidTotalPages(res.data.totalPages || 1);
    } catch {
      setError("Failed to load paid quotations");
    }
  }

  async function fetchBills(page) {
    try {
      const res = await API.get(`/bills?page=${page}`);
      setBills(res.data.data || []);
      setBillPage(res.data.page || 1);
      setBillTotalPages(res.data.totalPages || 1);
    } catch {
      setError("Failed to load bills");
    }
  }

  async function createBill(quotationId) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await API.post(`/bills/from-quotation/${quotationId}`);
      await fetchBills(1);
      await openBill(res.data._id);
      setMessage("Bill draft created. Please edit and save before download/send.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create bill");
    } finally {
      setBusy(false);
    }
  }

  async function openBill(id, options = {}) {
    const shouldScrollToPreview = options.scrollToPreview !== false;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await API.get(`/bills/${id}`);
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
      setError(err.response?.data?.message || "Failed to load bill");
    } finally {
      setBusy(false);
    }
  }

  async function saveBill() {
    if (!form) return;
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const payload = buildSavePayload(form);
      const saveRes = await API.put(`/bills/${form._id}`, payload);
      const activeBillId = saveRes?.data?._id || form._id;

      await openBill(activeBillId, { scrollToPreview: false });
      await fetchBills(billPage);
      setIsPreviewOpen(false);
      setMessage("Bill saved successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save bill");
    } finally {
      setBusy(false);
    }
  }

  async function sendBill() {
    if (!form) return;
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const savePayload = buildSavePayload(form);
      await API.put(`/bills/${form._id}`, savePayload);
      const pdfDoc = await buildPdfDocument();
      const pdfDataUri = pdfDoc.output("datauristring");
      const pdfBase64 = pdfDataUri.includes(",") ? pdfDataUri.split(",")[1] : "";

      await API.post(`/bills/${form._id}/send`, { pdfBase64 });

      await fetchBills(billPage);
      await openBill(form._id, { scrollToPreview: false });
      setMessage("Bill sent successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send bill");
    } finally {
      setBusy(false);
    }
  }

  async function downloadPdf() {
    if (!form) return;
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const savePayload = buildSavePayload(form);
      await API.put(`/bills/${form._id}`, savePayload);

      const doc = await buildPdfDocument();
      doc.save(`${form.billNumber || "bill"}.pdf`);

      await fetchBills(billPage);
      await openBill(form._id, { scrollToPreview: false });
      setMessage("Bill downloaded successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to download bill");
    } finally {
      setBusy(false);
    }
  }

  async function buildPdfDocument(sourceForm = null) {
    const q = sourceForm || form;
    if (!q) throw new Error("No bill selected");

    const doc = new jsPDF("p", "pt", "a4");
    const pageW = 595;
    const pageH = 842;
    const margin = 28;
    const contentW = pageW - margin * 2;
    const showGst = q.billType === "with-gst";
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

    doc.setFillColor(236, 236, 236);
    doc.rect(0, 0, pageW, pageH, "F");

    // Logo placement with improved styling
    const logoSource =
      resolveLogoUrl(q.companyLogoUrl) ||
      localStorage.getItem(FIXED_LOGO_STORAGE_KEY) ||
      FIXED_LOGO_URL;
    try {
      const logoDataUrl = await toDataUrl(logoSource);
      if (logoDataUrl) {
        const fmt = logoDataUrl.includes("image/png") ? "PNG" : "JPEG";
        // Logo background box - white container
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.rect(margin, 32, 68, 56, "FD");
        // Logo image centered in the box
        doc.addImage(logoDataUrl, fmt, margin + 4, 36, 60, 48);
      }
    } catch (logoError) {
      console.warn("[BILL_PDF] Failed to load logo:", logoError);
    }

    // Header section with company name and details
    const headerLeft = margin + 70;
    const companyNameTop = 45;
    txt(q.companyName || "Company Name", headerLeft, companyNameTop, { bold: true, size: 18, color: [29, 56, 122] });
    const addressLines = doc.splitTextToSize(q.companyAddress || "", 120);
    doc.setFontSize(8);
    doc.setTextColor(31, 41, 55);
    doc.text(addressLines, headerLeft, companyNameTop + 14);
    if (q.companyPhone) {
      txt(`Phone: ${q.companyPhone}`, headerLeft, companyNameTop + 28, { size: 8, color: [31, 41, 55] });
    }

    txt("INVOICE", pageW - margin - 8, 48, { bold: true, size: 32, align: "right", color: [88, 110, 181] });

    // Top right info box with better spacing
    const infoBoxWidth = 170;
    const infoBoxLeft = pageW - margin - infoBoxWidth;
    const infoBoxTop = 84;
    const infoRowHeight = 17;
    const infoLabelWidth = 65;
    const infoValueWidth = 97;
    
    const infoRows = [
      ["DATE", dayjs(q.billDate).format("DD/MM/YYYY")],
      ["INVOICE #", q.billNumber || "-"],
      ["CUSTOMER ID", q.clientEmail?.substring(0, 16) || "-"],
      ["DUE DATE", dayjs(q.billDate).format("DD/MM/YYYY")],
    ];
    
    infoRows.forEach((row, index) => {
      const rowY = infoBoxTop + index * infoRowHeight;
      // Label
      txt(row[0], infoBoxLeft, rowY + 11, { size: 7.5, color: [17, 24, 39] });
      // Value box
      doc.setFillColor(224, 230, 243);
      doc.setDrawColor(112, 127, 167);
      doc.setLineWidth(0.5);
      doc.rect(infoBoxLeft + infoLabelWidth + 2, rowY, infoValueWidth, infoRowHeight, "FD");
      txt(row[1], infoBoxLeft + infoLabelWidth + 2 + infoValueWidth / 2, rowY + 11, { size: 7.5, align: "center", color: [17, 24, 39] });
    });

    // Bill To section with proper spacing
    let y = 188;
    doc.setFillColor(52, 73, 138);
    doc.setDrawColor(52, 73, 138);
    doc.setLineWidth(0.5);
    doc.rect(margin, y, 220, 16, "F");
    txt("BILL TO", margin + 8, y + 11, { bold: true, size: 10, color: [255, 255, 255] });
    
    y += 18;
    const recipientName = q.recipientName || "";
    txt(recipientName, margin + 8, y + 6, { bold: true, size: 10, color: [17, 24, 39] });
    
    const billToAddress = doc.splitTextToSize(q.recipientAddress || "", 210);
    doc.setFontSize(9);
    doc.setTextColor(31, 41, 55);
    doc.text(billToAddress, margin + 8, y + 16);

    y = 270;
    const tableTop = y;
    const tableW = contentW;
    const descW = 380;
    const taxW = 50;
    const amountW = tableW - descW - taxW;
    const rowH = 20;
    const bodyRows = 12;

    // Table header
    doc.setFillColor(52, 73, 138);
    doc.setDrawColor(52, 73, 138);
    doc.setLineWidth(0.5);
    doc.rect(margin, tableTop, tableW, rowH, "F");
    txt("DESCRIPTION", margin + 8, tableTop + 13, { bold: true, size: 10, color: [255, 255, 255] });
    txt("TAXED", margin + descW + taxW / 2, tableTop + 13, { bold: true, size: 10, align: "center", color: [255, 255, 255] });
    txt("AMOUNT", margin + descW + taxW + amountW / 2, tableTop + 13, { bold: true, size: 10, align: "center", color: [255, 255, 255] });

    // Table body rows with alternating background
    let tableY = tableTop + rowH;
    for (let i = 0; i < bodyRows; i += 1) {
      doc.setFillColor(i % 2 === 0 ? 245 : 235, i % 2 === 0 ? 245 : 235, i % 2 === 0 ? 245 : 235);
      doc.rect(margin, tableY, tableW, rowH, "F");
      doc.setDrawColor(170, 170, 170);
      doc.setLineWidth(0.3);
      doc.rect(margin, tableY, tableW, rowH);
      tableY += rowH;
    }
    
    // Vertical lines in table
    doc.setLineWidth(0.3);
    doc.line(margin + descW, tableTop + rowH, margin + descW, tableTop + rowH + bodyRows * rowH);
    doc.line(margin + descW + taxW, tableTop + rowH, margin + descW + taxW, tableTop + rowH + bodyRows * rowH);

    // First row data
    const descLines = doc.splitTextToSize(q.serviceDescription || "Service Fee", descW - 16);
    doc.setFontSize(9);
    doc.setTextColor(17, 24, 39);
    doc.text(descLines, margin + 8, tableTop + rowH + 12);
    txt(showGst ? "X" : "", margin + descW + taxW / 2, tableTop + rowH + 12, { size: 9, align: "center", color: [17, 24, 39] });
    txt(formatCurrency(localAmount), margin + tableW - 8, tableTop + rowH + 12, { size: 9, align: "right", color: [17, 24, 39] });

    // Summary and totals section (right side)
    const summaryX = margin + 370;
    const summaryY = tableTop + rowH + bodyRows * rowH + 12;
    const subtotal = localAmount;
    const taxable = showGst ? localAmount : 0;
    const taxRate = showGst ? `${localGstPercent.toFixed(2)}%` : "-";
    const taxDue = showGst ? localTotals.gstAmount : 0;
    const total = localTotals.totalAmount;
    
    const summaryRows = [
      ["Subtotal", formatCurrency(subtotal)],
      ["Taxable", formatCurrency(taxable)],
      ["Tax rate", taxRate],
      ["Tax due", formatCurrency(taxDue)],
      ["Other", "-"],
    ];

    doc.setFontSize(9);
    doc.setTextColor(17, 24, 39);
    summaryRows.forEach((row, idx) => {
      const rowY = summaryY + idx * 13;
      txt(row[0], summaryX, rowY, { size: 9, color: [17, 24, 39] });
      txt(row[1], pageW - margin - 4, rowY, { size: 9, align: "right", color: [17, 24, 39] });
    });

    // Total highlight box
    const totalY = summaryY + summaryRows.length * 13 + 4;
    doc.setFillColor(230, 236, 250);
    doc.setDrawColor(112, 127, 167);
    doc.setLineWidth(0.5);
    doc.rect(summaryX - 8, totalY - 9, pageW - margin - (summaryX - 8) + 4, 18, "FD");
    txt("TOTAL", summaryX, totalY + 2, { bold: true, size: 12, color: [17, 24, 39] });
    txt(formatCurrency(total), pageW - margin - 2, totalY + 2, { bold: true, size: 12, align: "right", color: [17, 24, 39] });

    // Other comments section
    const commentsY = tableTop + rowH + bodyRows * rowH + 8;
    doc.setFillColor(52, 73, 138);
    doc.setDrawColor(52, 73, 138);
    doc.setLineWidth(0.5);
    doc.rect(margin, commentsY, 260, 16, "F");
    txt("OTHER COMMENTS", margin + 8, commentsY + 11, { bold: true, size: 10, color: [255, 255, 255] });
    doc.setDrawColor(170, 170, 170);
    doc.setLineWidth(0.3);
    doc.rect(margin, commentsY + 16, 260, 90);
    
    const commentsLines = doc.splitTextToSize(q.paymentTerms || "Payment received successfully.", 252);
    doc.setFontSize(8.5);
    doc.setTextColor(17, 24, 39);
    doc.text(commentsLines, margin + 8, commentsY + 28);
    
    const amountPaidLines = doc.splitTextToSize(
      `Amount received: ${formatCurrency(q.amountPaid || localTotals.totalAmount)}`,
      252
    );
    doc.text(amountPaidLines, margin + 8, commentsY + 60);

    // Footer
    const footY = pageH - 80;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, footY, pageW - margin, footY);
    
    doc.setFontSize(9);
    doc.setTextColor(31, 41, 55);
    txt("If you have any questions about this invoice, please contact", pageW / 2, footY + 12, {
      size: 9,
      align: "center",
      color: [17, 24, 39],
    });
    
    const contactInfo = [q.senderName || q.companyName, q.senderPhone || q.companyPhone, q.clientEmail]
      .filter(Boolean)
      .join(" | ");
    txt(contactInfo, pageW / 2, footY + 22, {
      size: 9,
      align: "center",
      color: [17, 24, 39],
    });
    
    txt("Thank You For Your Business!", pageW / 2, footY + 38, {
      bold: true,
      size: 16,
      align: "center",
      color: [52, 73, 138],
    });

    return doc;
  }

  return (
    <div className="min-h-[calc(100vh-64px)] px-3 sm:px-6 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-white">Manual Bills</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generate bill from paid quotations, manually edit/review, then download PDF or send email.
          </p>
        </div>

        <div ref={alertAnchorRef} />

        {error && <div className="rounded-xl p-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm">{error}</div>}
        {message && <div className="rounded-xl p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{message}</div>}

        <section className="rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-white/85 dark:bg-slate-900/80 backdrop-blur-sm p-3 sm:p-4 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Paid Clients (Generate Bill)</h2>
          <div className="max-w-sm">
            <label className="space-y-1 block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Search paid quotations</span>
              <input
                type="text"
                value={paidSearch}
                onChange={(e) => setPaidSearch(e.target.value)}
                placeholder="Search quotation no, client, email"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              />
            </label>
          </div>
          <div className="overflow-x-auto rounded-xl border border-indigo-100 dark:border-indigo-900/40">
            <table className="min-w-[760px] w-full text-sm">
              <thead className="bg-indigo-50/70 dark:bg-indigo-950/30">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Quotation No</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Client</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Email</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPaidQuotations.map((q) => (
                  <tr key={q._id} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-100">{q.quotationNumber}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{q.recipientName || "-"}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300 break-all">{q.clientEmail || "-"}</td>
                    <td className="px-3 py-2">
                      <button
                        disabled={busy}
                        onClick={() => createBill(q._id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                      >
                        Generate Bill
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredPaidQuotations.length === 0 && (
                  <tr>
                    <td className="px-3 py-4 text-slate-500" colSpan={4}>No paid quotations found on this page.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pager page={paidPage} totalPages={paidTotalPages} onPrev={() => setPaidPage((p) => Math.max(1, p - 1))} onNext={() => setPaidPage((p) => Math.min(paidTotalPages, p + 1))} />
        </section>

        <section className="rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-white/85 dark:bg-slate-900/80 backdrop-blur-sm p-3 sm:p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Bill Records</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full sm:w-auto">
              <button disabled={!form || !isReviewed || busy} onClick={downloadPdf} className="w-full px-3 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white disabled:opacity-50">Download PDF</button>
              <button disabled={!form || !isReviewed || busy} onClick={sendBill} className="w-full px-3 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white disabled:opacity-50">Send Email</button>
            </div>
          </div>

          <div className="max-w-sm">
            <label className="space-y-1 block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Search bills</span>
              <input
                type="text"
                value={billSearch}
                onChange={(e) => setBillSearch(e.target.value)}
                placeholder="Search bill no, client, email"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              />
            </label>
          </div>

          <div className="overflow-x-auto rounded-xl border border-indigo-100 dark:border-indigo-900/40">
            <table className="min-w-[880px] w-full text-sm">
              <thead className="bg-indigo-50/70 dark:bg-indigo-950/30">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Bill No</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Client</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Type</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Email</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Total</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Reviewed</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Sent</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((b) => (
                  <tr
                    key={b._id}
                    className={`border-t border-slate-200 dark:border-slate-700 ${selectedId === b._id ? "bg-indigo-50/60 dark:bg-indigo-900/20" : ""}`}
                  >
                    <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-100">{b.billNumber}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{b.recipientName || "-"}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{b.billType === "with-gst" ? "With GST" : "Without GST"}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300 break-all">{b.clientEmail || "-"}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{formatCurrency(b.totalAmount || 0)}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${b.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-700" : b.paymentStatus === "partial" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"}`}>
                        {String(b.paymentStatus || "unpaid").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${b.reviewed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {b.reviewed ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${b.sent ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"}`}>
                        {b.sent ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
                        onClick={() => openBill(b._id)}
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredBills.length === 0 && (
                  <tr>
                    <td className="px-3 py-4 text-slate-500" colSpan={9}>No bill records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pager page={billPage} totalPages={billTotalPages} onPrev={() => setBillPage((p) => Math.max(1, p - 1))} onNext={() => setBillPage((p) => Math.min(billTotalPages, p + 1))} />
        </section>

        <section className="rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-white/85 dark:bg-slate-900/80 backdrop-blur-sm p-3 sm:p-4 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Selected Bill Record</h2>
          {!form ? (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-sm text-slate-500">
              Select a bill record from the table above to edit and review.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-slate-600">Bill Details</h3>
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
                      <Input label="Bill Number" value={form.billNumber || ""} readOnly />
                      <Input label="Bill Date" value={dayjs(form.billDate).format("DD MMM YYYY")} readOnly />
                      <Input label="Bill Type" value={form.billType === "with-gst" ? "With GST" : "Without GST"} readOnly />
                      <Input label="Client Email" value={form.clientEmail || ""} readOnly />
                      <Input label="Recipient Name" value={form.recipientName || ""} onChange={(v) => setForm({ ...form, recipientName: v })} />
                      <Input label="Recipient Address" value={form.recipientAddress || ""} onChange={(v) => setForm({ ...form, recipientAddress: v })} />
                      <Input label="Subject" value={form.subject || ""} onChange={(v) => setForm({ ...form, subject: v })} />
                      <Input label="Service Description" value={form.serviceDescription || ""} onChange={(v) => setForm({ ...form, serviceDescription: v })} />
                    </div>

                    <button
                      disabled={busy}
                      onClick={saveBill}
                      className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Save Manual Edits (Required)
                    </button>
                  </>
                ) : (
                  <>
                    <TextArea label="Intro Text" value={form.introText || ""} onChange={(v) => setForm({ ...form, introText: v })} />
                    <Input label="Client Name" value={form.recipientName || ""} onChange={(v) => setForm({ ...form, recipientName: v })} />
                    <Input label="Service Type" value={form.serviceType || ""} onChange={(v) => setForm({ ...form, serviceType: v })} />
                    <Input label="Amount" type="number" value={form.amount ?? 0} onChange={(v) => setForm({ ...form, amount: v })} />
                    <Input label="Amount Paid" type="number" value={form.amountPaid ?? 0} onChange={(v) => setForm({ ...form, amountPaid: v })} />

                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-sm">
                      {form.billType === "with-gst" && (
                        <p><strong>Calculated GST:</strong> {formatCurrency(totals.gstAmount)}</p>
                      )}
                      <p><strong>Calculated Total:</strong> {formatCurrency(totals.totalAmount)}</p>
                    </div>

                    <button
                      disabled={busy}
                      onClick={saveBill}
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
