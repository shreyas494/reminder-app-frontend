import { useState, useEffect, useMemo } from "react";
import API from "../services/api";
import dayjs from "dayjs";

import { DesktopDateTimePicker } from "@mui/x-date-pickers/DesktopDateTimePicker";
import CustomPickerLayout from "../components/CustomPickerLayout";

export default function AddReminder() {
  const [serviceTypes, setServiceTypes] = useState([]);
  const [serviceTypeSearch, setServiceTypeSearch] = useState("");

  const [form, setForm] = useState({
    clientName: "",
    contactPerson: "",
    mobile1: "",
    email: "",
    projectName: "",
    serviceType: "",
    domainName: "",
    activationDate: null,
    expiryDate: null,
    amount: "",
  });

  const [error, setError] = useState("");

  const filteredServiceTypes = useMemo(() => {
    if (!serviceTypeSearch.trim()) return serviceTypes;
    const term = serviceTypeSearch.toLowerCase();
    return serviceTypes.filter((st) =>
      st.name.toLowerCase().includes(term)
    );
  }, [serviceTypes, serviceTypeSearch]);

  /* ================= FETCH SERVICE TYPES ================= */
  useEffect(() => {
    async function loadServiceTypes() {
      try {
        const res = await API.get("/service-types");
        setServiceTypes(res.data?.data || []);
        // Set default service type if none selected
        if (!form.serviceType && (res.data?.data?.length > 0)) {
          setForm((prev) => ({ ...prev, serviceType: res.data.data[0].name }));
        }
      } catch (err) {
        console.error("Failed to load service types:", err);
        // Fallback to empty array
        setServiceTypes([]);
      }
    }
    loadServiceTypes();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    // 🔴 FRONTEND REQUIRED CHECK
    if (
      !form.clientName ||
      !form.mobile1 ||
      !form.projectName ||
      !form.serviceType ||
      form.amount === "" ||
      Number(form.amount) <= 0 ||
      !form.activationDate ||
      !form.expiryDate
    ) {
      setError("Missing required fields");
      return;
    }

    try {
      await API.post("/reminders", {
        clientName: form.clientName,
        contactPerson: form.contactPerson,
        mobile1: form.mobile1,
        email: form.email || undefined,
        projectName: form.projectName,
        serviceType: form.serviceType,
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
        serviceType: "Domain,Hosting and SSL",
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

        <div>
          <label className="block mb-1 text-sm dark:text-gray-300">
            Service Type <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required={!form.serviceType}
            placeholder="Search or select service type"
            value={serviceTypeSearch}
            onChange={(e) => setServiceTypeSearch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-t-xl border border-b-0 border-slate-200 dark:border-slate-700
             bg-slate-50 dark:bg-slate-900/50
             text-slate-900 dark:text-white
             focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500
             transition-all duration-200 text-sm"
          />
          <div className="max-h-48 overflow-y-auto border border-t-0 border-slate-200 dark:border-slate-700 rounded-b-xl
           bg-white dark:bg-slate-900
           divide-y divide-slate-100 dark:divide-slate-800">
            {filteredServiceTypes.length > 0 ? (
              filteredServiceTypes.map((st) => (
                <button
                  key={st._id}
                  type="button"
                  onClick={() => {
                    setForm({ ...form, serviceType: st.name });
                    setServiceTypeSearch("");
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors ${
                    form.serviceType === st.name
                      ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-900 dark:text-indigo-100 font-semibold"
                      : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {st.name}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 italic">
                {serviceTypeSearch ? "No matches found" : "Loading service types..."}
              </div>
            )}
          </div>
          {form.serviceType && (
            <div className="mt-2 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-xs font-medium text-indigo-700 dark:text-indigo-300">
              Selected: {form.serviceType}
            </div>
          )}
        </div>

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
          disableOpenPickerOnInput
          slots={{ layout: CustomPickerLayout }}
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
          disableOpenPickerOnInput
          slots={{ layout: CustomPickerLayout }}
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
          required
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
