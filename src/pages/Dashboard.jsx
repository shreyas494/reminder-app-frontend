import { useEffect, useState } from "react";
import API from "../services/api";
import dayjs from "dayjs";
import AddReminderModal from "../components/AddReminderModal";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Dashboard() {
  const [reminders, setReminders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editReminder, setEditReminder] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchReminders(page);
  }, [page]);

  const fetchReminders = async (pageNo = 1) => {
    const res = await API.get(`/reminders?page=${pageNo}`);
    setReminders(res.data.data);        // ✅ REQUIRED (fixes e.map error)
    setTotalPages(res.data.totalPages);
  };

  const getExpiry = (r) => dayjs(r.expiryDate);

  const hasBeenRenewed = (r) =>
    Array.isArray(r.renewals) && r.renewals.length > 0;

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
    return { text: "Active", color: "green" };
  };

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-8 bg-gray-100 dark:bg-[#0b1120]">

      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Subscriptions
        </h1>

        <button
          onClick={() => {
            setEditReminder(null);
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
        >
          + Add Reminder
        </button>
      </div>

      {/* TABLE */}
      <div className="max-w-7xl mx-auto bg-white dark:bg-[#111827]
                      border border-gray-200 dark:border-gray-700
                      rounded-2xl shadow-xl overflow-x-auto">

        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-gray-200 dark:bg-gray-800">
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

          <tbody>
            {reminders.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center py-16 text-gray-500">
                  No reminders found.
                </td>
              </tr>
            ) : (
              reminders.map((r, i) => {
                const expiry = getExpiry(r);
                const isExpired = expiry.isBefore(dayjs());
                const status = getStatusLabel(r);

                return (
                  <tr key={r._id}
                      className="border-t border-gray-200 dark:border-gray-700
                                 hover:bg-gray-100 dark:hover:bg-gray-800">

                    <Td>{(page - 1) * 5 + i + 1}</Td>
                    <Td>{r.clientName}</Td>
                    <Td className="hidden md:table-cell">{r.contactPerson}</Td>

                    <Td>
                      <CallButton mobile1={r.mobile1} mobile2={r.mobile2} />
                    </Td>

                    <Td>{r.projectName}</Td>
                    <Td>{expiry.format("DD MMM YYYY")}</Td>

                    <Td className="hidden lg:table-cell">
                      {remainingTime(r)}
                    </Td>

                    <Td>
                      <Badge color={status.color}>{status.text}</Badge>
                    </Td>

                    <Td className="hidden lg:table-cell">
                      ₹{r.amount || "-"}
                    </Td>

                    <Td>
                      <div className="flex gap-2">
                        {!isExpired && (
                          <>
                            <ActionButton color="blue" onClick={() => {
                              setEditReminder({ ...r, _mode: "edit" });
                              setShowModal(true);
                            }}>
                              Edit
                            </ActionButton>

                            <ActionButton color="amber" onClick={() => {
                              setEditReminder({ ...r, _mode: "renew" });
                              setShowModal(true);
                            }}>
                              Renew
                            </ActionButton>
                          </>
                        )}

                        <ActionButton color="red" onClick={async () => {
                          if (!window.confirm("Delete this reminder?")) return;
                          await API.delete(`/reminders/${r._id}`);
                          fetchReminders(page);
                        }}>
                          Delete
                        </ActionButton>
                      </div>
                    </Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION (ARROWS ONLY) */}
      <div className="flex justify-center items-center gap-6 mt-6">
        <button
          disabled={page === 1}
          onClick={() => setPage(p => Math.max(1, p - 1))}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 disabled:opacity-40"
        >
          <ChevronLeft />
        </button>

        <span className="text-gray-600 dark:text-gray-300">
          Page {page} of {totalPages}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 disabled:opacity-40"
        >
          <ChevronRight />
        </button>
      </div>

      {showModal && (
        <AddReminderModal
          existing={editReminder}
          onAdded={() => fetchReminders(page)}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

/* ===== HELPERS (UNCHANGED) ===== */

function Th({ children }) {
  return (
    <th className="p-3 text-left font-semibold text-gray-800 dark:text-gray-200">
      {children}
    </th>
  );
}

function Td({ children }) {
  return (
    <td className="p-3 text-gray-700 dark:text-gray-300">
      {children}
    </td>
  );
}

function Badge({ children, color }) {
  const colors = {
    green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
}

function ActionButton({ children, onClick, color }) {
  const colors = {
    blue: "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
    amber: "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
    red: "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300",
  };

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${colors[color]}`}
    >
      {children}
    </button>
  );
}

/* ✅ CALL BUTTON – RESTORED OLD UI */
function CallButton({ mobile1, mobile2 }) {
  if (!mobile2) {
    return (
      <a
        href={`tel:${mobile1}`}
        className="px-4 py-2 rounded-xl text-sm font-medium
                   bg-green-100 text-green-700
                   hover:bg-green-200 transition"
      >
        Call
      </a>
    );
  }

  return (
    <div className="flex gap-2">
      <a
        href={`tel:${mobile1}`}
        className="px-4 py-2 rounded-xl text-sm font-medium
                   bg-green-100 text-green-700 hover:bg-green-200"
      >
        Call 1
      </a>
      <a
        href={`tel:${mobile2}`}
        className="px-4 py-2 rounded-xl text-sm font-medium
                   bg-green-100 text-green-700 hover:bg-green-200"
      >
        Call 2
      </a>
    </div>
  );
}
