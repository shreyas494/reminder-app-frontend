import { useEffect, useState } from "react";
import dayjs from "dayjs";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import AddReminderModal from "../components/AddReminderModal";

const WHATSAPP_LOGO_URL = "https://cdn.simpleicons.org/whatsapp/25D366";
const GMAIL_LOGO_URL = "https://cdn.simpleicons.org/gmail/EA4335";

export default function NearExpiry() {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [creatingQuotationId, setCreatingQuotationId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editReminder, setEditReminder] = useState(null);

  useEffect(() => {
    fetchNearExpiry(page);
  }, [page]);

  async function fetchNearExpiry(pageNo = 1) {
    setLoading(true);
    try {
      const res = await API.get(`/reminders/near-expiry?page=${pageNo}`);
      const { data, page: current, totalPages: total } = res.data;
      setReminders(data || []);
      setPage(current || 1);
      setTotalPages(Math.max(1, total || 1));
    } catch (err) {
      console.error("Failed to fetch near-expiry reminders", err);
      setReminders([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }

  const remainingTime = (r) => {
    const now = dayjs();
    const end = dayjs(r.expiryDate);
    if (end.isBefore(now)) return "Expired";
    const months = end.diff(now, "month");
    if (months >= 1) return `${months} month(s)`;
    return `${end.diff(now, "day")} day(s)`;
  };

  const getStatusLabel = (r) => {
    const end = dayjs(r.expiryDate);
    if (end.isBefore(dayjs())) return { text: "Expired", color: "red" };
    if (Array.isArray(r.renewals) && r.renewals.length > 0) {
      return { text: "Renewed", color: "blue" };
    }
    return { text: "Active", color: "green" };
  };

  const normalizePhone = (phone) => {
    const raw = String(phone || "").replace(/\D/g, "");
    if (!raw) return "";
    if (raw.length === 10) return `91${raw}`;
    return raw;
  };

  const buildReminderMessage = (r) => {
    const expiryIST = new Date(r.expiryDate).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });

    return `📢 Subscription Reminder\n\nClient: ${r.clientName}\nProject: ${r.projectName}\nDomain: ${r.domainName || "-"}\nExpiry: ${expiryIST}\nAmount: ₹${r.amount ?? "-"}\n\nPlease renew on time.`;
  };

  const smsLink = (r) => {
    const phone = normalizePhone(r.mobile1 || r.mobile2);
    if (!phone) return "#";
    return `sms:+${phone}?body=${encodeURIComponent(buildReminderMessage(r))}`;
  };

  const whatsappLink = (r) => {
    const phone = normalizePhone(r.mobile1 || r.mobile2);
    if (!phone) return "#";
    return `https://wa.me/${phone}?text=${encodeURIComponent(buildReminderMessage(r))}`;
  };

  const mailLink = (r) => {
    if (!r.email) return "#";
    return `mailto:${r.email}?subject=${encodeURIComponent("Subscription Expiry Reminder")}&body=${encodeURIComponent(buildReminderMessage(r))}`;
  };

  const createGstQuotationAndOpen = async (r) => {
    setCreatingQuotationId(r._id);
    try {
      const res = await API.post(`/quotations/from-reminder/${r._id}`, {
        quotationType: "with-gst",
      });
      navigate("/quotations", {
        state: {
          openQuotationId: res.data?._id,
          notice: "GST quotation draft created. You can edit and change type if needed.",
        },
      });
    } catch (err) {
      console.error("Failed to create GST quotation draft", err);
      window.alert(err.response?.data?.message || "Failed to create GST quotation draft");
    } finally {
      setCreatingQuotationId("");
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)] px-4 sm:px-6 py-8 overflow-hidden transition-colors">
      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Near Expiry Reminders
            </h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Reminders expiring in the next 30 days
            </p>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/70 dark:bg-[#111827]/60 border border-white/50 dark:border-white/10 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-700/60">
                <tr>
                  <Th>#</Th>
                  <Th>Client</Th>
                  <Th className="hidden md:table-cell">Contact</Th>
                  <Th>Mobile</Th>
                  <Th>Project</Th>
                  <Th>Expiry</Th>
                  <Th>Remaining</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-12 text-slate-500">Loading...</td>
                  </tr>
                ) : reminders.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-12 text-slate-500">No near-expiry reminders found.</td>
                  </tr>
                ) : (
                  reminders.map((r, i) => {
                    const status = getStatusLabel(r);
                    const hasPhone = Boolean(r.mobile1 || r.mobile2);
                    const hasEmail = Boolean(r.email);
                    const callTarget = r.mobile1 || r.mobile2 || "";
                    return (
                      <tr key={r._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors duration-200">
                        <Td className="font-mono text-slate-400 opacity-60">{(page - 1) * 10 + i + 1}</Td>
                        <Td className="font-bold text-slate-800 dark:text-slate-200">{r.clientName}</Td>
                        <Td className="hidden md:table-cell text-slate-600 dark:text-slate-400">{r.contactPerson}</Td>
                        <Td>
                          <a
                            href={r.mobile1 || r.mobile2 ? `tel:${r.mobile1 || r.mobile2}` : "#"}
                            target="_self"
                            rel="noreferrer"
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm ${hasPhone ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 hover:bg-indigo-200" : "bg-slate-100 text-slate-400 cursor-not-allowed pointer-events-none"}`}
                            title={r.mobile1 || r.mobile2 || "No mobile number"}
                          >
                            📞
                          </a>
                        </Td>
                        <Td className="text-indigo-600 dark:text-indigo-400 font-medium truncate max-w-[180px]">{r.projectName}</Td>
                        <Td className="tabular-nums font-medium text-slate-700 dark:text-slate-300">{dayjs(r.expiryDate).format("DD MMM YYYY")}</Td>
                        <Td className="tabular-nums text-slate-500">{remainingTime(r)}</Td>
                        <Td>
                          <Badge color={status.color}>{status.text}</Badge>
                        </Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            <a
                              href={smsLink(r)}
                              target="_self"
                              rel="noreferrer"
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm ${hasPhone ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200" : "bg-slate-100 text-slate-400 cursor-not-allowed pointer-events-none"}`}
                              title="Send SMS"
                            >
                              💬
                            </a>

                            <a
                              href={whatsappLink(r)}
                              target="_blank"
                              rel="noreferrer"
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm ${hasPhone ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-200" : "bg-slate-100 text-slate-400 cursor-not-allowed pointer-events-none"}`}
                              title="Send WhatsApp"
                            >
                              <img src={WHATSAPP_LOGO_URL} alt="WhatsApp" className="w-4 h-4" />
                            </a>

                            <a
                              href={mailLink(r)}
                              target="_self"
                              rel="noreferrer"
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm ${hasEmail ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 hover:bg-rose-200" : "bg-slate-100 text-slate-400 cursor-not-allowed pointer-events-none"}`}
                              title="Send Email"
                            >
                              <img src={GMAIL_LOGO_URL} alt="Gmail" className="w-4 h-4" />
                            </a>

                            <button
                              type="button"
                              onClick={() => createGstQuotationAndOpen(r)}
                              disabled={creatingQuotationId === r._id}
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm ${creatingQuotationId === r._id ? "bg-slate-100 text-slate-400 cursor-wait" : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 hover:bg-indigo-200"}`}
                              title="Open Quotations"
                            >
                              {creatingQuotationId === r._id ? "…" : "📄"}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditReminder({ ...r, _mode: "renew" });
                                setShowModal(true);
                              }}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 hover:bg-amber-200"
                              title="Renew"
                            >
                              ♻️
                            </button>
                          </div>
                        </Td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <PaginationButton disabled={page === 1} onClick={() => setPage((p) => p - 1)} label="Previous" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 backdrop-blur px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            Page {page} of {totalPages}
          </span>
          <PaginationButton disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} label="Next" />
        </div>

        {showModal && (
          <AddReminderModal
            existing={editReminder}
            onAdded={() => fetchNearExpiry(page)}
            onClose={() => {
              setShowModal(false);
              setEditReminder(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

function Th({ children, className = "" }) {
  return (
    <th className={`px-4 sm:px-6 py-3 sm:py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }) {
  return <td className={`px-4 sm:px-6 py-3 sm:py-5 whitespace-nowrap text-sm ${className}`}>{children}</td>;
}

function Badge({ children, color }) {
  const map = {
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-1 ring-emerald-600/10",
    red: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 ring-1 ring-rose-600/10",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 ring-1 ring-blue-600/10",
  };

  return <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${map[color]}`}>{children}</span>;
}

function PaginationButton({ disabled, onClick, label }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
        disabled
          ? "opacity-50 cursor-not-allowed text-slate-400 bg-slate-100 dark:bg-slate-800"
          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-lg shadow-slate-200/50 dark:shadow-none hover:-translate-y-0.5 hover:shadow-xl hover:text-indigo-600 dark:hover:text-indigo-400"
      }`}
    >
      {label}
    </button>
  );
}

