import { useEffect, useState } from "react";
import API from "../services/api";
import dayjs from "dayjs";
import AddReminderModal from "../components/AddReminderModal";

export default function Dashboard() {
  const [reminders, setReminders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editReminder, setEditReminder] = useState(null);

  useEffect(() => {
    fetchReminders();
  }, []);

  /* ✅ FIXED: backend now returns { data, page, totalPages } */
  const fetchReminders = async () => {
    const res = await API.get("/reminders");
    setReminders(res.data.data || []); // 🔑 CRITICAL FIX
  };

  /* 🔑 SINGLE SOURCE OF TRUTH */
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
    <div className="min-h-[calc(100vh-64px)] px-4 sm:px-6 py-8 bg-gray-100 dark:bg-[#0b1120]">
      <div className="max-w-7xl mx-auto mb-6 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Subscriptions
        </h1>

        <button
          onClick={() => {
            setEditReminder(null);
            setShowModal(true);
          }}
          className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base
                     bg-blue-600 hover:bg-blue-700
                     text-white rounded-lg font-semibold"
        >
          + Add Reminder
        </button>
      </div>

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
                <td colSpan="10" className="text-center py-16 text-gray-500 dark:text-gray-400">
                  No reminders found.
                </td>
              </tr>
            ) : (
              reminders.map((r, i) => {
                const expiry = getExpiry(r);
                const isExpired = expiry.isBefore(dayjs());
                const status = getStatusLabel(r);

                return (
                  <tr
                    key={r._id}
                    className="border-t border-gray-200 dark:border-gray-700
                               hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  >
                    <Td>{i + 1}</Td>
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
                      <div className="flex flex-col gap-1">
                        <Badge color={status.color}>{status.text}</Badge>
                        <span className="text-xs text-gray-400 lg:hidden">
                          {remainingTime(r)}
                        </span>
                      </div>
                    </Td>

                    <Td className="hidden lg:table-cell">₹{r.amount || "-"}</Td>

                    <Td>
                      <div className="flex flex-col sm:flex-row gap-2">
                        {!isExpired && (
                          <>
                            <ActionButton
                              color="blue"
                              onClick={() => {
                                setEditReminder({ ...r, _mode: "edit" });
                                setShowModal(true);
                              }}
                            >
                              Edit
                            </ActionButton>

                            <ActionButton
                              color="amber"
                              onClick={() => {
                                setEditReminder({ ...r, _mode: "renew" });
                                setShowModal(true);
                              }}
                            >
                              Renew
                            </ActionButton>
                          </>
                        )}

                        <ActionButton
                          color="red"
                          onClick={async () => {
                            const ok = window.confirm("Delete this reminder?");
                            if (!ok) return;
                            await API.delete(`/reminders/${r._id}`);
                            fetchReminders();
                          }}
                        >
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

      {showModal && (
        <AddReminderModal
          existing={editReminder}
          onAdded={fetchReminders}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

/* ===== HELPERS ===== */

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
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
}

function ActionButton({ children, onClick, color }) {
  const colors = {
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
  };

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${colors[color]}`}
    >
      {children}
    </button>
  );
}

function CallButton({ mobile1, mobile2 }) {
  if (mobile1 && !mobile2) {
    return (
      <a
        href={`tel:${mobile1}`}
        className="px-3 py-1.5 rounded-lg text-xs bg-green-100 text-green-700"
      >
        Call
      </a>
    );
  }

  return (
    <div className="flex gap-2">
      <a
        href={`tel:${mobile1}`}
        className="px-3 py-1.5 rounded-lg text-xs bg-green-100 text-green-700"
      >
        Call 1
      </a>
      {mobile2 && (
        <a
          href={`tel:${mobile2}`}
          className="px-3 py-1.5 rounded-lg text-xs bg-green-100 text-green-700"
        >
          Call 2
        </a>
      )}
    </div>
  );
}
