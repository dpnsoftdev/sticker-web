import axios from "axios";

// Create axios instance with default config
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const axiosPublic = axios.create({
  baseURL: BASE_URL,
});

export const axiosPrivate = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});
