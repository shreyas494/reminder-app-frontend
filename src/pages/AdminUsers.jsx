import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  const enableUser = async (id) => {
    await API.put(`/admin/users/${id}/enable`);
    fetchUsers();
  };

  const disableUser = async (id) => {
    await API.put(`/admin/users/${id}/disable`);
    fetchUsers();
  };

  const enableGoogle = async (id) => {
    await API.put(`/admin/users/${id}/google/enable`);
    fetchUsers();
  };

  const disableGoogle = async (id) => {
    await API.put(`/admin/users/${id}/google/disable`);
    fetchUsers();
  };

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 sm:px-6 py-8 bg-gray-100 dark:bg-[#0b1120]">
      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          User Management
        </h1>

        <Link
          to="/admin/users/create"
          className="w-full sm:w-auto text-center
                     px-4 py-2 rounded-lg
                     bg-blue-600 hover:bg-blue-700
                     text-white font-semibold"
        >
          + Create User
        </Link>
      </div>

      {/* TABLE */}
      <div className="max-w-7xl mx-auto bg-white dark:bg-[#111827]
                      border border-gray-200 dark:border-gray-700
                      rounded-2xl shadow-xl overflow-x-auto">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-gray-200 dark:bg-gray-800">
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
                <td colSpan="6" className="text-center py-16 text-gray-500">
                  Loading users…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-16 text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isSuperAdmin = user.role === "superadmin";

                return (
                  <tr
                    key={user._id}
                    className="border-t border-gray-200 dark:border-gray-700
                               hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  >
                    <Td>{user.name}</Td>
                    <Td className="break-all">{user.email}</Td>

                    <Td>
                      <Badge color={isSuperAdmin ? "blue" : "gray"}>
                        {isSuperAdmin ? "Super Admin" : "User"}
                      </Badge>
                    </Td>

                    <Td>
                      {isSuperAdmin ? (
                        <Badge color="blue">Protected</Badge>
                      ) : user.isActive ? (
                        <Badge color="green">Active</Badge>
                      ) : (
                        <Badge color="red">Disabled</Badge>
                      )}
                    </Td>

                    <Td>
                      {isSuperAdmin ? (
                        <Badge color="blue">Always Enabled</Badge>
                      ) : user.googleEnabled ? (
                        <Badge color="green">Enabled</Badge>
                      ) : (
                        <Badge color="red">Disabled</Badge>
                      )}
                    </Td>

                    {/* ✅ ACTION BUTTONS */}
                    <Td>
                      {isSuperAdmin ? (
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">
                          Protected
                        </span>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-2">
                          {user.isActive ? (
                            <ActionButton
                              color="red"
                              onClick={() => disableUser(user._id)}
                            >
                              Disable
                            </ActionButton>
                          ) : (
                            <ActionButton
                              color="green"
                              onClick={() => enableUser(user._id)}
                            >
                              Enable
                            </ActionButton>
                          )}

                          {user.googleEnabled ? (
                            <ActionButton
                              color="amber"
                              onClick={() => disableGoogle(user._id)}
                            >
                              Disable Google
                            </ActionButton>
                          ) : (
                            <ActionButton
                              color="blue"
                              onClick={() => enableGoogle(user._id)}
                            >
                              Enable Google
                            </ActionButton>
                          )}
                        </div>
                      )}
                    </Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
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

function Td({ children, className = "" }) {
  return (
    <td className={`p-3 text-gray-700 dark:text-gray-300 ${className}`}>
      {children}
    </td>
  );
}

function Badge({ children, color }) {
  const colors = {
    green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    gray: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
}

/* 🔘 SAME ACTION BUTTON AS DASHBOARD */
function ActionButton({ children, onClick, color }) {
  const colors = {
    blue: "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
    green: "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300",
    red: "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300",
    amber: "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
  };

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${colors[color]}`}
    >
      {children}
    </button>
  );
}
