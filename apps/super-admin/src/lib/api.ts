import axios from "axios";
import { getStoredAccessToken } from "./auth";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
