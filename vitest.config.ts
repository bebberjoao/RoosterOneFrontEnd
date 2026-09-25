import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = fileURLToPath(new URL(".", import.meta.url));

// Config separada da do app (vite.config.ts) de propósito: aquela é montada
// por @lovable.dev/vite-tanstack-config, que já injeta TanStack Start, nitro,
// tailwind e outros plugins, e avisa explicitamente para não acrescentar
// plugins manualmente. Teste unitário não precisa de nada disso — precisa só
// de React (JSX), do alias "@" e de um DOM.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": resolve(raiz, "./src") },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
