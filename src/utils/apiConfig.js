const normalizeOrigin = (value) => (value || "").trim().replace(/\/+$/, "");

export const API_ORIGIN = normalizeOrigin(
  process.env.REACT_APP_API_URL || "https://efilx-solar-backend-1.onrender.com"
);

export const LEGACY_API_ORIGINS = [
  "https://efilx-solar-backend-1.onrender.com",
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
