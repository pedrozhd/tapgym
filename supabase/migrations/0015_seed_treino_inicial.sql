-- Seed de treino inicial para contas novas (Peito seg/qui, Perna ter/sex).
-- Extende handle_new_user: além de profiles + trial, cria treinos/exercícios
-- editáveis para o dashboard não nascer vazio no trial.
--
-- Só afeta inserts futuros em auth.users. Sem backfill.

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
