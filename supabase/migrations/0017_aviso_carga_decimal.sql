-- Primeiro aviso publicado na caixa de entrada (migração 0016): a correção
-- de carga com decimal no app e a versão nova do atalho do iPhone.
--
-- Igual ao seed de treino da migração 0015, isto é conteúdo indo direto numa
-- migração porque não existe painel de admin: escrever um aviso é escrever
-- (e versionar) uma migração de insert como esta.
--
-- `where not exists`: se a 0017 retentar depois de um insert parcial/sucesso,
-- não duplica o mesmo comunicado.
insert into public.avisos (titulo, corpo, link_label, link_url, link_somente_ios)
select
  'Carga com decimal, sem erro',
  'Ajustamos o registro de carga com decimal (17,5 kg, por exemplo): no app, digitar vírgula ou ponto já funciona direto, sem perder dígito, e a exibição ficou padronizada com ponto em todo o TapGym, PDF incluso. Também tem uma versão nova do atalho do iPhone. Se você já usa o atalho, baixe a versão nova pelo botão abaixo.',
  'Baixar atalho atualizado',
  'https://www.icloud.com/shortcuts/abd2e19ad6f94c50862cacf0becaa524',
  true
where not exists (
  select 1 from public.avisos where titulo = 'Carga com decimal, sem erro'
);
