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
    <div className="relative min-h-[calc(100vh-64px)] px-4 sm:px-6 py-8 overflow-hidden bg-slate-50 dark:bg-[#0b1120] transition-colors">

      {/* 🎨 ANIMATED BACKGROUND */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-r from-blue-400/10 to-indigo-400/10 blur-[100px] animate-pulse dark:from-blue-600/5 dark:to-indigo-600/5 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-r from-violet-400/10 to-purple-400/10 blur-[100px] animate-pulse delay-1000 dark:from-violet-600/5 dark:to-purple-600/5 pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
              User Management
            </h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Manage system access and permissions
            </p>
          </div>

          <Link
            to="/admin/users/create"
            className="group relative w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 
                       text-white font-semibold text-sm shadow-lg shadow-blue-500/30 hover:shadow-indigo-500/40 
                       transition-all duration-300 hover:-translate-y-0.5 text-center"
          >
            + Create User
          </Link>
        </div>

        {/* 🌟 GLASS TABLE CARD */}
        <div className="backdrop-blur-xl bg-white/70 dark:bg-[#111827]/60 border border-white/50 dark:border-white/10 
                        rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden hover:border-indigo-500/20 transition-colors">

          <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full text-sm text-left">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-700/60 backdrop-blur-sm">
                <tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Role</Th>
                  <Th>Status</Th>
                  <Th>Google Login</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-24">
                      <div className="flex flex-col items-center gap-3 animate-pulse">
                        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-24">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-4xl">👥</div>
                        <p className="text-slate-500 font-medium">No users found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors duration-200">
                      <Td className="font-semibold text-slate-900 dark:text-slate-200">{user.name}</Td>
                      <Td className="text-slate-600 dark:text-slate-400 font-medium">{user.email}</Td>
                      <Td>
                        <Badge color={user.role === "superadmin" ? "purple" : user.role === "admin" ? "blue" : "gray"}>
                          {user.role}
                        </Badge>
                      </Td>
                      <Td>
                        {user.isActive ? (
                          <Badge color="green">Active</Badge>
                        ) : (
                          <Badge color="red">Disabled</Badge>
                        )}
                      </Td>
                      <Td>
                        {user.googleEnabled ? (
                          <Badge color="green">Enabled</Badge>
                        ) : (
                          <Badge color="gray">Disabled</Badge>
                        )}
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-all">
                          {user.role !== "superadmin" && (
                            <>
                              {user.isActive ? (
                                <ActionButton
                                  color="red"
                                  label="Disable"
                                  onClick={() => disableUser(user._id)}
                                />
                              ) : (
                                <ActionButton
                                  color="green"
                                  label="Enable"
                                  onClick={() => enableUser(user._id)}
                                />
                              )}

                              {/* GOOGLE TOGGLE */}
                              {user.googleEnabled ? (
                                <ActionButton
                                  color="orange"
                                  label="Disable Google"
                                  onClick={() => disableGoogle(user._id)}
                                />
                              ) : (
                                <ActionButton
                                  color="blue"
                                  label="Enable Google"
                                  onClick={() => enableGoogle(user._id)}
                                />
                              )}
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
      </div>
    </div>
  );
}

/* ---------- UI HELPERS ---------- */

function Th({ children, className = "" }) {
  return (
    <th className={`px-4 sm:px-6 py-3 sm:py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }) {
  return <td className={`px-4 sm:px-6 py-3 sm:py-5 whitespace-nowrap text-sm ${className}`}>{children}</td>;
}

function Badge({ children, color }) {
  const map = {
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-1 ring-emerald-600/10",
    red: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 ring-1 ring-rose-600/10",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 ring-1 ring-blue-600/10",
    purple: "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400 ring-1 ring-violet-600/10",
    orange: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 ring-1 ring-amber-600/10",
    gray: "bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-400 ring-1 ring-slate-600/10",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${map[color]}`}>
      {children}
    </span>
  );
}

function ActionButton({ label, onClick, color }) {
  const map = {
    green: "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20",
    red: "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20",
    blue: "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20",
    orange: "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20",
  };
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${map[color]}`}
    >
      {label}
    </button>
  );
}
