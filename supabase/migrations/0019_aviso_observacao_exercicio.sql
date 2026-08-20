-- Aviso da observação do exercício por dia: nota no diálogo de editar série
-- (lápis), visível uma vez no histórico daquele dia. Sem link: a função
-- mora no app, não no atalho.
--
-- `where not exists`: se a 0019 retentar, não duplica o mesmo comunicado.
insert into public.avisos (titulo, corpo)
select
  'Observação do dia no exercício',
  'Dá para anotar o contexto do exercício naquele dia: aparelho, cabo, variação. Toque numa série (o lápis), escreva em Observação do dia e salve. A nota aparece uma vez no histórico, acima das séries daquela data. O atalho do iPhone continua igual: registra a série sem nota.'
where not exists (
  select 1 from public.avisos where titulo = 'Observação do dia no exercício'
);
