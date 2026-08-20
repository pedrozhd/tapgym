-- Catálogo de variações do exercício (filho do pai em `exercicios`) e a
-- escolha do dia civil. Série não ganha coluna: classificar um set é olhar
-- `exercicio_variacao_dia` na data de `getDataLocalISO`.
--
-- Unique case-insensitive no nome evita "Halter" e "halter" no mesmo pai.
create table if not exists public.exercicio_variacoes (
  id uuid primary key default gen_random_uuid(),
  exercicio_id uuid not null references public.exercicios (id) on delete cascade,
  nome text not null check (char_length(btrim(nome)) between 1 and 40),
  created_at timestamptz not null default now()
);

create unique index if not exists exercicio_variacoes_pai_nome_ci_idx
  on public.exercicio_variacoes (exercicio_id, lower(btrim(nome)));

create index if not exists exercicio_variacoes_exercicio_id_idx
  on public.exercicio_variacoes (exercicio_id);

create table if not exists public.exercicio_variacao_dia (
  exercicio_id uuid not null references public.exercicios (id) on delete cascade,
  data date not null,
  variacao_id uuid not null references public.exercicio_variacoes (id) on delete restrict,
  primary key (exercicio_id, data)
);

create index if not exists exercicio_variacao_dia_variacao_id_idx
  on public.exercicio_variacao_dia (variacao_id);

create or replace function public.exercicio_variacao_dia_mesmo_pai()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.exercicio_variacoes v
    where v.id = new.variacao_id and v.exercicio_id = new.exercicio_id
  ) then
    raise exception 'variacao nao pertence ao exercicio';
  end if;
  return new;
end;
$$;

drop trigger if exists exercicio_variacao_dia_mesmo_pai on public.exercicio_variacao_dia;
create trigger exercicio_variacao_dia_mesmo_pai
  before insert or update on public.exercicio_variacao_dia
  for each row execute function public.exercicio_variacao_dia_mesmo_pai();

alter table public.exercicio_variacoes enable row level security;
alter table public.exercicio_variacao_dia enable row level security;

drop policy if exists "exercicio_variacoes: owner full access" on public.exercicio_variacoes;
create policy "exercicio_variacoes: owner full access"
  on public.exercicio_variacoes for all
  using (
    exists (
      select 1 from public.exercicios e
      where e.id = exercicio_variacoes.exercicio_id and e.user_id = auth.uid()
    )
    and public.tem_acesso(auth.uid())
  )
  with check (
    exists (
      select 1 from public.exercicios e
      where e.id = exercicio_variacoes.exercicio_id and e.user_id = auth.uid()
    )
    and public.tem_acesso(auth.uid())
  );

drop policy if exists "exercicio_variacao_dia: owner full access" on public.exercicio_variacao_dia;
create policy "exercicio_variacao_dia: owner full access"
  on public.exercicio_variacao_dia for all
  using (
    exists (
      select 1 from public.exercicios e
      where e.id = exercicio_variacao_dia.exercicio_id and e.user_id = auth.uid()
    )
    and public.tem_acesso(auth.uid())
  )
  with check (
    exists (
      select 1 from public.exercicios e
      where e.id = exercicio_variacao_dia.exercicio_id and e.user_id = auth.uid()
    )
    and public.tem_acesso(auth.uid())
  );
