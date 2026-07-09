import { defineConfig } from "vitest/config";

/**
 * Unit tests run under Vitest. Pure logic (e.g. `src/lib/`) uses the default
 * `node` environment; component/DOM tests can opt into `jsdom` per-file with a
 * `// @vitest-environment jsdom` pragma.
 */
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    environment: "node",
  },
});
