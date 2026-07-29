-- Adiciona o nome de exibição do usuário, editável pelo próprio usuário
-- (mas sem permitir que ele altere o próprio api_token pela mesma via).

alter table public.profiles add column if not exists nome text;

drop policy if exists "profiles: owner can update own name" on public.profiles;
create policy "profiles: owner can update own name"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Restringe a coluna que pode ser escrita: mesmo com a policy de update
-- acima, só a coluna `nome` fica gravável pelo usuário autenticado.
revoke update on public.profiles from authenticated;
grant update (nome) on public.profiles to authenticated;
