-- Grupamento muscular principal de cada exercício (nullable = legado / ainda não classificado).
alter table public.exercicios
  add column if not exists grupo_muscular text;

alter table public.exercicios
  drop constraint if exists exercicios_grupo_muscular_check;

alter table public.exercicios
  add constraint exercicios_grupo_muscular_check check (
    grupo_muscular is null
    or grupo_muscular in (
      'ombros',
      'costas',
      'peito',
      'triceps',
      'biceps',
      'antebraco',
      'panturrilha',
      'abdomen',
      'gluteo',
      'posterior_de_coxa',
      'quadriceps',
      'trapezio',
      'adutores'
    )
  );
