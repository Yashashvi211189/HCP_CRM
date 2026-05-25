import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = config.url && config.url.startsWith("/admin")
    ? localStorage.getItem("hcp_admin_token")
    : localStorage.getItem("hcp_crm_token") || localStorage.getItem("hcp_admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const sendOtp = (name, email) => api.post("/auth/send-otp", { name, email });
export const verifyOtp = (email, otp) => api.post("/auth/verify-otp", { email, otp });
export const adminLogin = (password) => api.post("/auth/admin-login", { password });
export const trackActivity = (action, route) => api.post("/api/activity", { action, route });
export const listAdminUsers = (q = "") => api.get("/admin/users", { params: { q } });
export const getAdminUserActivity = (id) => api.get(`/admin/users/${id}/activity`);
export const sendChatMessage = (message, history = []) => api.post("/api/chat", { message, history });
export const searchHcps = (q) => api.get("/api/hcps", { params: { q } });
export const saveInteraction = (interaction) =>
  api.post("/api/interactions", {
    ...interaction,
    ai_suggested_followups: Array.isArray(interaction.ai_suggested_followups)
      ? interaction.ai_suggested_followups.join("\n")
      : interaction.ai_suggested_followups,
  });
export const listInteractions = () => api.get("/api/interactions");
export const editInteraction = (id, field, new_value) => api.patch(`/api/interactions/${id}`, { field, new_value });
export const deleteInteraction = (id) => api.delete(`/api/interactions/${id}`);

export default api;
