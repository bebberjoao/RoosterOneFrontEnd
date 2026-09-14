import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const KEY = "rooster.auth";

type AuthCtx = {
  authed: boolean;
  ready: boolean;
  login: () => void;
  logout: () => void;
};

const Ctx = createContext<AuthCtx>({ authed: false, ready: false, login: () => {}, logout: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAuthed(localStorage.getItem(KEY) === "1");
    setReady(true);
  }, []);

  const login = () => {
    localStorage.setItem(KEY, "1");
    setAuthed(true);
  };
  const logout = () => {
    localStorage.removeItem(KEY);
    setAuthed(false);
  };

  return <Ctx.Provider value={{ authed, ready, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
