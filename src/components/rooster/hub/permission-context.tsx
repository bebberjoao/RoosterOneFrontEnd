// Autorização em tempo real do Rooster One.
// Fonte da verdade: as permissões efetivas do usuário REALMENTE logado
// (`session.permissoes`, capturadas de `acesso.permissoes` na resposta de
// `POST /auth/login` — ver auth-context.tsx e services/hub/session.ts).
// Isso nunca depende de listar todo mundo do sistema (a maioria dos usuários
// não tem permissão pra isso) nem de casar o nome da persona de demonstração
// (RoleSwitcher) com algum usuário real cadastrado — o usuário logado é
// sempre exatamente quem o JWT diz que é.
//
// O RoleSwitcher (`role-context.tsx`) continua funcionando por cima disso:
// `MODULES`/`modulesForRole` decide o que a "Visão" escolhida mostraria; esta
// permissão real é uma restrição ADICIONAL (E lógico, nunca substitui) — um
// módulo só aparece se a Visão permitir E o usuário logado tiver a permissão
// de verdade. Para um admin real (que tem todas as permissões), isso não
// muda nada visualmente — a Visão continua controlando 100% da prévia, como
// sempre. Para qualquer outro usuário real, a permissão dele vira um teto:
// nenhuma Visão consegue mostrar mais do que ele realmente pode acessar.
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/shared/primitives";
import { session, type SessionUser } from "@/services/hub/session";
import { ACCESS_ACTION, findScreenByRoute, permissionKey } from "./permission-catalog";

type PermissionCtx = {
  /** Usuário realmente logado (JWT), ou `null` antes do login/restore. */
  usuario: SessionUser | null;
  /** Chaves `modulo.tela.acao` (mesmo formato de `Permissao.nome`) efetivamente concedidas a ele. */
  granted: Set<string>;
  /** Há uma sessão real ativa? (sempre `true` quando logado — a permissão vem sempre do backend, nunca de uma matriz de demonstração) */
  hasCustom: boolean;
  loading: boolean;
  /** Primeira sincronização com a sessão concluída (evita telas piscando "sem acesso" antes de restaurar). */
  ready: boolean;
  /** Recarrega a partir da sessão atual — útil depois de uma ação que possa ter mudado a própria permissão (raro; o normal é um novo login). */
  reload: () => void;
};

const Ctx = createContext<PermissionCtx>({
  usuario: null,
  granted: new Set(),
  hasCustom: false,
  loading: false,
  ready: false,
  reload: () => {},
});

export function PermissionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<SessionUser | null>(null);
  const [granted, setGranted] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setUsuario(session.usuario);
      setGranted(new Set(session.permissoes));
      setReady(true);
    };
    sync();
    const unsubscribe = session.subscribe(sync);
    return () => { unsubscribe(); };
  }, []);

  const value = useMemo<PermissionCtx>(
    () => ({
      usuario,
      granted,
      hasCustom: usuario !== null,
      loading: false,
      ready,
      reload: () => {
        setUsuario(session.usuario);
        setGranted(new Set(session.permissoes));
      },
    }),
    [usuario, granted, ready],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePermissions() {
  return useContext(Ctx);
}

/** O usuário logado pode entrar nesta tela/rota? Rota sem tela conhecida no catálogo é sempre liberada (ex.: `/`, `/settings`). */
export function useCanAccess(route: string): boolean {
  const { granted, hasCustom } = usePermissions();
  if (!hasCustom) return true; // sessão ainda não restaurada — não bloqueia, RequireAccess espera `ready`
  const match = findScreenByRoute(route);
  if (!match) return true;
  return granted.has(permissionKey(match.module.id, match.screen.id, ACCESS_ACTION.id));
}

/** O usuário logado pode executar esta ação na tela informada? */
export function useCan(route: string, actionId: string): boolean {
  const { granted, hasCustom } = usePermissions();
  const canAccess = useCanAccess(route);
  if (!canAccess) return false;
  if (!hasCustom) return true;
  const match = findScreenByRoute(route);
  if (!match) return true;
  return granted.has(permissionKey(match.module.id, match.screen.id, actionId));
}

/** Bloqueia o conteúdo quando o usuário logado não tem permissão de acesso real à rota. */
export function RequireAccess({ route, children }: { route: string; children: ReactNode }) {
  const allowed = useCanAccess(route);
  const { ready } = usePermissions();
  if (!ready) return <div className="min-h-40" />;
  if (allowed) return <>{children}</>;
  return (
    <EmptyState
      icon={ShieldAlert}
      title="Acesso negado"
      description="Seu usuário não tem permissão para acessar esta tela. Fale com um administrador do Rooster Hub."
    />
  );
}
