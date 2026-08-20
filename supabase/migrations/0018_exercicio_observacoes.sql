-- Observação do exercício por dia civil (não é nota da série nem texto eterno
-- no catálogo). Uma linha por (exercicio, data); texto vazio some na app
-- (delete), não fica row em branco.
--
-- `data` é `date` (YYYY-MM-DD), o mesmo recorte que `getDataLocalISO` usa no
-- app (America/Sao_Paulo). Não é timestamptz: a nota é "hoje na academia",
-- não um instante.
create table if not exists public.exercicio_observacoes (
  id uuid primary key default gen_random_uuid(),
  exercicio_id uuid not null references public.exercicios (id) on delete cascade,
  data date not null,
  texto text not null check (char_length(texto) between 1 and 200),
  created_at timestamptz not null default now(),
  unique (exercicio_id, data)
);

create index if not exists exercicio_observacoes_exercicio_id_data_idx
  on public.exercicio_observacoes (exercicio_id, data desc);

alter table public.exercicio_observacoes enable row level security;

drop policy if exists "exercicio_observacoes: owner full access" on public.exercicio_observacoes;
create policy "exercicio_observacoes: owner full access"
  on public.exercicio_observacoes for all
  using (
    exists (
      select 1 from public.exercicios e
      where e.id = exercicio_observacoes.exercicio_id and e.user_id = auth.uid()
    )
    and public.tem_acesso(auth.uid())
  )
  with check (
    exists (
      select 1 from public.exercicios e
      where e.id = exercicio_observacoes.exercicio_id and e.user_id = auth.uid()
    )
    and public.tem_acesso(auth.uid())
  );
