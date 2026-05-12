const API_BASE_URL = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");

// This joins the main backend URL with one API path.
export function buildApiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
