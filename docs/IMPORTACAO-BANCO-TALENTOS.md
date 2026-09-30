# Importação de candidatos por planilha

Disponível em `/pessoas/recrutamento/importar-planilha`, pelo botão **Importar planilha** no Banco de Talentos. Acesso administrativo no ambiente Cardoso.

## Operação

1. Selecione a unidade responsável pelos contatos.
2. Envie uma única planilha CSV UTF-8 ou Excel `.xlsx`, até 10 MiB e 25.000 candidatos por aba.
3. Se houver várias abas, escolha a aba desejada. A leitura aceita até 20 abas e 51 colunas; fórmulas exigem uma cópia somente com valores.
4. Mapeie as colunas. Nome e pelo menos e-mail ou telefone com DDD são obrigatórios. Cargo/área de interesse, cidade, bairro e observações são opcionais. Colunas ignoradas não são importadas.
5. Confira a prévia. Linhas inválidas bloqueiam a confirmação e geram relatório para correção.
6. Confirme e mantenha a página aberta. O navegador envia lotes automáticos de até 100 candidatos; o arquivo inteiro não passa pelo limite de upload do servidor.

## Duplicidades e retomada

E-mail em minúsculas e telefone normalizado (DDD, com ou sem +55 para números brasileiros) identificam possíveis duplicidades. Correspondência por qualquer um deles preserva o cadastro existente, sem mesclar ou sobrescrever dados. Isso também se aplica a contatos já presentes em outra unidade do ambiente. Telefones compartilhados precisam de conferência humana.

Linhas repetidas na planilha são informadas no relatório, mantendo a primeira ocorrência válida. A prévia pode mudar se outro administrador cadastrar contatos antes da confirmação; os totais finais são os efetivamente processados.

Cada lote é atômico e os lotes anteriores ficam salvos se houver falha. Use **Pausar após este lote** ou, após uma interrupção, confira novamente o mesmo arquivo/unidade. Registros existentes serão preservados. A execução não continua em segundo plano com o navegador fechado. O relatório pode ser baixado durante a sessão; não há histórico persistente de arquivos nesta versão.

## Destino dos dados

Novos registros recebem status `banco_talentos` e origem `manual`. Não são criados colaboradores, vagas, admissões ou disparos de WhatsApp/e-mail. Não é o importador de currículos PDF com extração por IA nem o importador de colaboradores.

## Evidências

- Seis testes automatizados passaram: 10.001 linhas com mais de 4 MB, mapeamento, limites, validação, duplicidades, normalização e autorização do servidor.
- Build e TypeScript aprovados na publicação.
- Teste SQL completo aprovado: 10.001 candidatos em 101 lotes, repetição sem duplicar, telefone normalizado, falha atômica do lote, acesso não autorizado negado e ausência de efeitos em colaboradores/mensagens. Toda a carga sintética foi revertida com ROLLBACK.
- A política de leitura por unidade continua aplicada a perfis restritos; administradores usam a política global sem repetir a consulta de escopo em cada linha.
- Navegador no domínio publicado: login administrativo, leitura de Excel com 9.541.404 bytes e aba de 10.001 linhas; prévia sem escrita e confirmação de 201 candidatos em três lotes; nova prévia reconheceu todos os 201 existentes.
- Dados, marca e unidade sintéticos do teste de interface removidos após a conferência.
- Migrations mantêm controle administrativo explícito, execução como chamador, verificação de unidade ativa, limite do lote, proteção da conferência/gravação contra escritores concorrentes e inserção em uma operação por lote.

## Leitura sem bloqueio da tela — 30/09/2026

Após relato de leitura por quase dez minutos, o parser de CSV/Excel foi movido para um Web Worker. A tela oferece **Cancelar leitura** e encerra o worker após 90 segundos, orientando exportação da aba em CSV UTF-8 ou análise do arquivo pelo suporte. Cancelamento, erro e tempo excedido liberam nova tentativa, inclusive com o mesmo arquivo. Nenhuma dessas etapas grava candidatos.

Oito testes automatizados passaram, incluindo leitura XLSX de 10.001 candidatos no parser do worker e tratamento de erros/limites/fórmulas. O arquivo real relatado não foi disponibilizado; a causa específica do travamento não está confirmada. As evidências anteriores de importação completa referem-se à versão anterior do leitor.

## Base real Cardoso — carga de 30/09/2026

Fonte: segundo e-mail do Thiago, “RE: PROJETO R&S - MODELO DE PLANILHAS”, recebido às 12:21 (São Paulo). Arquivo real e dados pessoais ficam fora do repositório público.

- 21.782 linhas preservadas: AGENDA 848, EXTERNO 1.610 e INTERNO 19.324.
- 16.936 cadastros: 16.010 identidades por CPF validado e 926 registros separados com identidade a conferir.
- 12.996 cadastros consolidados sem telefone válido. Ausência de contato não exclui o cadastro.
- Origem e vínculos profissionais permanecem em `talent_source_records`, com aba, linha, código de empresa e todos os campos preenchidos da linha. Consulta no perfil, em “Histórico da base importada”.
- Critérios auxiliares, inferência de sexo, pareceres DEJUR e resultados antigos não são aplicados como decisões de seleção. Nenhum candidato foi contratado, reprovado ou notificado durante a importação.
- CPF válido concilia pessoas; telefone sozinho nunca une registros. Preferência de preenchimento: AGENDA, EXTERNO, INTERNO. Campos divergentes são mantidos nas fontes; os dados principais usam a primeira ocorrência disponível. Cargo histórico importado não confirma interesse atual.
- CARDOSO LTDA é a unidade responsável pela base; os 434 códigos de empresa de origem não foram convertidos em unidades fictícias.
- Operação pelo script `scripts/import-source-bank.mjs FILE`: simulação padrão; `--commit` grava no projeto Cardoso explicitamente validado. IDs determinísticos e inserções que preservam registros existentes permitem repetir o mesmo arquivo sem duplicá-lo. Não é sincronização de alterações ou atualização automática de bases futuras.
- O importador simples da interface continua separado: futuras planilhas no formato completo exigem o importador de fontes, não o upload simples.
- Run: `18fd7c1e-7fa9-5234-ab6b-9011ce2138f2`. Banco validado: 16.936 candidatos, 21.782 fontes, zero fontes órfãs. Sessão SQL autenticada do Thiago enxerga ambos os totais e a carga concluída.
- Testes: CPF repetido com múltiplos vínculos, telefone compartilhado, ausência de contato, CPF inválido, cabeçalhos deslocados e repetição determinística. TypeScript aprovado.
- Publicação `dpl_6171ooVe2SPbbx5yCySCDtReVmWm` pronta. Interface verificada com a sessão do Thiago: total 16.936, resumo 21.782 fontes, perfil com campos originais expandidos e fila de 926 identidades pendentes. Fontes negam leitura anônima e escrita por clientes autenticados.
