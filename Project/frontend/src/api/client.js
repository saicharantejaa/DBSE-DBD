import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 15000,
});

// Attach JWT if present (set by AuthContext after login/register)
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('lp_token');
  if (raw) {
    config.headers['Authorization'] = `Bearer ${raw}`;
  }
  return config;
});

// ── Course endpoints ────────────────────────────────────────────────────────
export const getCourses      = ()     => api.get('/courses').then(r => r.data);
export const getCourse       = (id)   => api.get(`/courses/${id}`).then(r => r.data);
export const getCourseAnalytics = (id) => api.get(`/courses/${id}/analytics`).then(r => r.data);

// ── Enrollment endpoints ────────────────────────────────────────────────────
export const getEnrollments  = (studentId) => api.get(`/enrollments?studentId=${studentId}`).then(r => r.data);
export const enroll          = (studentId, courseId) =>
  api.post('/enrollments', { student_id: studentId, course_id: courseId }).then(r => r.data);

// ── Doubt endpoints ─────────────────────────────────────────────────────────
export const getDoubts           = (studentId)    => api.get(`/doubts?studentId=${studentId}`).then(r => r.data);
export const getInstructorDoubts = (instructorId) => api.get(`/doubts?instructorId=${instructorId}`).then(r => r.data);
export const getDoubt            = (id)           => api.get(`/doubts/${id}`).then(r => r.data);
export const submitDoubt         = (payload)      => api.post('/doubts', payload).then(r => r.data);

// ── User endpoints ──────────────────────────────────────────────────────────
export const getUser = (id) => api.get(`/users/${id}`).then(r => r.data);

// ── Auth endpoints ──────────────────────────────────────────────────────────
export const authLogin    = (email, password) =>
  api.post('/auth/login', { email, password }).then(r => r.data);
export const authRegister = (name, email, password, role) =>
  api.post('/auth/register', { name, email, password, role }).then(r => r.data);

export default api;

