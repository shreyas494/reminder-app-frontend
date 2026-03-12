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
      disableOpenPickerOnInput
      slots={{ layout: CustomPickerLayout }}
      slotProps={{
        textField: {
          fullWidth: true,
          required,
          size: "small",
        },
        toolbar: {
          hidden: false,
        }
      }}
    />
  );
}
