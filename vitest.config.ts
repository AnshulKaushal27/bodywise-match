import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./apps/web"),
      "@bodywise/shared": path.resolve(__dirname, "./packages/shared/src"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    exclude: ["**/node_modules/**", "**/dist/**", "**/.next/**", "**/e2e/**"],
  },
});
