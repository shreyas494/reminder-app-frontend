import { useState } from "react";
import API from "../services/api";
import dayjs from "dayjs";

import { DesktopDateTimePicker } from "@mui/x-date-pickers/DesktopDateTimePicker";

export default function AddReminder() {
  const [form, setForm] = useState({
    clientName: "",
    contactPerson: "",   // ✅ REQUIRED BY BACKEND
    mobile1: "",
    email: "",
    projectName: "",
    domainName: "",
    activationDate: null,
    expiryDate: null,
    amount: "",
  });

  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    // 🔴 FRONTEND REQUIRED CHECK (MATCHES BACKEND)
    if (
      !form.clientName ||
      !form.contactPerson ||
      !form.mobile1 ||
      !form.projectName ||
      !form.activationDate ||
      !form.expiryDate
    ) {
      setError("Missing required fields");
      return;
    }

    try {
      await API.post("/reminders", {
        clientName: form.clientName,
        contactPerson: form.contactPerson, // ✅ FIX
        mobile1: form.mobile1,
        email: form.email || undefined,
        projectName: form.projectName,
        domainName: form.domainName || undefined,
        activationDate: form.activationDate.toISOString(),
        expiryDate: form.expiryDate.toISOString(),
        amount: form.amount || undefined,
      });

      alert("Reminder created successfully");

      // reset
      setForm({
        clientName: "",
        contactPerson: "",
        mobile1: "",
        email: "",
        projectName: "",
        domainName: "",
        activationDate: null,
        expiryDate: null,
        amount: "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save reminder");
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 dark:text-gray-100">
        Add Reminder
      </h2>

      {error && (
        <div className="mb-4 text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <form
        onSubmit={submit}
        className="bg-white dark:bg-[#111827] p-6 rounded-2xl shadow space-y-4"
      >
        <Input
          label="Client Name"
          required
          value={form.clientName}
          onChange={(v) => setForm({ ...form, clientName: v })}
        />

        <Input
          label="Contact Person"
          required
          value={form.contactPerson}
          onChange={(v) => setForm({ ...form, contactPerson: v })}
        />

        <Input
          label="Mobile No"
          required
          value={form.mobile1}
          onChange={(v) => setForm({ ...form, mobile1: v })}
        />

        <Input
          label="Email (Optional)"
          type="email"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
        />

        <Input
          label="Project Name"
          required
          value={form.projectName}
          onChange={(v) => setForm({ ...form, projectName: v })}
        />

        <Input
          label="Domain Name"
          value={form.domainName}
          onChange={(v) => setForm({ ...form, domainName: v })}
        />

        {/* DATE & TIME PICKERS */}
        <DesktopDateTimePicker
          label="Activation Date & Time *"
          value={form.activationDate}
          onChange={(v) =>
            setForm({ ...form, activationDate: v })
          }
          ampm
          slotProps={{
            textField: muiTextFieldProps,
            popper: {
              disablePortal: true,
              placement: "top-start",
            },
          }}
        />

        <DesktopDateTimePicker
          label="Expiry Date & Time *"
          value={form.expiryDate}
          onChange={(v) =>
            setForm({ ...form, expiryDate: v })
          }
          ampm
          slotProps={{
            textField: muiTextFieldProps,
            popper: {
              disablePortal: true,
              placement: "top-start",
            },
          }}
        />

        <Input
          label="Amount (₹)"
          type="number"
          value={form.amount}
          onChange={(v) => setForm({ ...form, amount: v })}
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          Save Reminder
        </button>
      </form>
    </div>
  );
}

/* ================= INPUT ================= */
function Input({ label, required, type = "text", value, onChange }) {
  return (
    <div>
      <label className="block mb-1 text-sm dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </div>
  );
}

/* ================= STYLES ================= */

const inputClass =
  "w-full px-4 py-2 rounded-lg transition-colors " +
  "bg-white text-gray-900 border border-gray-300 " +
  "focus:outline-none focus:ring-2 focus:ring-blue-500 " +
  "dark:bg-[#020617] dark:text-gray-100 dark:border-gray-600";

const muiTextFieldProps = {
  fullWidth: true,
  size: "small",
  InputLabelProps: {
    shrink: true,
    className: "dark:text-gray-300",
  },
  InputProps: {
    className:
      "bg-white dark:bg-[#020617] text-gray-900 dark:text-gray-100 " +
      "border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 " +
      "focus:outline-none focus:ring-2 focus:ring-blue-500",
  },
};
