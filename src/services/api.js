import axios from "axios";

const API = axios.create({
  baseURL: "https://reminder-app-backend-aaac.onrender.com/api",
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.setItem("logout_reason", "expired");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default API;
