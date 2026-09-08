# Mapa RBAC do Rooster One

## Contrato da permissão

Cada permissão pertence a um módulo e usa a forma `recurso.acao`:

- `access`: entrada no módulo ou recurso.
- `read`: leitura, listagem e consulta.
- `create`: criação e envio.
- `update`: edição, aprovação, lançamento ou mudança de status.
- `delete`: exclusão, cancelamento ou revogação.

O catálogo da tela **Hub > Acessos e permissões** é gerado em `src/services/hub/seed.ts` com IDs determinísticos no formato `modulo-recurso-acao`.

## Recursos mapeados

| Módulo | Recursos |
| --- | --- |
| Rooster Hub | usuários, setores, perfis, permissões, módulos, sessões, logs, notificações, vínculos |
| Rooster Desk | tickets, categorias, subcategorias, prioridades, status, mensagens, anexos, histórico, avaliações, equipe |
| Rooster Student | perfil, disciplinas, atividades, notas, frequência, histórico, calendário, cursos, financeiro, reservas, chamados, documentos, notificações |
| Rooster Academy | disciplinas, turmas, professores, matrículas, calendário, frequência, conteúdos, notas, desempenho, períodos, documentos |
| Rooster Rooms | campi, blocos, ambientes, reservas |
| Rooster Assets | ativos, categorias, movimentações |
| Rooster Finance | cobranças, mensalidades, boletos, produtos, serviços, notas fiscais, relatórios, descontos, configurações |
| Rooster Learn | atividades, questões, turmas, notas, relatórios, entregas |
| Rooster Boost | cursos, conteúdos, inscrições, certificados |

Todos os recursos têm as cinco ações do contrato. A aplicação pode restringir ações por perfil e por escopo do usuário (por exemplo, aluno consulta apenas os próprios dados), mas não deve remover a permissão estrutural do catálogo.

## Matriz inicial de perfis

| Perfil | Módulos liberados |
| --- | --- |
| Administrador | Todos, com todas as ações |
| Coordenador | Hub, Desk, Student, Academy, Rooms, Assets e Learn; sem exclusão |
| Professor | Desk, Student, Academy, Rooms e Learn; sem exclusão |
| Financeiro | Desk, Assets e Finance; sem exclusão |
| Aluno | Desk, Student, Rooms, Learn e Boost; acesso de criação limitado ao próprio fluxo |
| Técnico de TI | Desk, Rooms e Assets, incluindo exclusão operacional |
| Usuário institucional | Desk, Student, Rooms e Assets; sem exclusão |

## Estado da integração

A tela frontend já lista o catálogo completo, permite associar o módulo ao cadastrar uma permissão e gera a matriz de vínculos para os sete perfis. O backend ainda aplica autorização de forma explícita apenas no Rooster Desk, em `hasPermission`; os demais controllers CRUD ainda precisam receber guards usando o mesmo contrato `modulo + recurso + acao` antes de considerar o RBAC pronto para produção.
