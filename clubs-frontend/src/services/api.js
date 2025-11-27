import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
};

// Club endpoints
export const clubAPI = {
  create: (data) => api.post("/clubs/", data),
  get: (uid) => api.get(`/clubs/${uid}`),
  update: (uid, data) => api.put(`/clubs/${uid}`, data),
  join: (uid) => api.post(`/clubs/${uid}/join`),
  getMembers: (uid) => api.get(`/clubs/${uid}/members`),
  getMyClubs: () => api.get("/clubs/my-clubs"),
  getStats: (uid) => api.get(`/clubs/${uid}/stats`),
};

// Event endpoints
export const eventAPI = {
  create: (data) => api.post("/events/", data),
  get: (uid) => api.get(`/events/${uid}`),
  update: (uid, data) => api.put(`/events/${uid}`, data),
  join: (uid) => api.post(`/events/${uid}/join`),
  getClubEvents: (clubUid) => api.get(`/events/club/${clubUid}`),
  delete: (uid) => api.delete(`/events/${uid}`),
};

// Media endpoints
export const mediaAPI = {
  upload: (file, presetType) => {
    const fd = new FormData();
    fd.append("file", file);
    if (presetType) fd.append("preset_type", presetType);
    return api.post("/media/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export default api;
