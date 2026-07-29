-- O trigger handle_new_user em produção foi sobrescrito por uma versão
-- anterior (sem trial_ends_at): contas novas depois de ~2026-07-27 passaram
-- a nascer com trial null (ex.: gymtwice@, 2026-07-29). Contas como
-- windsurfpedro (2026-07-27) ainda têm trial, o que prova que 0012 já tinha
-- rodado e depois a função foi substituída.
--
-- Esta migração reinsere a definição correta (igual 0012 / schema.sql) e
-- faz backfill das contas afetadas.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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

-- Backfill: quem nasceu depois do trial existir, não é legacy, não assina,
-- e ficou sem trial por causa do trigger quebrado.
update public.profiles p
set trial_ends_at = u.created_at + interval '7 days'
from auth.users u
where p.id = u.id
  and p.trial_ends_at is null
  and p.is_legacy_free = false
  and (p.subscription_status is distinct from 'active')
  and u.created_at >= timestamptz '2026-07-26 00:00:00+00';
