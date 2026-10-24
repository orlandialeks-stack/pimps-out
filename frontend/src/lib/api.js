import axios from "axios";

export const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");

export const API = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  withCredentials: true,
});

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
