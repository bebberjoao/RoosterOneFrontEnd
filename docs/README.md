# Documentação interna — Rooster One

Esta pasta contém APENAS documentação técnica interna. Nada aqui é renderizado
na interface: são arquivos markdown para a equipe de desenvolvimento e para a
integração futura com o backend NestJS.

## Índice

- [Arquitetura do frontend](./arquitetura.md)
- [Dados mockados e ponto único de integração](./dados-mockados.md)
- [Guia de integração com o backend](./integracao-backend.md)
- [Extração de módulos para o backend](./modulos-backend.md)
- [Modelo de dados (tabelas e relacionamentos)](./data-model/README.md) — padrão em [rooms.md](./data-model/rooms.md) · lista simples de campos em [rooms-tabelas.md](./data-model/rooms-tabelas.md)
- [Design System](./design-system.md)
- [Shell, sidebar e navegação](./shell-navegacao.md)

### Módulos

| Módulo | Rota base | Documento |
| --- | --- | --- |
| Rooster Hub | `/hub` | [hub.md](./modules/hub.md) |
| Rooster Desk | `/desk` | [desk.md](./modules/desk.md) |
| Rooster Student | `/student` | [student.md](./modules/student.md) |
| Rooster Academy | `/academy` | [academy.md](./modules/academy.md) |
| Rooster Rooms | `/rooms` | [rooms.md](./modules/rooms.md) · [modelo de dados](./data-model/rooms.md) · [tabelas](./data-model/rooms-tabelas.md) |
| Rooster Assets | `/assets` | [assets.md](./modules/assets.md) |
| Rooster Finance | `/finance` | [finance.md](./modules/finance.md) |
| Rooster Learn | `/learn` | [learn.md](./modules/learn.md) |
| Rooster Boost | `/boost` | [boost.md](./modules/boost.md) |

## Convenção de documentação de módulo

Cada documento de módulo segue a mesma estrutura:

1. Objetivo do módulo
2. Rotas e arquivos
3. Telas (o que cada uma exibe)
4. Componentes próprios
5. Serviços e funções (assinatura + comportamento)
6. Tabela de botões e ações (label, tela, efeito, serviço chamado)
7. Permissões por perfil
8. Pontos de integração com o backend