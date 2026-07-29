# Cérebro do TapGym

Documento de referência do sistema: o que existe, por que existe, e o que mora fora do repositório.

Escrito para quem (pessoa ou agente) chega sem contexto e precisa mexer sem quebrar decisões já tomadas. Não é changelog: o `git log` já conta o que mudou. Aqui está o **porquê**, que é o que se perde.

Última revisão: 2026-07-29.

---

## 1. O produto

App de registro de treino de academia. O usuário monta seus treinos, define quais dias da semana cada um cai, e registra cada série (carga, repetições, qualidade da execução). O app mostra progressão de carga por exercício e volume semanal por grupamento muscular.

Nome do produto: **TapGym**. O repositório se chama `realgains` por razões históricas; `package.json` já diz `tapgym`.

Domínio de produção: **https://www.tapgym.com.br**

**Mobile-first de verdade.** O app (grupo de rotas `(app)`) é desenhado para 430px e usado dentro da academia, entre séries, com o celular na mão e suado. Isso justifica decisões que pareceriam exageradas num app de desktop: alvos de toque grandes, poucos toques por ação, e um atalho de iPhone que registra sem abrir o app.

### Diferencial: o atalho do iOS

O produto tem um atalho (app Atalhos) que registra uma série a partir da tela de início do iPhone, sem abrir o app. É o diferencial anunciado na landing page e a razão de existirem as rotas `/api/hoje` e `/api/registrar`.

**Não existe equivalente no Android.** O app Atalhos é exclusivo do iOS. Isso é uma assimetria real de valor entre plataformas, assumida conscientemente: a copy da LP diz "Atalho no iPhone" no título justamente para não prometer a metade do público algo que ela não pode ter.

---

## 2. Stack

| Camada | Escolha |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind v4, base-ui, shadcn |
| Banco e auth | Supabase (Postgres + GoTrue) |
| Pagamentos | Stripe (assinatura mensal) |
| Rate limit | Upstash Redis |
| E-mail transacional | Resend, via SMTP do Supabase |
| Hospedagem | Vercel |
| Animação | GSAP + ScrollTrigger, three.js (só na LP) |

**Não há suíte de testes.** A verificação é `npm run lint`, `npx tsc --noEmit` e `npm run build`. Qualquer mudança deve passar nos três antes de commit.

> Este projeto usa uma versão do Next com mudanças que podem divergir do que você "lembra". Antes de escrever código de framework, leia o guia relevante em `node_modules/next/dist/docs/`. Exemplo real: `searchParams` é `Promise` e precisa de `await`.

---

## 3. Modelo de acesso e cobrança

Assinatura mensal de **R$ 9,90**. O app inteiro é pago: sem acesso, nada funciona.

### A regra única

Toda decisão de acesso passa por `src/lib/acesso.ts`. Três formas de ter acesso:

```
is_legacy_free = true          → isenção vitalícia
subscription_status = "active" → assinante
trial_ends_at > agora          → teste gratuito vigente
```

**Isso é fonte única de propósito.** A regra já esteve reescrita à mão no middleware e no checkout, e **faltava por completo** nas rotas do atalho. O resultado era um furo: quem cancelava a assinatura perdia as páginas e continuava registrando séries pelo atalho indefinidamente. Quando o teste gratuito foi adicionado depois, ele passou a valer nos quatro pontos com uma linha, porque a regra tinha virado um lugar só.

Ao mexer em acesso, mexa em `acesso.ts`. Se precisar de uma coluna nova, adicione em `COLUNAS_ACESSO` e todos os `select` acompanham.

### `temAcesso` não é a mesma pergunta que `naoPrecisaAssinar`

São duas perguntas diferentes e confundi-las já causou bug:

| Função | Pergunta | Trial conta? |
|---|---|---|
| `temAcesso` | pode usar o app? | **sim** |
| `naoPrecisaAssinar` | o checkout é desnecessário? | **não** |

A rota de checkout usa a segunda. Ela existe para não criar uma segunda assinatura em quem já paga, mas quando o teste gratuito entrou no `temAcesso`, esse guarda herdou o significado novo e passou a barrar **quem estava em teste e queria pagar antes do prazo**: o POST era devolvido para o `/dashboard` em silêncio.

Regra prática: gate de acesso usa `temAcesso`; qualquer coisa relacionada a cobrar usa `naoPrecisaAssinar`.

### Os três estados, e de onde vêm

| Estado | Origem |
|---|---|
| `is_legacy_free` | Migração `0008` isentou todas as contas que existiam naquele momento. Contas novas nascem `false`. É uma promessa feita a quem testou o beta, e deve ser respeitada. |
| `subscription_status` | Escrito pelo webhook do Stripe. `active` na conclusão do checkout, e depois o status real do Stripe (`past_due`, `unpaid`, `canceled`). |
| `trial_ends_at` | Migração `0012`. O trigger `handle_new_user` preenche com `now() + 7 dias` em contas novas. Contas antigas ficam `null`. |

### Teste gratuito de 7 dias

Sem cartão. O cadastro entra direto no app; o paywall só aparece quando o prazo vence.

Existe porque o cadastro caía direto no `/assinar`: a primeira tela depois de criar a conta era um preço, sem a pessoa nunca ter visto o produto funcionando com os dados dela.

**O contador é obrigatório, não enfeite.** Um teste que vence em silêncio é a mesma agressividade, só adiada: no oitavo dia o app tranca sem aviso. Por isso `TrialAviso` fica no topo do Dashboard (uma linha, sem card, para não competir com o treino do dia) e escala para cor de alerta nos dois últimos dias. A AccountSheet também mostra os dias restantes.

**Quem está em teste tem que poder assinar de dentro do app**, e há dois caminhos: o "Assinar" do `TrialAviso` e o "Assinar agora" na AccountSheet. Os dois postam direto para o checkout.

Isso não é conveniência, é desbloqueio. Durante o teste `temAcesso` é `true`, então o middleware manda quem está logado de volta da `/` para o `/dashboard`: **a pessoa não consegue nem chegar na landing page para clicar em Assinar**. Sair da conta também não resolve, porque depois do login ela é devolvida ao `/dashboard`. Sem botão dentro do app, alguém decidido a pagar simplesmente não tinha por onde.

**Limitação conhecida e aceita:** dá para repetir o teste criando outra conta, e com login Google isso é trivial. Não existe defesa boa sem exigir cartão, o que reintroduziria a parede que o teste veio remover.

---

## 4. Rotas e por que cada uma renderiza como renderiza

```
/                    ƒ  landing page
/login               ƒ  entrar e cadastrar
/assinar             ƒ  paywall
/dashboard           ○  \
/registro            ○   |  grupo (app), atrás do gate
/treino              ○   |
/exercicios          ○   |
/exercicio/[id]      ƒ  /
```

As dinâmicas (`ƒ`) são dinâmicas por motivo específico, não por acidente:

- **`/`** lê a sessão. Precisa saber se há usuário logado para trocar "Entrar"/"Criar conta" por "Assinar"/"Sair da conta" e mandar os CTAs direto ao checkout. Custou a renderização estática da página de marketing, e foi decisão consciente.
- **`/login`** lê `?modo=criar` no server. Feito assim em vez de `useSearchParams` para não precisar de Suspense em volta do formulário.
- **`/assinar`** lê o perfil para distinguir quem terminou o teste de quem nunca teve um.

### Middleware (`src/lib/supabase/middleware.ts`)

Roda antes de toda rota. Ordem das decisões:

1. Sem usuário e fora de `/` ou `/login` → manda para `/login`.
2. Com usuário: busca o perfil e calcula acesso.
3. **Com** acesso, em `/`, `/login` ou `/assinar` → manda para `/dashboard`.
4. **Sem** acesso, fora de `/` ou `/assinar` → manda para `/assinar`.

**A `/` é liberada de propósito para quem está logado sem assinatura.** É a saída do paywall que não custa a sessão. Antes ela também caía no `/assinar`, e o único jeito de sair daquela tela era deslogar: quem tinha acabado de criar a conta era obrigado a entrar de novo. Não feche esse buraco sem substituir a saída.

**Redirecionar preservando cookies.** `redirectPreservingSession()` existe porque `getUser()` pode renovar o cookie de sessão, e uma `NextResponse.redirect` nova descarta essa renovação. Sem isso o usuário cai deslogado sem aviso na navegação seguinte.

---

## 5. Fluxos de entrada

### Do zero até pagar

```
LP  →  /login?modo=criar  →  cadastro  →  /dashboard (7 dias)  →  /assinar  →  Stripe
```

Os CTAs da LP levam ao cadastro com o modo certo. Antes apontavam para `/login`, que abria no modo "entrar", e o cadastro ficava escondido atrás de um toggle de texto cinza.

**Logado, os CTAs vão direto ao Stripe.** Um `<form method="POST">` para `/api/stripe/checkout`, sem passar pelo `/assinar`. Antes era "Assinar" → tela → "Assinar": a mesma palavra duas vezes para uma ação, com o preço já visível na LP.

O `/assinar` continua existindo e é necessário: é o destino do gate no middleware e o `cancel_url` do Stripe. A LP só não passa mais por ele.

### Google OAuth

Um provider cobre entrar e cadastrar: se o e-mail é novo, a conta é criada. **Vincula à conta existente** quando o e-mail já está cadastrado e confirmado (testado em produção).

O `/auth/callback` não precisou de nenhuma mudança para suportar OAuth: ele já trocava `code` por sessão e redirecionava. Ele também valida o `next` contra open redirect.

Quem entra pelo Google **não tem senha**. Se depois tentar "Entrar" com e-mail e senha, recebe "E-mail ou senha inválidos". Não há recuperação de senha implementada, então hoje essa pessoa não tem como criar uma. É dívida conhecida (seção 10).

### Preço

`src/lib/pricing.ts` é a fonte de apresentação (valor, período, benefícios), consumida pela LP e pelo `/assinar`. **A autoridade da cobrança é o `STRIPE_PRICE_ID`.** São duas fontes que precisam ser mantidas em sincronia à mão: mudar o preço no Stripe sem editar esse arquivo faz a LP mentir.

---

## 6. Stripe

| Rota | O que faz |
|---|---|
| `POST /api/stripe/checkout` | Cria a sessão e faz 303 para o Stripe. Se o usuário já tem acesso, devolve para `/dashboard` em vez de criar uma segunda assinatura. |
| `POST /api/stripe/portal` | Abre o portal de gerenciamento. Sem `stripe_customer_id`, redireciona para `/assinar`. |
| `POST /api/stripe/webhook` | Escreve `subscription_status` em `profiles`. |

Eventos tratados: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.

`success_url` é `/dashboard`, `cancel_url` é `/assinar`.

**"Gerenciar assinatura" na AccountSheet só aparece com `stripe_customer_id`.** Antes aparecia para todos, e para quem é `is_legacy_free` o toque não produzia nada visível: a rota redirecionava para `/assinar` e o middleware devolvia para `/dashboard`.

---

## 7. O atalho do iOS

### Contrato da API

Duas rotas, autenticadas por `profiles.api_token` (não por sessão). Usam a service role key, então **não passam por RLS nem pelo middleware**: toda checagem é explícita no código da rota.

**As duas respondem sempre HTTP 200.** Erro vai no corpo, nunca no status. O porquê está em "Erro no corpo, não no status" abaixo.

```
GET /api/hoje?token=...
  { ok: true,  treino_nome, exercicios: [{ id, nome, num_series, rep_min, rep_max, ultima_carga }] }
  { ok: false, code: 401, error: "Token inválido" }
  { ok: false, code: 402, error: "Assinatura inativa, reative no app" }
  { ok: false, code: 404, error: "Nenhum treino configurado" | "Hoje é dia de descanso" }
  { ok: false, code: 429, error: "Muitas requisições, tente novamente em instantes" }
  { ok: false, code: 500, error: "Erro no servidor, tente novamente" }

POST /api/registrar
  body { token, exercicio_id, carga, reps, qualidade }   qualidade: boa | razoavel | ruim
  { ok: true }
  { ok: false, code: 400, error: "Campos obrigatórios: Token, Exercício, Carga > 0, ..." }
  { ok: false, code: 404, error: "Exercício não encontrado" }
  { ok: false, code: 500, error: "Não deu para salvar a série, tente novamente" }
  401 / 402 / 429 como acima
```

**`error` é texto de interface, não código de erro.** O Atalhos mostra o valor cru num alerta, então a redação é frase com maiúscula inicial, e o 400 nomeia campos e valores como o usuário os vê no atalho, não como o JSON os manda: "Repetições", não `reps`; "Boa, Razoável ou Ruim", não `boa | razoavel | ruim`. Os valores que a API aceita de fato são os do bloco acima, e não mudaram. Reescrever essas frases é seguro e não quebra atalho instalado, porque o atalho só exibe o valor, nunca compara com texto. O que **não** pode mudar são os nomes dos campos do JSON, de entrada e de saída.

O formato vive em `src/lib/atalho.ts`: `sucesso()`, `falha()` e `rotaAtalho()`. **Use as três em qualquer rota nova do atalho**, em vez de montar `NextResponse.json` à mão.

**Essa API precisa ser estável para sempre.** Não existe atualização automática de atalho: nada no servidor consegue alterar um atalho já instalado. Cada quebra de compatibilidade obriga toda a base a reinstalar e reconfigurar o token na mão. Nunca renomeie os caminhos nem os campos; sempre aceite o formato antigo.

**Sempre chame com `www.`.** O apex `tapgym.com.br` responde `308 Permanent Redirect` para `www.tapgym.com.br`, e esse redirecionamento acontece na camada de domínio, **antes** de qualquer invocação de função. O Atalhos não segue o 308 num POST: a requisição fica pendurada e não aparece log nenhum, porque a função nunca é chamada. Já custou uma sessão de investigação, com o sintoma enganoso de "o POST não funciona" quando o GET, que apontava para o www, funcionava normalmente.

Se algum dia o diagnóstico for "requisição do atalho não chega e não há log", confira o `www` antes de qualquer outra coisa. O redirect apex para www é mantido de propósito, para ter host canônico e não duplicar a LP para buscadores.

`/api/registrar` também verifica que o `exercicio_id` pertence ao dono do token. Como a rota usa service role, **é essa checagem, não o banco**, que impede um token válido de gravar série no exercício de outra pessoa.

### O token

Coluna `profiles.api_token`, com default no banco (`encode(gen_random_bytes(24), 'hex')`).

Vale acesso pago desde que o paywall entrou nessas rotas. Três defesas:

1. **Paywall.** `temAcesso` é checado nas duas rotas. Sem isso, cancelar a assinatura tirava as páginas mas deixava o atalho funcionando para sempre.
2. **Rate limit duplo.** Uma cota por IP e outra pelo token, 20 requisições por minuto cada. Só a de IP não servia: cinco pessoas com o mesmo token em cinco redes ganhavam cinco cotas independentes.
3. **Rotação.** `POST /api/token/rotate` gera um token novo. Precisou de rota porque o schema faz `revoke update on profiles from authenticated` e devolve só `grant update (nome)`: o cliente não pode escrever nessa coluna.

**O que não dá para defender:** depois de instalado, qualquer pessoa abre o atalho no app Atalhos e lê todas as ações, incluindo URLs e formato do payload. Não existe atalho ofuscado. Assinar requisições não resolve, porque a chave de assinatura moraria dentro do atalho. Um assinante escrever o próprio cliente não custa receita (ele paga); o que custa é **compartilhar o token**, e é isso que as três defesas acima limitam.

### Distribuição

O atalho é distribuído por link do iCloud, lido de `NEXT_PUBLIC_SHORTCUT_URL` em `src/components/layout/shortcut-dialog.tsx`.

**Link do iCloud é imutável por versão.** Editar o atalho gera um link novo, e o antigo continua servindo a versão velha para sempre. Ao editar o atalho, troque a variável (local **e** na Vercel) e faça deploy, senão os usuários seguem instalando a versão antiga.

**Está em env var para não ficar no repositório, que é público.** Não confunda com segredo: o prefixo `NEXT_PUBLIC` é obrigatório porque o diálogo é client component, e o link é servido ao browser de qualquer forma. Tem que ser: o botão "Instalar atalho" existe justamente para entregar esse link ao usuário. Sigilo aqui não é uma defesa que este projeto tenha, e nem poderia ser (ver "O que não dá para defender").

Sem a variável, o botão do diálogo aparece desabilitado como "Atalho indisponível". É deliberado: um `href=""` recarregaria o app e a pessoa não teria como entender o que falhou.

### Onboarding

Dois lugares, dois papéis:

- **Descoberta:** `AtalhoCard`, no topo do Dashboard. Só aparece com treino já cadastrado (sem treino com semana definida o atalho não acha o treino de hoje), só em iOS, e some para sempre quando dispensado. O "para sempre" é por dispositivo via `localStorage`, o que casa com a instalação do atalho ser por dispositivo. Na **primeira** visita o `ShortcutDialog` abre sozinho (`tapgym-atalho-modal-visto`); fechar o modal não dispensa o card — só "Depois" grava `tapgym-atalho-dispensado`.
- **Procedimento:** `ShortcutDialog`, com o token dentro e botão de copiar. Antes o passo 2 mandava fechar o diálogo, abrir a AccountSheet pelo avatar, copiar e voltar, no meio de um procedimento que já trocava de app três vezes.

Contas novas já nascem com treino seed (Peito seg/qui, Perna ter/sex) no `handle_new_user` — migração `0015` — para o dashboard e o atalho não dependerem de montar tudo no trial. É exemplo editável, não plano imposto.

O ícone de raio no header e o card ficam escondidos fora do iOS (`src/lib/use-ios.ts`).

### As instruções do app e o comportamento do atalho têm que concordar

O passo 3 do `ShortcutDialog` diz **"Cole o token onde o atalho pedir"**. Isso só é verdade se o atalho realmente pedir. Se o token estiver num campo de texto que o dono editou à mão, a instrução é falsa para todo mundo que não seja ele: a pessoa instala, nada é perguntado, e ela não descobre onde colar.

O mecanismo correto é **Import Questions** do Atalhos (no editor: `Setup` → `Add New Question` → escolher o parâmetro → `Question Text`). Ele pergunta **uma vez**, na importação, e grava a resposta dentro do próprio atalho. O resultado é igual a ter editado o campo à mão, sem o usuário abrir o editor.

Não confundir com a ação **"Pedir Entrada"** (*Ask for Input*), que roda a cada execução e não guarda nada. Um atalho usado entre séries não pode pedir token toda vez.

Também foi cogitado guardar o token num arquivo do iCloud Drive (`Obter Arquivo` / `Salvar Arquivo`) e **descartado**: resolve o mesmo problema com mais peças e com dois modos de falha documentados, a sincronização lenta entre dispositivos e o iCloud descarregando o arquivo do aparelho.

### Rotação de token invalida o atalho instalado

Como o token fica gravado dentro do atalho, usar "Gerar novo token" na AccountSheet faz o atalho já instalado parar de registrar.

O conserto mais limpo é **reinstalar pelo link**, porque a Import Question é feita de novo e pede o token novo. Mandar a pessoa caçar o campo no editor é o caminho ruim.

A confirmação da rotação hoje diz "Você vai precisar colar o novo no atalho do iPhone", que é verdade mas não diz como. Trocar por algo que mande reinstalar pelo link está em aberto.

### Erro no corpo, não no status

O "Obter Conteúdo de URL" do Atalhos **não expõe o status HTTP** em nenhuma variável do fluxo. Ele lê o corpo normalmente, mas não tem como ramificar em 401 / 402 / 404 / 429, então toda mensagem de erro chegava ao usuário como alerta genérico do sistema, mesmo com um `error` descritivo no corpo. Um 402 de assinatura vencida, que é a mensagem que mais precisa chegar, era o pior caso.

Daí o contrato de sempre 200. O raciocínio: uma API consumida por um cliente que não sabe ramificar em status code não deveria sinalizar erro por status code.

Três consequências que não são óbvias:

- **O atalho ramifica pelo campo `error` ("tem algum valor"), não pelo `ok`.** Booleano de JSON vira 1/0 no Atalhos e a comparação é instável entre versões do iOS; "tem algum valor" é a condição confiável do app. `ok` e `code` seguem no contrato para log e para qualquer cliente futuro.
- **Exceção também precisa virar 200.** É o que o `rotaAtalho()` faz. Sem ele, Supabase fora do ar ou env faltando devolve 500 com corpo HTML, sem campo nenhum, e o alerta genérico volta justamente no cenário de erro mais provável.
- **Sempre 200 apaga a taxa de erro dos painéis da Vercel**, que só enxergam status. O `falha()` compensa com `console.error` / `console.warn` e o header `X-Error-Code`. Se algum dia o diagnóstico for "as rotas do atalho não dão erro nenhum", é isto: procure nos logs, não no status.

Falta o teste de aceitação no dispositivo: numa conta de teste, `subscription_status = 'canceled'` e `is_legacy_free = false`, rodar o atalho e confirmar que aparece a frase "assinatura inativa, reative no app", e não erro genérico. Depois reverta.

### Onde o atalho está (27/07/2026)

Servidor pronto: as duas rotas já respondem sempre 200 no formato acima. No atalho, `www` no GET e Import Questions para o token estão feitos, e a ramificação de erro nas duas chamadas está em andamento.

Falta, nesta ordem:

1. **Terminar a ramificação de erro** no atalho (`Obter Valor do Dicionário: error` → `Se tem algum valor` → alerta → parar).
2. **Trocar `NEXT_PUBLIC_SHORTCUT_URL`** pelo link novo do iCloud, local e na Vercel, e fazer deploy.
3. **Rodar o teste de aceitação** acima.

Ao editar o atalho, o link do iCloud muda e a variável precisa acompanhar. Só pegue o link **depois** da última edição: cada salvamento gera link novo, e publicar um link intermediário distribui uma versão incompleta para sempre.

---

## 8. Supabase

### Schema

`supabase/schema.sql` é o baseline para um projeto novo. `supabase/migrations/` tem o histórico incremental (`0002` a `0015`). **Os dois precisam ser mantidos em sincronia à mão.**

Tabelas: `exercicios`, `treinos`, `treino_exercicios`, `series`, `profiles`.

`series` não guarda `user_id`: a posse vem por `exercicio_id → exercicios.user_id`.

**Atenção ao versionamento:** o `.gitignore` tem `supabase/**/*.sql`, mas as migrações recentes estão versionadas porque foram adicionadas com `git add -f`. Uma migração nova **não aparece no `git status`** e precisa ser forçada, senão não entra no commit.

### O trigger de signup

`handle_new_user()` cria o `profiles` e preenche:

- `nome`: `coalesce(nome, full_name, name)` do metadata. O `nome` vem do nosso formulário; `full_name`/`name` vêm do Google. Sem esse coalesce, quem entra pelo Google fica sem nome e o Dashboard sauda pelo prefixo do e-mail.
- `trial_ends_at`: `now() + 7 dias`.
- Seed de treino (migração `0015`): Peito (seg/qui) e Perna (ter/sex) com exercícios exemplo, para o trial não começar no empty state.

### RLS

Ligada em todas as tabelas, com posse por `auth.uid()`. Em `profiles`, o usuário lê o próprio registro e só pode escrever a coluna `nome`.

---

## 9. Configuração fora do repositório

**Esta seção é a mais importante do documento.** Boa parte do comportamento do sistema mora em painéis, não em código, e foi origem de duas quebras em produção.

### Supabase

| Onde | Valor correto | Por quê |
|---|---|---|
| Authentication → Sign In / Providers → **Email** | `Enable email provider` **ligado** | Desligar esse toggle mata login e cadastro por senha. Já aconteceu, por confusão com o toggle de confirmação, e o sintoma foi "Email logins are disabled" em inglês na tela. |
| Authentication → Emails → **Confirm sign up** | **desligado** | Com ele ligado, o cadastro depende de entrega de e-mail funcionar. Uma falha de SMTP derruba o cadastro inteiro. Já aconteceu, e o erro chegava à tela como `{}`. |
| Authentication → Sign In / Providers → **Google** | habilitado, com Client ID e Secret | |
| Authentication → **URL Configuration** → Site URL | `https://www.tapgym.com.br` | Se estiver errado, o Supabase descarta o `redirectTo` fora da allowlist e cai na **raiz** do Site URL. Já aconteceu: o login do Google voltava para `http://localhost:3000/?code=...` e nenhuma sessão era criada. |
| Authentication → URL Configuration → **Redirect URLs** | `https://www.tapgym.com.br/**` e `http://localhost:3000/**` | O segundo é para desenvolvimento. |
| Authentication → **SMTP** | host `smtp.resend.com`, porta 465, usuário literalmente `resend`, senha = API key do Resend, remetente `@tapgym.com.br` | O serviço de e-mail embutido do Supabase é limitado a poucos e-mails por hora e não serve para produção. |

Como rede de segurança para o caso do Site URL, a LP reencaminha `?code=` para `/auth/callback`. Isso cobre o `code` que chega no host certo e no caminho errado, mas **não** substitui a configuração correta.

### Google Cloud Console

- OAuth client tipo **Web application**.
- **Authorized redirect URI** é o callback do **Supabase**, não o do app: `https://<project-ref>.supabase.co/auth/v1/callback`. É o campo que mais gera erro.
- Escopos: `openid`, `userinfo.email`, `userinfo.profile`. Todos não sensíveis, o que dispensa verificação manual do Google.
- Publishing status: **In production**. Em `Testing`, só e-mails na lista de testers entram e o refresh token expira em 7 dias.
- **Não suba logo** na consent screen: upload de logo dispara brand verification, o único processo lento que sobra nesse caminho.

### Resend

- Domínio `tapgym.com.br` verificado (DKIM em `resend._domainkey`, SPF em `send` como MX e TXT, DMARC em `_dmarc`).
- A API key usada no SMTP é do tipo **sending-only**, que é o privilégio mínimo correto.
- Ao rotacionar a chave, atualize em **dois** lugares: o campo de senha do SMTP no Supabase e a variável na Vercel. Só a Vercel faz os e-mails pararem de sair, e o sintoma parece problema de domínio.

### Vercel

Variáveis em produção: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_*` (4), `KV_*` / `REDIS_URL` (5), `RESEND_API_KEY`, `NEXT_PUBLIC_SHORTCUT_URL`.

**`vercel env pull` sobrescreve o `.env.local`.** Variável que existe só localmente e não na Vercel é apagada no próximo pull. Já aconteceu duas vezes neste projeto.

`RESEND_API_KEY` não é lida por nenhum código hoje: os e-mails de auth saem do Supabase, não do app. Ela está lá para quando o TapGym enviar e-mail próprio.

---

## 10. Convenções de UI

- **Dark-only.** `src/lib/theme.tsx` força a classe `dark` antes da hidratação. O tema claro em `:root` é código morto, mantido só como fallback. Ao avaliar contraste, use os valores do `.dark`.
- **Soft UI / neumorfismo.** Superfícies usam `shadow-soft-elevated` / `-subtle` / `-pressed` em vez de borda. Use o componente `SoftCard`.
- **`svh`, nunca `dvh`.** A altura dinâmica recalcula quando a barra do Safari some na rolagem, o que deixava vão no topo e cortava o nav embaixo.
- **Safe area.** `viewportFit: "cover"` faz a página ocupar a área da Dynamic Island. Todo elemento fixo no topo ou no fundo precisa do `env(safe-area-inset-*)`.
- **Zoom liberado.** Não voltar com `maximumScale: 1` (WCAG 1.4.4). Os inputs usam 16px, que é o que evita o auto-zoom do iOS ao focar um campo.
- **Alvos de toque de 44px.** Os defaults do componente `Button` são menores que isso; sempre passar `h-11` ou mais em contexto tocável.
- **Ícones do lucide.** Não usar glifos de texto (`←`, `−`, `+`) como ícone. Ainda há resquícios disso no `AppHeader` e no `CargaCard`.
- **Sem travessão.** Nenhum `—` em texto visível ao usuário. Usar ponto, vírgula ou dois-pontos. Comentários de código são exceção.
- **Ações destrutivas** ficam em cor semântica, separadas da ação primária, e com confirmação em dois toques dentro do próprio desenho do app. Não usar `window.confirm`.

---

## 11. Dívidas conhecidas

Levantadas em revisão de UX e ainda abertas:

**Acessibilidade**
- `globals.css` tem `input:focus { outline: none }` global, sem substituto. Os `Button` mantêm anel de foco; os inputs não.
- `text-muted-foreground/70` rende 3.55:1 e `/60` rende 2.67:1 sobre o fundo escuro. Abaixo do mínimo (4.5:1 para texto, 3:1 para elementos de UI).
- `RepsCard` tem um `<span role="button">` dentro de um `<button>`. Gambiarra para fugir do HTML inválido; o problema de teclado e leitor de tela continua.
- `ToastPill` não tem `role="status"` nem `aria-live`, então "Série salva" nunca é anunciada. Dura 1.8s, abaixo dos 3 a 5s recomendados.

**Produto**
- **Não há recuperação de senha nem magic link.** Quem esquece a senha, ou entrou pelo Google e nunca teve uma, não tem caminho de volta. Com o SMTP já configurado, `signInWithOtp` resolveria os dois casos com pouco código.
- O gráfico de `/exercicio/[id]` esconde os dois eixos Y, que têm escalas diferentes. As duas linhas não são comparáveis e não há como ler um valor sem acertar o toque num ponto.
- Cinco telas usam "Carregando..." centralizado em vez de skeleton.
- Tocar na aba Dashboard força `window.location` (reload completo, perde scroll e estado). Deliberado, para garantir dados frescos, mas é a aba mais usada.
- LP: `.rg-stage` tem 400vh de hero 3D usando `100vh`, justamente o `vh` que o app evita em todo lugar.

---

## 12. Decisões que valem preservar

Coisas que parecem candidatas óbvias a "simplificar" e não são:

- **`/assinar` não é redundante com o card de preço da LP.** São o mesmo preço em dois momentos: um convence o anônimo, o outro cobra de quem já decidiu. Redirecionar `/assinar` para a LP quebraria o destino do gate no middleware e o `cancel_url` do Stripe, e despejaria quem acabou de se cadastrar no topo de um hero 3D de quatro telas.
- **A LP liberada para logado sem assinatura** é a saída do paywall que não custa a sessão. Ver seção 4.
- **O hero mobile não é o hero desktop.** No celular o palco 3D não roda: a cena foi calibrada para proporção larga. O primeiro painel é hero de tela cheia e estático; os outros três ficam num bloco compacto com foco ao rolar, via GSAP, sem `filter` animado (borrar texto o torna ilegível para quem para de rolar no meio).
- **`is_legacy_free` é uma promessa.** Foi feita a quem testou o beta. Não zere a coluna.
- **O modelo é "tudo pago".** Foi cogitado deixar o app grátis e cobrar só pelo atalho. Descartado: o atalho é exclusivo de iOS, então a receita passaria a vir só de donos de iPhone e o público Android não teria o que comprar. O teste de 7 dias resolveu a agressividade do paywall sem essa consequência.

---

## 13. Privacidade (LGPD mínima)

O produto trata dados pessoais (conta, treino, cobrança via Stripe). Documentação viva:

| O quê | Onde |
|---|---|
| Política pública | `/privacidade` ← `content/legal/privacidade.md` |
| Termos públicos | `/termos` ← `content/legal/termos.md` |
| Mapa de dados (interno) | `docs/lgpd/mapa-dados.md` |
| Plano de incidente (interno) | `docs/lgpd/incidente.md` |
| Spec | `docs/superpowers/specs/2026-07-29-lgpd-minima-lancamento-design.md` |

Exclusão self-serve: AccountSheet → Excluir conta → `POST /api/conta/excluir`. Contato único (produto e privacidade): `contatotapgym@gmail.com`. Controlador descrito como pessoa física responsável pelo TapGym até haver empresa formal.

Middleware libera `/privacidade` e `/termos` para anônimo e para logado sem assinatura (além da LP e do `/assinar`).

---

## 14. Como verificar

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Os três precisam passar. Não rode `npm run build` com o dev server de pé: os dois disputam o `.next`.

Migrações são aplicadas à mão no SQL editor do Supabase ou via `supabase db push`. **Rode a migração antes do deploy** quando o código novo depende de coluna nova, senão o `select` falha em produção.
