-- Adiciona a agenda semanal aos treinos: cada treino passa a poder ser
-- atribuído a um ou mais dias da semana (0 = domingo ... 6 = sábado).
-- "Treino de hoje" passa a ser calculado pelo dia da semana atual, não mais
-- pela rotação (último treinado + próximo da sequência).

alter table public.treinos
  add column if not exists dias_semana integer[] not null default '{}';

alter table public.treinos
  drop constraint if exists treinos_dias_semana_validos;

alter table public.treinos
  add constraint treinos_dias_semana_validos check (dias_semana <@ array[0, 1, 2, 3, 4, 5, 6]);
