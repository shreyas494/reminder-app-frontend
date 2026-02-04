import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-[#0b1120] transition-colors">

      {/* 🎨 ANIMATED BACKGROUND */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-r from-blue-400/20 to-indigo-400/20 blur-[120px] animate-pulse dark:from-blue-600/10 dark:to-indigo-600/10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-r from-violet-400/20 to-purple-400/20 blur-[120px] animate-pulse delay-700 dark:from-violet-600/10 dark:to-purple-600/10"></div>

      {/* HERO SECTION */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-24 pb-16 sm:pt-32 sm:pb-20">

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span className="text-[10px] sm:text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
            Smart Reminder System
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold mb-6 sm:mb-8 tracking-tight animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <span className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Never Miss a
          </span>
          <br />
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Payment Again
          </span>
        </h1>

        <p className="max-w-2xl text-base sm:text-xl text-slate-600 dark:text-slate-400 mb-8 sm:mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          Track your pending payments, subscriptions, and renewals in one centralized dashboard.
          Get timely reminders and stay stress-free.
        </p>

        <div className="flex flex-col w-full sm:w-auto sm:flex-row gap-4 sm:gap-5 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          {user ? (
            <Link
              to="/dashboard"
              className="group relative w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600
                         text-white font-bold shadow-lg shadow-blue-500/30 hover:shadow-indigo-500/40
                         transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              <span className="relative z-10 block text-center">Go to Dashboard</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </Link>
          ) : (
            <Link
              to="/login"
              className="group relative w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600
                         text-white font-bold shadow-lg shadow-blue-500/30 hover:shadow-indigo-500/40
                         transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              <span className="relative z-10 block text-center">Get Started Free</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </Link>
          )}
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-32">
        <div className="grid md:grid-cols-3 gap-8">
          <Feature
            icon="📅"
            title="Smart Reminders"
            text="Set it and forget it. We'll notify you before your due dates via email and SMS."
            delay="0"
          />
          <Feature
            icon="🔄"
            title="Subscription Tracking"
            text="Manage recurring subscriptions and auto-renewal cycles effortlessly in one view."
            delay="200"
          />
          <Feature
            icon="🛡️"
            title="Secure & Reliable"
            text="Bank-grade security with Google Login and JWT authentication for peace of mind."
            delay="400"
          />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto py-8 text-center border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} Reminder App. Crafted with <span className="text-rose-500">♥</span> for developers.
        </p>
      </footer>
    </div>
  );
}

/* ---------- Feature Card ---------- */
function Feature({ icon, title, text, delay }) {
  return (
    <div
      className="p-8 rounded-3xl bg-white/70 dark:bg-[#111827]/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 
                 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all duration-300 hover:transform hover:-translate-y-1 hover:border-blue-500/30"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-2xl mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
        {text}
      </p>
    </div>
  );
}
