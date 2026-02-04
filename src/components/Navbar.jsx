import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="sticky top-0 z-50 h-18 px-4 sm:px-8 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-[#0b1120]/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between">

        {/* LEFT */}
        <Link
          to={user ? "/" : "/landing"}
          className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400 tracking-tight hover:opacity-80 transition-opacity"
        >
          Reminder App
        </Link>

        {/* RIGHT */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-lg"
            title="Toggle theme"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          {!user ? (
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5"
            >
              Login
            </Link>
          ) : (
            <>
              {/* 🔴 SUPERADMIN ONLY */}
              {user.role === "superadmin" && (
                <Link
                  to="/admin/users"
                  className="px-5 py-2.5 rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400 
                             font-semibold text-sm ring-1 ring-violet-500/20 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-all whitespace-nowrap"
                >
                  Admin Panel
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300
                           font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all hover:-translate-y-0.5"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
