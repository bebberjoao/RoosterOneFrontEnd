// Contexto de autenticação do portal público Rooster Boost — espelha
// src/components/rooster/auth-context.tsx (Hub), mas fala com
// POST /boost/cadastro e POST /boost/login (BoostUsuario, JWT `tipo: 'boost'`)
// e guarda a sessão em src/services/boost-portal/session.ts. Nunca importa
// nada do Hub: as duas sessões coexistem sem se enxergar.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { BoostApiError, BoostApiUnavailableError, request } from "./client";
import { boostSession, type BoostSessionUser } from "./session";

type SessaoBoostResponse = { usuario: BoostSessionUser; accessToken: string };

type BoostAuthCtx = {
  authed: boolean;
  ready: boolean;
  usuario: BoostSessionUser | null;
  /** POST /boost/login. Lança BoostApiError (credenciais) ou BoostApiUnavailableError (sem servidor). */
  login: (email: string, senha: string) => Promise<void>;
  /** POST /boost/login-institucional: aluno interno, com e-mail e senha do Rooster One. Emite token do portal. */
  loginInstitucional: (email: string, senha: string) => Promise<void>;
  /** POST /boost/cadastro. Lança BoostApiError (ex.: 409 e-mail já cadastrado) ou BoostApiUnavailableError. */
  cadastro: (nome: string, email: string, senha: string) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<BoostAuthCtx>({
  authed: false,
  ready: false,
  usuario: null,
  login: async () => {},
  loginInstitucional: async () => {},
  cadastro: async () => {},
  logout: () => {},
});

export function BoostAuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<BoostSessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    boostSession.restore();
    setUsuario(boostSession.usuario);
    setReady(true);
    const unsubscribe = boostSession.subscribe(() => setUsuario(boostSession.usuario));
    return () => {
      unsubscribe();
    };
  }, []);

  const login = async (email: string, senha: string) => {
    const res = await request<SessaoBoostResponse>("/boost/login", { method: "POST", body: { email, senha } });
    boostSession.set(res.accessToken, res.usuario);
  };

  const loginInstitucional = async (email: string, senha: string) => {
    const res = await request<SessaoBoostResponse>("/boost/login-institucional", { method: "POST", body: { email, senha } });
    boostSession.set(res.accessToken, res.usuario);
  };

  const cadastro = async (nome: string, email: string, senha: string) => {
    const res = await request<SessaoBoostResponse>("/boost/cadastro", { method: "POST", body: { nome, email, senha } });
    boostSession.set(res.accessToken, res.usuario);
  };

  const logout = () => boostSession.clear();

  return (
    <Ctx.Provider value={{ authed: usuario !== null, ready, usuario, login, loginInstitucional, cadastro, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useBoostAuth() {
  return useContext(Ctx);
}

export { BoostApiError, BoostApiUnavailableError };
