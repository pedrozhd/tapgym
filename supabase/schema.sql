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

-- avisos --------------------------------------------------------------------
-- Caixa de entrada de comunicados de produto. Sem user_id: conteúdo global,
-- escrito só pela service role (não existe painel de admin — ver migração
-- 0016). Confirmação de leitura é a tabela avisos_lidos, abaixo.
create table if not exists public.avisos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  corpo text not null,
  link_label text,
  link_url text,
  -- true quando o link é o atalho do iPhone: o app Atalhos só existe no iOS,
  -- e sem isto o botão de instalar apareceria pra quem não tem como usá-lo.
  link_somente_ios boolean not null default false,
  publicado_em timestamptz not null default now()
);

create index if not exists avisos_publicado_em_idx on public.avisos (publicado_em desc);

-- avisos_lidos ----------------------------------------------------------------
-- Recibo de leitura: uma linha por (aviso, usuário), criada quando o aviso é
-- aberto. Nunca é apagada nem atualizada — uma vez lido, lido pra sempre.
create table if not exists public.avisos_lidos (
  aviso_id uuid not null references public.avisos (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  lido_em timestamptz not null default now(),
  primary key (aviso_id, user_id)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  treino_peito_id uuid;
  treino_perna_id uuid;
  ex_supino_reto uuid;
  ex_supino_incl uuid;
  ex_crucifixo uuid;
  ex_triceps uuid;
  ex_agachamento uuid;
  ex_leg_press uuid;
  ex_extensora uuid;
  ex_flexora uuid;
  ex_panturrilha uuid;
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

  -- Seed editável (Peito seg/qui, Perna ter/sex) pra o trial não começar vazio.
  insert into public.treinos (user_id, nome, ordem, dias_semana)
  values (new.id, 'Peito', 0, array[1, 4])
  returning id into treino_peito_id;

  insert into public.treinos (user_id, nome, ordem, dias_semana)
  values (new.id, 'Perna', 1, array[2, 5])
  returning id into treino_perna_id;

  insert into public.exercicios (user_id, nome, grupo_muscular)
  values (new.id, 'Supino reto', 'peito')
  returning id into ex_supino_reto;

  insert into public.exercicios (user_id, nome, grupo_muscular)
  values (new.id, 'Supino inclinado', 'peito')
  returning id into ex_supino_incl;

  insert into public.exercicios (user_id, nome, grupo_muscular)
  values (new.id, 'Crucifixo', 'peito')
  returning id into ex_crucifixo;

  insert into public.exercicios (user_id, nome, grupo_muscular)
  values (new.id, 'Tríceps pulley', 'triceps')
  returning id into ex_triceps;

  insert into public.exercicios (user_id, nome, grupo_muscular)
  values (new.id, 'Agachamento', 'quadriceps')
  returning id into ex_agachamento;

  insert into public.exercicios (user_id, nome, grupo_muscular)
  values (new.id, 'Leg press', 'quadriceps')
  returning id into ex_leg_press;

  insert into public.exercicios (user_id, nome, grupo_muscular)
  values (new.id, 'Cadeira extensora', 'quadriceps')
  returning id into ex_extensora;

  insert into public.exercicios (user_id, nome, grupo_muscular)
  values (new.id, 'Mesa flexora', 'posterior_de_coxa')
  returning id into ex_flexora;

  insert into public.exercicios (user_id, nome, grupo_muscular)
  values (new.id, 'Panturrilha', 'panturrilha')
  returning id into ex_panturrilha;

  insert into public.treino_exercicios (treino_id, exercicio_id, ordem, num_series, rep_min, rep_max)
  values
    (treino_peito_id, ex_supino_reto, 0, 3, 8, 12),
    (treino_peito_id, ex_supino_incl, 1, 3, 8, 12),
    (treino_peito_id, ex_crucifixo, 2, 3, 8, 12),
    (treino_peito_id, ex_triceps, 3, 3, 8, 12),
    (treino_perna_id, ex_agachamento, 0, 3, 8, 12),
    (treino_perna_id, ex_leg_press, 1, 3, 8, 12),
    (treino_perna_id, ex_extensora, 2, 3, 8, 12),
    (treino_perna_id, ex_flexora, 3, 3, 8, 12),
    (treino_perna_id, ex_panturrilha, 4, 3, 8, 12);

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
alter table public.avisos enable row level security;
alter table public.avisos_lidos enable row level security;

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

-- Aviso não é feature paga: quem está com assinatura vencida ou trial
-- encerrado ainda precisa ver comunicados (inclusive o próprio "sua
-- assinatura venceu"), então esta policy não passa por `tem_acesso()`
-- (diferente de exercicios/treinos/series, acima).
create policy "avisos: authenticated read"
  on public.avisos for select
  to authenticated
  using (true);

create policy "avisos_lidos: owner read"
  on public.avisos_lidos for select
  using (auth.uid() = user_id);

create policy "avisos_lidos: owner insert"
  on public.avisos_lidos for insert
  with check (auth.uid() = user_id);
