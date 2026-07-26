-- Teste de 7 dias sem cartão: o cadastro entra direto no app e o paywall só
-- aparece quando o prazo vence. Antes, quem criava a conta batia no /assinar
-- imediatamente, sem ter visto o produto funcionando com os dados dele.
alter table public.profiles
  add column if not exists trial_ends_at timestamptz;

-- Só contas novas ganham trial. Quem já existe é isento (is_legacy_free) ou
-- pagante, então fica com null e nada muda.
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
