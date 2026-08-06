import { useState, useRef, useEffect } from "react";

export default function AutocompleteInput({
  label,
  required,
  type = "text",
  value,
  onChange,
  placeholder = "",
  options = [],
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Filter options based on input value
  const filteredOptions = (options || []).filter((opt) => {
    if (!opt) return false;
    if (!value || !value.trim()) return true;
    return String(opt).toLowerCase().includes(String(value).toLowerCase());
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative space-y-1.5 w-full">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          className={
            className ||
            `w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm`
          }
        />

        {isOpen && filteredOptions.length > 0 && (
          <ul className="absolute z-[999] left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 shadow-2xl py-1 divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredOptions.map((opt, idx) => (
              <li
                key={`${opt}-${idx}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(opt);
                  setIsOpen(false);
                }}
                className="px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
              >
                {opt}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
