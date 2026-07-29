-- Lista de espera da LP (captura de e-mail antes do beta abrir). Insert
-- publico via anon key; sem policy de select, ninguem alem do service role
-- consegue listar os e-mails.

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;

drop policy if exists "waitlist: anyone can join" on public.waitlist;
create policy "waitlist: anyone can join"
  on public.waitlist for insert
  to anon, authenticated
  with check (true);
