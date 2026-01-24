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
    <div className="min-h-[calc(100vh-64px)] px-4 sm:px-6 py-8 bg-gray-100 dark:bg-[#0b1120] transition-colors">
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

      {/* TABLE WRAPPER WITH SCROLL */}
      <div
        className="max-w-7xl mx-auto
                   bg-white dark:bg-[#111827]
                   border border-gray-200 dark:border-gray-700
                   rounded-2xl shadow-xl
                   overflow-x-auto"
      >
        <table className="min-w-[900px] w-full border-collapse text-sm">
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
                <td
                  colSpan="6"
                  className="text-center py-16 text-gray-600 dark:text-gray-400"
                >
                  Loading users…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-16 text-gray-600 dark:text-gray-400"
                >
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
                      {isSuperAdmin ? (
                        <Badge color="blue">Super Admin</Badge>
                      ) : (
                        <Badge color="gray">User</Badge>
                      )}
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
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">
                          Always Enabled
                        </span>
                      ) : user.googleEnabled ? (
                        <Badge color="green">Enabled</Badge>
                      ) : (
                        <Badge color="red">Disabled</Badge>
                      )}
                    </Td>

                    <Td>
                      {isSuperAdmin ? (
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">
                          Protected
                        </span>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-2">
                          {/* Enable / Disable User */}
                          {user.isActive ? (
                            <button
                              onClick={() => disableUser(user._id)}
                              className="text-red-600 dark:text-red-400 hover:underline"
                            >
                              Disable
                            </button>
                          ) : (
                            <button
                              onClick={() => enableUser(user._id)}
                              className="text-green-600 dark:text-green-400 hover:underline"
                            >
                              Enable
                            </button>
                          )}

                          {/* Google Toggle */}
                          {user.googleEnabled ? (
                            <button
                              onClick={() => disableGoogle(user._id)}
                              className="text-red-600 dark:text-red-400 hover:underline"
                            >
                              Disable Google
                            </button>
                          ) : (
                            <button
                              onClick={() => enableGoogle(user._id)}
                              className="text-green-600 dark:text-green-400 hover:underline"
                            >
                              Enable Google
                            </button>
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

/* ---------- HELPERS ---------- */

function Th({ children }) {
  return (
    <th className="p-4 text-left font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">
      {children}
    </th>
  );
}

function Td({ children }) {
  return (
    <td className="p-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">
      {children}
    </td>
  );
}

function Badge({ children, color }) {
  const colors = {
    green:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    red:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    blue:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    gray:
      "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm ${colors[color]}`}>
      {children}
    </span>
  );
}
