# Implantação Cardoso — 29/09/2026

## Resultado desta etapa

Aplicada no Supabase Cardoso a migration `cardoso_people_core`, versionada em
`supabase/migrations/20260929000200_cardoso_people_core.sql`.

- Cinco tabelas operacionais: colaboradores, dependentes, documentos, desligamentos e logs de importação.
- 113 colunas e 23 constraints preservadas do catálogo de origem, incluindo tipos, defaults e vínculos.
- Índices de consulta e de chaves estrangeiras; removida apenas a duplicação do índice único de CPF.
- Trigger de sincronização do nível do colaborador com seu papel.
- RLS e grants explícitos: acesso operacional aos administradores globais; demais perfis ainda bloqueados.
- Nenhum dado de cliente copiado. A origem foi consultada somente para ler metadados.

O destino agora possui dez tabelas públicas, incluindo as cinco da fundação de autenticação.
Os dois vínculos administrativos existentes foram preservados. Não há unidades, marcas,
colaboradores, documentos, desligamentos, dependentes ou logs de importação cadastrados.

## Validação executada

`supabase/tests/cardoso_people_core.sql` foi executado no destino em uma transação com ROLLBACK:

- Primeiro administrador: criação, leitura e atualização de registros.
- Segundo administrador: leitura dos mesmos registros e atualização de documento.
- Trigger de nível e rejeição de tipo documental inválido.
- Usuário sem papel: nenhuma linha visível, inserção bloqueada e atualização sem efeito.
- Tentativa de conceder papel a si mesmo: bloqueada.
- Anônimo: leitura bloqueada nas cinco tabelas.
- Exclusão de colaborador: bloqueada até implantação do recrutamento e seu trigger de reversão.
- Após o rollback: consultas confirmaram zero registros de teste e os dois vínculos administrativos intactos.

O teste usa os papéis PostgreSQL e claims de sessão; não equivale a homologação pela interface.
O advisor não apontou problemas de RLS ou de funções; reportou proteção contra senhas vazadas
desabilitada em Auth. Revisar na etapa de autenticação:
https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Sprints e critérios

| Sprint | Estado | Entrega / aceite |
|---|---|---|
| 0 — Fundação | Concluída | Repositório independente, ambiente e dois logins testados |
| 1 — Banco e permissões | Em andamento | Primeiro bloco aplicado; completar dependências, funções, triggers, storage e permissões por unidade |
| 2 — Cadastros e importação | Pendente | Unidades e base recebidas; prévia da carga e conciliação aprovada pelo cliente |
| 3 — RH e recrutamento | Pendente | JD, vaga, pipeline, admissão, desligamento e pendências validados de ponta a ponta |
| 4 — Ponto, folha e histórico | Pendente | Exportações recebidas e totais conciliados com a origem |
| 5 — Dashboard e Orkestri | Pendente | Indicadores com período/origem, dados conferidos e ausência de dados explícita |
| 6 — Homologação e publicação | Pendente | URL própria, recuperação de senha, perfis e fluxos aprovados |

## Próximo bloco técnico

1. Completar schema de recrutamento e seus catálogos; implantar o trigger que reverte o candidato ao excluir colaborador, antes de habilitar DELETE de colaboradores.
2. Expandir grafo das RPCs e dependências indiretas dos demais módulos.
3. Implantar armazenamento privado e revisar ações que usam service role (RLS não protege essas chamadas).
4. Testar isolamento por unidade e perfis de gestão/colaborador antes de concedê-los.
5. Implantar o restante dos módulos, Auth e hospedagem próprios, com validação pela interface.

As cinco tabelas são uma entrega de infraestrutura, não cinco módulos homologados.
Documentos ainda precisam de storage. Desligamento ainda usa duas operações na aplicação;
avaliar transação/RPC para garantir atomicidade antes da homologação operacional.
Não foi publicado um site nesta etapa. Integrações externas seguem desabilitadas até configuração própria.

## Dados aguardados

Unidades/empresas e CNPJs, base de colaboradores, intervalo histórico, sistemas fornecedores,
arquivos de exportação, demais usuários e responsável pela validação. Prioridade:
unidades + colaboradores + intervalo de histórico. Essas pendências não impedem continuar o schema.

Portal comercial/Academy e backends externos dos agentes exigem implantação específica.
Credenciais e dados pessoais não devem ser incluídos neste repositório público.
