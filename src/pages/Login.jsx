import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin, googleLogout } from "@react-oauth/google";
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

  useEffect(() => {
    googleLogout();
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
      setMessage("Login successful. Redirecting...");
      redirect();
    } catch (err) {
      setIsSuccess(false);
      setMessage(
        err.response?.data?.message ||
        "Access denied. Contact administrator."
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
      setMessage("Login successful. Redirecting...");
      redirect();
    } catch (err) {
      setIsSuccess(false);
      setMessage(
        err.response?.data?.message ||
        "Access denied. Contact administrator."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden transition-colors">

      {/* 🎨 ANIMATED BACKGROUND DECORATION */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-r from-cyan-400/25 to-indigo-400/25 blur-[100px] animate-pulse dark:from-cyan-500/20 dark:to-indigo-600/20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-r from-fuchsia-400/25 to-purple-400/25 blur-[100px] animate-pulse delay-1000 dark:from-fuchsia-600/20 dark:to-purple-600/20"></div>

      <div className="relative w-full max-w-md p-8 z-10">

        {/* 🌟 GLASS CARD */}
        <div className="backdrop-blur-xl bg-white/75 dark:bg-[#111827]/65 border border-indigo-100/70 dark:border-indigo-900/40 shadow-2xl rounded-3xl p-8 transition-all duration-300 hover:shadow-indigo-500/20">

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
              className={`w-full h-11 rounded-xl text-white font-semibold text-sm shadow-sm
                         transition-colors duration-200 flex items-center justify-center gap-2
                         ${isLoading
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
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
            <div className="relative w-[240px] h-11">
              <div className="absolute inset-0 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-semibold inline-flex items-center justify-center gap-2 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.207 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.845 1.154 7.96 3.04l5.657-5.657C34.046 6.053 29.273 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                  <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 13 24 13c3.059 0 5.845 1.154 7.96 3.04l5.657-5.657C34.046 6.053 29.273 4 24 4c-7.732 0-14.41 4.405-17.694 10.691z"/>
                  <path fill="#4CAF50" d="M24 44c5.168 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.149 35.091 26.715 36 24 36c-5.186 0-9.62-3.329-11.283-7.946l-6.522 5.025C9.435 39.475 16.58 44 24 44z"/>
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.046 12.046 0 01-4.084 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                </svg>
                <span>Sign in with Google</span>
              </div>

              <div className="absolute inset-0 opacity-0">
                <GoogleLogin
                  key={isDark ? "dark" : "light"}
                  onSuccess={handleGoogleLogin}
                  onError={() => setMessage("Google authentication failed. Please try again.")}
                  useOneTap={false}
                  auto_select={false}
                  use_fedcm_for_button={false}
                  use_fedcm_for_prompt={false}
                  type="standard"
                  theme={isDark ? "filled_black" : "outline"}
                  shape="pill"
                  size="large"
                  width="240"
                  text="signin_with"
                  logo_alignment="center"
                />
              </div>
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
