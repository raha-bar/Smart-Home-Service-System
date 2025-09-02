// frontend/src/lib/api.js
import axios from "axios";

/** Pull a token from the shapes already used in the app */
export function getToken() {
  const read = (key) => {
    try { return JSON.parse(localStorage.getItem(key) || "{}"); }
    catch { return {}; }
  };

  const auth = read("auth");           // { token } or { accessToken }
  const userInfo = read("userInfo");   // { token } or { accessToken }
  const session = read("session");     // optional fallback

  return (
    auth.token || auth.accessToken ||
    userInfo.token || userInfo.accessToken ||
    session.token || session.accessToken ||
    null
  );
}

const api = axios.create({
  baseURL:
    (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.replace(/\/$/, "")) ||
    "http://localhost:5000/api",
  withCredentials: false,
});

// Automatically attach Authorization header when we have a token
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
