import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ApiError, ApiUnavailableError, request } from "@/services/hub/client";
import { session, type SessionUser } from "@/services/hub/session";

type LoginResponse = { usuario: SessionUser; accessToken: string };

type AuthCtx = {
  authed: boolean;
  ready: boolean;
  usuario: SessionUser | null;
  /** Autentica contra POST /auth/login. Lança ApiError (credenciais) ou ApiUnavailableError (sem servidor). */
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx>({
  authed: false,
  ready: false,
  usuario: null,
  login: async () => {},
  logout: () => {},
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
    session.set(res.accessToken, res.usuario);
  };
  const logout = () => session.clear();

  return (
    <Ctx.Provider value={{ authed: usuario !== null, ready, usuario, login, logout }}>{children}</Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}

export { ApiError, ApiUnavailableError };
