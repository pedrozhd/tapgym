-- RealGains schema
-- Run in the Supabase SQL editor (or `supabase db push`) against a fresh project.

create extension if not exists pgcrypto;

-- exercicios ------------------------------------------------------------
create table if not exists public.exercicios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  grupo_muscular text check (
    grupo_muscular is null
    or grupo_muscular in (
      'ombros',
      'costas',
      'peito',
      'triceps',
      'biceps',
      'antebraco',
      'panturrilha',
      'abdomen',
      'gluteo',
      'posterior_de_coxa',
      'quadriceps',
      'trapezio',
      'adutores'
    )
  ),
  created_at timestamptz not null default now()
);

create index if not exists exercicios_user_id_idx on public.exercicios (user_id);

-- treinos -----------------------------------------------------------------
create table if not exists public.treinos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  ordem integer not null default 0,
  -- Dias da semana em que o treino está agendado (0 = domingo ... 6 = sábado).
  -- Vazio = ainda não agendado. Cada dia deve pertencer a no máximo um treino
  -- por usuário; isso é garantido pela aplicação, não por uma constraint aqui.
  dias_semana integer[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint treinos_dias_semana_validos check (dias_semana <@ array[0, 1, 2, 3, 4, 5, 6])
);

create index if not exists treinos_user_id_ordem_idx on public.treinos (user_id, ordem);

-- treino_exercicios ---------------------------------------------------------
create table if not exists public.treino_exercicios (
  id uuid primary key default gen_random_uuid(),
  treino_id uuid not null references public.treinos (id) on delete cascade,
  exercicio_id uuid not null references public.exercicios (id) on delete cascade,
  ordem integer not null default 0,
  num_series integer not null default 3 check (num_series > 0),
  rep_min integer not null check (rep_min > 0),
  rep_max integer not null check (rep_max >= rep_min),
  created_at timestamptz not null default now()
);

create index if not exists treino_exercicios_treino_id_ordem_idx on public.treino_exercicios (treino_id, ordem);
create index if not exists treino_exercicios_exercicio_id_idx on public.treino_exercicios (exercicio_id);

-- series --------------------------------------------------------------------
create table if not exists public.series (
  id uuid primary key default gen_random_uuid(),
  exercicio_id uuid not null references public.exercicios (id) on delete cascade,
  carga numeric(6, 2) not null check (carga > 0),
  reps integer not null check (reps > 0),
  qualidade text not null check (qualidade in ('boa', 'razoavel', 'ruim')),
  data timestamptz not null default now()
);

create index if not exists series_exercicio_id_data_idx on public.series (exercicio_id, data desc);

-- profiles --------------------------------------------------------------------
-- Token pessoal para a integração com o Shortcut do iOS (/api/hoje, /api/registrar)
-- e o nome de exibição do usuário (editável só pelo próprio dono, ver GRANT abaixo).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  api_token text unique not null default encode(gen_random_bytes(24), 'hex'),
  nome text,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text,
  is_legacy_free boolean not null default false,
  -- Teste de 7 dias, preenchido pelo trigger abaixo em contas novas.
  trial_ends_at timestamptz
);

-- stripe_events -----------------------------------------------------------
-- Dedup do webhook por event.id (ver src/app/api/stripe/webhook/route.ts).
-- Só a service role toca esta tabela.
create table if not exists public.stripe_events (
  id text primary key,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- `nome` vem do nosso formulário; `full_name`/`name` vêm dos providers OAuth
  -- (Google). nullif(trim(...)) evita que metadata vazia vire um nome.
  insert into public.profiles (id, nome, trial_ends_at)
  values (
    new.id,
    nullif(
      trim(
        coalesce(
          new.raw_user_meta_data ->> 'nome',
          new.raw_user_meta_data ->> 'full_name',
          new.raw_user_meta_data ->> 'name',
          ''
        )
      ),
      ''
    ),
    now() + interval '7 days'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security ---------------------------------------------------------
-- series and treino_exercicios have no user_id column of their own, so
-- ownership is checked by joining back to the table that does.

alter table public.exercicios enable row level security;
alter table public.treinos enable row level security;
alter table public.treino_exercicios enable row level security;
alter table public.series enable row level security;
alter table public.profiles enable row level security;
alter table public.stripe_events enable row level security;

-- Espelha `src/lib/acesso.ts::temAcesso` em SQL. Sem isso, RLS checava só
-- posse (auth.uid() = user_id) e nunca acesso pago: como o app lê e escreve
-- direto no PostgREST com a anon key, quem perdia o acesso (trial vencido,
-- assinatura cancelada) continuava usando o produto inteiro por fora da UI.
-- Mantida em sincronia manual com acesso.ts, como o resto deste arquivo é
-- mantido em sincronia com as migrações (ver migração 0013).
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

create policy "exercicios: owner full access"
  on public.exercicios for all
  using (auth.uid() = user_id and public.tem_acesso(auth.uid()))
  with check (auth.uid() = user_id and public.tem_acesso(auth.uid()));

create policy "treinos: owner full access"
  on public.treinos for all
  using (auth.uid() = user_id and public.tem_acesso(auth.uid()))
  with check (auth.uid() = user_id and public.tem_acesso(auth.uid()));

-- Valida posse dos dois lados (treino e exercício): validar só o treino_id
-- permitia vincular ao próprio treino um exercicio_id de outra pessoa, que
-- rotas com service role (/api/hoje) liam sem RLS.
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

-- profiles/api_token são lidos pelo cliente (tela de conta), mas nunca
-- escritos por ele — só o trigger (security definer) cria a linha.
create policy "profiles: owner can read own token"
  on public.profiles for select
  using (auth.uid() = id);

-- nome pode ser editado pelo próprio usuário; api_token não (ver GRANT abaixo).
create policy "profiles: owner can update own name"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

revoke update on public.profiles from authenticated;
grant update (nome) on public.profiles to authenticated;
