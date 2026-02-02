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
    setReminders(res.data.data);
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
    <div className="min-h-[calc(100vh-64px)] px-6 py-8 bg-[#0b1120]">
      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Subscriptions</h1>

        <button
          onClick={() => {
            setEditReminder(null);
            setShowModal(true);
          }}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
        >
          + Add Reminder
        </button>
      </div>

      {/* TABLE */}
      <div className="max-w-7xl mx-auto bg-[#111827] border border-gray-700 rounded-2xl shadow-xl overflow-x-auto">
        <table className="min-w-[1000px] w-full text-sm text-gray-200">
          <thead className="bg-[#1f2937]">
            <tr>
              <Th>#</Th>
              <Th>Client</Th>
              <Th>Contact</Th>
              <Th>Mobile</Th>
              <Th>Project</Th>
              <Th>Expiry</Th>
              <Th>Remaining</Th>
              <Th>Status</Th>
              <Th>Amount</Th>
              <Th>Actions</Th>
            </tr>
          </thead>

          <tbody>
            {reminders.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center py-16 text-gray-400">
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
                    className="border-t border-gray-700 hover:bg-[#1f2937]"
                  >
                    <Td>{(page - 1) * 5 + i + 1}</Td>
                    <Td>{r.clientName}</Td>
                    <Td>{r.contactPerson}</Td>

                    {/* ✅ CALL BUTTON WITH MOBILE SELECTOR */}
                    <Td>
                      <CallButton
                        mobile1={r.mobile1}
                        mobile2={r.mobile2}
                      />
                    </Td>

                    <Td>{r.projectName}</Td>
                    <Td>{expiry.format("DD MMM YYYY")}</Td>
                    <Td>{remainingTime(r)}</Td>

                    <Td>
                      <Badge color={status.color}>{status.text}</Badge>
                    </Td>

                    <Td>₹{r.amount || "-"}</Td>

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
      <div className="flex justify-center items-center gap-6 mt-6 text-gray-300">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="px-4 py-2 rounded-lg bg-gray-700 disabled:opacity-40"
        >
          ←
        </button>

        <span>
          Page {page} of {totalPages}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          className="px-4 py-2 rounded-lg bg-gray-700 disabled:opacity-40"
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

/* ===== HELPERS ===== */

function Th({ children }) {
  return (
    <th className="p-4 text-left font-semibold text-gray-300">
      {children}
    </th>
  );
}

function Td({ children }) {
  return <td className="p-4">{children}</td>;
}

function Badge({ children, color }) {
  const colors = {
    green: "bg-green-900/40 text-green-300",
    red: "bg-red-900/40 text-red-300",
    blue: "bg-blue-900/40 text-blue-300",
  };

  return (
    <span className={`px-4 py-1 rounded-full text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
}

function ActionButton({ children, onClick, color }) {
  const colors = {
    blue: "bg-blue-900/40 text-blue-300 hover:bg-blue-900/60",
    amber: "bg-yellow-900/40 text-yellow-300 hover:bg-yellow-900/60",
    red: "bg-red-900/40 text-red-300 hover:bg-red-900/60",
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-lg text-sm transition ${colors[color]}`}
    >
      {children}
    </button>
  );
}

/* ✅ CALL BUTTON WITH DROPDOWN */
function CallButton({ mobile1, mobile2 }) {
  const [open, setOpen] = useState(false);

  if (mobile1 && !mobile2) {
    return (
      <a
        href={`tel:${mobile1}`}
        className="px-4 py-1.5 rounded-full
                   bg-green-900/40 text-green-300
                   hover:bg-green-900/60 transition"
      >
        Call
      </a>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="px-4 py-1.5 rounded-full
                   bg-green-900/40 text-green-300
                   hover:bg-green-900/60 transition"
      >
        Call
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-36 bg-[#111827] border border-gray-700 rounded-lg shadow-lg">
          <a
            href={`tel:${mobile1}`}
            className="block px-4 py-2 text-sm hover:bg-[#1f2937]"
          >
            📞 Mobile 1
          </a>

          {mobile2 && (
            <a
              href={`tel:${mobile2}`}
              className="block px-4 py-2 text-sm hover:bg-[#1f2937]"
            >
              📞 Mobile 2
            </a>
          )}
        </div>
      )}
    </div>
  );
}
