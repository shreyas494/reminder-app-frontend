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
    <div className="min-h-[calc(100vh-64px)] px-4 sm:px-6 py-8 bg-slate-50 dark:bg-[#0b1120] transition-colors">

      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
            User Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage system access and permissions
          </p>
        </div>

        <Link
          to="/admin/users/create"
          className="group px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 
                     text-white font-semibold text-sm shadow-lg shadow-indigo-500/30 
                     transition-all duration-300 hover:-translate-y-0.5"
        >
          + Create User
        </Link>
      </div>

      {/* TABLE */}
      <div className="max-w-7xl mx-auto bg-white dark:bg-[#111827]
                      border border-slate-200 dark:border-slate-800
                      rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">

        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Google Login</Th>
                <Th>Actions</Th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-20 text-slate-500">
                    Loading users…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-20 text-slate-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isSuperAdmin = user.role === "superadmin";

                  return (
                    <tr
                      key={user._id}
                      className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <Td className="font-semibold text-slate-900 dark:text-slate-200">{user.name}</Td>
                      <Td className="text-slate-600 dark:text-slate-400">{user.email}</Td>

                      <Td>
                        <Badge color={isSuperAdmin ? "purple" : "gray"}>
                          {isSuperAdmin ? "Super Admin" : "User"}
                        </Badge>
                      </Td>

                      <Td>
                        {isSuperAdmin ? (
                          <Badge color="purple">Protected</Badge>
                        ) : user.isActive ? (
                          <Badge color="green">Active</Badge>
                        ) : (
                          <Badge color="red">Disabled</Badge>
                        )}
                      </Td>

                      <Td>
                        {isSuperAdmin ? (
                          <Badge color="purple">Always Enabled</Badge>
                        ) : user.googleEnabled ? (
                          <Badge color="green">Enabled</Badge>
                        ) : (
                          <Badge color="red">Disabled</Badge>
                        )}
                      </Td>

                      {/* ✅ ACTION BUTTONS */}
                      <Td>
                        {isSuperAdmin ? (
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            System
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
    </div>
  );
}

/* ===== HELPERS ===== */

function Th({ children }) {
  return (
    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
      {children}
    </th>
  );
}

function Td({ children, className = "" }) {
  return (
    <td className={`px-6 py-4 whitespace-nowrap ${className}`}>
      {children}
    </td>
  );
}

function Badge({ children, color }) {
  const map = {
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-1 ring-emerald-600/10",
    red: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 ring-1 ring-rose-600/10",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 ring-1 ring-blue-600/10",
    purple: "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400 ring-1 ring-violet-600/10",
    gray: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 ring-1 ring-slate-600/10",
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${map[color]}`}>
      {children}
    </span>
  );
}

function ActionButton({ children, onClick, color }) {
  const map = {
    blue: "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20",
    green: "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20",
    red: "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20",
    amber: "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20",
  };

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border border-transparent hover:border-current ${map[color]}`}
    >
      {children}
    </button>
  );
}
