import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

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
      slotProps={{
        textField: {
          fullWidth: true,
          required,
          size: "small",
        },
      }}
    />
  );
}
