import { useEffect, useState } from "react";
import API from "../services/api";
import dayjs from "dayjs";

import { useMediaQuery } from "@mui/material";
import {
  DesktopDateTimePicker,
  MobileDateTimePicker,
} from "@mui/x-date-pickers";

export default function AddReminderModal({ onClose, onAdded, existing }) {
  const isEdit = Boolean(existing);
  const mode = existing?._mode || "edit"; // edit | renew
  const isRenewMode = mode === "renew";

  const isMobile = useMediaQuery("(max-width:768px)");
  const Picker = isMobile ? MobileDateTimePicker : DesktopDateTimePicker;

  const [form, setForm] = useState({
    clientName: "",
    contactPerson: "",
    mobile1: "",
    mobile2: "",
    email: "",
    projectName: "",
    domainName: "",
    activationDate: null,
    expiryDate: null,
    amount: "",

    // 🔁 recurring
    recurringEnabled: false,
    recurringInterval: "daily",

    // 🔄 renew
    renewedExpiryDate: null,
  });

  const [error, setError] = useState("");

  /* ================= PREFILL ================= */
  useEffect(() => {
    if (!existing) return;

    setForm({
      clientName: existing.clientName || "",
      contactPerson: existing.contactPerson || "",
      mobile1: existing.mobile1 || "",
      mobile2: existing.mobile2 || "",
      email: existing.email || "",
      projectName: existing.projectName || "",
      domainName: existing.domainName || "",
      activationDate: existing.activationDate
        ? dayjs(existing.activationDate)
        : null,
      expiryDate: existing.expiryDate
        ? dayjs(existing.expiryDate)
        : null,
      amount:
        existing.amount !== undefined && existing.amount !== null
          ? String(existing.amount)
          : "",

      recurringEnabled: !!existing.recurringEnabled,
      recurringInterval: existing.recurringInterval || "daily",

      renewedExpiryDate: null,
    });
  }, [existing]);

  /* ================= SUBMIT ================= */
  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (isRenewMode) {
      if (!form.renewedExpiryDate) {
        setError("Please select new expiry date");
        return;
      }
    } else {
      if (
        !form.clientName ||
        !form.contactPerson ||
        !form.mobile1 ||
        !form.email ||
        !form.projectName
      ) {
        setError("Missing required fields");
        return;
      }

      if (!/^\d{10}$/.test(form.mobile1)) {
        setError("Mobile No 1 must be 10 digits");
        return;
      }

      if (form.mobile2 && !/^\d{10}$/.test(form.mobile2)) {
        setError("Mobile No 2 must be 10 digits");
        return;
      }
    }

    try {
      /* ================= PAYLOAD ================= */
      const payload = {
        clientName: form.clientName,
        contactPerson: form.contactPerson,
        mobile1: form.mobile1,
        mobile2: form.mobile2 || undefined,
        email: form.email,
        projectName: form.projectName,
        domainName: form.domainName || undefined,
        amount:
          form.amount !== "" && form.amount !== null
            ? Number(form.amount)
            : undefined,

        recurringEnabled: form.recurringEnabled,
        recurringInterval: form.recurringEnabled
          ? form.recurringInterval
          : undefined,
      };

      // 🔄 RENEW ONLY
      if (isRenewMode) {
        payload.expiryDate = form.renewedExpiryDate.toISOString();
      }

      // ✏️ EDIT
      if (isEdit) {
        await API.put(`/reminders/${existing._id}`, payload);
      }
      // ➕ ADD
      else {
        await API.post("/reminders", {
          ...payload,
          activationDate: form.activationDate.toISOString(),
          expiryDate: form.expiryDate.toISOString(),
        });
      }

      onAdded();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save reminder");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 bg-white dark:bg-[#111827] border dark:border-gray-700 shadow-2xl">

        <h2 className="text-2xl font-bold mb-4 dark:text-gray-100">
          {isRenewMode
            ? "Renew Subscription"
            : isEdit
            ? "Edit Reminder"
            : "Add Reminder"}
        </h2>

        {error && (
          <div className="mb-4 text-red-600 dark:text-red-400">{error}</div>
        )}

        <form onSubmit={submit} className="space-y-4">

          {/* ================= ADD / EDIT ================= */}
          {!isRenewMode && (
            <>
              <Input label="Client Name" required value={form.clientName}
                onChange={(v) => setForm({ ...form, clientName: v })} />

              <Input label="Contact Person" required value={form.contactPerson}
                onChange={(v) => setForm({ ...form, contactPerson: v })} />

              <Input label="Mobile No 1" required value={form.mobile1}
                onChange={(v) => setForm({ ...form, mobile1: v })} />

              <Input label="Mobile No 2 (Optional)" value={form.mobile2}
                onChange={(v) => setForm({ ...form, mobile2: v })} />

              <Input label="Email" required type="email" value={form.email}
                onChange={(v) => setForm({ ...form, email: v })} />

              <Input label="Project Name" required value={form.projectName}
                onChange={(v) => setForm({ ...form, projectName: v })} />

              <Input label="Domain Name" value={form.domainName}
                onChange={(v) => setForm({ ...form, domainName: v })} />

              {/* 🔒 dates locked in edit */}
              <Picker
                label="Activation Date & Time *"
                value={form.activationDate}
                onChange={(v) => setForm({ ...form, activationDate: v })}
                disabled={isEdit}
                ampm
                slotProps={pickerProps}
              />

              <Picker
                label="Expiry Date & Time *"
                value={form.expiryDate}
                onChange={(v) => setForm({ ...form, expiryDate: v })}
                disabled={isEdit}
                ampm
                slotProps={pickerProps}
              />

              <Input label="Amount (₹)" type="number" value={form.amount}
                onChange={(v) => setForm({ ...form, amount: v })} />

              {/* 🔁 RECURRING (RESTORED, UNCHANGED) */}
              <div className="rounded-lg border p-4 dark:border-gray-700 space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.recurringEnabled}
                    onChange={(e) =>
                      setForm({ ...form, recurringEnabled: e.target.checked })
                    }
                  />
                  <span className="dark:text-gray-300">
                    Enable recurring reminders
                  </span>
                </label>

                {form.recurringEnabled && (
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 dark:text-gray-300">
                      <input
                        type="radio"
                        checked={form.recurringInterval === "daily"}
                        onChange={() =>
                          setForm({ ...form, recurringInterval: "daily" })
                        }
                      />
                      Daily
                    </label>

                    <label className="flex items-center gap-2 dark:text-gray-300">
                      <input
                        type="radio"
                        checked={form.recurringInterval === "weekly"}
                        onChange={() =>
                          setForm({ ...form, recurringInterval: "weekly" })
                        }
                      />
                      Weekly
                    </label>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ================= RENEW ONLY ================= */}
          {isRenewMode && (
            <Picker
              label="New Expiry Date & Time *"
              value={form.renewedExpiryDate}
              onChange={(v) =>
                setForm({ ...form, renewedExpiryDate: v })
              }
              ampm
              slotProps={pickerProps}
            />
          )}

          <div className="flex justify-end gap-3 pt-6">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg border dark:border-gray-600">
              Cancel
            </button>

            <button type="submit"
              className={`px-5 py-2 rounded-lg text-white ${
                isRenewMode
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}>
              {isRenewMode ? "Renew" : isEdit ? "Update" : "Save"}
            </button>
          </div>

        </form>
      </div>
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </div>
  );
}

const inputClass =
  "w-full px-4 py-2 rounded-lg transition-colors " +
  "bg-white text-gray-900 border border-gray-300 " +
  "focus:outline-none focus:ring-2 focus:ring-blue-500 " +
  "dark:bg-[#020617] dark:text-gray-100 dark:border-gray-600";

const pickerProps = {
  textField: { fullWidth: true, size: "small", inputProps: { readOnly: true } },
  popper: { disablePortal: false, sx: { zIndex: 20000 } },
  dialog: { sx: { zIndex: 20000 } },
};
