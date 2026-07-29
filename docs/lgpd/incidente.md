# Plano mínimo de incidente de segurança / dados

Checklist operacional interno. Não é parecer jurídico. Referência de prazo da
ANPD para comunicação (quando aplicável): em linhas gerais, até **3 dias úteis**
após o conhecimento do incidente pelo controlador.

Contato interno: fundador + `contato@tapgym.com.br`

## 1. Acionar

- [ ] Quem detectou registra data/hora e canal (usuário, log, provedor).
- [ ] Avisar o responsável do produto e o e-mail de privacidade.

## 2. Conter

- [ ] Rotacionar segredos expostos (Vercel env, Stripe, Supabase service role, Resend, Upstash).
- [ ] Revogar sessões / desligar provider comprometido se necessário (Supabase Auth, Google OAuth).
- [ ] Rotacionar tokens de atalho afetados (`/api/token/rotate` ou reset em massa via admin).
- [ ] Isolar o vetor (desligar rota, feature flag, bloquear IP se aplicável).

## 3. Registrar

- [ ] Quais sistemas foram afetados.
- [ ] Quais categorias de dados (e-mail, treino, cobrança, token…).
- [ ] Estimativa de titulares impactados.
- [ ] Evidências (logs, tickets de provedor) guardadas em local seguro.

## 4. Comunicar (se cabível)

- [ ] Avaliar risco/dano relevante aos titulares.
- [ ] Se comunicável: ANPD e titulares no prazo aplicável; texto claro do que ocorreu e o que fazer.
- [ ] Não improvisar número de afetados: usar a estimativa registrada.

## 5. Pós-mortem

- [ ] Causa raiz e correção permanente.
- [ ] Atualizar este plano e o mapa de dados se o fluxo mudar.
- [ ] Confirmar que secrets antigos foram invalidados.
