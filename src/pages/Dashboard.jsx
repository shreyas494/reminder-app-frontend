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

  const fetchReminders = async () => {
    const res = await API.get("/reminders");
    setReminders(res.data);
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
    <div className="min-h-[calc(100vh-64px)] px-4 sm:px-6 py-8 bg-gray-100 dark:bg-[#0b1120]">

      <div className="max-w-7xl mx-auto mb-6 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Subscriptions
        </h1>

        {/* ✅ ONLY CHANGE IS HERE */}
        <button
          onClick={() => {
            setEditReminder(null);
            setShowModal(true);
          }}
          className="
            w-full sm:w-auto
            px-4 py-2
            bg-blue-600 hover:bg-blue-700
            text-white rounded-lg font-semibold
          "
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
            {reminders.map((r, i) => {
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

                  {/* 📞 CALL SELECTOR — UNCHANGED */}
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
            })}
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

/* 📞 CALL SELECTOR — EXACTLY AS YOU WANTED */
function CallButton({ mobile1, mobile2 }) {
  const [open, setOpen] = useState(false);

  if (!mobile2) {
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
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 rounded-lg text-xs bg-green-100 text-green-700"
      >
        Call
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-40 bg-white dark:bg-[#111827]
                        border border-gray-300 dark:border-gray-700
                        rounded-lg shadow-lg">
          <a href={`tel:${mobile1}`} className="block px-4 py-2">📞 Mobile 1</a>
          <a href={`tel:${mobile2}`} className="block px-4 py-2">📞 Mobile 2</a>
        </div>
      )}
    </div>
  );
}
