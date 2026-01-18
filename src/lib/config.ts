// Centralized API base config for frontend
// Use VITE_API_BASE for production backend URL. Leave empty for dev to use Vite proxy.
export const API_BASE: string = import.meta.env.VITE_API_BASE || "";

export default API_BASE;
