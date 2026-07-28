<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Contexto do projeto

Leia `docs/CEREBRO.md` antes de mexer em acesso, cobrança, autenticação, no atalho do iOS ou na landing page.

Ele registra as decisões e o motivo delas, e principalmente a configuração que mora fora do repositório (Supabase, Google Cloud, Resend, Vercel), que já foi origem de quebras em produção e não é dedutível do código.

Leia `docs/DESIGN-SYSTEM.md` antes de mexer na interface do app. Ele tem os tokens, a escala tipográfica, as convenções de espaçamento e elevação, e uma lista de anti-padrões que já custaram correção neste código.

Verificação antes de qualquer commit: `npm run lint`, `npx tsc --noEmit`, `npm run build`. Não há suíte de testes.
