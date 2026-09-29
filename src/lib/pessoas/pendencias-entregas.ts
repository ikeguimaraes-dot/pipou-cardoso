/** Reviewed delivery register. Update after evidence of a release or operational validation.
 * This is not a live monitor and must never include employee records or exploit details.
 */
export const ENTREGAS_REVIEWED_AT = "2026-09-22";

export const ENTREGA_STATUS = {
  bloqueado: "Bloqueado", aberto: "Em aberto", validar: "A validar", planejado: "Melhoria prevista",
} as const;

export type PendenciaEntrega = {
  id: string;
  area: "Plataforma" | "Portal" | "Integração";
  priority: "urgente" | "alta" | "normal";
  status: keyof typeof ENTREGA_STATUS;
  title: string;
  owner: string;
  detail: string;
  nextStep: string;
  doneWhen: string;
};

export const PENDENCIAS_ENTREGAS: readonly PendenciaEntrega[] = [
  {
    id: "permissoes-rh", area: "Plataforma", priority: "urgente", status: "aberto",
    title: "Revisar permissões das rotinas administrativas",
    owner: "Time de desenvolvimento",
    detail: "A auditoria identificou verificações de acesso incompletas em rotinas de folha, faltas, horas extras e gorjetas.",
    nextStep: "Corrigir as permissões por função e unidade e validar os cenários de acesso.",
    doneWhen: "As operações permitirem apenas usuários e unidades autorizados, com testes aprovados.",
  },
  {
    id: "holerites-acesso", area: "Plataforma", priority: "alta", status: "aberto",
    title: "Migrar os PDFs de holerite para acesso temporário",
    owner: "Time de desenvolvimento",
    detail: "O gateway agora verifica identidade, perfil e unidade antes de liberar o PDF. Falta substituir os endereços permanentes por arquivos privados com acesso temporário.",
    nextStep: "Mapear os arquivos, migrar para armazenamento privado e substituir os links permanentes por acesso temporário.",
    doneWhen: "Os arquivos exigirem acesso autorizado e os links temporários expirarem, incluindo a revisão dos endereços antigos.",
  },
  {
    id: "identidade-portal", area: "Portal", priority: "alta", status: "bloqueado",
    title: "Publicar a mesma identidade PIPOU no portal",
    owner: "Administração do Netlify + Desenvolvimento",
    detail: "Logo original, cores e Raleway já estão alinhados no código e testados em desktop e celular. A plataforma está publicada; o portal no Netlify ainda aguarda publicação.",
    nextStep: "Disponibilizar acesso ao projeto portal-pipou-academy no Netlify para publicar o pacote pronto.",
    doneWhen: "O endereço público do portal exibir a mesma identidade da plataforma, conferida em desktop e celular.",
  },
  {
    id: "cursos-matricula", area: "Portal", priority: "alta", status: "aberto",
    title: "Separar a inscrição em cursos da candidatura a vagas",
    owner: "Produto + Desenvolvimento",
    detail: "Os botões de inscrição do curso no portal levam à página de vagas. A página apresenta a grade, mas não oferece um caminho próprio de matrícula e acesso às aulas.",
    nextStep: "Definir e implementar matrícula, confirmação, área do aluno e acompanhamento do curso.",
    doneWhen: "Uma pessoa conseguir se matricular no curso e acessar as aulas pelo caminho correto.",
  },
  {
    id: "maya-sincronizacao", area: "Integração", priority: "alta", status: "aberto",
    title: "Corrigir a sincronização de candidatos da Maya",
    owner: "Time de desenvolvimento",
    detail: "A sincronização ainda usa uma regra de identificação diferente da estrutura atual de candidaturas.",
    nextStep: "Alinhar a identificação por pessoa e vaga e tratar os candidatos que ainda não têm vaga vinculada.",
    doneWhen: "Sincronizações repetidas importarem os candidatos sem falhas ou duplicações.",
  },
  {
    id: "faltas-score", area: "Plataforma", priority: "alta", status: "aberto",
    title: "Alinhar o registro de faltas ao score",
    owner: "Desenvolvimento + RH / DP",
    detail: "Existem diferenças nos tipos de falta e no registro do impacto no histórico de score.",
    nextStep: "Unificar a classificação e o cálculo, conferir os registros anteriores e validar com o RH.",
    doneWhen: "O tipo de falta, o impacto exibido e o histórico de score estiverem consistentes.",
  },
  {
    id: "candidatura-curriculo", area: "Portal", priority: "alta", status: "aberto",
    title: "Validar a candidatura e o envio de currículo",
    owner: "Desenvolvimento + Recrutamento",
    detail: "O limite de arquivo anunciado precisa corresponder ao limite aceito. O envio também precisa conferir se a vaga continua aberta e pertence à unidade correta.",
    nextStep: "Ajustar validações e mensagens de erro e testar o cadastro completo, incluindo anexos.",
    doneWhen: "Candidaturas válidas chegarem ao recrutamento e problemas de envio tiverem orientação clara.",
  },
  {
    id: "portal-comercial", area: "Portal", priority: "normal", status: "aberto",
    title: "Completar a apresentação e contratação da plataforma",
    owner: "Produto + Comercial + Desenvolvimento",
    detail: "A página pública inspecionada apresenta o curso. Ainda falta o caminho para conhecer e contratar a plataforma PIPOU.",
    nextStep: "Definir a oferta, apresentar a plataforma e implementar o contato comercial ou contratação.",
    doneWhen: "Uma empresa conseguir entender a oferta e iniciar a contratação pelo portal.",
  },
  {
    id: "autenticacao-integracoes", area: "Plataforma", priority: "alta", status: "aberto",
    title: "Revisar sessões e permissões das integrações",
    owner: "Time de desenvolvimento",
    detail: "A auditoria deixou pontos de autenticação, saída da conta, conexão com Google e perfis de liderança para correção e validação.",
    nextStep: "Revisar esses fluxos e confirmar que cada perfil mantém apenas o acesso previsto.",
    doneWhen: "Entrada, saída e integrações passarem nos testes de sessão e autorização dos perfis envolvidos.",
  },
  {
    id: "qualidade-dependencias", area: "Plataforma", priority: "normal", status: "aberto",
    title: "Tratar as demais pendências de qualidade da auditoria",
    owner: "Time de desenvolvimento",
    detail: "Ainda precisam de revisão as dependências com alertas, os filtros de período, as mensagens de falha de consulta e a cobertura de verificações automáticas.",
    nextStep: "Revalidar os alertas, priorizar as correções e ampliar os testes dos fluxos afetados.",
    doneWhen: "Os alertas confirmados estiverem corrigidos ou avaliados e os fluxos alterados tiverem validação registrada.",
  },
  {
    id: "central-validacao", area: "Plataforma", priority: "alta", status: "validar",
    title: "Validar a Central de Pendências com Day e equipe",
    owner: "Day e equipe + Desenvolvimento",
    detail: "A central está publicada e foi testada com dados de teste. Falta a validação autenticada da rotina pela equipe em produção.",
    nextStep: "Conferir uma unidade, completar um cadastro, revisar documentos e validar as rotinas da competência escolhida.",
    doneWhen: "A equipe confirmar acesso correto, salvamento e atualização das pendências reais.",
  },
  {
    id: "central-distribuicao", area: "Plataforma", priority: "normal", status: "planejado",
    title: "Distribuir pendências por pessoa, prazo e comentários",
    owner: "Produto + Day e equipe + Desenvolvimento",
    detail: "Hoje a central indica a equipe de referência e permite exportar a fila. Ainda não possui atribuição individual, prazo ou histórico de comentários.",
    nextStep: "Definir a rotina de distribuição com Day e implementar o acompanhamento compartilhado.",
    doneWhen: "As pessoas responsáveis conseguirem acompanhar suas tarefas, prazos e comentários na plataforma.",
  },
  {
    id: "orkestri-dados", area: "Integração", priority: "normal", status: "validar",
    title: "Validar os dados de Pessoas apresentados no Orkestri",
    owner: "Desenvolvimento + Gestão",
    detail: "O Orkestri deve interpretar a operação e mostrar os destaques para a liderança. A cobertura e a atualização das fontes ainda precisam ser auditadas.",
    nextStep: "Conferir indicadores usando a mesma unidade, período e origem e validar as prioridades com a gestão.",
    doneWhen: "Cada indicador executivo puder ser conferido na fonte e os filtros explicarem eventuais diferenças.",
  },
];

export const ENTREGAS_PUBLICADAS = [
  "Importação em massa de cadastros por CPF e unidade, com prévia, validação e resultado por linha.",
  "Entrada destacada para Pendências do RH e evoluções na página Pessoas.",
  "Indicadores limitados à unidade selecionada; falhas de consulta aparecem como indisponíveis.",
  "ASOs conferidos pela validade do documento mais recente de cada colaborador ativo.",
  "Gateway de holerites com identidade verificada, escopo por unidade e resposta sem cache.",
  "Identidade PIPOU aplicada à plataforma e ao login.",
  "Menu lateral da área Pessoas dedicado às rotinas de pessoas.",
  "Central com cadastro, documentos, ponto, holerites, gorjetas e exportação da fila.",
] as const;
