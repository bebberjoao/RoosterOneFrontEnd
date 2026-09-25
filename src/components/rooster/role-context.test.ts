import { describe, expect, it } from "vitest";
import { deriveRole } from "./role-context";
import { tempoRelativo } from "./notifications/use-notificacoes";

const com = (...chaves: string[]) => new Set(chaves);

describe("deriveRole — perfil de interface deduzido das permissões reais", () => {
  it("quem gerencia permissões é administrador, mesmo com outras permissões", () => {
    expect(deriveRole(com("hub.acessos.gerenciar-permissoes", "finance.dashboard.acessar"))).toBe("admin");
  });

  it("reconhece cada perfil pela permissão que o caracteriza", () => {
    expect(deriveRole(com("finance.dashboard.acessar"))).toBe("financeiro");
    expect(deriveRole(com("student.dashboard.acessar", "learn.student.acessar"))).toBe("aluno");
    expect(deriveRole(com("academy.dashboard.acessar", "academy.manage.acessar"))).toBe("coordenador");
    expect(deriveRole(com("academy.dashboard.acessar"))).toBe("professor");
    expect(deriveRole(com("desk.tickets.encerrar"))).toBe("tecnico");
  });

  it("sem nenhuma permissão conhecida cai no perfil menos privilegiado, nunca em admin", () => {
    expect(deriveRole(com())).toBe("institucional");
  });
});

describe("tempoRelativo", () => {
  const atras = (ms: number) => new Date(Date.now() - ms).toISOString();
  it("formata minutos, horas e dias", () => {
    expect(tempoRelativo(atras(10_000))).toBe("agora");
    expect(tempoRelativo(atras(5 * 60_000))).toBe("há 5 min");
    expect(tempoRelativo(atras(3 * 3_600_000))).toBe("há 3 h");
    expect(tempoRelativo(atras(30 * 3_600_000))).toBe("ontem");
    expect(tempoRelativo(null)).toBe("");
  });
});
