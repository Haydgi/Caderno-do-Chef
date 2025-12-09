import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/Caderno-do-Chef/" : "/",
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Permite acesso de todos os IPs (localhost + rede)
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:3001", // Usa localhost para proxy local
        changeOrigin: true,
        secure: false,
      },
    },
  },
}));
