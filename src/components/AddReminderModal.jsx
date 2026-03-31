import { useEffect, useState } from "react";
import API from "../services/api";
import dayjs from "dayjs";

import { useMediaQuery } from "@mui/material";
import {
  DesktopDateTimePicker,
} from "@mui/x-date-pickers";

const SERVICE_TYPE_OPTIONS = [
  "Domain,Hosting and SSL",
  "Domain",
  "Hosting and SSL",
  "Website maintenance",
];


export default function AddReminderModal({ onClose, onAdded, existing }) {
  const isEdit = Boolean(existing);
  const mode = existing?._mode || "edit"; // edit | renew
  const isRenewMode = mode === "renew";

  const isMobile = useMediaQuery("(max-width:768px)");
  const Picker = DesktopDateTimePicker;

  const [form, setForm] = useState({
    clientName: "",
    contactPerson: "",
    mobile1: "",
    mobile2: "",
    email: "",
    projectName: "",
    serviceType: "Domain,Hosting and SSL",
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

  const originalExpiryDate = existing?.expiryDate ? dayjs(existing.expiryDate) : null;
  const minExpiryDate = form.activationDate
    ? roundToFiveMinuteStep(form.activationDate.add(5, "minute"), "up")
    : null;
  const minRenewalDate = originalExpiryDate
    ? roundToFiveMinuteStep(originalExpiryDate.add(5, "minute"), "up")
    : null;

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
      serviceType: existing.serviceType || "Domain,Hosting and SSL",
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

  useEffect(() => {
    if (!form.activationDate || !form.expiryDate || isEdit) {
      return;
    }

    if (form.expiryDate.isSame(form.activationDate) || form.expiryDate.isBefore(form.activationDate)) {
      setForm((current) => ({
        ...current,
        expiryDate: roundToFiveMinuteStep(current.activationDate.add(5, "minute"), "up"),
      }));
    }
  }, [form.activationDate, form.expiryDate, isEdit]);

  const handleActivationDateChange = (value) => {
    const activationDate = normalizePickerValue(value);

    setForm((current) => {
      const nextState = {
        ...current,
        activationDate,
      };

      if (
        activationDate &&
        current.expiryDate &&
        (current.expiryDate.isSame(activationDate) || current.expiryDate.isBefore(activationDate))
      ) {
        nextState.expiryDate = roundToFiveMinuteStep(activationDate.add(5, "minute"), "up");
      }

      return nextState;
    });
  };

  const handleExpiryDateChange = (value) => {
    setForm((current) => ({
      ...current,
      expiryDate: normalizePickerValue(value),
    }));
  };

  const handleRenewedExpiryDateChange = (value) => {
    setForm((current) => ({
      ...current,
      renewedExpiryDate: normalizePickerValue(value),
    }));
  };

  /* ================= SUBMIT ================= */
  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (isRenewMode) {
      if (!isValidDayjsValue(form.renewedExpiryDate)) {
        setError("Please select new expiry date");
        return;
      }

      if (
        minRenewalDate &&
        (form.renewedExpiryDate.isSame(minRenewalDate) || form.renewedExpiryDate.isAfter(minRenewalDate)) === false
      ) {
        setError("New expiry must be at least 5 minutes after the current expiry");
        return;
      }
    } else {
      if (
        !form.clientName ||
        !form.contactPerson ||
        !form.mobile1 ||
        !form.email ||
        !form.projectName ||
        !form.serviceType ||
        !isValidDayjsValue(form.activationDate) ||
        !isValidDayjsValue(form.expiryDate)
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

      if (form.expiryDate.isSame(form.activationDate) || form.expiryDate.isBefore(form.activationDate)) {
        setError("Expiry date must be at least 5 minutes after activation date");
        return;
      }

      if (minExpiryDate && form.expiryDate.isBefore(minExpiryDate)) {
        setError("Expiry date must be at least 5 minutes after activation date");
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
        serviceType: form.serviceType,
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

      // ✏️ EDIT / 🔄 RENEW
      if (isEdit) {
        if (isRenewMode) {
          await API.patch(`/reminders/${existing._id}`, {
            expiryDate: form.renewedExpiryDate.toISOString(),
          });
        } else {
          await API.put(`/reminders/${existing._id}`, payload);
        }
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#111827] shadow-2xl animate-in fade-in zoom-in-95 duration-200">

        {/* HEADER */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md">
          <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
            {isRenewMode
              ? "Renew Subscription"
              : isEdit
                ? "Edit Reminder"
                : "New Subscription"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <div className="p-4 sm:p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm font-medium dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-6">

            {/* ================= ADD / EDIT ================= */}
            {!isRenewMode && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">

                <div className="md:col-span-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-[-10px]">
                  Client Details
                </div>

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

                {/* SPACER */}
                <div className="md:col-span-2 h-px bg-slate-100 dark:bg-slate-800 my-2"></div>
                <div className="md:col-span-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-[-10px]">
                  Project & Dates
                </div>

                <Input label="Project Name" required value={form.projectName}
                  onChange={(v) => setForm({ ...form, projectName: v })} />

                <label className="space-y-1 block">
                  <span className="text-sm font-semibold dark:text-slate-200">
                    Service Type <span className="text-red-500">*</span>
                  </span>
                  <select
                    required
                    value={form.serviceType}
                    onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl
                   bg-slate-50 dark:bg-slate-900/50
                   border border-slate-200 dark:border-slate-700
                   text-slate-900 dark:text-white
                   focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500
                   transition-all duration-200"
                  >
                    {SERVICE_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <Input label="Domain Name" value={form.domainName}
                  onChange={(v) => setForm({ ...form, domainName: v })} />

                {/* 🔒 dates locked in edit */}
                {isMobile ? (
                  <MobileDateTimeInput
                    label="Activation Date *"
                    value={form.activationDate}
                    onChange={handleActivationDateChange}
                    disabled={isEdit}
                    required
                    helperText={isEdit
                      ? "Activation date is locked after reminder creation"
                      : "Select or update activation date and time"}
                  />
                ) : (
                  <Picker
                    label="Activation Date *"
                    value={form.activationDate}
                    onChange={handleActivationDateChange}
                    disabled={isEdit}
                    ampm
                    format="DD/MM/YYYY hh:mm A"
                    views={["year", "month", "day", "hours", "minutes"]}
                    timeSteps={{ minutes: 5 }}
                    closeOnSelect={false}
                    slotProps={getPickerProps({
                      required: true,
                      helperText: isEdit
                        ? "Activation date is locked after reminder creation"
                        : "You can type the date/time or pick it from the dialog",
                      isMobile,
                    })}
                  />
                )}

                {isMobile ? (
                  <MobileDateTimeInput
                    label="Expiry Date *"
                    value={form.expiryDate}
                    onChange={handleExpiryDateChange}
                    disabled={isEdit || !form.activationDate}
                    required
                    minValue={minExpiryDate}
                    helperText={isEdit
                      ? "Expiry updates are handled via Renew"
                      : !form.activationDate
                      ? "Select activation date first"
                      : "Select or update expiry date and time"}
                  />
                ) : (
                  <Picker
                    label="Expiry Date *"
                    value={form.expiryDate}
                    onChange={handleExpiryDateChange}
                    disabled={isEdit || !form.activationDate}
                    ampm
                    format="DD/MM/YYYY hh:mm A"
                    views={["year", "month", "day", "hours", "minutes"]}
                    timeSteps={{ minutes: 5 }}
                    closeOnSelect={false}
                    minDateTime={minExpiryDate}
                    slotProps={getPickerProps({
                      required: true,
                      helperText: isEdit
                        ? "Expiry updates are handled via Renew"
                        : !form.activationDate
                        ? "Select activation date first"
                        : "Expiry must be at least 5 minutes after activation",
                      isMobile,
                    })}
                  />
                )}

                <div className="md:col-span-2">
                  <Input label="Amount (₹)" type="number" value={form.amount}
                    onChange={(v) => setForm({ ...form, amount: v })} />
                </div>

                {/* 🔁 RECURRING */}
                <div className="md:col-span-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.recurringEnabled}
                      onChange={(e) =>
                        setForm({ ...form, recurringEnabled: e.target.checked })
                      }
                      className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                    />
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Enable recurring reminders
                    </span>
                  </label>

                  {form.recurringEnabled && (
                    <div className="mt-4 flex gap-6 pl-8">
                      <Radio
                        label="Daily"
                        checked={form.recurringInterval === "daily"}
                        onChange={() => setForm({ ...form, recurringInterval: "daily" })}
                      />
                      <Radio
                        label="Weekly"
                        checked={form.recurringInterval === "weekly"}
                        onChange={() => setForm({ ...form, recurringInterval: "weekly" })}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= RENEW ONLY ================= */}
            {isRenewMode && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200">
                  <p className="font-medium">Renewing {existing.projectName} for {existing.clientName}</p>
                </div>

                {isMobile ? (
                  <MobileDateTimeInput
                    label="New Expiry Date & Time *"
                    value={form.renewedExpiryDate}
                    onChange={handleRenewedExpiryDateChange}
                    required
                    minValue={minRenewalDate}
                    helperText="Renewal expiry must be later than the current expiry"
                  />
                ) : (
                  <Picker
                    label="New Expiry Date & Time *"
                    value={form.renewedExpiryDate}
                    onChange={handleRenewedExpiryDateChange}
                    ampm
                    format="DD/MM/YYYY hh:mm A"
                    views={["year", "month", "day", "hours", "minutes"]}
                    timeSteps={{ minutes: 5 }}
                    closeOnSelect={false}
                    minDateTime={minRenewalDate}
                    slotProps={getPickerProps({
                      required: true,
                      helperText: "Renewal expiry must be later than the current expiry",
                      isMobile,
                    })}
                  />
                )}
              </div>
            )}

            {/* FOOTER */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                className={`px-6 py-2.5 rounded-xl text-white font-semibold text-sm shadow-sm transition-colors ${
                  isRenewMode
                    ? "bg-amber-500 hover:bg-amber-600"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}>
                {isRenewMode ? "Confirm Renewal" : isEdit ? "Update Reminder" : "Save Reminder"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

function isValidDayjsValue(value) {
  return dayjs.isDayjs(value) && value.isValid();
}

function roundToFiveMinuteStep(value, direction = "nearest") {
  if (!isValidDayjsValue(value)) {
    return null;
  }

  const baseValue = value.second(0).millisecond(0);
  const minute = baseValue.minute();
  const remainder = minute % 5;

  if (remainder === 0) {
    return baseValue;
  }

  if (direction === "up") {
    return baseValue.add(5 - remainder, "minute");
  }

  if (direction === "down") {
    return baseValue.subtract(remainder, "minute");
  }

  return remainder >= 3
    ? baseValue.add(5 - remainder, "minute")
    : baseValue.subtract(remainder, "minute");
}

function normalizePickerValue(value) {
  if (!isValidDayjsValue(value)) {
    return null;
  }

  return roundToFiveMinuteStep(value, "nearest");
}

function MobileDateTimeInput({
  label,
  value,
  onChange,
  disabled = false,
  required = false,
  helperText = "",
  minValue = null,
}) {
  const inputValue = isValidDayjsValue(value)
    ? value.format("YYYY-MM-DDTHH:mm")
    : "";

  const minInputValue = isValidDayjsValue(minValue)
    ? minValue.format("YYYY-MM-DDTHH:mm")
    : undefined;

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>

      <input
        type="datetime-local"
        value={inputValue}
        min={minInputValue}
        step={300}
        required={required}
        disabled={disabled}
        onChange={(e) => {
          const nextValue = e.target.value ? dayjs(e.target.value) : null;
          onChange(nextValue);
        }}
        className="w-full px-4 py-3 rounded-xl
                   bg-slate-50 dark:bg-slate-900/50
                   border border-slate-200 dark:border-slate-700
                   text-slate-900 dark:text-white
                   focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500
                   transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
      />

      {helperText ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 px-1">{helperText}</p>
      ) : null}
    </div>
  );
 }

/* ================= INPUT ================= */
function Input({ label, required, type = "text", value, onChange }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl
                   bg-slate-50 dark:bg-slate-900/50
                   border border-slate-200 dark:border-slate-700
                   text-slate-900 dark:text-white
                   focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500
                   transition-all duration-200"
      />
    </div>
  );
}

function Radio({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${checked ? "border-indigo-600 bg-indigo-600" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-indigo-400"
        }`}>
        {checked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
      </div>
      <span className={`text-sm ${checked ? "text-indigo-600 font-medium" : "text-slate-600 dark:text-slate-400"}`}>
        {label}
      </span>
      <input type="radio" checked={checked} onChange={onChange} className="hidden" />
    </label>
  );
}

function getPickerProps({ required = false, helperText = "", isMobile = false } = {}) {
  return {
    textField: {
      fullWidth: true,
      size: "small",
      required,
      helperText,
      sx: {
        '& .MuiOutlinedInput-root': {
          borderRadius: '12px',
          backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.5)' : '#F8FAFC',
          '& fieldset': { borderColor: (theme) => theme.palette.mode === 'dark' ? '#334155' : '#E2E8F0' },
          '&:hover fieldset': { borderColor: '#6366F1' },
          '&.Mui-focused fieldset': { borderColor: '#6366F1' }
        },
        '& .MuiInputBase-input': {
          padding: '10px 14px',
        }
      }
    },
    popper: {
      disablePortal: false,
      placement: "bottom-start",
      sx: {
        zIndex: 20000,
        '& .MuiPaper-root': {
          borderRadius: '16px',
          overflow: 'hidden',
          width: isMobile ? 'min(92vw, 360px)' : 'auto',
          maxWidth: isMobile ? 'calc(100vw - 16px)' : 'none',
          maxHeight: isMobile ? 'calc(100vh - 24px)' : 'none',
        },
        '& .MuiPickersLayout-root': {
          minWidth: isMobile ? 'unset' : '320px',
        },
        '& .MuiMultiSectionDigitalClock-root': {
          maxHeight: isMobile ? '180px' : '200px',
        }
      }
    },
    dialog: { sx: { zIndex: 20000 } },
    layout: {
      sx: {
        width: isMobile ? '100%' : 'auto',
        '& .MuiMultiSectionDigitalClock-root': {
          maxHeight: isMobile ? '180px' : '200px'
        }
      }
    }
  };
}
