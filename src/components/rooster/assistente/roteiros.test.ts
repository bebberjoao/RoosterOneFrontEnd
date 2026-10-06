import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { ROTEIROS_TELA, roteiroPorId } from "./roteiros";

/**
 * Integridade dos roteiros guiados: os identificadores coincidem com os do backend
 * (src/assistente/roteiros.ts, que associa cada roteiro ao manual e à permissão exigida)
 * e todo alvo de passo existe no código da interface — um alvo renomeado ou removido de
 * uma tela quebraria o roteiro em silêncio, só percebido quando o usuário o executasse.
 */

/** Espelho da lista de roteiros do backend. */
const ROTEIROS_BACKEND = [
  "abrir-chamado",
  "responder-chamado",
  "reservar-ambiente",
  "aprovar-reserva",
  "cadastrar-usuario",
  "conceder-permissao",
  "registrar-frequencia",
  "lancar-notas",
  "criar-atividade",
  "cadastrar-questao",
  "corrigir-entrega",
  "responder-atividade",
  "gerar-mensalidades",
  "registrar-pagamento",
  "cadastrar-patrimonio",
];

const SRC = join(__dirname, "..", "..", "..");

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return arquivos(caminho);
    return /\.tsx$/.test(nome) && !/\.test\.tsx$/.test(nome) ? [caminho] : [];
  });
}

const codigo = arquivos(SRC)
  .map((f) => readFileSync(f, "utf8"))
  .join("\n");

/** Alvos gerados por componentes compartilhados a partir de um valor (abas, cadastro genérico do Hub). */
const PREFIXOS_DINAMICOS: Array<[RegExp, string]> = [
  [/^aba-/, "data-tour={`aba-${t.value}`}"],
  [/^campo-/, "tour={`campo-${f.name}`}"],
  [/^reserva-aba-/, "data-tour={`reserva-aba-${v}`}"],
];

function alvoExiste(alvo: string): boolean {
  if (codigo.includes(`data-tour="${alvo}"`) || codigo.includes(`tour="${alvo}"`)) return true;
  return PREFIXOS_DINAMICOS.some(([re, trecho]) => re.test(alvo) && codigo.includes(trecho));
}

describe("roteiros guiados do assistente", () => {
  it("definem as etapas de todos os roteiros do backend, sem duplicidade", () => {
    expect(ROTEIROS_TELA.map((r) => r.id).sort()).toEqual([...ROTEIROS_BACKEND].sort());
    expect(roteiroPorId("abrir-chamado")?.titulo).toBe("Abrir um chamado de suporte");
    expect(roteiroPorId("inexistente")).toBeUndefined();
  });

  it("começam pela tela da tarefa e explicam cada passo (o que fazer e por quê)", () => {
    for (const r of ROTEIROS_TELA) {
      expect(r.passos.length, r.id).toBeGreaterThan(1);
      expect(r.passos[0].rota, r.id).toMatch(/^\//);
      expect(r.passos[0].opcional, r.id).toBeFalsy();
      for (const p of r.passos) {
        expect(p.titulo.trim(), `${r.id}/${p.alvo}`).not.toBe("");
        expect(p.texto.trim().length, `${r.id}/${p.alvo}`).toBeGreaterThan(10);
        expect(p.porque.trim().length, `${r.id}/${p.alvo}`).toBeGreaterThan(10);
        expect(p.alvo, `${r.id}/${p.alvo}`).toMatch(/^[a-z][a-zA-Z-]*$/);
      }
    }
  });

  it("apontam apenas para elementos marcados com data-tour no código das telas", () => {
    const ausentes = ROTEIROS_TELA.flatMap((r) =>
      r.passos.filter((p) => !alvoExiste(p.alvo)).map((p) => `${r.id}: ${p.alvo}`),
    );
    expect(ausentes).toEqual([]);
  });

  it("restringem o avanço a marcadores existentes", () => {
    for (const r of ROTEIROS_TELA) {
      for (const p of r.passos) {
        if (!p.avancaEm) continue;
        expect(p.acao, `${r.id}/${p.alvo}`).toBe("clicar");
        for (const [, marcador] of p.avancaEm.matchAll(/data-tour="([^"]+)"/g)) {
          expect(alvoExiste(marcador), `${r.id}/${p.alvo}: ${marcador}`).toBe(true);
        }
      }
    }
  });
});
