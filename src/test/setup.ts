// Carregado antes de cada arquivo de teste (vitest.config.ts -> setupFiles).
// Adiciona os matchers de DOM do Testing Library (toBeInTheDocument, etc.)
// e limpa a árvore React entre testes, para um teste não enxergar o DOM do anterior.
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
