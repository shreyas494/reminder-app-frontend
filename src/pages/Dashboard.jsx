import { useEffect, useState } from "react";
import API from "../services/api";
import dayjs from "dayjs";
import AddReminderModal from "../components/AddReminderModal";

export default function Dashboard() {
  const [reminders, setReminders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editReminder, setEditReminder] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReminders(page);
  }, [page]);

  /* 🔄 FETCH REMINDERS (With Auto-Correction) */
  const fetchReminders = async (pageNo = 1) => {
    setLoading(true);
    try {
      const res = await API.get(`/reminders?page=${pageNo}`);

      const { data, totalPages: total, page: current } = res.data;

      // 🛡️ IF PAGE IS EMPTY & NOT FIRST PAGE, GO BACK
      if (data.length === 0 && current > 1) {
        setPage((p) => Math.max(1, p - 1));
        return;
      }

      setReminders(data);
      setPage(current);
      setTotalPages(Math.max(1, total)); // Ensure at least 1 page
    } catch (err) {
      console.error("Failed to fetch reminders", err);
    } finally {
      setLoading(false);
    }
  };

  /* 🔑 SINGLE SOURCE OF TRUTH */
  const getExpiry = (r) => dayjs(r.expiryDate);

  const hasBeenRenewed = (r) =>
    Array.isArray(r.renewals) && r.renewals.length > 0;

  const getDaysToExpiry = (r) =>
    getExpiry(r).startOf("day").diff(dayjs().startOf("day"), "day");

  const remainingTime = (r) => {
    const now = dayjs();
    const end = getExpiry(r);

    if (end.isBefore(now)) return "Expired";

    const months = end.diff(now, "month");
    if (months >= 1) return `${months} month(s)`;

    return `${end.diff(now, "day")} day(s)`;
  };

  const getStatusLabel = (r) => {
    const end = getExpiry(r);

    if (end.isBefore(dayjs())) return { text: "Expired", color: "red" };
    if (hasBeenRenewed(r)) return { text: "Renewed", color: "blue" };
    const daysToExpiry = getDaysToExpiry(r);
    if (daysToExpiry >= 0 && daysToExpiry <= 30) return { text: "Near Expiry", color: "amber" };
    return { text: "Active", color: "green" };
  };

  const nearExpiryReminders = reminders.filter((r) => {
    const daysToExpiry = getDaysToExpiry(r);
    return daysToExpiry >= 0 && daysToExpiry <= 30;
  });

  return (
    <div className="relative min-h-[calc(100vh-64px)] px-4 sm:px-6 py-8 overflow-hidden transition-colors">

      {/* 🎨 ANIMATED BACKGROUND */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-r from-cyan-400/12 to-indigo-400/12 blur-[100px] animate-pulse dark:from-cyan-500/10 dark:to-indigo-600/10 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-r from-fuchsia-400/12 to-purple-400/12 blur-[100px] animate-pulse delay-1000 dark:from-fuchsia-600/10 dark:to-purple-600/10 pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
              Subscriptions
            </h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Manage your client reminders and renewals
            </p>
          </div>

          <button
            onClick={() => {
              setEditReminder(null);
              setShowModal(true);
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700
                       text-white font-semibold text-sm shadow-sm
                       transition-all duration-200"
          >
            New Reminder
          </button>
        </div>

        {/* NEAR EXPIRY (SEPARATE) */}
        {!loading && nearExpiryReminders.length > 0 && (
          <div className="backdrop-blur-xl bg-amber-50/70 dark:bg-amber-900/10 border border-amber-200/80 dark:border-amber-500/20 rounded-3xl shadow-lg overflow-hidden">
            <div className="px-4 sm:px-6 py-3 border-b border-amber-200/70 dark:border-amber-500/20 flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-bold text-amber-800 dark:text-amber-300">Near Expiry (Next 30 Days)</h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                {nearExpiryReminders.length} reminder(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-amber-100/70 dark:bg-amber-900/20 border-b border-amber-200/70 dark:border-amber-500/20">
                  <tr>
                    <Th>Client</Th>
                    <Th>Project</Th>
                    <Th>Expiry</Th>
                    <Th>Remaining</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100/80 dark:divide-amber-900/20">
                  {nearExpiryReminders.map((r) => {
                    const status = getStatusLabel(r);
                    return (
                      <tr key={`near-${r._id}`} className="hover:bg-amber-50/60 dark:hover:bg-amber-900/10 transition-colors">
                        <Td className="font-semibold text-slate-800 dark:text-slate-200">{r.clientName}</Td>
                        <Td className="text-slate-600 dark:text-slate-300">{r.projectName}</Td>
                        <Td className="tabular-nums text-slate-700 dark:text-slate-300">{getExpiry(r).format("DD MMM YYYY")}</Td>
                        <Td className="tabular-nums text-slate-600 dark:text-slate-400">{remainingTime(r)}</Td>
                        <Td>
                          <Badge color={status.color}>{status.text}</Badge>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 🌟 GLASS TABLE CARD */}
        <div className="backdrop-blur-xl bg-white/70 dark:bg-[#111827]/60 border border-white/50 dark:border-white/10 
                        rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden hover:border-indigo-500/20 transition-colors">

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-700/60 backdrop-blur-sm">
                <tr>
                  <Th>#</Th>
                  <Th>Client</Th>
                  <Th className="hidden md:table-cell">Contact</Th>
                  <Th>Mobile</Th>
                  <Th>Project</Th>
                  <Th>Expiry</Th>
                  <Th className="hidden lg:table-cell">Remaining</Th>
                  <Th>Status</Th>
                  <Th className="hidden lg:table-cell">Amount</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {loading ? (
                  <tr>
                    <td colSpan="10" className="text-center py-24">
                      <div className="flex flex-col items-center gap-3 animate-pulse">
                        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                      </div>
                    </td>
                  </tr>
                ) : reminders.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-24">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                            <path fillRule="evenodd" d="M5.25 2.25a3 3 0 00-3 3v4.318a3 3 0 00.879 2.121l9.58 9.581c.92.92 2.39 1.186 3.548.428a18.849 18.849 0 005.441-5.44c.758-1.16.492-2.629-.428-3.548l-9.58-9.581a3 3 0 00-2.121-.879H5.25zM6.375 7.5a1.125 1.125 0 100-2.25 1.125 1.125 0 000 2.25z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">No reminders found.</p>
                        <button
                          onClick={() => setShowModal(true)}
                          className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                        >
                          Create your first reminder
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  reminders.map((r, i) => {
                    const status = getStatusLabel(r);

                    return (
                      <tr key={r._id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors duration-200">
                        <Td className="font-mono text-slate-400 opacity-60">{(page - 1) * 5 + i + 1}</Td>
                        <Td className="font-bold text-slate-800 dark:text-slate-200">{r.clientName}</Td>
                        <Td className="hidden md:table-cell text-slate-600 dark:text-slate-400">{r.contactPerson}</Td>
                        <Td>
                          <CallButton mobile1={r.mobile1} mobile2={r.mobile2} />
                        </Td>
                        <Td className="text-indigo-600 dark:text-indigo-400 font-medium truncate max-w-[150px]">{r.projectName}</Td>
                        <Td className="tabular-nums font-medium text-slate-700 dark:text-slate-300">
                          <div className="flex flex-col">
                            <span>{getExpiry(r).format("DD MMM YYYY")}</span>
                            <span className="mt-1 text-xs font-normal text-slate-500 dark:text-slate-400 lg:hidden">
                              {remainingTime(r) === "Expired" ? "Expired" : `${remainingTime(r)} remaining`}
                            </span>
                          </div>
                        </Td>
                        <Td className="hidden lg:table-cell tabular-nums text-slate-500">{remainingTime(r)}</Td>
                        <Td>
                          <Badge color={status.color}>{status.text}</Badge>
                        </Td>
                        <Td className="hidden lg:table-cell font-mono font-medium text-slate-700 dark:text-slate-300">
                          {r.amount ? `₹${r.amount.toLocaleString()}` : <span className="text-slate-300">-</span>}
                        </Td>
                        <Td>
                          <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                            <ActionButton
                              color="blue"
                              label="Edit"
                              onClick={() => {
                                setEditReminder({ ...r, _mode: "edit" });
                                setShowModal(true);
                              }}
                            />
                            <ActionButton
                              color="amber"
                              label="Renew"
                              onClick={() => {
                                setEditReminder({ ...r, _mode: "renew" });
                                setShowModal(true);
                              }}
                            />
                            <ActionButton
                              color="red"
                              label="Delete"
                              onClick={async () => {
                                if (!window.confirm("Delete this reminder?")) return;
                                await API.delete(`/reminders/${r._id}`);
                                fetchReminders(page);
                              }}
                            />
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

        {/* PAGINATION */}
        <div className="flex items-center justify-center gap-4">
          <PaginationButton
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            label="Previous"
          />

          <span className="text-sm font-medium text-slate-600 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 backdrop-blur px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            Page {page} of {totalPages}
          </span>

          <PaginationButton
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            label="Next"
          />
        </div>

        {showModal && (
          <AddReminderModal
            existing={editReminder}
            onAdded={() => fetchReminders(page)}
            onClose={() => setShowModal(false)}
          />
        )}
      </div>
    </div>
  );
}

/* ================= COMPONENT HELPERS ================= */

function Th({ children, className = "" }) {
  return (
    <th className={`px-4 sm:px-6 py-3 sm:py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }) {
  return (
    <td className={`px-4 sm:px-6 py-3 sm:py-5 whitespace-nowrap text-sm ${className}`}>
      {children}
    </td>
  );
}

function Badge({ children, color }) {
  const map = {
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-1 ring-emerald-600/10",
    red: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 ring-1 ring-rose-600/10",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 ring-1 ring-blue-600/10",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 ring-1 ring-amber-600/10",
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${map[color]}`}>
      {children}
    </span>
  );
}

function ActionButton({ onClick, color, label }) {
  const map = {
    blue: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 ring-1 ring-blue-200/70 dark:ring-blue-800/50",
    amber: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 ring-1 ring-amber-200/70 dark:ring-amber-800/50",
    red: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 ring-1 ring-rose-200/70 dark:ring-rose-800/50",
  };

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${map[color]}`}
    >
      {label}
    </button>
  );
}

function PaginationButton({ disabled, onClick, label }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 
        ${disabled
          ? "opacity-50 cursor-not-allowed text-slate-400 bg-slate-100 dark:bg-slate-800"
          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-lg shadow-slate-200/50 dark:shadow-none hover:-translate-y-0.5 hover:shadow-xl hover:text-indigo-600 dark:hover:text-indigo-400"
        }`}
    >
      {label}
    </button>
  );
}

function CallButton({ mobile1, mobile2 }) {
  return (
    <div className="flex flex-col gap-1 text-xs">
      {mobile1 && (
        <a href={`tel:${mobile1}`} className="hover:text-indigo-600 transition-colors font-mono">
          {mobile1}
        </a>
      )}
      {mobile2 && (
        <a href={`tel:${mobile2}`} className="text-slate-400 hover:text-indigo-500 transition-colors font-mono">
          {mobile2}
        </a>
      )}
    </div>
  );
}


