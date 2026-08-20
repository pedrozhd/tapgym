# TapGym

App de registro de treino. O usuário monta a ficha, escolhe os dias da semana e anota cada série (carga, reps, qualidade). O app mostra progressão de carga e volume por grupamento.

Produção: [www.tapgym.com.br](https://www.tapgym.com.br)

O repositório se chama `realgains` por história; o produto é **TapGym**.

## Atalho do iOS (Shortcuts)

O diferencial é um atalho do app **Atalhos** que registra a série pela tela de início do iPhone, **sem abrir o app**. Não existe equivalente no Android: o Atalhos é só iOS.

Na prática: o usuário toca o atalho, escolhe o exercício do treino de hoje, informa carga / reps / qualidade, e a série cai no histórico. Se no Registro tiver uma variação escolhida para o dia (ex.: *Stiff · com halter*), o menu do atalho já mostra esse nome e a última carga daquela variação. Não precisa reinstalar.

### Como o usuário instala

No iPhone, com treino já cadastrado, o Dashboard mostra o convite. O diálogo pede para:

1. Copiar o token de acesso
2. Instalar o atalho pelo link do iCloud
3. Colar o token **quando o atalho perguntar** (Import Question, uma vez só)

O link de instalação vem de `NEXT_PUBLIC_SHORTCUT_URL`. Sem essa variável, o botão aparece como “Atalho indisponível”. Editar o atalho no app Atalhos gera um **link novo**; o antigo continua servindo a versão velha para sempre. Troque a env (local e na Vercel) e faça deploy.

Gerar um token novo na conta invalida o atalho já instalado. O caminho certo é reinstalar pelo link, para a pergunta do token rodar de novo.

### Como o atalho fala com o app

Duas rotas, autenticadas pelo token (`profiles.api_token`), não pela sessão:

| Método | Rota | Função |
|---|---|---|
| `GET` | `/api/hoje?token=…` | Treino de hoje e lista de exercícios (`id`, `nome`, séries, faixa de reps, `ultima_carga`) |
| `POST` | `/api/registrar` | Grava a série (`token`, `exercicio_id`, `carga`, `reps`, `qualidade`) |

Sempre chame `https://www.tapgym.com.br`. O apex sem `www` devolve 308, e o Atalhos **não segue** esse redirect no POST: a requisição fica pendurada e não aparece log.

A API responde **sempre HTTP 200**. Erro vai no corpo (`error` é texto de alerta). O Atalhos ramifica por “`error` tem algum valor”, não pelo status HTTP. **Não renomeie caminhos nem campos**: atalho instalado não atualiza sozinho.

Detalhe do contrato, token, rate limit e o que não pode quebrar: [`docs/CEREBRO.md`](docs/CEREBRO.md) §7.

## Stack

Next.js 16, React 19, Tailwind v4, Supabase, Stripe, Vercel.

## Desenvolvimento

```bash
npm install
npm run dev
```

Abre em [http://localhost:3000](http://localhost:3000).

Antes de commit: `npm run lint`, `npx tsc --noEmit`, `npm run build`. Não há suíte de testes.

Antes de mexer em acesso, cobrança, autenticação, atalho ou landing, leia [`docs/CEREBRO.md`](docs/CEREBRO.md). Antes de mexer na UI do app, leia [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md).
