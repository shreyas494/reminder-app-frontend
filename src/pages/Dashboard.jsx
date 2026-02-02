import { useEffect, useState } from "react";
import API from "../services/api";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await API.get("/admin/users");
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (id, enabled) => {
    await API.patch(`/admin/users/${id}/status`, { enabled });
    fetchUsers();
  };

  const toggleGoogle = async (id, enabled) => {
    await API.patch(`/admin/users/${id}/google`, { enabled });
    fetchUsers();
  };

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 sm:px-6 py-8 bg-gray-100 dark:bg-[#0b1120]">
      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">User Management</h1>

        <button className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
          + Create User
        </button>
      </div>

      {/* TABLE */}
      <div className="max-w-7xl mx-auto bg-[#111827] border border-gray-700 rounded-2xl shadow-xl overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm text-white">
          <thead className="bg-gray-800">
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Google Login</Th>
              <Th>Actions</Th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-10 text-gray-400">
                  Loading users…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-10 text-gray-400">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u._id}
                  className="border-t border-gray-700 hover:bg-gray-800 transition"
                >
                  <Td>{u.name}</Td>
                  <Td>{u.email}</Td>

                  <Td>
                    <Badge color={u.role === "superadmin" ? "blue" : "gray"}>
                      {u.role === "superadmin" ? "Super Admin" : "User"}
                    </Badge>
                  </Td>

                  <Td>
                    {u.protected ? (
                      <Badge color="blue">Protected</Badge>
                    ) : u.enabled ? (
                      <Badge color="green">Active</Badge>
                    ) : (
                      <Badge color="red">Disabled</Badge>
                    )}
                  </Td>

                  <Td>
                    {u.googleProtected ? (
                      <Badge color="blue">Always Enabled</Badge>
                    ) : u.googleEnabled ? (
                      <Badge color="green">Enabled</Badge>
                    ) : (
                      <Badge color="red">Disabled</Badge>
                    )}
                  </Td>

                  <Td>
                    <div className="flex flex-wrap gap-2">
                      {u.protected ? (
                        <Badge color="blue">Protected</Badge>
                      ) : (
                        <>
                          <ActionButton
                            color={u.enabled ? "red" : "green"}
                            onClick={() =>
                              toggleUserStatus(u._id, !u.enabled)
                            }
                          >
                            {u.enabled ? "Disable" : "Enable"}
                          </ActionButton>

                          <ActionButton
                            color={u.googleEnabled ? "amber" : "blue"}
                            onClick={() =>
                              toggleGoogle(u._id, !u.googleEnabled)
                            }
                          >
                            {u.googleEnabled
                              ? "Disable Google"
                              : "Enable Google"}
                          </ActionButton>
                        </>
                      )}
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================= UI HELPERS ================= */

function Th({ children }) {
  return (
    <th className="p-4 text-left font-semibold text-gray-200">
      {children}
    </th>
  );
}

function Td({ children }) {
  return <td className="p-4 text-gray-300">{children}</td>;
}

function Badge({ children, color }) {
  const colors = {
    green: "bg-green-600 text-white",
    red: "bg-red-600 text-white",
    blue: "bg-blue-600 text-white",
    gray: "bg-gray-600 text-white",
    amber: "bg-yellow-500 text-black",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[color]}`}>
      {children}
    </span>
  );
}

function ActionButton({ children, onClick, color }) {
  const colors = {
    green: "bg-green-600 hover:bg-green-700",
    red: "bg-red-600 hover:bg-red-700",
    blue: "bg-blue-600 hover:bg-blue-700",
    amber: "bg-yellow-500 hover:bg-yellow-600 text-black",
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${colors[color]}`}
    >
      {children}
    </button>
  );
}
