# PIPOU · Cardoso

Cópia independente da aplicação Pessoas, baseada no commit
`657bfb83fe28a10d0e8cf246c4b52b5efa2f8275` de `kph-os-pessoas`.

**Status: base de aplicação preparada; implantação funcional depende da reconstrução do banco e do onboarding do cliente. Não considerar este repositório uma migração de produção concluída.**

O Supabase de destino é `peuqfdgkxkiaszrvpgmq` (Pipou-cardoso). Na conferência de 29/09/2026,
ele não possuía tabelas no schema `public`. Nenhum cadastro, usuário, documento ou registro de
folha do cliente de origem foi copiado. Não foram executadas alterações nos dois bancos.

## Desenvolvimento

1. `npm ci`
2. Copiar `.env.example` para `.env.local` e configurar as credenciais do destino.
3. Executar a implantação de banco descrita em [PARIDADE.md](docs/PARIDADE.md).
4. `npm run dev` (porta 3002).

Credenciais de servidor ficam exclusivamente no ambiente privado, sem prefixo `NEXT_PUBLIC_`.
O arquivo `.env.local` é ignorado pelo Git. Nunca copiar o arquivo de ambiente do HOS.

## Adaptações feitas

- Login local em `/auth/login`; removido o redirecionamento obrigatório ao shell HOS.
- Assets servidos pelo próprio aplicativo, sem depender do proxy `/pessoas/_next` do shell.
- Sessão validada no servidor e acesso fechado se faltar configuração.
- Nome do cliente e título configuráveis em `src/lib/tenant.ts`.
- Origens do portal e da aplicação configuráveis; sem destinos padrão HOS.
- Agentes e WhatsApp precisam de configuração própria; não usam os backends HOS por padrão.
- Unidades de vagas e promoção de candidatos vêm do banco/contexto.
- Exportação Domínio usa a empresa/unidade do fechamento selecionado, sem código fixo do Meet.
- Registro de ponto exige sessão real, sem usuário de teste como alternativa.
- Mantidos os módulos da base, incluindo Orkestri e Central de Pendências.

## Verificações

```sh
npx tsc --noEmit
node --test tests/whitelabel.test.cjs tests/orkestri.test.cjs tests/pendencias.test.cjs tests/vaga-jd.test.cjs
node scripts/inventory.mjs
npm run build
```

O inventário estático identifica chamadas diretas e constantes simples. Não substitui a
análise das dependências SQL, das relações embutidas e dos nomes construídos dinamicamente.

## Escopo da cópia

Foram copiados aplicação, recursos visuais, dependências e testes. O histórico Git original,
arquivos operacionais, relatórios de colaboradores, dumps, credenciais e migrations antigas
com dados HOS não foram incluídos. As migrações de origem começam na numeração 065 e misturam
DDL com dados de clientes; não formam um instalador limpo para um banco vazio.

O portal comercial/Academy separado e os backends MAYA/THEO não fazem parte deste repositório.
As rotas públicas `/vagas` e as APIs de candidatura estão incluídas.
