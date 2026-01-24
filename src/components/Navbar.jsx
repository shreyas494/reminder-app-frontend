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
    <nav
      className="h-16 px-4 sm:px-6
                 flex items-center justify-between
                 bg-white dark:bg-[#020617]
                 border-b border-gray-200 dark:border-gray-700"
    >
      {/* LEFT */}
      <Link
        to={user ? "/" : "/landing"}
        className="text-lg sm:text-xl font-bold
                   text-blue-600 dark:text-blue-400
                   whitespace-nowrap"
      >
        Reminder App
      </Link>

      {/* RIGHT */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-xl"
          title="Toggle theme"
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        {!user ? (
          <Link to="/login">Login</Link>
        ) : (
          <>
            {/* 🔴 SUPERADMIN ONLY */}
            {user.role === "superadmin" && (
              <Link
                to="/admin/users"
                className="px-3 py-1
                           rounded-lg border border-red-500
                           text-red-600 dark:text-red-400
                           hover:bg-red-50 dark:hover:bg-red-900/30
                           font-semibold
                           whitespace-nowrap"
              >
                Admin Panel
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="px-3 py-1
                         bg-red-500 text-white
                         rounded-lg
                         whitespace-nowrap"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
