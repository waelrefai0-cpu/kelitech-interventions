import axios from "axios";

const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname) || window.location.hostname.startsWith("192.168.");
const defaultApiUrl = isLocalHost ? `${window.location.protocol}//${window.location.hostname}:4000/api` : `${window.location.origin}/api`;

export const API_URL = import.meta.env.VITE_API_URL ?? defaultApiUrl;

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("kelitech_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("kelitech_token");
      localStorage.removeItem("kelitech_user");
    }
    return Promise.reject(error);
  },
);
