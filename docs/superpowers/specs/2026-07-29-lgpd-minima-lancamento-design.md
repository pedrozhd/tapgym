# LGPD mínima para lançamento público — Design

Data: 2026-07-29  
Status: implementado; contato público `contatotapgym@gmail.com`
Artigo de referência: [LGPD para SaaS e microSaaS (TOGETHER)](https://togetherprivacy.tech/blog/lgpd-para-saas-e-microsaas-cuidados-antes-de-lancar-app)

## Objetivo

Deixar o TapGym em condições mínimas de privacidade para abrir ao público:
documentos coerentes com o produto, canal de contato, exclusão de conta
self-serve, mapa interno de dados e plano mínimo de incidente. Não é
adequação jurídica completa nem substitui revisão de advogado/DPO.

## Fora de escopo (fase 2)

- Exportação / portabilidade self-serve
- Banner de cookies (hoje só cookies essenciais de sessão Auth; reavaliar se
  entrar analytics/pixel)
- DPO as a Service / contratação de consultoria
- Correções de segurança da auditoria (confirmação de e-mail, filtro
  `/api/hoje`, idempotência Stripe, etc.) — **dependência paralela**, não
  misturar nesta entrega; listadas em “Dependências”
- Texto jurídico “à prova de ANPD” redigido por IA como versão final

## Decisões

1. **Escopo = mínimo do gap analysis**, não o checklist inteiro do artigo.
2. **Papel LGPD:** TapGym é **controlador** dos dados dos próprios usuários
   (B2C). Não é operador de base de “clientes dos clientes”.
3. **Documentos no produto:** páginas públicas `/privacidade` e `/termos`,
   em português, no visual da LP (dark, tipografia Satoshi), conteúdo em
   Markdown versionado no repo (`content/legal/*.md`), renderizado no app.
4. **Autoria do texto:** o time redige um **rascunho fiel à arquitetura
   real** (fornecedores, finalidades, retenção). Placeholders explícitos
   para razão social, CNPJ e e-mail de contato. Disclaimer no rodapé do
   doc interno: revisão jurídica antes de tratar como definitivo.
5. **Contato de privacidade:** `privacidade@tapgym.com.br` (ou o endereço
   que o fundador confirmar na implementação). Aparece na política, no
   footer da LP e no fluxo de exclusão. Criar a caixa no DNS/Resend ou
   encaminhar para o e-mail pessoal — fora do código, checklist de ops.
6. **Exclusão de conta:** self-serve na AccountSheet, confirmação em dois
   toques (padrão do app, sem `window.confirm`), depois `POST
   /api/conta/excluir` que: cancela assinatura Stripe se houver, apaga o
   usuário no Auth (cascade no Postgres) e encerra a sessão. Sem “pedido
   por e-mail” como único caminho.
7. **Exportação:** fora. Quem pedir por e-mail recebe resposta manual na
   fase 1 (prazo interno documentado no mapa).
8. **Mapa de dados e plano de incidente:** docs internos em
   `docs/lgpd/`, não páginas públicas.
9. **Depoimentos mockados:** na mesma entrega, marcar a seção como
   ilustrativa **ou** remover handles/fotos que fingem ser reais — decisão
   de copy na implementação; default = eyebrow/descrição deixando claro
   que são exemplos até haver depoimentos autorizados.

## Arquitetura

```
Público (sem login)
  /privacidade     ← content/legal/privacidade.md
  /termos          ← content/legal/termos.md
  footer LP + login + /assinar → links

Logado
  AccountSheet → "Excluir conta" → confirmação → POST /api/conta/excluir
       → Stripe cancel (se customer/sub)
       → supabaseAdmin.auth.admin.deleteUser(id)
       → signOut + redirect /

Interno (repo)
  docs/lgpd/mapa-dados.md
  docs/lgpd/incidente.md
  docs/CEREBRO.md  ← ponte curta apontando esses docs
```

### Middleware

Hoje tudo que não é `/`, `/login*` ou (com regras) `/assinar` exige sessão
ou cai no paywall. Incluir rotas legais na allowlist anônima **e** na
allowlist de logado sem acesso:

```
isLegalRoute = pathname === "/privacidade" || pathname === "/termos"
```

- Anônimo: pode abrir legal (além de `/` e `/login`).
- Logado sem acesso: pode abrir legal (além de `/`, `/assinar`).
- Logado com acesso: pode abrir legal (não redirecionar para `/dashboard`).

### Páginas legais

- Server Components: conteúdo em `content/legal/privacidade.md` e
  `termos.md`, lido com `fs` no server.
- Renderização **sem dependência nova**: parser mínimo no próprio app
  (headings `#`/`##`, parágrafos, listas `- `, links `[t](u)`) — o volume
  do texto é pequeno e previsível. Se o parser mínimo ficar frágil demais
  na implementação, cair para seções em TSX no mesmo PR; não adicionar
  MDX/toolchain.
- Layout compartilhado leve (`src/app/(legal)/layout.tsx`): marca TapGym,
  link “Voltar”, sem shell do app. Largura `max-w-3xl` (página de
  marketing, não o `max-w-[430px]` do app).
- Tipografia alinhada à LP (Satoshi, dark, `text-muted-foreground` no
  corpo).

### Exclusão de conta — fluxo detalhado

1. Usuário abre AccountSheet → seção perigo → "Excluir conta".
2. Primeiro toque: revela confirmação ("Apaga treinos, histórico e a conta.
   Não tem volta.").
3. Segundo toque: chama `POST /api/conta/excluir` (cookie de sessão).
4. Rota (service role + sessão válida):
   - Sem user → 401.
   - Lê `profiles` (`stripe_customer_id`, `stripe_subscription_id`,
     `is_legacy_free`).
   - Se `stripe_subscription_id`:
     `subscriptions.cancel(id, { invoice_now: false, prorate: true })`
     (ou equivalente atual da API Stripe do projeto). Falha Stripe não
     bloqueia exclusão do Auth se a sub já estiver cancelada; logar erro.
   - `auth.admin.deleteUser(user.id)` — depende de **ON DELETE CASCADE**
     (ou triggers) de `profiles` e tabelas de treino para o `auth.users`.
     Verificar nas migrações; se faltar cascade, a rota apaga na ordem
     correta (séries → … → profile → user) antes do deleteUser.
   - Resposta 200 `{ ok: true }`.
5. Client: `signOut`, `router.replace("/")`, fechar sheet.

**Legacy free / trial:** exclusão apaga igual. Não há retenção especial.

**Stripe Customer:** cancelar a subscription basta para parar cobrança; o
objeto Customer pode permanecer na Stripe (dado de cobrança sob
controladoria Stripe). Mencionar isso na política.

### Conteúdo mínimo da política de privacidade

Deve responder, em linguagem clara:

- Quem é o controlador (placeholder razão social / CNPJ / país)
- Quais dados: conta (e-mail, nome, auth Google), treino (exercícios,
  cargas, reps, qualidade, dias), cobrança (via Stripe: não armazenamos
  cartão), token do atalho, logs técnicos de provedores
- Finalidades + bases legais sugeridas (execução de contrato / legítimo
  interesse onde couber — rascunho; jurídico valida)
- Fornecedores: Supabase, Vercel, Stripe, Google (OAuth), Resend, Upstash;
  transferência internacional possível
- Retenção: enquanto a conta existir; após exclusão, remoção dos dados de
  app; obrigações legais de cobrança podem permanecer na Stripe
- Direitos: acesso, correção (nome no app), exclusão (self-serve),
  informação; canal `privacidade@…`
- Cookies: sessão Auth essenciais; sem analytics no momento
- Sem uso de dados para treinar IA de terceiros pelo TapGym
- Como reportar incidente / contato

### Conteúdo mínimo dos termos de uso

- O que é o TapGym; conta pessoal; idade mínima (ex.: 18+, ou responsável)
- Assinatura R$ 9,90/mês, trial 7 dias, legacy free, cancelamento via
  portal Stripe / exclusão de conta
- Uso aceitável; propriedade do conteúdo do usuário; IP do produto
- Limitação de responsabilidade razoável para microSaaS
- Atalho iOS como diferencial, sem garantia de disponibilidade eterna
- Foro / lei brasileira (placeholder cidade)
- Link cruzado para a política

## Modelo de dados / migrações

Nenhuma coluna nova prevista. Pode ser necessário ajustar FKs para
`ON DELETE CASCADE` a partir de `auth.users` / `profiles.id` — auditar
migrações existentes na Task de exclusão.

## Mapa de dados (`docs/lgpd/mapa-dados.md`)

Tabela por linha de tratamento, no espírito do registro simplificado da
ANPD para agentes de pequeno porte:

| Dado | Etapa | Finalidade | Base (rascunho) | Onde | Quem acessa | Fornecedor | Retenção | Como titular age |
|---|---|---|---|---|---|---|---|---|

Preencher com a realidade do código (cadastro, Google, treino, atalho,
Stripe webhook, e-mail Resend/SMTP).

## Plano de incidente (`docs/lgpd/incidente.md`)

Checklist operacional curto:

1. Quem é acionado (fundador / e-mail privacidade)
2. Conter (rotacionar keys, revogar sessões, desligar provider)
3. Registrar o que vazou e quais titulares
4. Decidir comunicação ANPD/titulares (prazo de referência: até 3 dias
   úteis quando aplicável — citar regra, sem parecer jurídico)
5. Pós-mortem e rotação de segredos

## UI

- Footer LP: links “Privacidade” e “Termos” ao lado do ©
- `/login` e `/assinar`: mesma linha discreta
- AccountSheet: bloco destrutivo no rodapé do sheet (após Sair), copy
  clara, dois toques, estado de loading/erro
- Depoimentos: copy ilustrativa (sem parecer review real de @handles)

## Dependências (não bloqueiam o merge desta spec, bloqueiam “abrir ads”)

Da auditoria / Cérebro, tratar em trilhas separadas antes de tráfego pago:

- Confirmação de e-mail ou desligar auto-link Google (pré-sequestro)
- Filtro de posse em `/api/hoje` + RLS
- Hardening Stripe webhook / checkout
- Recuperação de senha (dívida já listada no Cérebro)

## Verificação

- `npm run lint`, `npx tsc --noEmit`, `npm run build`
- Anônimo abre `/privacidade` e `/termos` sem redirect para login
- Logado sem assinatura abre as mesmas rotas sem cair só em `/assinar`
- Exclusão: conta some do Auth, linhas de treino somem, sub Stripe
  cancela, redirect `/` deslogado
- Links do footer e do login funcionam
- Docs `docs/lgpd/*` existem e Cérebro aponta para eles

## Riscos e notas

- Texto gerado/rascunhado **não** é parecer jurídico. Lançar com o
  rascunho + placeholders preenchidos é melhor que zero documento; ainda
  assim, revisão humana/jurídica é recomendada antes de escala.
- `deleteUser` é irreversível; a UI precisa ser explícita.
- Se o cascade estiver incompleto, exclusão parcial deixa lixo no banco —
  a Task de exclusão começa pela auditoria de FKs.
- Criar a caixa `privacidade@` é passo de ops; sem ela o link `mailto:`
  falha na prática.

## Ordem sugerida de implementação (para o plan seguinte)

1. Allowlist no middleware + esqueleto das páginas legais
2. Conteúdo `privacidade.md` / `termos.md` + links footer/login/assinar
3. Auditoria cascade + `POST /api/conta/excluir` + UI AccountSheet
4. `docs/lgpd/mapa-dados.md` + `docs/lgpd/incidente.md` + ponte no Cérebro
5. Ajuste de copy dos depoimentos
6. Checklist ops: e-mail privacidade, CNPJ/razão social nos placeholders
