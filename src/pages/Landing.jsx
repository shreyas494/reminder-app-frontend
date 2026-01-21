import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col
                    bg-gray-100 dark:bg-[#0b1120]
                    transition-colors">

      {/* HERO SECTION */}
      <section className="flex flex-col items-center justify-center
                          text-center px-6 py-24">

        <h1 className="text-4xl md:text-5xl font-extrabold mb-6
                       text-gray-900 dark:text-gray-100">
          Never Miss a Payment Again
        </h1>

        <p className="max-w-2xl text-lg mb-10
                      text-gray-600 dark:text-gray-400">
          Track your pending payments, subscriptions, and renewals in one place.
          Get timely reminders and stay stress-free.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          {user ? (
            <Link
              to="/dashboard"
              className="px-8 py-3 rounded-lg
                         bg-blue-600 hover:bg-blue-700
                         text-white font-semibold transition"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-8 py-3 rounded-lg
                           bg-blue-600 hover:bg-blue-700
                           text-white font-semibold transition"
              >
                Get Started
              </Link>

              <Link
                to="/register"
                className="px-8 py-3 rounded-lg
                           border border-gray-300 dark:border-gray-600
                           text-gray-800 dark:text-gray-200
                           hover:bg-gray-200 dark:hover:bg-gray-800
                           font-semibold transition"
              >
                Create Account
              </Link>
            </>
          )}
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-8">

          <Feature
            title="Payment Reminders"
            text="Never forget due dates. Track all pending payments with clarity."
          />

          <Feature
            title="Subscription Tracking"
            text="Manage recurring subscriptions and renewal cycles effortlessly."
          />

          <Feature
            title="Secure & Simple"
            text="Google Login, JWT security, and a clean dashboard experience."
          />

        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto py-6 text-center
                         text-sm text-gray-500 dark:text-gray-400
                         border-t border-gray-200 dark:border-gray-800">
        © {new Date().getFullYear()} Reminder App. All rights reserved.
      </footer>
    </div>
  );
}

/* ---------- Feature Card ---------- */
function Feature({ title, text }) {
  return (
    <div className="rounded-2xl p-6
                    bg-white dark:bg-[#111827]
                    border border-gray-200 dark:border-gray-700
                    shadow-lg dark:shadow-blue-900/20">

      <h3 className="text-xl font-semibold mb-2
                     text-gray-900 dark:text-gray-100">
        {title}
      </h3>

      <p className="text-gray-600 dark:text-gray-400">
        {text}
      </p>
    </div>
  );
}
