import axios from "axios";

// Fallback keeps the site functional on static hosts (e.g. Vercel) even when
// REACT_APP_BACKEND_URL is not configured. A dashboard env var takes precedence.
export const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || "https://pimpsout-store.preview.emergentagent.com").replace(/\/$/, "");

export const API = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  withCredentials: true,
});

// If a host (e.g. Vercel SPA fallback) answers /api/* with HTML instead of JSON,
// treat it as an error so pages render their fallback states instead of crashing.
API.interceptors.response.use(
  (res) => {
    if (typeof res.data === "string") {
      return Promise.reject(new Error("API unreachable: received non-JSON response"));
    }
    return res;
  },
  (err) => Promise.reject(err)
);

export const imgUrl = (p) => {
  if (!p) return "";
  if (p.startsWith("http")) return p;
  return `${BACKEND_URL}${p}`;
};

export const eur = (n) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n ?? 0);

export const fmtErr = (e) => {
  const d = e?.response?.data?.detail;
  if (!d) return e?.message || "Something went wrong";
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => x?.msg || JSON.stringify(x)).join(" ");
  return String(d);
};
