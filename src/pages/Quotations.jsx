import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import dayjs from "dayjs";
import API from "../services/api";

const FIXED_LOGO_STORAGE_KEY = "fixedQuotationLogo";
const FIXED_LOGO_URL = "https://reminder-app-backend-aaac.onrender.com/assets/company-logo.png";

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
  const [reminders, setReminders] = useState([]);
  const [reminderPage, setReminderPage] = useState(1);
  const [reminderTotalPages, setReminderTotalPages] = useState(1);

  const [quotations, setQuotations] = useState([]);
  const [quotationPage, setQuotationPage] = useState(1);
  const [quotationTotalPages, setQuotationTotalPages] = useState(1);

  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isReviewed = Boolean(form?.reviewed);

  useEffect(() => {
    fetchReminders(reminderPage);
  }, [reminderPage]);

  useEffect(() => {
    fetchQuotations(quotationPage);
  }, [quotationPage]);

  const totals = useMemo(() => {
    if (!form) return { gstAmount: 0, totalAmount: 0 };
    const amount = Number(form.amount || 0);
    const gstPercent = Number(form.gstPercent || 0);
    const gstAmount = form.quotationType === "with-gst" ? (amount * gstPercent) / 100 : 0;
    return { gstAmount, totalAmount: amount + gstAmount };
  }, [form]);

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

  async function fetchQuotations(page) {
    try {
      const res = await API.get(`/quotations?page=${page}`);
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

  async function openQuotation(id) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await API.get(`/quotations/${id}`);
      setSelectedId(id);
      const fixedLogo = localStorage.getItem(FIXED_LOGO_STORAGE_KEY) || FIXED_LOGO_URL;
      const resolvedLogo = resolveLogoUrl(res.data.companyLogoUrl) || fixedLogo;
      setForm({
        ...res.data,
        companyLogoUrl: resolvedLogo,
      });
      setPreviewHtml(res.data.previewHtml || "");
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
      const payload = {
        quotationType: form.quotationType,
        quotationDate: form.quotationDate,
        clientEmail: form.clientEmail,
        recipientName: form.recipientName,
        recipientAddress: form.recipientAddress,
        subject: form.subject,
        introText: form.introText,
        serviceDescription: form.serviceDescription,
        expiryText: form.expiryText,
        paymentTerms: form.paymentTerms,
        amount: Number(form.amount || 0),
        gstPercent: Number(form.gstPercent || 0),
        senderName: form.senderName,
        senderPhone: form.senderPhone,
        companyName: form.companyName,
        companyAddress: form.companyAddress,
        companyRegistration: form.companyRegistration,
        companyPhone: form.companyPhone,
        companyTagline: form.companyTagline,
        companyLogoUrl:
          resolveLogoUrl(form.companyLogoUrl) ||
          localStorage.getItem(FIXED_LOGO_STORAGE_KEY) ||
          FIXED_LOGO_URL,
      };

      await API.put(`/quotations/${form._id}`, payload);
      await openQuotation(form._id);
      await fetchQuotations(quotationPage);
      setMessage("Quotation updated and marked as reviewed.");
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
      const pdfDoc = await buildPdfDocument();
      const pdfDataUri = pdfDoc.output("datauristring");
      const pdfBase64 = pdfDataUri.includes(",") ? pdfDataUri.split(",")[1] : "";

      await API.post(`/quotations/${form._id}/send`, { pdfBase64 });
      await openQuotation(form._id);
      await fetchQuotations(quotationPage);
      setMessage("Quotation email sent successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send quotation");
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

  async function downloadPdf() {
    if (!form) return;

    const doc = await buildPdfDocument();
    doc.save(`${form.quotationNumber || "quotation"}.pdf`);
  }

  async function buildPdfDocument() {
    if (!form) throw new Error("No quotation selected");

    const doc = new jsPDF("p", "pt", "a4");
    const pageW = 595;
    const pageH = 842;
    const margin = 28;
    const contentW = pageW - margin * 2;
    const showGst = form.quotationType === "with-gst";

    const txt = (text, x, y, opts = {}) => {
      doc.setFont("helvetica", opts.bold ? "bold" : "normal");
      doc.setFontSize(opts.size || 10);
      doc.setTextColor(...(opts.color || [26, 26, 26]));
      doc.text(String(text || ""), x, y, opts.align ? { align: opts.align } : undefined);
    };

    const headerH = 84;
    doc.setFillColor(15, 44, 92);
    doc.rect(0, 0, pageW, headerH, "F");
    doc.setFillColor(29, 79, 145);
    doc.triangle(pageW - 170, 0, pageW, 0, pageW, headerH, "F");
    doc.triangle(pageW - 230, 0, pageW - 160, 0, pageW, headerH, "F");

    const logoSource =
      resolveLogoUrl(form.companyLogoUrl) ||
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
    } catch {}

    txt(form.companyName || "", 104, 28, { bold: true, size: 14, color: [255, 255, 255] });
    txt(form.companyAddress || "", 104, 42, { size: 8, color: [208, 221, 242] });
    if (form.companyRegistration) {
      txt(`Reg. No: ${form.companyRegistration}  ·  Mobile: ${form.companyPhone || ""}`, 104, 53, {
        size: 8,
        color: [208, 221, 242],
      });
    }
    if (form.companyTagline) {
      txt(form.companyTagline, 104, 64, { bold: true, size: 8, color: [234, 241, 255] });
    }

    txt("INVOICE", pageW - margin, 30, { bold: true, size: 20, align: "right", color: [255, 255, 255] });
    txt(`Ref No: ${form.quotationNumber || "-"}`, pageW - margin, 47, {
      size: 8,
      align: "right",
      color: [208, 221, 242],
    });
    txt(`Date: ${dayjs(form.quotationDate).format("DD/MM/YYYY")}`, pageW - margin, 58, {
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
    txt(form.recipientName || "", margin + 8, y + 28, { bold: true, size: 10, color: [17, 24, 39] });
    if (form.recipientAddress) {
      const billAddress = doc.splitTextToSize(form.recipientAddress, blockW - 16);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(75, 85, 99);
      doc.text(billAddress, margin + 8, y + 42);
    }

    txt("From", margin + blockW + blockGap + 8, y + 14, { bold: true, size: 9, color: [55, 91, 145] });
    txt(form.companyName || "", margin + blockW + blockGap + 8, y + 28, { bold: true, size: 10, color: [17, 24, 39] });
    const fromLines = doc.splitTextToSize(form.companyAddress || "", blockW - 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(75, 85, 99);
    doc.text(fromLines, margin + blockW + blockGap + 8, y + 41);
    const signerLine = [form.senderName, form.senderPhone].filter(Boolean).join(" · ");
    if (signerLine) {
      txt(signerLine, margin + blockW + blockGap + 8, y + 67, { size: 8.5, color: [75, 85, 99] });
    }
    y += blockH + 14;

    txt(form.subject || "", margin, y, { bold: true, size: 13, color: [15, 44, 92] });
    y += 14;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    const introLines = doc.splitTextToSize(form.introText || "", contentW);
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

    drawRow(y, "1", String(form.serviceDescription || ""), formatCurrency(form.amount)); y += rowH;
    if (showGst) {
      drawRow(y, "", `GST (${form.gstPercent}%)`, formatCurrency(totals.gstAmount)); y += rowH;
    }
    drawRow(y, "", "Total", formatCurrency(totals.totalAmount), true, true); y += rowH + 10;

    const amountBoxW = 220;
    const amountBoxH = 30;
    doc.setFillColor(29, 79, 145);
    doc.rect(pageW - margin - amountBoxW, y, amountBoxW, amountBoxH, "F");
    txt(`Amount Due: ${formatCurrency(totals.totalAmount)}`, pageW - margin - 10, y + 19, {
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
      txt(`Note: GST @ ${form.gstPercent}% is included in the above total.`, margin + 8, y + 14, {
        size: 8.5,
        color: [75, 85, 99],
      });
      y += noteH + 10;
    }

    txt("Payment Info", margin, y, { bold: true, size: 9, color: [55, 91, 145] });
    y += 12;
    txt(form.paymentTerms || "", margin, y, { size: 8.5, color: [75, 85, 99] });

    const noteY = y + 20;
    txt("Notes", margin, noteY, { bold: true, size: 9, color: [55, 91, 145] });
    txt("Please give us your confirmation for the renewal as soon as possible.", margin, noteY + 12, {
      size: 8.5,
      color: [75, 85, 99],
    });

    const signBaseY = pageH - 86;
    txt("Authorized Signatory", pageW - margin, signBaseY, { size: 8.5, align: "right", color: [107, 114, 128] });
    txt(form.senderName || form.companyName || "", pageW - margin, signBaseY + 14, {
      bold: true,
      size: 10,
      align: "right",
      color: [17, 24, 39],
    });

    const footerY = pageH - 30;
    doc.setDrawColor(201, 215, 238);
    doc.line(margin, footerY, pageW - margin, footerY);
    txt("Validity: 15 Days", pageW - margin, footerY + 12, {
      size: 8,
      align: "right",
      color: [107, 114, 128],
    });

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

        {error && <div className="rounded-xl p-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm">{error}</div>}
        {message && <div className="rounded-xl p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{message}</div>}

        <section className="rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-white/85 dark:bg-slate-900/80 backdrop-blur-sm p-3 sm:p-4 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Reminders (Create Quotation)</h2>
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
                {reminders.map((r) => (
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
                {reminders.length === 0 && (
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
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Quotation Records</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full sm:w-auto">
              <button disabled={!form || !isReviewed || busy} onClick={downloadPdf} className="w-full px-3 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white disabled:opacity-50">Download PDF</button>
              <button disabled={!form || !isReviewed || busy} onClick={sendQuotation} className="w-full px-3 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white disabled:opacity-50">Send Email</button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-indigo-100 dark:border-indigo-900/40">
            <table className="min-w-[880px] w-full text-sm">
              <thead className="bg-indigo-50/70 dark:bg-indigo-950/30">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Quotation No</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Client</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Type</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Reviewed</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Sent</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((q) => (
                  <tr
                    key={q._id}
                    className={`border-t border-slate-200 dark:border-slate-700 ${selectedId === q._id ? "bg-indigo-50/60 dark:bg-indigo-900/20" : ""}`}
                  >
                    <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-100">{q.quotationNumber}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{q.recipientName || "-"}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{q.quotationType === "with-gst" ? "With GST" : "Without GST"}</td>
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
                      <button
                        onClick={() => openQuotation(q._id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
                {quotations.length === 0 && (
                  <tr>
                    <td className="px-3 py-4 text-slate-500" colSpan={6}>No quotation records found.</td>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input label="Quotation Number" value={form.quotationNumber || ""} readOnly />
                      <Input label="Quotation Date" type="date" value={dayjs(form.quotationDate).format("YYYY-MM-DD")} onChange={(v) => setForm({ ...form, quotationDate: dayjs(v).toISOString() })} />
                      <Select label="Quotation Type" value={form.quotationType} onChange={(v) => setForm({ ...form, quotationType: v })} options={[{ value: "with-gst", label: "With GST" }, { value: "without-gst", label: "Without GST" }]} />
                      <Input label="Client Email" value={form.clientEmail || ""} onChange={(v) => setForm({ ...form, clientEmail: v })} />
                      <Input label="Recipient Name" value={form.recipientName || ""} onChange={(v) => setForm({ ...form, recipientName: v })} />
                      <Input label="Recipient Address" value={form.recipientAddress || ""} onChange={(v) => setForm({ ...form, recipientAddress: v })} />
                      <Input label="Subject" value={form.subject || ""} onChange={(v) => setForm({ ...form, subject: v })} />
                      <Input label="Service Description" value={form.serviceDescription || ""} onChange={(v) => setForm({ ...form, serviceDescription: v })} />
                      <Input label="Amount" type="number" value={form.amount ?? 0} onChange={(v) => setForm({ ...form, amount: v })} />
                      <Input label="GST Percent" type="number" value={form.gstPercent ?? 18} onChange={(v) => setForm({ ...form, gstPercent: v })} />
                      <Input label="Payment Terms" value={form.paymentTerms || ""} onChange={(v) => setForm({ ...form, paymentTerms: v })} />
                      <Input label="Sender Name" value={form.senderName || ""} onChange={(v) => setForm({ ...form, senderName: v })} />
                      <Input label="Sender Phone" value={form.senderPhone || ""} onChange={(v) => setForm({ ...form, senderPhone: v })} />
                      <Input label="Company Name" value={form.companyName || ""} onChange={(v) => setForm({ ...form, companyName: v })} />
                      <Input label="Company Address" value={form.companyAddress || ""} onChange={(v) => setForm({ ...form, companyAddress: v })} />
                      <Input label="Company Registration" value={form.companyRegistration || ""} onChange={(v) => setForm({ ...form, companyRegistration: v })} />
                      <Input label="Company Phone" value={form.companyPhone || ""} onChange={(v) => setForm({ ...form, companyPhone: v })} />
                      <Input label="Company Tagline" value={form.companyTagline || ""} onChange={(v) => setForm({ ...form, companyTagline: v })} />
                      <Input label="Company Logo URL" value={form.companyLogoUrl || ""} readOnly />
                    </div>

                    <TextArea label="Intro Text" value={form.introText || ""} onChange={(v) => setForm({ ...form, introText: v })} />

                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-sm">
                      <p><strong>Calculated GST:</strong> {formatCurrency(totals.gstAmount)}</p>
                      <p><strong>Calculated Total:</strong> {formatCurrency(totals.totalAmount)}</p>
                    </div>

                    <button
                      disabled={busy}
                      onClick={saveQuotation}
                      className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Save Manual Edits (Required)
                    </button>

                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                      <h3 className="text-sm font-bold text-slate-600 mb-3">Review Preview</h3>
                      <div className="max-h-[520px] overflow-auto bg-white rounded-lg border border-slate-200">
                        <div className="min-w-[760px]" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                      </div>
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

function Select({ label, value, onChange, options }) {
  return (
    <label className="space-y-1 block">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
