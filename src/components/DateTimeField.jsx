import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import CustomPickerLayout from "./CustomPickerLayout";

export default function DateTimeField({
  label,
  value,
  onChange,
  required = false,
}) {
  return (
    <DateTimePicker
      label={label}
      value={value}
      onChange={onChange}
      ampm
      minutesStep={5}
      timeSteps={{ minutes: 5 }}
      format="DD/MM/YYYY hh:mm A"
      views={["year", "month", "day", "hours", "minutes"]}
      closeOnSelect={false}
      slots={{ layout: CustomPickerLayout }}
      slotProps={{
        textField: {
          fullWidth: true,
          required,
          size: "small",
          helperText: "You can type the date/time or select it from the dialog",
        },
        toolbar: {
          hidden: false,
        }
      }}
    />
  );
}
