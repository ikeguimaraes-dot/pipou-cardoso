# Implantação Cardoso — 29/09/2026

Aplicação independente publicada em https://pipou-cardoso.vercel.app.
Repositório: https://github.com/ikeguimaraes-dot/pipou-cardoso.

## Entrega técnica

- Oito migrations aplicadas: autenticação, núcleo RH, demais dependências operacionais, storage, catálogos, leitura por unidade, onboarding e correções de runtime.
- 83 tabelas públicas e uma view; dependências de 77 referências diretas de tabelas e 21 RPCs do aplicativo contempladas. O inventário também inclui 98 arquivos de rota/página.
- Quatro buckets privados, com limites de tamanho, tipos permitidos e acesso administrativo. Documentos usam URLs assinadas; fotos de ponto guardam caminho privado, sem URL pública.
- 62 definições genéricas de rubricas e quatro grupos de cargo. Rubricas sem códigos Domínio do cliente e com exportação desativada até mapeamento.
- Configuração de marcas/unidades em `/pessoas/configuracao`, sem semear casas do cliente de origem.
- Importação inicial de colaboradores em `/pessoas/importacao-inicial`: CSV, até 200 ativos por lote, unidade obrigatória, CPF válido/único, datas conferidas, prévia e confirmação; inserção única e sem sobrescrever registros.
- Importação de pendências existente preservada para completar cadastros; não substitui a carga histórica de ponto/folha.
- Desligamento em transação: histórico e status/data do colaborador gravados juntos; repetição rejeitada.
- Correções herdadas: reversão do candidato antes de excluir colaborador, bloqueio de recoleta de folha fechada/aprovada, vínculo colaborador/unidade validado nos lançamentos e aprovação de ponto com ator/status conferidos.
- Login e recuperação próprios; callback do domínio final, cadastro público de contas desativado e proteção contra senhas vazadas ativada.
- Candidatura pública exige vaga aberta e unidade correspondente. Arquivos limitados a PDF/Word, até 10 MB.

## Acesso nesta etapa

Os dois administradores solicitados têm acesso ao ambiente. Rotas privadas e Server Actions exigem sessão válida e administração; inclusive Actions encaminhadas por páginas públicas.

Políticas de leitura de RH por unidade foram testadas no banco, mas a aplicação continua restrita aos administradores. Abertura a gestores restritos/colaboradores exige revisão adicional das ações legadas com service role e testes de escrita por perfil. Não foi concedido acesso geral a esses perfis.

Nenhum registro operacional, documento, vínculo ou código de folha HOS foi copiado. Uma unidade já existente no destino foi preservada. Dados sintéticos dos testes SQL são revertidos com ROLLBACK.

## Sprints e dependências

| Sprint | Estado | Próximo aceite |
|---|---|---|
| 0 — Fundação | Concluída | Repositório, Auth e hospedagem independentes |
| 1 — Banco e segurança | Base administrativa entregue | Revisar ações por papel antes de liberar usuários restritos |
| 2 — Cadastros e importação | Ferramentas prontas | Receber unidades/base, conciliar carga e validar com cliente |
| 3 — RH e recrutamento | Fluxos principais testados tecnicamente | Homologar regras, JD, pipeline e documentos reais |
| 4 — Ponto e folha | Estrutura/RPCs testadas com dados sintéticos | Receber históricos, jornadas, matrículas e mapas de rubricas; conciliar totais |
| 5 — Dashboard e Orkestri | Telas disponíveis | Conferir indicadores com períodos e dados reais; integrações faltantes continuam explícitas |
| 6 — Publicação e homologação | Site publicado para administradores | SMTP próprio, validação do cliente e liberação dos perfis adicionais |

## O que depende de informação externa

1. Unidades/empresas, CNPJs e base de colaboradores com CPF, cargo, admissão e salários; histórico de desligados em arquivo separado.
2. Histórico de ponto/folha, período desejado, jornadas, códigos de empresa e matrículas Domínio, rubricas e critérios de conciliação.
3. Servidor de e-mail da organização. Fluxo de troca de senha testado; entrega por e-mail ao cliente não homologada e sem SMTP próprio.
4. Credenciais e contratação das integrações externas desejadas; agentes, WhatsApp e Google continuam sem ativação automática.
5. Responsável pelo aceite, usuários por perfil e identidade/domínio finais se diferentes dos atuais.

## Limites conhecidos

- Portal comercial/Academy separado e backends MAYA/THEO exigem projetos próprios; vagas públicas estão incluídas.
- Indicadores herdados sem fonte de faturamento, experiência ou pesquisa não são preenchidos artificialmente.
- Fotos de ponto são privadas; uma nova interface de visualização assinada não foi adicionada nesta etapa.
- Trigger de auditoria de unidades da origem não foi transplantado: depende de módulo compartilhado externo ao PIPOU. Implementar auditoria própria antes de exigir trilha completa dessas alterações.
- Limite de requisições da candidatura é local à instância; proteção distribuída é uma melhoria futura.
- CSV inicial destina-se a novos ativos. Salário omitido é zero e requer revisão; desligados e históricos precisam dos respectivos fluxos/mapeamentos.

Consulte [VALIDACAO-IMPLANTACAO.md](VALIDACAO-IMPLANTACAO.md) para evidências. Arquivos reais do cliente não são necessários para continuar testes técnicos, mas são necessários para conciliação e homologação operacional.
