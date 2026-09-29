# Plano de paridade — 29/09/2026

## Evidência conferida

- Origem do código: `kph-os-pessoas@657bfb8`, incluindo a aba Orkestri publicada.
- Repositório local original contém alterações não commitadas. Não foram incorporadas
  silenciosamente, pois não representam necessariamente a versão publicada. Devem ser
  comparadas e aprovadas por escopo numa etapa própria.
- Banco de origem compartilhado: 458 tabelas públicas, 286 funções públicas e 879 políticas.
  Estes números abrangem outros produtos além do PIPOU.
- Destino `peuqfdgkxkiaszrvpgmq`: projeto ativo, sem tabelas públicas na consulta.
- Aplicação: 75 tabelas referenciadas estaticamente, 18 RPCs, 4 buckets e 92 arquivos de
  rota/página. Todas as 75 relações e 18 funções existem na origem.
- Dependências diretas adicionais por FK: `groups`, `roles`, `payroll_dominio_empresa`,
  `payroll_rubricas` e `auth.users`. Expandir recursivamente e analisar corpos SQL antes
  de fechar a lista de objetos a migrar.
- Storage: `candidate-cvs`, `employee-docs` e `employee-documents` existem e são privados.
  O código também referencia `ponto-fotos`, ausente no inventário da origem, e tenta criá-lo
  como público no primeiro uso. A origem possui `punch-photos` privado. Uniformizar esse
  contrato e adaptar a leitura para URLs assinadas antes de habilitar fotos de ponto.

## Sequência de implantação

| Etapa | Entrega necessária | Critério de aceite |
|---|---|---|
| 1. Baseline de banco | Extrair somente estrutura: tabelas, tipos/enums, sequences, defaults, índices, FKs, views, funções, triggers, grants e RLS do grafo de dependências de Pessoas | Aplicação em banco vazio sem importar dados HOS; nenhuma relação/função faltante |
| 2. Regras SQL | Revisar funções e políticas com UUIDs, códigos de empresa, usuários ou domínios fixos; incluir tabelas chamadas por RPCs | Nenhuma regra ou permissão ligada ao cliente de origem |
| 3. Seeds de produto | Cargos/grupos, papéis de acesso, tipos documentais, rubricas, templates e demais catálogos reutilizáveis, separados de dados operacionais | Seeds idempotentes, revisados e sem nomes, documentos ou vínculos do HOS |
| 4. Onboarding Cardoso | Grupo, marcas, casas, código Domínio por empresa, primeiro administrador e permissões | Administrador entra, vê apenas as casas Cardoso e consegue cadastrar colaborador |
| 5. Auth | Site URL, redirects, SMTP, convites e recuperação de senha próprios | Login, logout, convite e redefinição testados no domínio final |
| 6. Storage | Buckets, limites/tipos, políticas e caminhos próprios | Upload e download autorizado; outro perfil não consegue acessar documento privado |
| 7. Folha/ponto | Matrículas Domínio, calendários, jornadas, rubricas, importação Ahgora, RPCs e fechamento | Arquivo de teste conciliado com resultado esperado; sem códigos de empresa de origem |
| 8. Integrações | MAYA/THEO, Twilio, Anthropic e Google OAuth/Calendar/Drive com contas do novo cliente | Erro explícito quando não configurado; dados enviados somente aos destinos Cardoso |
| 9. Portal | Copiar e configurar projeto comercial/Academy separado, autenticação, cursos, candidatura e CORS | Candidatura chega ao pipeline correto; cursos/comercial testados no portal próprio |
| 10. Deploy | Projeto de hospedagem separado, variáveis privadas, domínio e callbacks | Build passa; navegação e assets funcionam sem shell HOS |
| 11. Homologação | Fluxos de RH completos com dados sintéticos | Evidências por fluxo, perfil e unidade; liberar operação apenas após aceite |

## Fluxos obrigatórios na homologação

- Autenticação e autorização: administrador, gerente de casa e colaborador; isolamento entre unidades.
- Colaboradores: cadastro, edição, documentos, admissão e desligamento com data/motivo.
- Recrutamento: JD → vaga → candidatura → pipeline → admissão; SLA e motivo estruturado.
- Ponto: registro, ajustes, importação em lote, faltas, extras, banco de horas e relatório.
- Folha: gorjetas, holerites, fechamento, pendências e exportação Domínio.
- DHO: clima, avaliações, treinamento, onboarding e PDI.
- Central de Pendências: agrupamento, preenchimento em lote e atualização da fila.
- Orkestri: casas autorizadas, períodos, indicadores, evidências e acesso às rotinas.
- Agentes: conversas, status, envio, callbacks e tratamento de integração indisponível.

## Pontos herdados que não equivalem a funcionalidades prontas

- A Orkestri atual documenta lacunas em custo/faturamento, experiência, engajamento e eNPS.
  Copiar a aplicação preserva essas limitações; não cria integrações novas.
- Há ações legadas usando service role. A proteção de sessão não substitui a revisão de
  autorização por papel/unidade dessas ações antes da abertura ao cliente.
- `get_punches_by_unit` usa um UUID sentinela de visão consolidada. Preservar o contrato da
  RPC ou substituí-lo conjuntamente na função e no aplicativo; não criar uma casa HOS.
- A recuperação de senha era fornecida pelo shell. No clone o link só aparece quando
  `NEXT_PUBLIC_RECOVERY_URL` for configurada; implementar/validar o fluxo próprio na etapa Auth.
- Recuperar também configurações de Auth, Realtime, extensões e jobs efetivamente usados;
  estes recursos não são reproduzidos apenas pela cópia dos arquivos TypeScript.

## Dados que ainda precisamos do cliente

Unidades iniciais, administrador, domínio, identidade visual final (mantida PIPOU por enquanto),
códigos de empresas e matrículas da folha, jornadas e fornecedores/contas das integrações.

## Autenticação das chaves no destino

A chave de servidor respondeu HTTP 200 no endpoint REST de metadados. A chave pública
inicial retornou `Invalid API key`; foi configurada localmente a chave publishable ativa
obtida da API de gestão do próprio projeto. Ela respondeu HTTP 200 em `/auth/v1/settings`
e chegou ao REST de `units`, que retornou `PGRST205` (tabela ainda não criada).
O endpoint raiz de metadados REST exige chave secreta; não usá-lo para testar acesso público.
A chave de servidor nunca é alternativa no navegador. Nenhuma chave é versionada.

## Fora desta entrega

Não executamos migration no destino, cópia de registros, criação de usuários, envio de mensagens,
ativação de agentes, publicação de site ou fechamento/exportação real de folha. O repositório
é a base isolada para implantação, não um ambiente operacional homologado.

### Atualização — provisionamento inicial de acesso

Após a entrega da base, foi aplicada a migration `cardoso_auth_foundation` no destino:
`groups`, `brands`, `units`, `roles`, `user_roles`, FKs, índices, RLS e grants de leitura.
O grupo Cardoso e o papel global `founder` foram cadastrados. Dois usuários solicitados
foram criados via API administrativa de Auth, confirmados e vinculados a esse papel.
Credenciais, e-mails e UUIDs das contas não são incluídos no repositório público.

As tabelas de permissões não permitem escrita ao papel `authenticated`; cada usuário
lê seus próprios vínculos, sem poder conceder acesso a si mesmo. O papel global é
reconhecido pelo aplicativo como administração completa do ambiente Cardoso.

Essa etapa não cria casas fictícias nem implanta os módulos operacionais. As próximas
migrations devem considerar as cinco tabelas já existentes, preservar os usuários e
conceder ao papel global a cobertura adequada nas políticas dos módulos implantados.

## Validação da base entregue

- `npm ci --ignore-scripts --no-audit --no-fund`: concluído.
- `npx tsc --noEmit --incremental`: passou.
- Testes Orkestri, Pendências, JD e white label: 34 passaram.
- `npm run build`: passou, incluindo geração de páginas e checagem TypeScript.
- Servidor de produção local: `/auth/login` respondeu 200 com título `PIPOU · Cardoso`;
  `/pessoas` sem sessão redirecionou para o login local; API privada respondeu 401.
- Varredura dos arquivos versionados: nenhuma credencial JWT/publishable/secret encontrada.
- 142 arquivos estáticos gerados para o navegador conferidos: chave de servidor ausente.
- Supabase público: autenticação respondeu 200; consulta da tabela `units` retornou
  `PGRST205`, confirmando que a implantação do schema continua pendente.

Esses testes validam a base de código e o login público. Não validam ainda os fluxos completos
com usuários e dados Cardoso, pois o banco funcional e o onboarding não foram implantados.
