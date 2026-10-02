// Sessão do Rooster Boost — portal PÚBLICO de alunos externos (não são
// usuários do Hub). Token JWT retornado por POST /boost/cadastro ou
// POST /boost/login, assinado pelo backend com claim `tipo: 'boost'` — nunca
// é o mesmo token da sessão do Hub (ver src/services/hub/session.ts) e as
// chaves de localStorage são propositalmente diferentes para as duas sessões
// nunca colidirem/serem confundidas, mesmo com as duas abertas no mesmo
// navegador. Persistido só para sobreviver a um F5; o backend é a fonte da
// verdade de validade do token.
const TOKEN_KEY = "rooster.boost.session.token";
const USER_KEY = "rooster.boost.session.usuario";

/** `institucional`: sessão aberta com a conta institucional (aluno interno), e não com conta própria do portal. */
export type BoostSessionUser = { id: string; nome: string; email: string; institucional?: boolean };

let token: string | null = null;
let usuario: BoostSessionUser | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function readLocalStorage() {
  try {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    token = storedToken;
    usuario = storedUser ? (JSON.parse(storedUser) as BoostSessionUser) : null;
  } catch {
    token = null;
    usuario = null;
  }
}

export const boostSession = {
  get token() {
    return token;
  },
  get usuario() {
    return usuario;
  },
  /** Lê o storage local — chamado uma vez, no boot do portal Boost. */
  restore() {
    readLocalStorage();
    notify();
  },
  set(nextToken: string, nextUsuario: BoostSessionUser) {
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

/** Token atual, para consumidores fora do client HTTP (ex.: handshake do WebSocket do chat do curso). */
export async function getBoostApiToken(): Promise<string | null> {
  return boostSession.token;
}
