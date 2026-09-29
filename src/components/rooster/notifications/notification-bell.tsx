import { Bell, CheckCheck } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { tempoRelativo, useNotificacoes } from "./use-notificacoes";
import type { Notificacao } from "@/services/hub/types";

export function NotificationBell() {
  const { itens, naoLidas, carregando, erro, marcarLida, marcarTodasLidas } = useNotificacoes();
  const navigate = useNavigate();
  const rotulo = naoLidas > 0 ? `Notificações (${naoLidas} não lidas)` : "Notificações";

  function abrir(n: Notificacao) {
    void marcarLida(n.id);
    if (n.rota) navigate({ to: n.rota });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label={rotulo} title={rotulo}>
          <Bell className="h-4 w-4" />
          {naoLidas > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[oklch(0.6_0.22_25)] px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-background">
              {naoLidas > 99 ? "99+" : naoLidas}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notificações</p>
            <p className="text-xs text-muted-foreground">{naoLidas > 0 ? `${naoLidas} não lida(s)` : "Tudo em dia"}</p>
          </div>
          {naoLidas > 0 ? (
            <button
              type="button"
              onClick={() => void marcarTodasLidas()}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Marcar todas
            </button>
          ) : null}
        </div>

        {erro && itens.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">Não foi possível carregar as notificações.</p>
        ) : itens.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            {carregando ? "Carregando…" : "Você não tem notificações."}
          </p>
        ) : (
          <ScrollArea className="max-h-96">
            <ul className="divide-y">
              {itens.slice(0, 15).map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => abrir(n)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent ${n.lida ? "" : "bg-primary/5"}`}
                  >
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.lida ? "bg-transparent" : "bg-primary"}`} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-sm ${n.lida ? "" : "font-semibold"}`}>{n.titulo}</span>
                      {n.mensagem ? <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{n.mensagem}</span> : null}
                      <span className="mt-1 block text-[11px] text-muted-foreground">{tempoRelativo(n.criadoEm)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}

        <div className="border-t px-4 py-2 text-center">
          <Link to="/notifications" className="text-xs font-medium text-primary hover:underline">
            Ver todas
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
