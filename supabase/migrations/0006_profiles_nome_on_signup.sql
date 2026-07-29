-- Preenche profiles.nome com o nome informado no cadastro (guardado em
-- user_metadata pelo signUp), pra evitar que o usuário precise abrir o
-- perfil e digitar o nome depois de criar a conta.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome) values (new.id, new.raw_user_meta_data ->> 'nome');
  return new;
end;
$$;
