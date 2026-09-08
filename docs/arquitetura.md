# Arquitetura do frontend — Rooster One

## Stack

React 19 + TypeScript, TanStack Start/Router (rotas em `src/routes`), Tailwind
CSS v4 (tokens em `src/styles.css`), Recharts para gráficos, lucide-react para
ícones.

## Camadas

```text
src/routes/            Telas (uma rota por arquivo, padrão flat: modulo.pagina.tsx)
src/components/rooster/ Componentes de domínio por módulo + shell/navegação
src/components/shared/  UI kit interno (DataTable, Modal, Drawer, TabBar, ...)
src/components/ui/      Primitivos shadcn
src/services/           Camada de acesso a dados (mock-api, hub, http)
src/mock/               Banco de dados mockado (ver dados-mockados.md)
```

## Regras de dependência

- Rotas dependem de componentes e serviços; nunca de `src/mock` diretamente.
- Componentes de domínio não fazem fetch próprio quando a rota pode fornecer.
- Nenhum componente hardcoda cor: tudo via tokens semânticos do Design System.

## Navegação e permissões

`src/components/rooster/module-config.ts` é o catálogo único de módulos e
sub-itens da sidebar, com o array `roles` controlando visibilidade por perfil.
O perfil ativo vem de `role-context.tsx` (trocável pelo Role Switcher no topbar,
recurso de desenvolvimento). Detalhes em [shell-navegacao.md](./shell-navegacao.md).