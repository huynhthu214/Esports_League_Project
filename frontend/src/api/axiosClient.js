// src/api/axiosClient.js - (LÀM CHUNG) Axios tự động đính kèm JWT Token
import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: tự gắn token vào mọi request
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: tự xử lý token hết hạn
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthPage =
      window.location.pathname.includes("/login") ||
      window.location.pathname.includes("/register");

    if (
      !isAuthPage &&
      (error.response?.status === 401 || error.response?.status === 403)
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default axiosClient;
