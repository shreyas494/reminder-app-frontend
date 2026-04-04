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

    const headerH = 84;
    doc.setFillColor(15, 44, 92);
    doc.rect(0, 0, pageW, headerH, "F");
    doc.setFillColor(29, 79, 145);
    doc.triangle(pageW - 170, 0, pageW, 0, pageW, headerH, "F");

    txt(q.companyName || "", 104, 28, { bold: true, size: 14, color: [255, 255, 255] });
    txt(q.companyAddress || "", 104, 42, { size: 8, color: [208, 221, 242] });
    txt("BILL", pageW - margin, 30, { bold: true, size: 20, align: "right", color: [255, 255, 255] });
    txt(`No: ${q.billNumber || "-"}`, pageW - margin, 47, { size: 8, align: "right", color: [208, 221, 242] });
    txt(`Date: ${dayjs(q.billDate).format("DD/MM/YYYY")}`, pageW - margin, 58, { size: 8, align: "right", color: [208, 221, 242] });

    let y = headerH + 14;
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
    txt("No.", margin + 6, y + 15, { bold: true, size: 9, color: [255, 255, 255] });
    txt("Description", margin + srW + 6, y + 15, { bold: true, size: 9, color: [255, 255, 255] });
    txt("Amount", margin + srW + descW + chargeW - 6, y + 15, { bold: true, size: 9, align: "right", color: [255, 255, 255] });
    y += rowH;

    drawRow(y, "1", String(q.serviceDescription || ""), formatCurrency(q.amount)); y += rowH;
    if (showGst) {
      drawRow(y, "", `GST (${q.gstPercent}%)`, formatCurrency(localTotals.gstAmount)); y += rowH;
    }
    drawRow(y, "", "Total", formatCurrency(localTotals.totalAmount), true, true); y += rowH + 10;

    const amountBoxW = 240;
    const amountBoxH = 30;
    doc.setFillColor(29, 79, 145);
    doc.rect(pageW - margin - amountBoxW, y, amountBoxW, amountBoxH, "F");
    txt(`Amount Received: ${formatCurrency(q.amountPaid || localTotals.totalAmount)}`, pageW - margin - 10, y + 19, {
      bold: true,
      size: 10,
      align: "right",
      color: [255, 255, 255],
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
