// src/lib/api.ts
// Centralized API base for frontend. Use Railway URL in production, localhost in dev.
// Prefer an explicit Vite environment variable `VITE_API_BASE_URL`.
// Fallback to localhost in dev.
// Support both `VITE_API_BASE_URL` and legacy `VITE_API_BASE` variable names.
export const API_BASE: string = (import.meta.env.VITE_API_BASE_URL as string) || (import.meta.env.VITE_API_BASE as string) || (import.meta.env.PROD ? '' : 'http://localhost:3001');

export default API_BASE;
