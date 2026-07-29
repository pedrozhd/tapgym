-- Adiciona a quantidade de séries planejadas por exercício dentro de um
-- treino (ex: "3 séries de 8-12 reps"), junto de rep_min/rep_max.

alter table public.treino_exercicios add column if not exists num_series integer not null default 3;

alter table public.treino_exercicios drop constraint if exists treino_exercicios_num_series_check;
alter table public.treino_exercicios add constraint treino_exercicios_num_series_check check (num_series > 0);
