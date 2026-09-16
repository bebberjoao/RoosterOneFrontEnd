// Sessão real do Rooster One: token JWT retornado por POST /auth/login,
// anexado pelo client HTTP em toda chamada autenticada (ver client.ts).
// Persistido em localStorage só para sobreviver a um F5; a fonte da verdade
// de quem está logado é sempre o backend (o token expira em 8h).
const TOKEN_KEY = "rooster.session.token";
const USER_KEY = "rooster.session.usuario";

export type SessionUser = { id: string; nome: string; email: string };

let token: string | null = null;
let usuario: SessionUser | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function readLocalStorage() {
  try {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    token = storedToken;
    usuario = storedUser ? (JSON.parse(storedUser) as SessionUser) : null;
  } catch {
    token = null;
    usuario = null;
  }
}

export const session = {
  get token() {
    return token;
  },
  get usuario() {
    return usuario;
  },
  /** Lê o storage local — chamado uma vez, no boot do app. */
  restore() {
    readLocalStorage();
    notify();
  },
  set(nextToken: string, nextUsuario: SessionUser) {
    token = nextToken;
    usuario = nextUsuario;
    try {
      localStorage.setItem(TOKEN_KEY, nextToken);
      localStorage.setItem(USER_KEY, JSON.stringify(nextUsuario));
    } catch {
      // Storage indisponível (ex.: modo privado) — sessão fica só em memória.
    }
    notify();
  },
  clear() {
    token = null;
    usuario = null;
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
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
