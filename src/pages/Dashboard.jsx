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

  useEffect(() => {
    fetchReminders(page);
  }, [page]);

  const fetchReminders = async (pageNo = 1) => {
    const res = await API.get(`/reminders?page=${pageNo}`);

    // ✅ FIX — backend returns { data, page, totalPages }
    setReminders(res.data.data);
    setPage(res.data.page);
    setTotalPages(res.data.totalPages);
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
          className="w-full sm:w-auto px-4 py-2
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
                <td colSpan="10" className="text-center py-16 text-gray-500">
                  No reminders found.
                </td>
              </tr>
            ) : (
              reminders.map((r, i) => {
                const status = getStatusLabel(r);

                return (
                  <tr key={r._id} className="border-t">
                    <Td>{(page - 1) * 5 + i + 1}</Td>
                    <Td>{r.clientName}</Td>
                    <Td className="hidden md:table-cell">{r.contactPerson}</Td>
                    <Td>
                      <CallButton mobile1={r.mobile1} mobile2={r.mobile2} />
                    </Td>
                    <Td>{r.projectName}</Td>
                    <Td>{getExpiry(r).format("DD MMM YYYY")}</Td>
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

                        <ActionButton
                          color="red"
                          onClick={async () => {
                            if (!window.confirm("Delete this reminder?")) return;
                            await API.delete(`/reminders/${r._id}`);
                            fetchReminders(page);
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

      {/* PAGINATION */}
      <div className="flex items-center justify-center gap-6 mt-6">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="px-4 py-2 rounded-lg bg-gray-700 text-white disabled:opacity-40"
        >
          ←
        </button>

        <span className="text-gray-300">
          Page {page} of {totalPages}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 rounded-lg bg-gray-700 text-white disabled:opacity-40"
        >
          →
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

/* ---------- UI HELPERS (UNCHANGED) ---------- */

function Th({ children }) {
  return <th className="p-3 text-left font-semibold">{children}</th>;
}

function Td({ children }) {
  return <td className="p-3">{children}</td>;
}

function Badge({ children, color }) {
  const map = {
    green: "bg-green-900/30 text-green-300",
    red: "bg-red-900/30 text-red-300",
    blue: "bg-blue-900/30 text-blue-300",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs ${map[color]}`}>
      {children}
    </span>
  );
}

function ActionButton({ children, onClick, color }) {
  const map = {
    blue: "bg-blue-900/30 text-blue-300",
    amber: "bg-amber-900/30 text-amber-300",
    red: "bg-red-900/30 text-red-300",
  };
  return (
    <button onClick={onClick} className={`px-3 py-1 rounded-lg ${map[color]}`}>
      {children}
    </button>
  );
}

function CallButton({ mobile1, mobile2 }) {
  if (mobile1 && !mobile2) {
    return (
      <a href={`tel:${mobile1}`} className="px-3 py-1 rounded-lg bg-green-900/30 text-green-300">
        Call
      </a>
    );
  }

  return (
    <div className="relative group">
      <button className="px-3 py-1 rounded-lg bg-green-900/30 text-green-300">
        Call
      </button>
      <div className="hidden group-hover:block absolute z-10 mt-2 bg-[#111827] border rounded-lg">
        <a href={`tel:${mobile1}`} className="block px-4 py-2">📞 Mobile 1</a>
        {mobile2 && (
          <a href={`tel:${mobile2}`} className="block px-4 py-2">📞 Mobile 2</a>
        )}
      </div>
    </div>
  );
}
