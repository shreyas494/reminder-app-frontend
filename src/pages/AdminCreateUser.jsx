import { useState } from "react";
import API from "../services/api";

export default function AdminCreateUser() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await API.post("/admin/users", {
        name: form.name,
        email: form.email,
        password: form.password || undefined,
      });

      setMessage("✅ User created successfully");
      setForm({ name: "", email: "", password: "" });
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to create user"
      );
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] px-6 py-10 flex items-center justify-center bg-slate-50 dark:bg-[#0b1120] transition-colors">

      <div className="w-full max-w-lg bg-white dark:bg-[#111827]
                      border border-slate-200 dark:border-slate-800
                      rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none
                      p-8">

        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
          Create New User
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          Add a new member to the organization
        </p>

        {message && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400 flex items-center gap-2">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm font-medium dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400 flex items-center gap-2">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-6">
          <Field label="Full Name" required>
            <input
              required
              className={inputClass}
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              placeholder="e.g. John Doe"
            />
          </Field>

          <Field label="Email Address" required>
            <input
              type="email"
              required
              className={inputClass}
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              placeholder="john@example.com"
            />
          </Field>

          <Field label="Password">
            <input
              type="password"
              className={inputClass}
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              placeholder="••••••••"
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Leave blank if user will login using Google authentication
            </p>
          </Field>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full px-6 py-3 rounded-xl
                         bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700
                         text-white font-semibold shadow-lg shadow-indigo-500/25
                         transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- HELPERS ---------- */

function Field({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full px-4 py-3 rounded-xl " +
  "bg-slate-50 dark:bg-slate-900/50 " +
  "border border-slate-200 dark:border-slate-700 " +
  "text-slate-900 dark:text-white " +
  "placeholder:text-slate-400 " +
  "focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 " +
  "transition-all duration-200";
