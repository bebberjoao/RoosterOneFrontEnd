// Autorização em tempo real do Rooster One.
// Lê as permissões concedidas ao usuário ativo (tabela `usuarios_permissoes`
// + `permissoes`) e responde "pode / não pode" por tela e por ação.
// Não existe mais perfil/role como intermediário: a autorização é sempre
// usuário -> permissão. Quando o usuário ainda não possui permissões próprias
// cadastradas, vale a matriz padrão de demonstração dos módulos (RoleSwitcher),
// apenas para que o ambiente de demonstração continue navegável.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/shared/primitives";
import { permissoesService, usuariosPermissoesService, usuariosService } from "@/services/hub";
import type { Permissao, Usuario, UsuarioPermissao } from "@/services/hub";
import { ROLE_META, useRole, type Role } from "../role-context";
import { MODULES, moduleAllowed, subItemAllowed } from "../module-config";
import { ACCESS_ACTION, findScreenByRoute, permissionKey } from "./permission-catalog";

type PermissionCtx = {
  /** Usuário do Hub correspondente à persona ativa (quando existir). */
  usuario: Usuario | null;
  /** Chaves `modulo.tela.acao` concedidas ao usuário ativo. */
  granted: Set<string>;
  /** Há permissões personalizadas salvas para este usuário? */
  hasCustom: boolean;
  loading: boolean;
  /** Primeira carga concluída (evita remontar as telas a cada recarga). */
  ready: boolean;
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

/** Matriz padrão de demonstração, usada apenas quando não há permissões próprias. */
function roleAllowsRoute(role: Role, route: string): boolean {
  const mod = MODULES.find((m) => route === m.path || route.startsWith(`${m.path}/`));
  if (!mod) return true;
  if (!moduleAllowed(mod, role)) return false;
  const child = (mod.children ?? []).find((c) => c.to === route);
  return child ? subItemAllowed(child, role) : true;
}

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { role } = useRole();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [granted, setGranted] = useState<Set<string>>(new Set());
  const [hasCustom, setHasCustom] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    const personName = ROLE_META[role].person.name;

    (async () => {
      setLoading(true);
      try {
        const [usuarios, vinculos, permissoes] = await Promise.all([
          usuariosService.list(),
          usuariosPermissoesService.list(),
          permissoesService.list(),
        ]);
        if (!alive) return;
        const found = usuarios.find((u) => u.nome === personName) ?? null;
        setUsuario(found);
        if (!found) {
          setGranted(new Set());
          setHasCustom(false);
          return;
        }
        const byId = new Map<string, Permissao>(permissoes.map((p) => [p.id, p]));
        const mine = vinculos.filter((v: UsuarioPermissao) => v.usuarioId === found.id);
        const keys = new Set(
          mine.map((v) => byId.get(v.permissaoId)?.nome).filter((n): n is string => Boolean(n)),
        );
        setGranted(keys);
        setHasCustom(mine.length > 0);
      } catch {
        if (!alive) return;
        setGranted(new Set());
        setHasCustom(false);
      } finally {
        if (alive) {
          setLoading(false);
          setReady(true);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [role, tick]);

  const value = useMemo(
    () => ({ usuario, granted, hasCustom, loading, ready, reload }),
    [usuario, granted, hasCustom, loading, ready, reload],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePermissions() {
  return useContext(Ctx);
}

/** O usuário ativo pode entrar nesta tela/rota? */
export function useCanAccess(route: string): boolean {
  const { granted, hasCustom } = usePermissions();
  const { role } = useRole();
  if (!hasCustom) return roleAllowsRoute(role, route);
  const match = findScreenByRoute(route);
  if (!match) return roleAllowsRoute(role, route);
  return granted.has(permissionKey(match.module.id, match.screen.id, ACCESS_ACTION.id));
}

/** O usuário ativo pode executar esta ação na tela informada? */
export function useCan(route: string, actionId: string): boolean {
  const { granted, hasCustom } = usePermissions();
  const canAccess = useCanAccess(route);
  if (!canAccess) return false;
  if (!hasCustom) return true;
  const match = findScreenByRoute(route);
  if (!match) return true;
  return granted.has(permissionKey(match.module.id, match.screen.id, actionId));
}

/** Bloqueia o conteúdo quando o usuário ativo não tem permissão de acesso. */
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
