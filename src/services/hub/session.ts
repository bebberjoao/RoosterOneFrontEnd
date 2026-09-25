// Sessão real do Rooster One: token JWT retornado por POST /auth/login,
// anexado pelo client HTTP em toda chamada autenticada (ver client.ts).
// Persistido em localStorage só para sobreviver a um F5; a fonte da verdade
// de quem está logado é sempre o backend (o token expira em 8h).
const TOKEN_KEY = "rooster.session.token";
const USER_KEY = "rooster.session.usuario";
const PERMISSOES_KEY = "rooster.session.permissoes";
const REFRESH_KEY = "rooster.session.refresh";

export type SessionUser = { id: string; nome: string; email: string };

let token: string | null = null;
/** Refresh token de `POST /auth/login`, trocado por um par novo quando o access token expira (8h). */
let refreshToken: string | null = null;
let usuario: SessionUser | null = null;
/** Chaves `modulo.tela.acao` (mesmo formato de `Permissao.nome`/`permissionKey()`) efetivamente concedidas ao usuário logado — vêm de `acesso.permissoes` na resposta de `POST /auth/login`, nunca recalculadas no cliente. */
let permissoes: string[] = [];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function readLocalStorage() {
  try {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    const storedPermissoes = localStorage.getItem(PERMISSOES_KEY);
    token = storedToken;
    refreshToken = localStorage.getItem(REFRESH_KEY);
    usuario = storedUser ? (JSON.parse(storedUser) as SessionUser) : null;
    permissoes = storedPermissoes ? (JSON.parse(storedPermissoes) as string[]) : [];
  } catch {
    token = null;
    refreshToken = null;
    usuario = null;
    permissoes = [];
  }
}

export const session = {
  get token() {
    return token;
  },
  get refreshToken() {
    return refreshToken;
  },
  get usuario() {
    return usuario;
  },
  /** Chaves de permissão real do usuário logado (vazio se ainda não restaurado/logado). */
  get permissoes() {
    return permissoes;
  },
  /** Lê o storage local — chamado uma vez, no boot do app. */
  restore() {
    readLocalStorage();
    notify();
  },
  set(
    nextToken: string,
    nextUsuario: SessionUser,
    nextPermissoes: string[] = [],
    nextRefreshToken: string | null = null,
  ) {
    token = nextToken;
    usuario = nextUsuario;
    permissoes = nextPermissoes;
    refreshToken = nextRefreshToken;
    try {
      localStorage.setItem(TOKEN_KEY, nextToken);
      localStorage.setItem(USER_KEY, JSON.stringify(nextUsuario));
      localStorage.setItem(PERMISSOES_KEY, JSON.stringify(nextPermissoes));
      if (nextRefreshToken) localStorage.setItem(REFRESH_KEY, nextRefreshToken);
      else localStorage.removeItem(REFRESH_KEY);
    } catch {
      // Storage indisponível (ex.: modo privado) — sessão fica só em memória.
    }
    notify();
  },
  clear() {
    token = null;
    refreshToken = null;
    usuario = null;
    permissoes = [];
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(PERMISSOES_KEY);
      localStorage.removeItem(REFRESH_KEY);
    } catch {
      // ignore
    }
    notify();
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

/** Token atual, para consumidores fora do client HTTP (ex.: handshake do WebSocket do Desk). */
export async function getApiToken(): Promise<string | null> {
  return session.token;
}
