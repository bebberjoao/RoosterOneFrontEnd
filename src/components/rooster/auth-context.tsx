import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ApiError, ApiUnavailableError, request } from "@/services/hub/client";
import { session, type SessionUser } from "@/services/hub/session";

type LoginResponse = {
  usuario: SessionUser;
  accessToken: string;
  /** Trocado por um par novo quando o access token expira — ver `client.ts`. */
  refreshToken: string;
  /** Permissões efetivas do usuário no momento do login — mesmo formato de `Permissao.nome`/`permissionKey()`. */
  acesso: { permissoes: Array<{ nome: string }> } | null;
};

type AuthCtx = {
  authed: boolean;
  ready: boolean;
  usuario: SessionUser | null;
  /** Autentica contra POST /auth/login. Lança ApiError (credenciais) ou ApiUnavailableError (sem servidor). */
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  /** POST /auth/esqueci-senha — sempre resolve (a API não informa se o e-mail existe). */
  requestPasswordReset: (email: string) => Promise<void>;
  /** POST /auth/redefinir-senha — lança ApiError se o token for inválido/expirado. */
  resetPassword: (token: string, novaSenha: string) => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  authed: false,
  ready: false,
  usuario: null,
  login: async () => {},
  logout: () => {},
  requestPasswordReset: async () => {},
  resetPassword: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    session.restore();
    setUsuario(session.usuario);
    setReady(true);
    const unsubscribe = session.subscribe(() => setUsuario(session.usuario));
    return () => {
      unsubscribe();
    };
  }, []);

  const login = async (email: string, senha: string) => {
    const res = await request<LoginResponse>("/auth/login", { method: "POST", body: { email, senha } });
    const permissoes = (res.acesso?.permissoes ?? []).map((p) => p.nome);
    session.set(res.accessToken, res.usuario, permissoes, res.refreshToken);
  };

  const logout = () => {
    // Avisa o servidor para revogar a sessão, mas não espera nem trava a saída
    // em caso de falha: do ponto de vista do usuário, sair é local e imediato.
    const refresh = session.refreshToken;
    if (refresh) {
      void request("/auth/logout", { method: "POST", body: { refreshToken: refresh } }).catch(() => {});
    }
    session.clear();
  };

  const requestPasswordReset = async (email: string) => {
    await request("/auth/esqueci-senha", { method: "POST", body: { email } });
  };
  const resetPassword = async (token: string, novaSenha: string) => {
    await request("/auth/redefinir-senha", { method: "POST", body: { token, novaSenha } });
  };

  return (
    <Ctx.Provider value={{ authed: usuario !== null, ready, usuario, login, logout, requestPasswordReset, resetPassword }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}

export { ApiError, ApiUnavailableError };
