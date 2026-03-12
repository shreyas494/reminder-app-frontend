import { PickersLayout, usePickerLayout, TimeField } from "@mui/x-date-pickers";

export default function CustomPickerLayout(props) {
  const { toolbar, tabs, content, actionBar } = usePickerLayout(props);

  // Show manual time entry only when we are in a time-related view
  const isTimeView = props.view === "hours" || props.view === "minutes" || props.view === "seconds";

  return (
    <PickersLayout {...props}>
      {toolbar}
      {isTimeView && (
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
            Manual Time Entry
          </p>
          <TimeField
            value={props.value}
            onChange={(newValue) => props.onChange?.(newValue)}
            ampm
            minutesStep={5}
            format="hh:mm A"
            fullWidth
            size="small"
            slotProps={{
              textField: {
                size: "small",
                sx: {
                  "& .MuiInputBase-root": {
                    borderRadius: "10px",
                    backgroundColor: (theme) =>
                      theme.palette.mode === "dark" ? "rgba(15, 23, 42, 0.5)" : "#F8FAFC",
                  },
                },
              },
            }}
          />
        </div>
      )}
      {tabs}
      <div className="relative">
        {content}
      </div>
      {actionBar}
    </PickersLayout>
  );
}
