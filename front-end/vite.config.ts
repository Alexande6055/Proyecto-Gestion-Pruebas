/// <reference types="vitest" />

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },

  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",

    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],

      include: [
        "src/**/*.{ts,tsx}",
      ],

      exclude: [
        "src/**/*.d.ts",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/setupTests.ts",
        "src/**/*.test.{ts,tsx}",
        "src/**/__tests__/**",
        "src/assets/**",
      ],
    },
  },
});