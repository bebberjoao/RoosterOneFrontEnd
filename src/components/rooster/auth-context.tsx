import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { API_BASE_URL, setApiToken, setApiUserId } from "@/services/http";

const KEY = "rooster.auth";

type AuthCtx = {
  authed: boolean;
  ready: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  user: { id: string; name: string; email: string; sector?: string } | null;
};

const Ctx = createContext<AuthCtx>({ authed: false, ready: false, login: async () => {}, logout: () => {}, user: null });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthCtx["user"]>(null);

  useEffect(() => {
    setAuthed(Boolean(localStorage.getItem("rooster.jwt")));
    const savedUser = localStorage.getItem("rooster.user");
    if (savedUser) setUser(JSON.parse(savedUser));
    setReady(true);
  }, []);

  const login = async (email: string, senha: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });
    if (!response.ok) throw new Error("Login ou senha inválidos.");
    const data = (await response.json()) as { accessToken: string; usuario: { id: string; nome: string; email: string }; acesso?: { perfis?: Array<{ nome: string }> } };
    setApiToken(data.accessToken);
    setApiUserId((data as { usuario?: { id?: string } }).usuario?.id ?? null);
    const nextUser = { id: data.usuario.id, name: data.usuario.nome, email: data.usuario.email };
    setUser(nextUser);
    localStorage.setItem("rooster.user", JSON.stringify(nextUser));
    const isAdmin = data.acesso?.perfis?.some((profile) => profile.nome === "Administrador");
    localStorage.setItem("rooster.role", isAdmin ? "admin" : "tecnico");
    window.dispatchEvent(new Event("rooster-auth-change"));
    localStorage.setItem(KEY, "1");
    setAuthed(true);
  };
  const logout = () => {
    localStorage.removeItem(KEY);
    setApiToken(null);
    setApiUserId(null);
    localStorage.removeItem("rooster.user");
    localStorage.removeItem("rooster.role");
    window.dispatchEvent(new Event("rooster-auth-change"));
    setAuthed(false);
  };

  return <Ctx.Provider value={{ authed, ready, login, logout, user }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
