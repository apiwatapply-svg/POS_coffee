import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    exclude: ["node_modules/**", ".next/**", "tests/e2e/**"],
    globals: true,
  },
  resolve: {
    alias: {
      "@frontend": new URL("./frontend", import.meta.url).pathname,
      "@backend": new URL("./backend", import.meta.url).pathname,
      "@shared": new URL("./shared", import.meta.url).pathname,
    },
  },
});
