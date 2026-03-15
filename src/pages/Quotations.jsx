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
        recipientOrganization: form.recipientOrganization,
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
      await API.post(`/quotations/${form._id}/send`);
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

    const doc = new jsPDF("p", "pt", "a4");
    const line = (text, x, y, opts = {}) => {
      doc.setFont("helvetica", opts.bold ? "bold" : "normal");
      doc.setFontSize(opts.size || 11);
      doc.text(String(text || ""), x, y, opts.align ? { align: opts.align } : undefined);
    };

    let y = 36;
    const headerCenterX = 332;
    const pageRightX = 552;
    const logoSource =
      resolveLogoUrl(form.companyLogoUrl) ||
      localStorage.getItem(FIXED_LOGO_STORAGE_KEY) ||
      FIXED_LOGO_URL;

    try {
      const logoDataUrl = await toDataUrl(logoSource);
      if (logoDataUrl) {
        const imageFormat = String(logoDataUrl).includes("image/png") ? "PNG" : "JPEG";
        doc.addImage(logoDataUrl, imageFormat, 24, 22, 64, 64);
      }
    } catch {}

    line(form.companyName, headerCenterX, y, { bold: true, size: 14, align: "center" });
    y += 16;
    line(form.companyAddress, headerCenterX, y, { size: 10, align: "center" });
    y += 14;
    if (form.companyTagline) {
      line(form.companyTagline, headerCenterX, y, { size: 10, align: "center" });
      y += 16;
    }

    line(`Date: ${dayjs(form.quotationDate).format("DD/MM/YYYY")}`, pageRightX, 36, { size: 10, align: "right" });

    y += 16;
    line(form.subject, headerCenterX, y, { bold: true, size: 13, align: "center" });

    y += 24;
    line("To,", 40, y, { bold: true });
    y += 14;
    line(form.recipientName, 40, y, { bold: true });
    y += 14;
    line(form.recipientOrganization, 40, y, { bold: true });
    y += 14;
    line(form.recipientAddress, 40, y, { bold: true });

    y += 20;
    const introLines = doc.splitTextToSize(form.introText || "", 510);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(introLines, 40, y);
    y += introLines.length * 14 + 12;

    const tableX = 40;
    const tableW = 510;
    const srW = 60;
    const descW = 320;
    const chargeW = tableW - srW - descW;
    const rowH = 22;

    const drawCell = (x, top, width, height) => {
      doc.rect(x, top, width, height);
    };

    const drawRow = (top, srText, descText, chargeText, bold = false) => {
      drawCell(tableX, top, srW, rowH);
      drawCell(tableX + srW, top, descW, rowH);
      drawCell(tableX + srW + descW, top, chargeW, rowH);

      line(srText, tableX + 8, top + 15, { bold, size: 10 });
      line(descText, tableX + srW + 8, top + 15, { bold, size: 10 });
      line(chargeText, tableX + srW + descW + chargeW - 8, top + 15, {
        bold,
        size: 10,
        align: "right",
      });
    };

    drawRow(y, "Sr.", "Description", "Charges", true);
    y += rowH;

    drawRow(y, "1", String(form.serviceDescription || ""), formatCurrency(form.amount), false);
    y += rowH;

    if (form.quotationType === "with-gst") {
      drawRow(y, "", `GST (${form.gstPercent}%)`, formatCurrency(totals.gstAmount), false);
      y += rowH;
    }

    drawRow(y, "", "Total", formatCurrency(totals.totalAmount), true);
    y += rowH + 10;

    y += 28;
    line(`Payment: ${form.paymentTerms}`, 40, y, { size: 11 });

    y += 30;
    line("Thanks & Regards,", 40, y, { bold: true });
    y += 14;
    line("For,", 40, y, { bold: true });
    y += 14;
    line(form.companyName, 40, y, { bold: true });
    y += 14;
    line(form.senderName, 40, y, { bold: true });
    y += 14;
    line(form.senderPhone, 40, y, { bold: true });

    doc.save(`${form.quotationNumber || "quotation"}.pdf`);
  }

  return (
    <div className="min-h-[calc(100vh-64px)] px-3 sm:px-6 py-4 sm:py-8 bg-slate-50 dark:bg-[#0b1120]">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-white">Manual Quotations</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create quotation from reminder, manually edit, review, then download PDF or send email.
          </p>
        </div>

        {error && <div className="rounded-xl p-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm">{error}</div>}
        {message && <div className="rounded-xl p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{message}</div>}

        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 sm:p-4 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Reminders (Create Quotation)</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="min-w-[760px] w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/70">
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

        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 sm:p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Quotation Records</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full sm:w-auto">
              <button disabled={!form || !isReviewed || busy} onClick={downloadPdf} className="w-full px-3 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white disabled:opacity-50">Download PDF</button>
              <button disabled={!form || !isReviewed || busy} onClick={sendQuotation} className="w-full px-3 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white disabled:opacity-50">Send Email</button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="min-w-[880px] w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/70">
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
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{q.recipientOrganization || "-"}</td>
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

        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 sm:p-4 space-y-4">
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
                      <Input label="Recipient Organization" value={form.recipientOrganization || ""} onChange={(v) => setForm({ ...form, recipientOrganization: v })} />
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
