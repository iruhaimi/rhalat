import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Markdown editor packages import their own CSS; let Vite handle them instead of Node.
    server: { deps: { inline: [/@uiw\//] } },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
