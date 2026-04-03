import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { APP_NAME } from "../constants/brand";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden transition-colors">

      {/* 🎨 ANIMATED BACKGROUND */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-r from-cyan-400/20 to-indigo-400/20 blur-[120px] animate-pulse dark:from-cyan-500/15 dark:to-indigo-600/15"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-r from-fuchsia-400/20 to-purple-400/20 blur-[120px] animate-pulse delay-700 dark:from-fuchsia-600/15 dark:to-purple-600/15"></div>

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

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold mb-6 sm:mb-8 tracking-tight text-slate-900 dark:text-white animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <span>
            Keep Track of
          </span>
          <br />
          <span>
            Your Subscriptions
          </span>
        </h1>

        <p className="max-w-2xl text-base sm:text-xl text-slate-600 dark:text-slate-400 mb-8 sm:mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          Security with Google and JWT auth. Send automatic reminders. Send quotation.
        </p>

        <div className="flex flex-col w-full sm:w-auto sm:flex-row gap-4 sm:gap-5 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          {user ? (
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700
                         text-white font-bold text-sm shadow-sm
                         transition-colors duration-200 text-center"
            >
              Go to Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700
                         text-white font-bold text-sm shadow-sm
                         transition-colors duration-200 text-center"
            >
              Get Started
            </Link>
          )}
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-32">
        <div className="grid md:grid-cols-3 gap-8">
          <Feature
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
              </svg>
            }
            title="Automatic Reminders"
            text="Send reminders automatically for your subscriptions."
            delay="0"
          />
          <Feature
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z" clipRule="evenodd" />
              </svg>
            }
            title="Send Quotation"
            text="Create, review, download, and email quotation PDF for each subscription."
            delay="200"
          />
          <Feature
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08zm3.094 8.016a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
              </svg>
            }
            title="Google + JWT Security"
            text="Secure access with Google sign-in and JWT-based authentication."
            delay="400"
          />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto py-8 text-center border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
      </footer>
    </div>
  );
}

/* ---------- Feature Card ---------- */
function Feature({ icon, title, text, delay }) {
  return (
    <div
      className="p-8 rounded-2xl bg-white/70 dark:bg-[#111827]/60 backdrop-blur-md border border-slate-200 dark:border-slate-800
                 shadow-lg shadow-slate-200/50 dark:shadow-none transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 mb-6">
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-3 text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
        {text}
      </p>
    </div>
  );
}
