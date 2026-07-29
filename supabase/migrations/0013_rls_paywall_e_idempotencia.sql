-- Fecha dois furos encontrados em auditoria de segurança:
--
-- 1) O paywall só existia no middleware do Next. Como o app lê e escreve
--    direto no PostgREST com a anon key (src/lib/store.tsx), quem perdia o
--    acesso (trial vencido, assinatura cancelada) continuava lendo e
--    escrevendo treinos/séries indefinidamente por fora da UI: RLS checava só
--    posse, nunca `temAcesso`. `tem_acesso()` espelha a regra de
--    `src/lib/acesso.ts::temAcesso` em SQL e passa a valer nas quatro tabelas
--    de dados. Precisa ser mantida em sincronia manual com `acesso.ts`, como
--    já é feito entre `schema.sql` e as migrações.
--
-- 2) A policy de `treino_exercicios` validava só o `treino_id`, nunca o
--    `exercicio_id`: um usuário conseguia vincular ao próprio treino um
--    `exercicio_id` de outra pessoa, que rotas com service role (`/api/hoje`)
--    liam sem RLS. Agora exige posse dos dois lados, igual `series` já fazia
--    para o exercício.

create or replace function public.tem_acesso(uid uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid
      and (p.is_legacy_free or p.subscription_status = 'active' or p.trial_ends_at > now())
  );
$$;

drop policy if exists "exercicios: owner full access" on public.exercicios;
create policy "exercicios: owner full access"
  on public.exercicios for all
  using (auth.uid() = user_id and public.tem_acesso(auth.uid()))
  with check (auth.uid() = user_id and public.tem_acesso(auth.uid()));

drop policy if exists "treinos: owner full access" on public.treinos;
create policy "treinos: owner full access"
  on public.treinos for all
  using (auth.uid() = user_id and public.tem_acesso(auth.uid()))
  with check (auth.uid() = user_id and public.tem_acesso(auth.uid()));

drop policy if exists "treino_exercicios: owner full access" on public.treino_exercicios;
create policy "treino_exercicios: owner full access"
  on public.treino_exercicios for all
  using (
    exists (
      select 1 from public.treinos t
      where t.id = treino_exercicios.treino_id and t.user_id = auth.uid()
    )
    and exists (
      select 1 from public.exercicios e
      where e.id = treino_exercicios.exercicio_id and e.user_id = auth.uid()
    )
    and public.tem_acesso(auth.uid())
  )
  with check (
    exists (
      select 1 from public.treinos t
      where t.id = treino_exercicios.treino_id and t.user_id = auth.uid()
    )
    and exists (
      select 1 from public.exercicios e
      where e.id = treino_exercicios.exercicio_id and e.user_id = auth.uid()
    )
    and public.tem_acesso(auth.uid())
  );

drop policy if exists "series: owner full access" on public.series;
create policy "series: owner full access"
  on public.series for all
  using (
    exists (
      select 1 from public.exercicios e
      where e.id = series.exercicio_id and e.user_id = auth.uid()
    )
    and public.tem_acesso(auth.uid())
  )
  with check (
    exists (
      select 1 from public.exercicios e
      where e.id = series.exercicio_id and e.user_id = auth.uid()
    )
    and public.tem_acesso(auth.uid())
  );

-- Idempotência do webhook da Stripe: dedup por `event.id` antes de processar
-- (ver `src/app/api/stripe/webhook/route.ts`). Só a service role toca esta
-- tabela, então RLS liga sem nenhuma policy (default-deny para anon/authenticated).
create table if not exists public.stripe_events (
  id text primary key,
  created_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;
