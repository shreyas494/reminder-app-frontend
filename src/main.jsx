import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";

import { GoogleOAuthProvider } from "@react-oauth/google";

import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";


function MuiWrapper({ children }) {
  const { theme } = useTheme();

  const muiTheme = createTheme({
    palette: { mode: theme },
  });

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <MuiWrapper>
          <AuthProvider>
            <BrowserRouter>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <App />
              </LocalizationProvider>
            </BrowserRouter>
          </AuthProvider>
        </MuiWrapper>
      </ThemeProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
