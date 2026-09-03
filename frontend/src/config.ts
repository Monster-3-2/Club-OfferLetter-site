/**
 * Centralized API Base URL configuration for Stats-O-Locked Offer Letter system.
 *
 * Local Development:
 * Defaults to 'http://localhost:5000' (or set via VITE_API_URL in .env / .env.development).
 *
 * Production Deployment (e.g. Vercel):
 * Set VITE_API_URL environment variable in deployment settings
 * (e.g. VITE_API_URL=https://backend-six-sand-58.vercel.app).
 */
export const API_BASE_URL = (
  (import.meta as any).env?.VITE_API_URL !== undefined && (import.meta as any).env?.VITE_API_URL !== ''
    ? (import.meta as any).env.VITE_API_URL
    : 'http://localhost:5000'
).replace(/\/$/, '');
