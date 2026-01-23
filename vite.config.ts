import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Allow both VITE_ and NEXT_PUBLIC_ prefixes to be exposed to client-side import.meta.env
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  // Base path: use the GitHub Pages subpath when building for production (adjust as needed).
  // On Vercel typically the site is served at '/', but if you publish under '/tanzify-ai/'
  // this ensures asset paths are emitted correctly.
  base: process.env.NODE_ENV === 'production' ? '/tanzify-ai/' : '/',
  server: {
    host: true,
    port: 5173,
    hmr: {
      overlay: false,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: 'globalThis',
  },
}));
