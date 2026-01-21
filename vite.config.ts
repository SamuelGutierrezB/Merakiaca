import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router")
            ) {
              return "vendor";
            }
            if (id.includes("firebase")) {
              return "firebase";
            }
            if (id.includes("@heroicons")) {
              return "ui";
            }
            if (
              id.includes("react-hook-form") ||
              id.includes("zod") ||
              id.includes("@hookform")
            ) {
              return "forms";
            }
            if (id.includes("zustand")) {
              return "state";
            }
            return "vendor-other";
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
