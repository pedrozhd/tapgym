-- Adiciona a tabela profiles com o token pessoal usado pela integração com o
-- Shortcut do iOS (/api/hoje, /api/registrar), com criação automática via
-- trigger para novos usuários e um backfill para quem já tinha conta.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  api_token text unique not null default encode(gen_random_bytes(24), 'hex')
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: owner can read own token" on public.profiles;
create policy "profiles: owner can read own token"
  on public.profiles for select
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: cria o perfil (e o token) de quem já tinha conta antes deste trigger existir.
insert into public.profiles (id)
select u.id
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
