const API_URL = "/api";
export const SOCKET_URL = "http://127.0.0.1:5000";

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("campusConnectToken");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}
