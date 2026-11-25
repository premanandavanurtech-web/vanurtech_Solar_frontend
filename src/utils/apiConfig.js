const normalizeOrigin = (value) => (value || "").trim().replace(/\/+$/, "");

const resolveApiOrigin = () => {
  if (typeof window !== "undefined") {
    const storageUrl = localStorage.getItem("API_URL") || localStorage.getItem("REACT_APP_API_URL");
    if (storageUrl) return storageUrl;
  }
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl) return envUrl;
  if (typeof window !== "undefined" && window.location) {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      const port = process.env.REACT_APP_API_PORT || "9001";
      return `http://localhost:${port}`;
    }
    if (host && !host.includes("vercel.app") && !host.includes("onrender.com")) {
      const port = process.env.REACT_APP_API_PORT || "9001";
      const protocol = window.location.protocol || "http:";
      return `${protocol}//${host}:${port}`;
    }
  }
  return "https://vanurtech-solar-backend-1.onrender.com";
};

export const API_ORIGIN = normalizeOrigin(resolveApiOrigin());

export const LEGACY_API_ORIGINS = [
  "https://vanurtech-solar-backend-1.onrender.com",
];

export const KNOWN_API_HOSTS = new Set(
  [API_ORIGIN, ...LEGACY_API_ORIGINS]
    .map((origin) => {
      try {
        return new URL(origin).hostname;
      } catch {
        return "";
      }
    })
    .filter(Boolean)
);

export const API_BASE_URL = `${API_ORIGIN}/api/v1`;

export const buildApiUrl = (endpoint = "") => {
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${normalizedEndpoint}`;
};
