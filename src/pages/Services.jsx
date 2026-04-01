import { useEffect, useState, useRef } from "react";
import API from "../services/api";

export default function Services() {
  const [serviceTypes, setServiceTypes] = useState([]);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceDesc, setNewServiceDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const alertAnchorRef = useRef(null);

  useEffect(() => {
    fetchServiceTypes();
  }, []);

  useEffect(() => {
    if (!message && !error) return;
    if (!alertAnchorRef.current) return;
    alertAnchorRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [message, error]);

  async function fetchServiceTypes() {
    try {
      setLoading(true);
      const res = await API.get("/service-types");
      setServiceTypes(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load service types");
    } finally {
      setLoading(false);
    }
  }

  async function addServiceType(e) {
    e.preventDefault();
    if (!newServiceName.trim()) {
      setError("Service type name is required");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const res = await API.post("/service-types", {
        name: newServiceName.trim(),
        description: newServiceDesc.trim(),
      });

      setServiceTypes([...serviceTypes, res.data]);
      setNewServiceName("");
      setNewServiceDesc("");
      setMessage("Service type added successfully");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to add service type";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function deleteServiceType(id) {
    if (!window.confirm("Are you sure you want to delete this service type?")) return;

    try {
      setLoading(true);
      await API.delete(`/service-types/${id}`);
      setServiceTypes(serviceTypes.filter((s) => s._id !== id));
      setMessage("Service type deleted successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete service type");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] px-3 sm:px-6 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-white">Service Types</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage service types that will be available when creating reminders.
          </p>
        </div>

        <div ref={alertAnchorRef} />

        {error && <div className="rounded-xl p-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm">{error}</div>}
        {message && <div className="rounded-xl p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{message}</div>}

        <section className="rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-white/85 dark:bg-slate-900/80 backdrop-blur-sm p-3 sm:p-4 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Add New Service Type</h2>
          <form onSubmit={addServiceType} className="space-y-3">
            <label className="space-y-1 block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Service Type Name *</span>
              <input
                type="text"
                required
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                placeholder="e.g., Domain Renewal, Website Maintenance"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              />
            </label>

            <label className="space-y-1 block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description (Optional)</span>
              <textarea
                value={newServiceDesc}
                onChange={(e) => setNewServiceDesc(e.target.value)}
                placeholder="Brief description of this service type"
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Service Type"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-white/85 dark:bg-slate-900/80 backdrop-blur-sm p-3 sm:p-4 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Existing Service Types</h2>

          {loading && serviceTypes.length === 0 ? (
            <div className="text-center py-8 text-slate-500">Loading...</div>
          ) : serviceTypes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500 text-center">
              No service types yet. Add one above to get started.
            </div>
          ) : (
            <div className="grid gap-3">
              {serviceTypes.map((service) => (
                <div
                  key={service._id}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 flex items-start justify-between gap-3"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">{service.name}</h3>
                    {service.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{service.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteServiceType(service._id)}
                    disabled={loading}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:hover:bg-rose-900/50 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
