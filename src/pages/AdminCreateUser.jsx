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
    <div className="min-h-[calc(100vh-64px)] px-6 py-10
                    bg-gray-100 dark:bg-[#0b1120]">

      <div className="max-w-xl mx-auto
                      bg-white dark:bg-[#111827]
                      border border-gray-200 dark:border-gray-700
                      rounded-2xl shadow-xl
                      p-6">

        <h2 className="text-2xl font-bold mb-6
                       text-gray-900 dark:text-gray-100">
          Create User
        </h2>

        {message && (
          <div className="mb-4 text-sm text-green-700 dark:text-green-400">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <Field label="Full Name" required>
            <input
              required
              className={inputClass}
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />
          </Field>

          <Field label="Email" required>
            <input
              type="email"
              required
              className={inputClass}
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />
          </Field>

          <Field label="Password (optional)">
            <input
              type="password"
              className={inputClass}
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave blank if user will login using Google
            </p>
          </Field>

          <div className="flex justify-end pt-6">
            <button
              type="submit"
              className="px-6 py-2 rounded-lg
                         bg-blue-600 hover:bg-blue-700
                         text-white font-semibold">
              Create User
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
    <div>
      <label className="block mb-1 text-sm font-medium
                        text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2 rounded-lg " +
  "bg-white dark:bg-[#020617] " +
  "border border-gray-300 dark:border-gray-600 " +
  "text-gray-900 dark:text-gray-100 " +
  "focus:outline-none focus:ring-2 focus:ring-blue-500";
