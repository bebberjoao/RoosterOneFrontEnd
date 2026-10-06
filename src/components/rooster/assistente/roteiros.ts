// Roteiros guiados do assistente de dúvidas.
//
// Cada roteiro conduz o usuário pela tela real: a página é escurecida, apenas o
// elemento do passo fica visível e interativo, e uma legenda ao lado explica o
// que fazer e por que o campo existe. Os identificadores coincidem com os do
// backend (src/assistente/roteiros.ts), que associa cada roteiro ao trecho do
// Manual do Usuário, às frases de exemplo e à permissão exigida.
//
// Os elementos são localizados pelo atributo `data-tour` (propriedade `tour`
// dos componentes Btn, Field e SectionCard; `aba-<valor>` nas abas do TabBar;
// `crud-novo`, `crud-salvar` e `campo-<nome>` no cadastro genérico do Hub).

/**
 * - `clicar`: o roteiro avança quando o usuário clica no elemento destacado;
 * - `preencher`: o usuário preenche o campo e avança em "Próximo";
 * - `observar`: o elemento é apresentado e o roteiro avança em "Próximo".
 */
export type AcaoPasso = "clicar" | "preencher" | "observar";

export type PassoRoteiro = {
  /** Valor do atributo `data-tour`. Todos os elementos visíveis com o valor são destacados. */
  alvo: string;
  titulo: string;
  /** O que fazer no passo. */
  texto: string;
  /** Finalidade do campo ou da ação. */
  porque: string;
  acao: AcaoPasso;
  /** Tela em que o passo ocorre; se o usuário estiver em outra, o roteiro navega até ela. */
  rota?: string;
  /**
   * Em passos `clicar` cujo alvo é uma área com vários controles (lista com busca, tabela com paginação):
   * seletor dos elementos cujo clique avança o roteiro. Padrão: qualquer controle interativo do alvo.
   */
  avancaEm?: string;
  /** Passo que depende do conteúdo da tela (ex.: alternativas, só em questões objetivas): é pulado se o elemento não aparecer. */
  opcional?: boolean;
  /** Orientação exibida quando o elemento não é encontrado (ex.: o botão só aparece em certas condições). */
  seAusente?: string;
};

export type RoteiroTela = {
  /** Mesmo identificador do roteiro no backend. */
  id: string;
  titulo: string;
  passos: PassoRoteiro[];
};

export const ROTEIROS_TELA: RoteiroTela[] = [
  {
    id: "abrir-chamado",
    titulo: "Abrir um chamado de suporte",
    passos: [
      {
        alvo: "chamados-novo",
        rota: "/desk/tickets",
        acao: "clicar",
        titulo: "Novo chamado",
        texto: "Clique em Novo chamado para abrir o formulário de abertura.",
        porque:
          "Todo atendimento do suporte começa por um chamado registrado, que entra na fila da equipe responsável.",
        seAusente: "O botão é exibido apenas para usuários com a permissão de abrir chamados.",
      },
      {
        alvo: "chamado-titulo",
        acao: "preencher",
        titulo: "Título",
        texto: 'Resuma o problema em uma frase, por exemplo: "Projetor da sala 204 sem imagem".',
        porque:
          "O título identifica o chamado na fila de atendimento e nas notificações, sem que seja necessário abri-lo.",
      },
      {
        alvo: "chamado-categoria",
        acao: "preencher",
        titulo: "Categoria",
        texto: "Selecione a área do problema, como infraestrutura, sistemas ou manutenção.",
        porque:
          "A categoria determina a equipe que recebe o chamado e o prazo de atendimento (SLA) aplicado.",
      },
      {
        alvo: "chamado-subcategoria",
        acao: "preencher",
        titulo: "Subcategoria",
        texto: "Após escolher a categoria, indique o tipo específico do problema.",
        porque: "A subcategoria detalha o assunto e direciona a triagem dentro da equipe.",
      },
      {
        alvo: "chamado-prioridade",
        acao: "preencher",
        titulo: "Prioridade",
        texto: "Indique a urgência conforme o impacto: baixa, média, alta ou crítica.",
        porque:
          "A prioridade ordena a fila de atendimento; as mais altas devem ser reservadas a problemas que impedem o trabalho ou as aulas.",
      },
      {
        alvo: "chamado-descricao",
        acao: "preencher",
        titulo: "Descrição",
        texto: "Descreva o que ocorreu, onde, desde quando e qual o impacto na rotina.",
        porque:
          "Uma descrição completa evita trocas de mensagens para esclarecimento e acelera a solução.",
      },
      {
        alvo: "chamado-enviar",
        acao: "clicar",
        titulo: "Enviar chamado",
        texto: "Clique em Enviar chamado para registrar a solicitação.",
        porque:
          "Após o envio, o chamado recebe um número e passa a ser acompanhado na lista de chamados, onde chegam as respostas da equipe.",
      },
    ],
  },
  {
    id: "responder-chamado",
    titulo: "Acompanhar e responder um chamado",
    passos: [
      {
        alvo: "chamados-lista",
        rota: "/desk/tickets",
        acao: "clicar",
        avancaEm: "tbody tr",
        titulo: "Lista de chamados",
        texto: "Clique no chamado que deseja acompanhar.",
        porque:
          "A lista reúne os chamados visíveis ao seu perfil, com a situação e a prioridade de cada um.",
        seAusente: "Não há chamados a exibir. Verifique os filtros ou abra um novo chamado.",
      },
      {
        alvo: "chamado-detalhes",
        acao: "observar",
        titulo: "Situação do chamado",
        texto:
          "Aqui constam a situação, a prioridade, a categoria e, para a equipe de atendimento, o prazo (SLA).",
        porque:
          "Esses dados indicam em que etapa o atendimento está e se o prazo está sendo cumprido.",
      },
      {
        alvo: "chamado-conversa",
        acao: "observar",
        titulo: "Histórico",
        texto: "As mensagens, os anexos e as mudanças de situação aparecem em ordem cronológica.",
        porque:
          "O histórico registra todo o atendimento e permite retomar o assunto sem repetir informações.",
      },
      {
        alvo: "chamado-resposta",
        acao: "preencher",
        titulo: "Mensagem",
        texto: "Escreva a resposta ou a informação complementar.",
        porque: "A mensagem fica registrada no chamado e a outra parte é notificada.",
      },
      {
        alvo: "chamado-anexar",
        acao: "observar",
        opcional: true,
        titulo: "Anexar arquivo",
        texto: "Se necessário, anexe capturas de tela ou documentos.",
        porque: "Os arquivos ajudam a equipe a compreender e reproduzir o problema.",
      },
      {
        alvo: "chamado-enviar-resposta",
        acao: "clicar",
        titulo: "Enviar",
        texto: "Clique em Enviar para registrar a mensagem.",
        porque:
          "O botão é habilitado quando há texto na mensagem; após o envio, ela passa a constar do histórico.",
      },
    ],
  },
  {
    id: "reservar-ambiente",
    titulo: "Reservar uma sala ou ambiente",
    passos: [
      {
        alvo: "reserva-ambientes",
        rota: "/rooms/book",
        acao: "clicar",
        avancaEm: '[data-tour="reserva-lista-ambientes"] button',
        titulo: "Ambiente",
        texto: "Escolha o ambiente na lista. A busca e o filtro de campus ajudam a localizá-lo.",
        porque:
          "Cada ambiente possui capacidade, recursos e agenda próprios; a disponibilidade exibida é a do ambiente selecionado.",
      },
      {
        alvo: "reserva-calendario",
        acao: "clicar",
        avancaEm: '[data-tour="reserva-dias"] button',
        titulo: "Data",
        texto: "Clique no dia desejado para consultar os horários já ocupados.",
        porque:
          "A agenda evita solicitações em conflito; os dias além do limite de antecedência ficam bloqueados.",
      },
      {
        alvo: "reserva-titulo",
        acao: "preencher",
        titulo: "Título do evento",
        texto: 'Informe o nome da atividade, por exemplo: "Aula prática de Redes".',
        porque:
          "O título identifica a reserva na agenda do ambiente e na análise do setor de reservas.",
      },
      {
        alvo: "reserva-finalidade",
        acao: "preencher",
        titulo: "Finalidade",
        texto: "Selecione o tipo de uso: aula, reunião, evento, estudo em grupo ou outro.",
        porque:
          "A finalidade orienta a análise da solicitação; em aulas, permite vincular a reserva a uma turma.",
      },
      {
        alvo: "reserva-turma",
        acao: "preencher",
        opcional: true,
        titulo: "Turma",
        texto: "Opcionalmente, vincule a reserva a uma das suas turmas.",
        porque:
          "Com o vínculo, os alunos da turma visualizam o horário da aula no próprio calendário.",
      },
      {
        alvo: "reserva-horario",
        acao: "preencher",
        titulo: "Horário",
        texto: "Selecione um dos períodos livres do ambiente no dia escolhido.",
        porque:
          "Somente os períodos cadastrados e ainda não reservados são oferecidos, o que impede a sobreposição.",
      },
      {
        alvo: "reserva-participantes",
        acao: "preencher",
        titulo: "Participantes",
        texto: "Informe a quantidade prevista de pessoas.",
        porque:
          "O número de participantes é comparado à capacidade do ambiente na análise da reserva.",
      },
      {
        alvo: "reserva-repeticao",
        acao: "preencher",
        titulo: "Repetição",
        texto:
          "Para uso periódico, escolha a repetição diária, semanal ou mensal e, em seguida, a data final.",
        porque:
          "A reserva recorrente cria todas as ocorrências de uma só vez; o recurso depende de permissão específica.",
      },
      {
        alvo: "reserva-aba-mensagem",
        acao: "clicar",
        titulo: "Mensagem e equipamentos",
        texto: "Abra esta aba para complementar a solicitação.",
        porque:
          "Nela são informados os recados ao setor de reservas e os equipamentos extras necessários.",
      },
      {
        alvo: "reserva-mensagem",
        acao: "preencher",
        titulo: "Mensagem e equipamentos extras",
        texto:
          "Registre observações, necessidades especiais ou a justificativa e selecione os equipamentos extras, se necessário.",
        porque: "As informações complementares subsidiam a aprovação e a preparação do ambiente.",
      },
      {
        alvo: "reserva-enviar",
        acao: "clicar",
        titulo: "Enviar solicitação",
        texto: "Clique em Enviar solicitação para registrar o pedido.",
        porque:
          "A reserva permanece em análise até a decisão do setor responsável; o acompanhamento é feito em Minhas reservas.",
      },
    ],
  },
  {
    id: "aprovar-reserva",
    titulo: "Aprovar ou cancelar reservas",
    passos: [
      {
        alvo: "reservas-filtros",
        rota: "/rooms/manage",
        acao: "observar",
        titulo: "Situação das reservas",
        texto:
          'Filtre as reservas pela situação; "Em análise" reúne as solicitações que aguardam decisão.',
        porque:
          "O filtro permite tratar primeiro as solicitações pendentes, sem percorrer toda a agenda.",
      },
      {
        alvo: "reservas-lista",
        acao: "observar",
        titulo: "Solicitações",
        texto:
          "Cada linha apresenta a reserva, o solicitante, a data, o horário e as ações disponíveis.",
        porque:
          "Clicar na linha abre o detalhe da reserva, com o histórico de mensagens e alterações.",
      },
      {
        alvo: "reserva-aprovar",
        acao: "observar",
        opcional: true,
        titulo: "Aprovar",
        texto: "Em uma solicitação em análise, clique em Aprovar para confirmá-la.",
        porque: "A aprovação confirma o uso do ambiente e notifica o solicitante.",
      },
      {
        alvo: "reserva-responder",
        acao: "observar",
        opcional: true,
        titulo: "Responder",
        texto:
          "Use Responder para enviar uma mensagem ao solicitante sem alterar a situação da reserva.",
        porque: "A mensagem permite solicitar ajustes ou esclarecimentos antes da decisão.",
      },
      {
        alvo: "reserva-cancelar",
        acao: "observar",
        opcional: true,
        titulo: "Cancelar",
        texto: "Use Cancelar para recusar ou desfazer a reserva, informando o motivo.",
        porque: "O motivo é enviado ao solicitante e fica registrado no histórico da reserva.",
      },
    ],
  },
  {
    id: "cadastrar-usuario",
    titulo: "Cadastrar um usuário",
    passos: [
      {
        alvo: "crud-novo",
        rota: "/hub/usuarios",
        acao: "clicar",
        titulo: "Novo usuário",
        texto: "Clique em Novo para abrir o formulário de cadastro.",
        porque:
          "O cadastro cria a conta de acesso ao Rooster One; as permissões são concedidas depois, em Acessos e permissões.",
        seAusente: "O botão é exibido apenas para usuários com a permissão de criar usuários.",
      },
      {
        alvo: "campo-nome",
        acao: "preencher",
        titulo: "Nome",
        texto: "Informe o nome completo do usuário.",
        porque:
          "O nome identifica a pessoa em todo o sistema: chamados, reservas, turmas e relatórios.",
      },
      {
        alvo: "campo-email",
        acao: "preencher",
        titulo: "E-mail",
        texto: "Informe o e-mail institucional.",
        porque:
          "O e-mail é o identificador de acesso e o endereço das notificações e da recuperação de senha; não pode se repetir.",
      },
      {
        alvo: "campo-senhaHash",
        acao: "preencher",
        titulo: "Senha inicial",
        texto: "Defina uma senha provisória com, no mínimo, 6 caracteres.",
        porque:
          "A senha permite o primeiro acesso; o usuário pode redefini-la depois pela recuperação de senha.",
      },
      {
        alvo: "campo-cpf",
        acao: "preencher",
        titulo: "CPF",
        texto: "Informe o CPF, somente com números (opcional).",
        porque: "O CPF diferencia pessoas homônimas e é utilizado em documentos e cobranças.",
      },
      {
        alvo: "campo-telefone",
        acao: "preencher",
        titulo: "Telefone",
        texto: "Informe um telefone de contato (opcional).",
        porque: "O telefone facilita o contato em atendimentos e reservas.",
      },
      {
        alvo: "campo-ativo",
        acao: "preencher",
        titulo: "Ativo",
        texto: 'Mantenha "Sim" para liberar o acesso.',
        porque: "Um usuário inativo permanece no histórico, mas não consegue entrar no sistema.",
      },
      {
        alvo: "crud-salvar",
        acao: "clicar",
        titulo: "Salvar",
        texto: "Clique em Salvar para concluir o cadastro.",
        porque:
          "Após salvar, as permissões do usuário são concedidas na tela Acessos e permissões.",
      },
    ],
  },
  {
    id: "conceder-permissao",
    titulo: "Conceder permissões a um usuário",
    passos: [
      {
        alvo: "acessos-usuarios",
        rota: "/hub/acessos",
        acao: "clicar",
        avancaEm: '[data-tour="acessos-lista-usuarios"] button',
        titulo: "Usuário",
        texto: "Selecione o usuário na lista; a busca localiza por nome ou e-mail.",
        porque:
          "As permissões são individuais: cada usuário recebe diretamente as operações liberadas.",
      },
      {
        alvo: "acessos-modulos",
        acao: "clicar",
        titulo: "Módulo",
        texto: "Escolha o módulo cujas permissões serão ajustadas.",
        porque:
          "As permissões são organizadas por módulo; a barra indica quantas já foram concedidas em cada um.",
      },
      {
        alvo: "acessos-telas",
        acao: "preencher",
        titulo: "Telas e operações",
        texto:
          'Marque "Acessar" na tela desejada e, em seguida, as operações que o usuário poderá executar.',
        porque:
          '"Acessar" libera a entrada na tela; sem essa permissão, as demais operações da tela permanecem bloqueadas.',
      },
      {
        alvo: "acessos-salvar",
        acao: "clicar",
        titulo: "Salvar permissões",
        texto: "Clique em Salvar permissões para gravar as alterações.",
        porque:
          "As alterações só passam a valer depois de salvas; o botão é habilitado quando há mudanças pendentes.",
      },
    ],
  },
  {
    id: "registrar-frequencia",
    titulo: "Registrar a frequência da turma",
    passos: [
      {
        alvo: "frequencia-turmas",
        rota: "/academy/attendance",
        acao: "clicar",
        titulo: "Turma",
        texto: "Clique na turma da aula.",
        porque: "A frequência é registrada por turma, para os alunos nela matriculados.",
        seAusente: "Nenhuma turma vinculada ao seu usuário foi encontrada.",
      },
      {
        alvo: "frequencia-nova-chamada",
        acao: "clicar",
        titulo: "Nova chamada",
        texto: "Clique em Nova chamada para lançar a frequência da aula.",
        porque:
          "Cada chamada corresponde a uma aula; as anteriores permanecem no histórico da turma e podem ser reabertas.",
      },
      {
        alvo: "chamada-data",
        acao: "preencher",
        titulo: "Data da aula",
        texto: "Confirme ou ajuste a data da aula.",
        porque: "A data identifica a aula no histórico e no cálculo da frequência de cada aluno.",
      },
      {
        alvo: "chamada-marcar-todos",
        acao: "observar",
        titulo: "Marcar todos",
        texto: 'Aplique uma mesma situação a toda a turma, por exemplo "Todos: Presente".',
        porque: "O recurso agiliza o registro: em seguida, basta ajustar as exceções.",
      },
      {
        alvo: "chamada-alunos",
        acao: "preencher",
        titulo: "Situação de cada aluno",
        texto: "Para cada aluno, marque P (presente), F (falta), A (atraso) ou J (justificada).",
        porque:
          "A situação registrada compõe a frequência do aluno, exibida também no portal do aluno.",
      },
      {
        alvo: "chamada-salvar",
        acao: "clicar",
        titulo: "Salvar chamada",
        texto: "Clique em Salvar chamada para gravar a frequência.",
        porque: "A chamada salva passa a constar do histórico da turma e da frequência dos alunos.",
      },
    ],
  },
  {
    id: "lancar-notas",
    titulo: "Lançar notas da turma",
    passos: [
      {
        alvo: "notas-turmas",
        rota: "/academy/grades",
        acao: "clicar",
        titulo: "Turma",
        texto: "Clique na turma cujas notas serão lançadas.",
        porque: "As notas são registradas por turma, para os alunos matriculados.",
        seAusente: "Nenhuma turma vinculada ao seu usuário foi encontrada.",
      },
      {
        alvo: "notas-composicao",
        acao: "observar",
        titulo: "Composição da nota",
        texto:
          "Confira os componentes da nota (provas, trabalhos), com o peso e a nota máxima de cada um.",
        porque: "A nota final é a média ponderada dos componentes, conforme o peso de cada um.",
      },
      {
        alvo: "notas-novo-componente",
        acao: "observar",
        titulo: "Novo componente",
        texto:
          "Se a avaliação ainda não existir, crie-a em Novo componente, informando a descrição, o peso e a nota máxima.",
        porque:
          "Cada nota lançada pertence a um componente; sem ele, não há coluna para registrar a avaliação.",
      },
      {
        alvo: "notas-tabela",
        acao: "preencher",
        titulo: "Notas dos alunos",
        texto:
          "Digite a nota de cada aluno na coluna do componente; ela é salva automaticamente ao sair do campo. " +
          "Componentes originados de atividades do Rooster Learn são preenchidos pela correção da atividade.",
        porque:
          "As notas determinam a nota final e a situação do aluno (aprovado ou em recuperação), exibidas também no portal do aluno.",
      },
    ],
  },
  {
    id: "criar-atividade",
    titulo: "Criar e publicar uma atividade",
    passos: [
      {
        alvo: "atividades-turmas",
        rota: "/learn/classes",
        acao: "clicar",
        titulo: "Turma",
        texto: "Clique na turma que receberá a atividade.",
        porque: "A atividade pertence a uma turma: somente os alunos nela matriculados a recebem.",
        seAusente: "Nenhuma turma vinculada ao seu usuário foi encontrada.",
      },
      {
        alvo: "atividades-nova",
        acao: "clicar",
        titulo: "Nova atividade",
        texto: "Clique em Nova atividade para abrir o cadastro.",
        porque:
          "O cadastro define as informações gerais; as questões são incluídas depois, na tela da atividade.",
      },
      {
        alvo: "atividade-titulo",
        acao: "preencher",
        titulo: "Título",
        texto: 'Informe o nome da atividade, por exemplo: "Lista 4 — Integrais".',
        porque: "O título identifica a atividade para os alunos e no quadro de notas.",
      },
      {
        alvo: "atividade-descricao",
        acao: "preencher",
        titulo: "Descrição",
        texto: "Descreva as orientações gerais da atividade.",
        porque: "As orientações são exibidas ao aluno antes da resposta.",
      },
      {
        alvo: "atividade-tipo",
        acao: "preencher",
        titulo: "Tipo",
        texto: "Selecione o tipo: prova, lista, trabalho, questionário ou material.",
        porque:
          "O tipo classifica a atividade nas listagens e orienta o aluno sobre o que é esperado.",
      },
      {
        alvo: "atividade-nota",
        acao: "preencher",
        titulo: "Peso e nota máxima",
        texto: "Informe o peso da atividade na composição da nota e a nota máxima possível.",
        porque:
          "O peso define a participação na nota final da turma; a nota máxima limita a correção e serve de base ao cálculo pelas questões.",
      },
      {
        alvo: "atividade-prazo",
        acao: "preencher",
        titulo: "Abertura e prazo",
        texto: "Defina, se necessário, a data de abertura e o prazo de entrega.",
        porque:
          "Fora do período, a atividade não aceita respostas, salvo quando a entrega após o prazo é permitida.",
      },
      {
        alvo: "atividade-salvar",
        acao: "clicar",
        titulo: "Salvar",
        texto: "Clique em Salvar para criar a atividade.",
        porque: "A atividade é criada como rascunho, ainda não visível para os alunos.",
      },
      {
        alvo: "atividade-publicar",
        acao: "observar",
        opcional: true,
        titulo: "Publicar",
        texto:
          "Com a atividade pronta, clique em Publicar. As questões podem ser cadastradas antes, na tela da atividade.",
        porque: "Somente atividades publicadas ficam disponíveis para os alunos responderem.",
      },
    ],
  },
  {
    id: "cadastrar-questao",
    titulo: "Cadastrar questões em uma atividade",
    passos: [
      {
        alvo: "learn-atividades",
        rota: "/learn",
        acao: "clicar",
        avancaEm: "a",
        titulo: "Atividade",
        texto: "Clique no título da atividade (ou em Abrir) para acessar a tela da atividade.",
        porque: "As questões são cadastradas na tela própria de cada atividade.",
        seAusente: "Não há atividades nas suas turmas. Crie uma atividade em Turmas e atividades.",
      },
      {
        alvo: "aba-questoes",
        acao: "clicar",
        titulo: "Aba Questões",
        texto: "Abra a aba Questões.",
        porque:
          "A aba reúne as questões da atividade, a ordem de apresentação e a pontuação total.",
      },
      {
        alvo: "questoes-adicionar",
        acao: "clicar",
        titulo: "Adicionar questão",
        texto: "Clique em Adicionar questão.",
        porque: "Cada questão é cadastrada individualmente, com tipo, enunciado e valor próprios.",
        seAusente:
          "O botão não é exibido quando a atividade já recebeu entregas, pois alterar as questões invalidaria as respostas enviadas.",
      },
      {
        alvo: "questao-tipo",
        acao: "preencher",
        titulo: "Tipo e valor",
        texto:
          "Escolha o tipo (múltipla escolha, verdadeiro ou falso, discursiva ou envio de arquivo) e informe quantos pontos a questão vale.",
        porque:
          "As objetivas são corrigidas automaticamente no envio; as demais, pelo professor. A nota é proporcional aos pontos obtidos.",
      },
      {
        alvo: "questao-enunciado",
        acao: "preencher",
        titulo: "Enunciado",
        texto: "Digite a pergunta.",
        porque: "O enunciado é o texto principal apresentado ao aluno.",
      },
      {
        alvo: "questao-apoio",
        acao: "preencher",
        titulo: "Texto e imagem de apoio",
        texto:
          "Opcionalmente, inclua um trecho de apoio e uma imagem (JPEG, PNG, GIF ou WebP, até 5 MB).",
        porque: "O material de apoio é exibido acima do enunciado e contextualiza a questão.",
      },
      {
        alvo: "questao-alternativas",
        acao: "preencher",
        opcional: true,
        titulo: "Alternativas e gabarito",
        texto:
          "Escreva as alternativas e marque a correta (ou as corretas) no botão ao lado de cada uma.",
        porque: "O gabarito é utilizado na correção automática e não é exibido ao aluno.",
      },
      {
        alvo: "questao-obrigatoria",
        acao: "preencher",
        titulo: "Resposta obrigatória",
        texto: "Defina se o aluno precisa responder a questão para enviar a atividade.",
        porque:
          "Questões obrigatórias sem resposta impedem o envio, o que evita entregas incompletas por descuido.",
      },
      {
        alvo: "questao-salvar",
        acao: "clicar",
        titulo: "Salvar questão",
        texto: "Clique em Salvar questão.",
        porque:
          "A questão é incluída ao final da lista; a ordem pode ser ajustada com as setas de cada questão.",
      },
    ],
  },
  {
    id: "corrigir-entrega",
    titulo: "Corrigir as entregas de uma atividade",
    passos: [
      {
        alvo: "learn-atividades",
        rota: "/learn",
        acao: "clicar",
        avancaEm: "a",
        titulo: "Atividade",
        texto: "Clique no título da atividade (ou em Abrir).",
        porque: "A correção é feita na tela da atividade, que reúne as entregas dos alunos.",
        seAusente: "Não há atividades nas suas turmas.",
      },
      {
        alvo: "aba-correcao",
        acao: "clicar",
        titulo: "Aba Correção",
        texto: "Abra a aba Correção.",
        porque: "A aba apresenta cada entrega, com as respostas, os anexos e o formulário de nota.",
        seAusente: "A aba Correção é exibida apenas para quem pode corrigir atividades.",
      },
      {
        alvo: "correcao-entregas",
        acao: "clicar",
        titulo: "Entrega",
        texto: "Selecione a entrega do aluno na lista.",
        porque: "A lista mostra a data de envio e, nas entregas já corrigidas, a nota atribuída.",
        seAusente: "Ainda não há entregas para corrigir.",
      },
      {
        alvo: "correcao-pontos",
        acao: "preencher",
        opcional: true,
        titulo: "Pontuação por questão",
        texto:
          "Informe os pontos de cada questão. As objetivas já chegam pontuadas pela correção automática e podem ser revistas.",
        porque:
          "A nota é calculada pela proporção dos pontos obtidos sobre o total, aplicada à nota máxima.",
      },
      {
        alvo: "correcao-nota",
        acao: "preencher",
        opcional: true,
        titulo: "Nota",
        texto: "Informe a nota da entrega.",
        porque: "Em atividades sem questões, a nota é atribuída diretamente, até a nota máxima.",
      },
      {
        alvo: "correcao-feedback",
        acao: "preencher",
        titulo: "Feedback",
        texto: "Escreva um comentário sobre a entrega.",
        porque: "O feedback é exibido ao aluno junto da nota e orienta a melhoria.",
      },
      {
        alvo: "correcao-salvar",
        acao: "clicar",
        titulo: "Salvar correção",
        texto: "Clique em Salvar correção.",
        porque:
          "A nota fica disponível para o aluno e, quando a atividade compõe a nota da disciplina, é levada ao quadro de notas da turma.",
      },
    ],
  },
  {
    id: "responder-atividade",
    titulo: "Responder uma atividade (aluno)",
    passos: [
      {
        alvo: "aluno-materias",
        rota: "/learn/student",
        acao: "clicar",
        titulo: "Matéria",
        texto: "Clique na matéria da atividade.",
        porque: "As atividades são organizadas por matéria, com o progresso de cada uma.",
        seAusente: "Ainda não há atividades publicadas nas suas turmas.",
      },
      {
        alvo: "aluno-responder",
        acao: "clicar",
        titulo: "Responder",
        texto: "Na aba A fazer, clique em Responder na atividade desejada.",
        porque: "A aba A fazer lista as atividades pendentes, com o prazo de entrega de cada uma.",
        seAusente: "Não há atividades pendentes nesta matéria.",
      },
      {
        alvo: "resposta-questoes",
        acao: "preencher",
        opcional: true,
        titulo: "Questões",
        texto: "Responda cada questão; as obrigatórias precisam de resposta para o envio.",
        porque:
          "As questões objetivas são corrigidas automaticamente no envio; as demais, pelo professor.",
      },
      {
        alvo: "resposta-texto",
        acao: "preencher",
        titulo: "Resposta ou observações",
        texto:
          "Escreva a resposta ou, quando a atividade tiver questões, as observações ao professor.",
        porque: "O texto é entregue ao professor junto com as respostas e os anexos.",
      },
      {
        alvo: "resposta-anexos",
        acao: "observar",
        titulo: "Arquivos",
        texto: "Se a atividade solicitar, anexe os arquivos.",
        porque: "Os anexos complementam a entrega e ficam disponíveis para o professor.",
      },
      {
        alvo: "resposta-enviar",
        acao: "clicar",
        titulo: "Enviar resposta",
        texto: "Clique em Enviar resposta.",
        porque:
          "Após o envio, a atividade passa para Realizadas, onde aparecem a nota e o feedback do professor.",
      },
    ],
  },
  {
    id: "gerar-mensalidades",
    titulo: "Gerar as mensalidades do mês",
    passos: [
      {
        alvo: "mensalidades-gerar",
        rota: "/finance/tuitions",
        acao: "clicar",
        titulo: "Gerar em lote",
        texto: "Clique em Gerar em lote.",
        porque:
          "A geração em lote cria uma mensalidade para cada aluno com matrícula ativa, sem lançamento individual.",
        seAusente: "O botão é exibido apenas para usuários com a permissão de gerar mensalidades.",
      },
      {
        alvo: "lote-competencia",
        acao: "preencher",
        titulo: "Competência",
        texto: "Informe o mês de referência no formato ano-mês, por exemplo 2026-09.",
        porque:
          "A competência identifica o mês cobrado e impede a duplicidade: gerar novamente o mesmo mês e serviço não cria cobranças repetidas.",
      },
      {
        alvo: "lote-vencimento",
        acao: "preencher",
        titulo: "Vencimento",
        texto: "Informe a data de vencimento.",
        porque:
          "A data é aplicada a todas as mensalidades geradas e determina a partir de quando passam a constar como vencidas.",
      },
      {
        alvo: "lote-servico",
        acao: "preencher",
        titulo: "Serviço",
        texto: "Selecione o serviço de mensalidade.",
        porque: "O serviço define o valor de cada mensalidade.",
      },
      {
        alvo: "lote-turma",
        acao: "preencher",
        titulo: "Turma",
        texto: "Opcionalmente, restrinja a geração a uma turma.",
        porque: "Em branco, a geração abrange todos os alunos com matrícula ativa.",
      },
      {
        alvo: "lote-gerar",
        acao: "clicar",
        titulo: "Gerar",
        texto: "Clique em Gerar.",
        porque:
          "O resultado informa quantas mensalidades foram criadas; elas passam a constar da lista e do portal do aluno.",
      },
    ],
  },
  {
    id: "registrar-pagamento",
    titulo: "Registrar o pagamento de uma cobrança",
    passos: [
      {
        alvo: "cobrancas-busca",
        rota: "/finance/charges",
        acao: "preencher",
        titulo: "Busca e filtros",
        texto:
          "Localize a cobrança pelo nome do aluno ou pela descrição; os filtros restringem por tipo e situação.",
        porque: "A busca evita percorrer a lista inteira quando há muitas cobranças.",
      },
      {
        alvo: "cobrancas-lista",
        acao: "clicar",
        avancaEm: "tbody tr",
        titulo: "Cobrança",
        texto: "Clique na cobrança que foi paga.",
        porque: "O detalhe da cobrança apresenta os valores, o vencimento e as ações disponíveis.",
        seAusente: "Nenhuma cobrança corresponde à busca e aos filtros aplicados.",
      },
      {
        alvo: "cobranca-marcar-paga",
        acao: "clicar",
        titulo: "Marcar como paga",
        texto: "Clique em Marcar como paga.",
        porque: "O registro dá baixa na cobrança, que deixa de constar como pendente para o aluno.",
        seAusente:
          "A ação não é exibida em cobranças já pagas ou canceladas, nem para usuários sem a permissão correspondente.",
      },
      {
        alvo: "pagamento-valor",
        acao: "preencher",
        titulo: "Valor pago",
        texto:
          "Informe o valor recebido ou deixe o campo em branco para considerar o total devido.",
        porque: "O valor registrado compõe os relatórios financeiros e o histórico do aluno.",
      },
      {
        alvo: "pagamento-confirmar",
        acao: "clicar",
        titulo: "Confirmar pagamento",
        texto: "Clique em Confirmar pagamento.",
        porque: "A cobrança passa à situação paga, o que é refletido no portal do aluno.",
      },
    ],
  },
  {
    id: "cadastrar-patrimonio",
    titulo: "Cadastrar um item de patrimônio",
    passos: [
      {
        alvo: "patrimonio-categorias",
        rota: "/assets/inventory",
        acao: "clicar",
        titulo: "Categoria",
        texto: "Clique na categoria do item (computadores, telas, impressoras etc.).",
        porque:
          "Os itens são organizados por categoria; o novo item é cadastrado na categoria aberta.",
        seAusente: "Não há categorias cadastradas. Crie uma em Nova categoria.",
      },
      {
        alvo: "patrimonio-novo",
        acao: "clicar",
        titulo: "Novo item",
        texto: "Clique em Novo item.",
        porque:
          "O formulário registra os dados de identificação, localização e responsabilidade do bem.",
        seAusente:
          "O botão é exibido apenas para usuários com a permissão de cadastrar patrimônio.",
      },
      {
        alvo: "item-nome",
        acao: "preencher",
        titulo: "Nome",
        texto: 'Descreva o item, por exemplo: "Notebook Dell Latitude".',
        porque: "O nome identifica o bem nas listagens e nos relatórios.",
      },
      {
        alvo: "item-numero",
        acao: "preencher",
        titulo: "Número de patrimônio",
        texto: "Informe o número da etiqueta de patrimônio.",
        porque: "O número é o identificador único do bem no inventário e nas movimentações.",
      },
      {
        alvo: "item-categoria",
        acao: "preencher",
        titulo: "Categoria",
        texto: "Confirme a categoria do item.",
        porque: "A categoria agrupa itens semelhantes para consulta e controle.",
      },
      {
        alvo: "item-identificacao",
        acao: "preencher",
        titulo: "Marca, modelo e número de série",
        texto: "Informe a marca, o modelo e o número de série, quando houver.",
        porque: "Esses dados identificam o equipamento em garantias, manutenções e auditorias.",
      },
      {
        alvo: "item-responsabilidade",
        acao: "preencher",
        titulo: "Setor e responsável",
        texto: "Selecione o setor vinculado e o usuário responsável pela guarda do item.",
        porque:
          "O setor e o responsável respondem pelo bem; a lista de setores vem do Rooster Hub.",
      },
      {
        alvo: "item-situacao",
        acao: "preencher",
        titulo: "Situação e conservação",
        texto: "Informe a situação de uso e o estado de conservação.",
        porque: "Esses dados apoiam o planejamento de manutenções e substituições.",
      },
      {
        alvo: "item-salvar",
        acao: "clicar",
        titulo: "Cadastrar",
        texto:
          "Clique em Cadastrar para registrar o item. O botão é habilitado quando os campos obrigatórios (*) estão preenchidos.",
        porque:
          "O item passa a constar do inventário da categoria, com o histórico de movimentações.",
      },
    ],
  },
];

const POR_ID = new Map(ROTEIROS_TELA.map((r) => [r.id, r]));

export function roteiroPorId(id: string): RoteiroTela | undefined {
  return POR_ID.get(id);
}
