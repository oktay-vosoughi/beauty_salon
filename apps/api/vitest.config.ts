import { defineConfig } from "vitest/config";
import { resolve } from "path";
import { config } from "dotenv";

// Load env before vitest starts collecting tests
config({ path: resolve(__dirname, "../../.env") });

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: ["./src/tests/setup.ts"],
  },
  resolve: {
    alias: { "@": resolve(__dirname, "src") },
  },
});
