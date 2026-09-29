# Validação técnica — Cardoso — 29/09/2026

## Evidências executadas

- 63 testes de desligamento, white label/autorização, preenchimento em lote, Orkestri, pendências e JD passaram. Os seis testes adicionais de importação inicial passaram, incluindo prévia sem escrita, confirmação atômica, CPF, datas, permissões e colisão concorrente.
- TypeScript e build de produção verificados na implantação.
- `cardoso_people_core.sql`: dois administradores; leitura/escrita; trigger; constraints; anônimo/sem papel bloqueados; autoelevação de papel bloqueada.
- `cardoso_operational_flows.sql`: todas as tabelas legíveis para admin; vaga com substituição por promoção; candidato → colaborador; avaliações, clima, treinamento; normalização do ponto; desligamento atômico/repetido; RPCs de consulta; exclusão de colaborador sem dependências reverte vínculo do candidato.
- `cardoso_scope.sql`: leitura restrita a unidade permitida; documentos isolados; escrita, onboarding e usuário sem papel bloqueados.
- `cardoso_payroll.sql`: onboarding, coleta, lançamento manual, TXT com 43 caracteres, divergência de empresa rejeitada, ajuste de ponto e recoleta de período fechado rejeitada.
- Todos os testes SQL usam transação com ROLLBACK. As rubricas sintéticas de exportação não permanecem configuradas.
- Login administrativo real no navegador: dashboard, Orkestri, pendências, vagas e configuração carregados sem erros JavaScript.
- Recuperação: conta temporária, link de recuperação, formulário de nova senha, encerramento de sessão e login com nova senha validados; conta removida. Não foi enviado e-mail no teste.
- Storage: upload de PDF com sessão administrativa, leitura assinada, acesso público negado e remoção do objeto.
- Advisor de segurança Supabase sem alertas após ativar proteção contra senhas vazadas.

## Repetir verificações locais

```sh
node --test tests/employee-termination.test.cjs tests/whitelabel.test.cjs tests/bulk.test.cjs tests/orkestri.test.cjs tests/pendencias.test.cjs tests/vaga-jd.test.cjs tests/initial-import.test.cjs
npx tsc --noEmit --incremental
node scripts/inventory.mjs
npm run build
```

Executar os arquivos de `supabase/tests` em conexão administrativa com o destino, mantendo BEGIN/ROLLBACK. Não versionar chaves ou resultados com dados pessoais.

## Limites da evidência

Os testes cobrem os fluxos descritos, não todos os módulos herdados. Não comprovam entrega SMTP, funcionamento de integrações ainda sem configuração, correção de bases ainda não recebidas ou homologação operacional pelo cliente. Perfis restritos ainda não estão liberados na aplicação.
