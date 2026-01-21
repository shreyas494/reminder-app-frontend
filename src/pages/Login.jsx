import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  /* 🌙 Detect dark mode */
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark")
  );

  /* ✅ SAFE REDIRECT (NO EARLY RETURN) */
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const redirect = () => setTimeout(() => navigate("/"), 1200);

  /* ================= EMAIL + PASSWORD ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await API.post("/auth/login", { email, password });
      login(res.data);
      setIsSuccess(true);
      setMessage("✅ Login successful. Redirecting...");
      redirect();
    } catch (err) {
      setIsSuccess(false);
      setMessage(
        err.response?.data?.message ||
          "❌ Access denied. Contact administrator."
      );
    }
  };

  /* ================= GOOGLE LOGIN ================= */
  const handleGoogleLogin = async (cred) => {
    setMessage("");

    try {
      const res = await API.post("/auth/google", {
        credential: cred.credential,
      });

      login(res.data);
      setIsSuccess(true);
      setMessage("✅ Login successful. Redirecting...");
      redirect();
    } catch (err) {
      setIsSuccess(false);
      setMessage(
        err.response?.data?.message ||
          "❌ Access denied. Contact administrator."
      );
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center
                    bg-gray-100 dark:bg-[#0b1120] px-4 transition-colors">

      <div className="w-full max-w-md rounded-2xl p-8
                      bg-white dark:bg-[#111827]
                      border border-gray-200 dark:border-gray-700
                      shadow-xl">

        <h1 className="text-3xl font-bold text-center mb-6
                       text-gray-900 dark:text-gray-100">
          Login
        </h1>

        {message && (
          <div
            className={`mb-4 rounded-lg px-4 py-2 text-sm ${
              isSuccess
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
          />

          <PasswordField
            label="Password"
            value={password}
            show={showPassword}
            toggle={() => setShowPassword(!showPassword)}
            onChange={setPassword}
          />

          <button
            className="w-full rounded-lg bg-blue-600 hover:bg-blue-700
                       text-white py-2 font-semibold transition">
            Login
          </button>
        </form>

        <div className="mt-5 flex justify-center">
          <GoogleLogin
            key={isDark ? "dark" : "light"}
            onSuccess={handleGoogleLogin}
            onError={() =>
              setMessage("❌ Google authentication failed")
            }
            theme={isDark ? "filled_black" : "outline"}
            shape="pill"
          />
        </div>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Contact your administrator if you don’t have access.
        </p>
      </div>
    </div>
  );
}

/* ---------- HELPERS ---------- */

function Input({ label, type, value, onChange }) {
  return (
    <div>
      <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg px-3 py-2
                   bg-white dark:bg-[#020617]
                   border border-gray-300 dark:border-gray-600
                   text-gray-900 dark:text-gray-100
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function PasswordField({ label, value, show, toggle, onChange }) {
  return (
    <div>
      <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">
        {label}
      </label>

      <div className="relative">
        <input
          type={show ? "text" : "password"}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg px-3 py-2 pr-12
                     bg-white dark:bg-[#020617]
                     border border-gray-300 dark:border-gray-600
                     text-gray-900 dark:text-gray-100"
        />

        <button
          type="button"
          onClick={toggle}
          className="absolute right-3 top-1/2 -translate-y-1/2
                     text-sm text-gray-600 dark:text-gray-400">
          {show ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}
