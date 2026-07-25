-- Login com Google: o provider grava o nome em `full_name`/`name`, não em
-- `nome` (que é o campo do nosso próprio formulário de cadastro). Sem este
-- coalesce, quem entra pelo Google fica com profiles.nome = null e o Dashboard
-- passa a saudar pelo prefixo do e-mail.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome)
  values (
    new.id,
    -- nullif(trim(...)) pra que metadata com string vazia não vire "nome".
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
    )
  );
  return new;
end;
$$;
