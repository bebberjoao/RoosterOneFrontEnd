import { describe, it, expect } from "vitest";
import {
  buildSlots,
  findConflicts,
  hourToMinutes,
  isoOf,
  parseOpeningHours,
  roomSlots,
  startOfWeek,
} from "./labels";
import type { Reservation } from "@/mock/database/reservations";

/**
 * Lógica pura da agenda do Rooster Rooms. É a regra que decide se uma sala
 * está livre — o backend reforça o mesmo (RN010), mas é isto aqui que a tela
 * usa para habilitar/desabilitar o envio e para montar a lista de horários.
 */

function reserva(over: Partial<Reservation>): Reservation {
  return {
    id: "r1",
    code: "RS-000001",
    spaceId: "sala-1",
    roomId: "sala-1",
    responsible: "Fulano",
    sector: "Setor",
    event: "Evento",
    purpose: "aula",
    date: "2026-10-15",
    start: "08:00",
    end: "10:00",
    participants: 10,
    status: "confirmada",
    notes: "",
    events: [],
    ...over,
  } as Reservation;
}

describe("hourToMinutes", () => {
  it("converte hora do dia em minutos desde a meia-noite", () => {
    expect(hourToMinutes("00:00")).toBe(0);
    expect(hourToMinutes("08:30")).toBe(510);
    expect(hourToMinutes("23:59")).toBe(1439);
  });
});

describe("isoOf", () => {
  it("formata a data local como yyyy-mm-dd, com zero à esquerda", () => {
    expect(isoOf(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(isoOf(new Date(2026, 11, 31))).toBe("2026-12-31");
  });

  it("usa a data local, não UTC — senão o dia 'vira' em fuso negativo", () => {
    // 1º de março às 23h local: em UTC-3 isso já seria 2 de março em UTC.
    // A agenda trabalha com o dia do calendário do usuário, então tem que ser 01.
    expect(isoOf(new Date(2026, 2, 1, 23, 0, 0))).toBe("2026-03-01");
  });
});

describe("startOfWeek", () => {
  it("volta para a segunda-feira da semana, zerando o horário", () => {
    // 2026-10-15 é uma quinta-feira; a segunda dessa semana é 2026-10-12.
    const seg = startOfWeek(new Date(2026, 9, 15, 14, 30));
    expect(isoOf(seg)).toBe("2026-10-12");
    expect(seg.getHours()).toBe(0);
    expect(seg.getMinutes()).toBe(0);
  });

  it("trata domingo como fim da semana, não início", () => {
    // 2026-10-18 é domingo: a segunda correspondente é a do dia 12, não a do dia 19.
    expect(isoOf(startOfWeek(new Date(2026, 9, 18)))).toBe("2026-10-12");
  });

  it("é idempotente quando já está na segunda", () => {
    expect(isoOf(startOfWeek(new Date(2026, 9, 12)))).toBe("2026-10-12");
  });
});

describe("findConflicts", () => {
  const existente = reserva({ id: "existente", start: "08:00", end: "10:00" });

  it("acusa sobreposição parcial no começo e no fim", () => {
    expect(findConflicts([existente], "sala-1", "2026-10-15", "09:00", "11:00")).toHaveLength(1);
    expect(findConflicts([existente], "sala-1", "2026-10-15", "07:00", "09:00")).toHaveLength(1);
  });

  it("acusa quando o novo horário engloba o existente, e vice-versa", () => {
    expect(findConflicts([existente], "sala-1", "2026-10-15", "07:00", "12:00")).toHaveLength(1);
    expect(findConflicts([existente], "sala-1", "2026-10-15", "08:30", "09:30")).toHaveLength(1);
  });

  it("não acusa quando os horários apenas se encostam", () => {
    // Fim às 08:00 e início às 08:00 é troca de turno, não conflito —
    // a comparação é estritamente "<", de propósito.
    expect(findConflicts([existente], "sala-1", "2026-10-15", "06:00", "08:00")).toHaveLength(0);
    expect(findConflicts([existente], "sala-1", "2026-10-15", "10:00", "12:00")).toHaveLength(0);
  });

  it("ignora reserva de outra sala ou de outro dia", () => {
    expect(findConflicts([existente], "sala-2", "2026-10-15", "09:00", "11:00")).toHaveLength(0);
    expect(findConflicts([existente], "sala-1", "2026-10-16", "09:00", "11:00")).toHaveLength(0);
  });

  it("ignora reserva cancelada — a sala volta a ficar livre", () => {
    const cancelada = reserva({ id: "x", status: "cancelada" });
    expect(findConflicts([cancelada], "sala-1", "2026-10-15", "09:00", "11:00")).toHaveLength(0);
  });

  it("ignora a própria reserva ao reagendar (ignoreId)", () => {
    // Sem isto, editar uma reserva acusaria conflito com ela mesma.
    expect(findConflicts([existente], "sala-1", "2026-10-15", "08:00", "10:00", "existente")).toHaveLength(0);
  });
});

describe("parseOpeningHours", () => {
  it("extrai os dois horários do texto livre de funcionamento", () => {
    expect(parseOpeningHours("07:00 – 22:30")).toEqual({ start: "07:00", end: "22:30" });
    expect(parseOpeningHours("Seg a Sex, das 8:00 às 18:00")).toEqual({ start: "08:00", end: "18:00" });
  });

  it("cai no padrão quando o texto não tem dois horários", () => {
    expect(parseOpeningHours(undefined)).toEqual({ start: "07:00", end: "22:00" });
    expect(parseOpeningHours("integral")).toEqual({ start: "07:00", end: "22:00" });
    expect(parseOpeningHours("a partir das 09:00")).toEqual({ start: "07:00", end: "22:00" });
  });
});

describe("buildSlots", () => {
  it("gera períodos sequenciais dentro do intervalo", () => {
    expect(buildSlots("08:00", "11:00", 60)).toEqual([
      { start: "08:00", end: "09:00", label: "08:00 - 09:00" },
      { start: "09:00", end: "10:00", label: "09:00 - 10:00" },
      { start: "10:00", end: "11:00", label: "10:00 - 11:00" },
    ]);
  });

  it("não gera período que ultrapasse o fim do expediente", () => {
    // De 08:00 a 09:30 com passo de 60 cabe um período só: 09:00–10:00 passaria do fim.
    expect(buildSlots("08:00", "09:30", 60)).toHaveLength(1);
  });

  it("respeita o passo mínimo de 15 minutos", () => {
    // Passo 0 ou negativo geraria laço infinito; a função força o mínimo.
    expect(buildSlots("08:00", "09:00", 0)).toHaveLength(1);
    expect(buildSlots("08:00", "09:00", 5)).toHaveLength(4);
  });

  it("devolve vazio quando o fim não é depois do início", () => {
    expect(buildSlots("10:00", "10:00", 60)).toEqual([]);
    expect(buildSlots("11:00", "09:00", 60)).toEqual([]);
  });
});

describe("roomSlots", () => {
  it("prefere os períodos cadastrados no ambiente, já ordenados", () => {
    const slots = roomSlots({
      openingHours: "07:00 – 22:00",
      slots: ["13:00 - 15:00", "08:00 - 10:00"],
      slotMinutes: 60,
    });
    expect(slots.map((s) => s.start)).toEqual(["08:00", "13:00"]);
  });

  it("descarta período cadastrado malformado em vez de quebrar a tela", () => {
    const slots = roomSlots({
      openingHours: "07:00 – 22:00",
      slots: ["08:00 - 10:00", "manhã"],
      slotMinutes: 60,
    });
    expect(slots).toHaveLength(1);
  });

  it("deriva do horário de funcionamento quando o ambiente não tem período cadastrado", () => {
    const slots = roomSlots({ openingHours: "08:00 – 11:00", slots: [], slotMinutes: 60 });
    expect(slots).toHaveLength(3);
    expect(slots[0]).toEqual({ start: "08:00", end: "09:00", label: "08:00 - 09:00" });
  });
});
