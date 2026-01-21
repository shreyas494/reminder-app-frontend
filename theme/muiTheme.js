import { createTheme } from "@mui/material/styles";

export const getMuiTheme = (mode) =>
  createTheme({
    palette: {
      mode, // "dark" | "light"
    },
  });
