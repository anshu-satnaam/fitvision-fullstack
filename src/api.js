/**
 * api.js — Central service layer for all backend calls.
 * Every request automatically injects the stored JWT token.
 * All paths are relative (/api/...) so the Vite proxy forwards them to FastAPI.
 */

const BASE = '/api'

// ── Token helpers ────────────────────────────────────────────────────────────
export const getToken  = () => localStorage.getItem('fv_token')
export const setToken  = (t) => localStorage.setItem('fv_token', t)
export const clearToken = () => localStorage.removeItem('fv_token')

function authHeaders(extra = {}) {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: authHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  /** POST /auth/signup */
  signup: (username, email, password) =>
    req('POST', '/auth/signup', { username, email, password }),

  /** POST /auth/login — login by email */
  login: (email, password) =>
    req('POST', '/auth/login', { email, password }),

  /** GET /auth/me */
  me: () => req('GET', '/auth/me'),
}

// ── Profile ──────────────────────────────────────────────────────────────────
export const profileAPI = {
  /** GET /profile */
  get: () => req('GET', '/profile'),

  /** PUT /profile */
  update: (data) => req('PUT', '/profile', data),

  /** POST /auth/profile — update age/height/weight via fitvision adapter */
  updateStats: (data) => req('PUT', '/auth/profile', data),

  /** POST /profile/upload-avatar */
  uploadAvatar: async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const token = getToken();
    const res = await fetch('/api/profile/upload-avatar', {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: fd
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
}

// ── Workouts ─────────────────────────────────────────────────────────────────
export const workoutAPI = {
  /** GET /workouts/me */
  myWorkouts: () => req('GET', '/workouts/me'),

  /** POST /workouts/start */
  startSession: (exercise) => req('POST', '/workouts/start', { exercise }),

  /** POST /workouts/end */
  endSession: (session_id, reps) => req('POST', '/workouts/end', { session_id, reps }),

  /** POST /workouts (quick log) */
  logWorkout: (exercise, reps) => req('POST', '/workouts', { exercise, reps }),

  /** POST /workouts/ai */
  logAiWorkout: (data) => req('POST', '/workouts/ai', data),

  /** POST /ai/posture-feedback */
  postureFeedback: (exercise, avg_angle, reps, stability) => req('POST', '/ai/posture-feedback', { exercise, avg_angle, reps, stability }),
}

// ── Chatbot ───────────────────────────────────────────────────────────────────
export const chatbotAPI = {
  /**
   * POST /chatbot/message
   * @param {string} message
   * @param {number} session_reps
   * @param {string} current_exercise
   */
  send: (message, session_reps = 0, current_exercise = 'general') =>
    req('POST', '/chatbot/message', { message, session_reps, current_exercise }),
}

// ── Leaderboard / Social ──────────────────────────────────────────────────────
export const socialAPI = {
  /** GET /leaderboard?page=1&size=20 */
  leaderboard: (page = 1, size = 20) =>
    req('GET', `/leaderboard?page=${page}&size=${size}`),
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  /** GET /dashboard */
  get: () => req('GET', '/dashboard'),
}
