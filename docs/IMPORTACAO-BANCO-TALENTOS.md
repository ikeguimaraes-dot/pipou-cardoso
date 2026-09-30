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
