import axios from 'axios';

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const { hostname, origin } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://${hostname}:8000`;
  }
  return origin;
};

const api = axios.create({
  baseURL: getBaseURL(),
});

export { getBaseURL };

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Error]', error.message, error.config?.url);
    if (error.message === 'Network Error') {
      console.error('The backend might be down or unreachable at ' + api.defaults.baseURL);
    }
    return Promise.reject(error);
  }
);

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const profileAPI = {
  get: () => api.get('/api/profile').then(res => res.data),
  update: (data) => api.put('/api/profile', data).then(res => res.data),
  updateStats: (data) => api.put('/api/profile', data).then(res => res.data),
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/api/profile/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  incrementReps: (count) => api.post(`/api/profile/increment-reps?count=${count}`).then(res => res.data),
};

export const workoutAPI = {
  myWorkouts: () => api.get('/api/workouts/me').then(res => res.data),
  logWorkout: (data) => api.post('/api/workouts', data).then(res => res.data),
};

export const authAPI = {
  login: (email, password) => api.post('/api/login', { username: email, password }).then(res => res.data),
  signup: (username, email, password) => api.post('/api/register', { username, email, password }).then(res => res.data),
  firebaseLogin: (data) => api.post('/api/firebase-login', data).then(res => res.data),
  me: () => api.get('/api/auth/me').then(res => res.data),
};

export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => localStorage.setItem('token', token);
export const clearToken = () => localStorage.removeItem('token');

export const chatbotAPI = {
  send: (text) => api.post('/api/chatbot', { content: text }).then(res => res.data),
};

export const socialAPI = {
  leaderboard: (page = 1, size = 20) => api.get(`/api/leaderboard?page=${page}&size=${size}`).then(res => res.data),
  myRank: () => api.get('/api/my-rank').then(res => res.data),
  search: (q) => api.get(`/api/users/search?q=${q}`).then(res => res.data),
  getFriends: () => api.get('/api/friends').then(res => res.data),
  getSuggestions: () => api.get('/api/friends/suggestions').then(res => res.data),
  getPendingRequests: () => api.get('/api/friends/requests/pending').then(res => res.data),
  sendRequest: (userId) => api.post(`/api/friends/${userId}/request`).then(res => res.data),
  acceptRequest: (userId) => api.post(`/api/friends/${userId}/accept`).then(res => res.data),
  rejectRequest: (userId) => api.post(`/api/friends/${userId}/reject`).then(res => res.data),
  removeFriend: (userId) => api.delete(`/api/friends/${userId}`).then(res => res.data),
  getUserProfile: (id) => api.get(`/api/users/${id}/profile`).then(res => res.data),
  getClans: () => api.get('/api/clans').then(res => res.data),
  getMyClan: () => api.get('/api/clans/my').then(res => res.data),
  createClan: (data) => api.post('/api/clans', data).then(res => res.data),
  joinClan: (id) => api.post(`/api/clans/${id}/join`).then(res => res.data),
  leaveClan: (id) => api.post(`/api/clans/${id}/leave`).then(res => res.data),
  getClanMembers: (id) => api.get(`/api/clans/${id}/members`).then(res => res.data),
  getClanChat: (id) => api.get(`/api/clans/${id}/chat`).then(res => res.data),
  sendClanMessage: (id, content) => api.post(`/api/clans/${id}/chat`, { content }).then(res => res.data),
};

export default api;
