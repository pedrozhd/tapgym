-- Aviso da variação de exercício: cascata na ficha, troca no Registro,
-- atalho mostra nome e última carga da variação do dia.
insert into public.avisos (titulo, corpo)
select
  'Variação do exercício no dia',
  'Halter ocupado, vai de barra: o exercício na ficha continua um só, e embaixo você cadastra variações (com halter, na máquina). No Registro, toque em Hoje para trocar a variação do dia, mesmo antes de registrar. O atalho do iPhone mostra o nome composto (Stiff · com halter) e sugere a última carga daquela variação. O atalho antigo continua funcionando, sem reinstalar.'
where not exists (
  select 1 from public.avisos where titulo = 'Variação do exercício no dia'
);
