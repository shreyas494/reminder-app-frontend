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

  const [isLoading, setIsLoading] = useState(false);

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

  const redirect = () => setTimeout(() => navigate("/"), 700);

  /* ================= EMAIL + PASSWORD ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

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
      setIsLoading(false);
    }
  };

  /* ================= GOOGLE LOGIN ================= */
  const handleGoogleLogin = async (cred) => {
    setMessage("");
    setIsLoading(true);

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
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-[#0b1120] transition-colors">

      {/* 🎨 ANIMATED BACKGROUND DECORATION */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-r from-blue-400/30 to-indigo-400/30 blur-[100px] animate-pulse dark:from-blue-600/20 dark:to-indigo-600/20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-r from-violet-400/30 to-purple-400/30 blur-[100px] animate-pulse delay-1000 dark:from-violet-600/20 dark:to-purple-600/20"></div>

      <div className="relative w-full max-w-md p-8 z-10">

        {/* 🌟 GLASS CARD */}
        <div className="backdrop-blur-xl bg-white/70 dark:bg-[#111827]/60 border border-white/50 dark:border-white/10 shadow-2xl rounded-3xl p-8 transition-all duration-300 hover:shadow-indigo-500/10">

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
              Welcome Back
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">
              Enter your credentials to access your dashboard
            </p>
          </div>

          {message && (
            <div
              className={`mb-6 rounded-xl px-4 py-3 text-sm font-medium border flex items-center gap-2 animate-in slide-in-from-top-2 ${isSuccess
                ? "bg-emerald-50/80 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400"
                : "bg-rose-50/80 border-rose-200 text-rose-700 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-400"
                }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="name@company.com"
            />

            <PasswordField
              label="Password"
              value={password}
              show={showPassword}
              toggle={() => setShowPassword(!showPassword)}
              onChange={setPassword}
              placeholder="••••••••"
            />

            <button
              disabled={isLoading}
              className={`w-full h-12 rounded-xl text-white font-semibold text-sm shadow-lg shadow-indigo-500/30
                         transition-all duration-300 flex items-center justify-center gap-2
                         ${isLoading
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Or continue with</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
          </div>

          <div className="flex justify-center">
            <div className="rounded-full p-1 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-transform hover:scale-105">
              <GoogleLogin
                key={isDark ? "dark" : "light"}
                onSuccess={handleGoogleLogin}
                onError={() => setMessage("❌ Google authentication failed")}
                theme={isDark ? "filled_black" : "outline"}
                shape="pill"
                size="medium" // Made smaller (was large)
                width="280"   // Slightly explicit width control if needed, but 'medium' size helps
                text="continue_with"
                logo_alignment="center"
              />
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-500">
            Protected by enterprise-grade security.
            <br />
            Contact admin for access issues.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- HELPERS ---------- */

function Input({ label, type, value, onChange, placeholder }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
        {label}
      </label>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl
                   bg-slate-50 dark:bg-slate-900/50
                   border border-slate-200 dark:border-slate-700
                   text-slate-900 dark:text-white
                   placeholder:text-slate-400 dark:placeholder:text-slate-600
                   focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500
                   transition-all duration-200"
      />
    </div>
  );
}

function PasswordField({ label, value, show, toggle, onChange, placeholder }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
        {label}
      </label>

      <div className="relative group">
        <input
          type={show ? "text" : "password"}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl pr-14
                     bg-slate-50 dark:bg-slate-900/50
                     border border-slate-200 dark:border-slate-700
                     text-slate-900 dark:text-white
                     placeholder:text-slate-400 dark:placeholder:text-slate-600
                     focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500
                     transition-all duration-200"
        />

        <button
          type="button"
          onClick={toggle}
          className="absolute right-3 top-1/2 -translate-y-1/2
                     p-1.5 rounded-lg text-xs font-medium
                     text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400
                     hover:bg-indigo-50 dark:hover:bg-indigo-900/20
                     transition-colors"
        >
          {show ? "HIDE" : "SHOW"}
        </button>
      </div>
    </div>
  );
}
