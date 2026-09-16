// Catálogo de permissões do Rooster One.
// Fonte única de "o que pode ser autorizado": módulo -> tela -> ação.
// As telas correspondem 1:1 às rotas existentes em `src/routes` e as ações
// correspondem aos botões/operações realmente implementados nessas telas.
// Nada aqui é genérico: cada ação existe hoje na interface.
import { MODULES, type ModuleItem } from "../module-config";

export type ActionDef = {
  /** Sufixo usado na chave `modulo.tela.acao`. */
  id: string;
  label: string;
  /** Descrição curta exibida como apoio na tela de Acessos e permissões. */
  hint?: string;
};

export type ScreenDef = {
  /** Identificador da tela = rota real (ex.: "/desk/tickets"). */
  id: string;
  title: string;
  /** Rota usada pela navegação; igual ao id para telas navegáveis. */
  route: string;
  actions: ActionDef[];
};

export type ModuleDef = {
  id: string;
  name: string;
  path: string;
  accent: string;
  screens: ScreenDef[];
};

/** Ação obrigatória em toda tela: autoriza entrar/utilizar a tela. */
export const ACCESS_ACTION: ActionDef = {
  id: "acessar",
  label: "Acessar",
  hint: "Permite entrar e visualizar a tela.",
};

const a = (id: string, label: string, hint?: string): ActionDef => ({ id, label, hint });

/** CRUD padrão das telas de cadastro do Hub e afins. */
const CRUD: ActionDef[] = [a("criar", "Criar"), a("editar", "Editar"), a("excluir", "Excluir")];

function screen(id: string, title: string, actions: ActionDef[]): ScreenDef {
  return { id, title, route: id, actions: [ACCESS_ACTION, ...actions] };
}

/** Telas e ações por módulo (mapeadas a partir das rotas e botões existentes). */
const SCREENS: Record<string, ScreenDef[]> = {
  hub: [
    screen("/hub", "Dashboard", []),
    screen("/hub/usuarios", "Usuários", [...CRUD]),
    screen("/hub/setores", "Setores", [
      ...CRUD,
      a("gerenciar-usuarios", "Gerenciar usuários do setor", "Adicionar e remover usuários vinculados ao setor."),
    ]),
    screen("/hub/acessos", "Acessos e permissões", [
      a("gerenciar-permissoes", "Gerenciar permissões"),
      a("conceder", "Conceder permissões a usuário"),
      a("revogar", "Revogar permissões de usuário"),
    ]),
  ],
  desk: [
    screen("/desk", "Dashboard", []),
    screen("/desk/tickets", "Chamados", [
      a("criar", "Abrir chamado"),
      a("editar", "Editar chamado"),
      a("encerrar", "Encerrar"),
      a("reabrir", "Reabrir"),
      a("transferir", "Transferir"),
      a("registrar-solucao", "Registrar solução"),
      a("anexar", "Anexar arquivo"),
      a("nota-interna", "Registrar nota interna"),
    ]),
    screen("/desk/categories", "Categorias", [...CRUD, a("subcategorias", "Gerenciar subcategorias")]),
    screen("/desk/team", "Atendentes", [...CRUD, a("vincular-categoria", "Vincular a categoria")]),
  ],
  student: [
    screen("/student", "Dashboard", []),
    screen("/student/profile", "Perfil acadêmico", []),
    screen("/student/disciplines", "Disciplinas", []),
    screen("/student/activities", "Atividades", [a("entregar", "Realizar entrega")]),
    screen("/student/grades", "Notas e desempenho", []),
    screen("/student/attendance", "Frequência", []),
    screen("/student/history", "Histórico", [a("baixar", "Baixar histórico")]),
    screen("/student/calendar", "Calendário", []),
    screen("/student/courses", "Cursos", [a("inscrever", "Inscrever-se")]),
    screen("/student/finance", "Financeiro", [a("baixar-boleto", "Baixar boleto")]),
    screen("/student/reservations", "Reservas", [a("solicitar", "Solicitar reserva")]),
    screen("/student/tickets", "Chamados", [a("abrir", "Abrir chamado")]),
    screen("/student/documents", "Documentos", [a("enviar", "Enviar documento"), a("baixar", "Baixar documento")]),
    screen("/student/notifications", "Notificações", [a("marcar-lida", "Marcar como lida")]),
  ],
  academy: [
    screen("/academy", "Dashboard", []),
    screen("/academy/manage", "Gestão acadêmica", [
      a("gerenciar-disciplinas", "Gerenciar disciplinas"),
      a("gerenciar-turmas", "Gerenciar turmas"),
      a("gerenciar-professores", "Gerenciar professores"),
      a("gerenciar-calendario", "Gerenciar calendário"),
      a("matricular", "Matricular aluno"),
    ]),
    screen("/academy/attendance", "Frequência", [
      a("registrar-chamada", "Registrar chamada"),
      a("editar-chamada", "Editar chamada anterior"),
    ]),
    screen("/academy/grades", "Notas e conteúdos", [
      a("lancar-notas", "Lançar notas"),
      a("configurar-pesos", "Configurar componentes e pesos"),
    ]),
  ],
  rooms: [
    screen("/rooms", "Dashboard", []),
    screen("/rooms/book", "Reservar", [a("solicitar", "Solicitar reserva")]),
    screen("/rooms/reservations", "Minhas reservas", [
      a("mensagem", "Enviar mensagem"),
      a("alterar-horario", "Solicitar alteração de horário"),
      a("cancelar", "Cancelar reserva"),
    ]),
    screen("/rooms/manage", "Gerenciar reservas", [
      a("aprovar", "Aprovar reserva"),
      a("responder", "Responder solicitante"),
      a("cancelar", "Cancelar com motivo"),
      a("alterar-horario", "Alterar horário"),
    ]),
    screen("/rooms/structure", "Estrutura física", [...CRUD, a("gerar-periodos", "Gerar períodos de funcionamento")]),
  ],
  assets: [
    screen("/assets", "Dashboard", []),
    screen("/assets/inventory", "Patrimônio", [
      ...CRUD,
      a("movimentar", "Registrar movimentação"),
      a("gerenciar-categorias", "Gerenciar categorias"),
    ]),
  ],
  finance: [
    screen("/finance", "Dashboard", []),
    screen("/finance/charges", "Cobranças", [
      a("criar", "Nova cobrança"),
      a("marcar-pago", "Marcar como paga"),
      a("negociar", "Negociar"),
      a("cancelar", "Cancelar cobrança"),
      a("exportar", "Exportar"),
    ]),
    screen("/finance/tuitions", "Mensalidades", [a("gerar-lote", "Gerar em lote"), a("editar", "Editar")]),
    screen("/finance/boletos", "Boletos", [a("emitir", "Emitir boleto"), a("baixar", "Baixar boleto")]),
    screen("/finance/products", "Produtos", CRUD),
    screen("/finance/services", "Serviços", CRUD),
    screen("/finance/nfe", "Notas Fiscais", [a("emitir", "Emitir nota"), a("exportar-xml", "Exportar XML")]),
    screen("/finance/reports", "Relatórios", [a("exportar", "Exportar relatório")]),
    screen("/finance/discounts", "Descontos", CRUD),
  ],
  learn: [
    screen("/learn", "Dashboard", []),
    screen("/learn/classes", "Turmas e atividades", [
      a("criar-atividade", "Criar atividade"),
      a("editar-questoes", "Editar questões"),
      a("corrigir", "Corrigir entregas"),
      a("duplicar", "Duplicar atividade"),
      a("excluir", "Excluir atividade"),
      a("gerenciar-turmas", "Gerenciar turmas"),
    ]),
    screen("/learn/student", "Minhas atividades", [
      a("responder", "Responder atividade"),
      a("anexar", "Anexar arquivo"),
      a("ver-correcao", "Ver correção do professor"),
    ]),
  ],
  boost: [
    screen("/boost", "Cursos", [
      a("criar", "Novo curso"),
      a("editar", "Editar curso"),
      a("duplicar", "Duplicar curso"),
      a("arquivar", "Arquivar curso"),
      a("excluir", "Excluir curso"),
      a("certificado", "Emitir certificado"),
    ]),
  ],
};

/** Módulos do catálogo, derivados de `module-config.ts` (não duplicados à mão). */
export const PERMISSION_MODULES: ModuleDef[] = MODULES.map((m: ModuleItem) => ({
  id: m.id,
  name: m.name,
  path: m.path,
  accent: m.accent,
  screens: SCREENS[m.id] ?? [],
})).filter((m) => m.screens.length > 0);

/** Chave canônica de uma permissão: `modulo.tela.acao`. */
export function permissionKey(moduleId: string, screenId: string, actionId: string): string {
  const screenSlug = screenId.replace(/^\//, "").replace(/\//g, "-");
  return `${moduleId}.${screenSlug}.${actionId}`;
}

export function screenKeys(mod: ModuleDef, screen: ScreenDef): string[] {
  return screen.actions.map((act) => permissionKey(mod.id, screen.id, act.id));
}

export function moduleKeys(mod: ModuleDef): string[] {
  return mod.screens.flatMap((s) => screenKeys(mod, s));
}

export const ALL_PERMISSION_KEYS: string[] = PERMISSION_MODULES.flatMap(moduleKeys);

/** Metadados de uma chave, usados para criar o registro em `permissoes`. */
export function describeKey(key: string): { moduloId?: string; recurso: string; acao: string; descricao: string } | null {
  for (const mod of PERMISSION_MODULES) {
    for (const scr of mod.screens) {
      for (const act of scr.actions) {
        if (permissionKey(mod.id, scr.id, act.id) === key) {
          return {
            recurso: scr.id,
            acao: act.id,
            descricao: `${mod.name} · ${scr.title} · ${act.label}`,
          };
        }
      }
    }
  }
  return null;
}

/** Localiza a tela do catálogo correspondente a uma rota. */
export function findScreenByRoute(route: string): { module: ModuleDef; screen: ScreenDef } | null {
  let best: { module: ModuleDef; screen: ScreenDef } | null = null;
  for (const mod of PERMISSION_MODULES) {
    for (const scr of mod.screens) {
      if (route === scr.route || route.startsWith(`${scr.route}/`)) {
        if (!best || scr.route.length > best.screen.route.length) best = { module: mod, screen: scr };
      }
    }
  }
  return best;
}
