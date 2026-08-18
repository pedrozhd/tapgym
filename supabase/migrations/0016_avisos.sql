-- Caixa de entrada de avisos: comunicados de produto (mudança no atalho,
-- correção que muda comportamento, etc.) com confirmação de leitura por
-- usuário.
--
-- `avisos` não tem `user_id`: é conteúdo global, igual pra todo mundo, sem
-- dono. Quem escreve é sempre a service role (via SQL direto/migração) — não
-- existe painel de admin, então a policy de authenticated cobre só leitura.
--
-- `avisos_lidos` é o recibo de leitura, uma linha por (aviso, usuário).
-- Nasce quando o aviso é aberto (ver `src/components/layout/avisos-sheet.tsx`)
-- e nunca é apagada nem atualizada: uma vez lido, lido pra sempre.
create table if not exists public.avisos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  corpo text not null,
  link_label text,
  link_url text,
  -- true quando o link é o atalho do iPhone: o app Atalhos só existe no iOS
  -- (mesma regra do ícone de raio e do AtalhoCard, via src/lib/use-ios.ts), e
  -- sem isto o botão de instalar apareceria pra quem não tem como usá-lo.
  -- O corpo do aviso continua visível pra todo mundo — só o botão some.
  link_somente_ios boolean not null default false,
  publicado_em timestamptz not null default now()
);

create index if not exists avisos_publicado_em_idx on public.avisos (publicado_em desc);

create table if not exists public.avisos_lidos (
  aviso_id uuid not null references public.avisos (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  lido_em timestamptz not null default now(),
  primary key (aviso_id, user_id)
);

alter table public.avisos enable row level security;
alter table public.avisos_lidos enable row level security;

-- Aviso não é feature paga: quem está com assinatura vencida ou trial
-- encerrado ainda precisa ver "sua assinatura venceu, reative" e comunicados
-- em geral, então esta policy não passa por `tem_acesso()` (diferente de
-- exercicios/treinos/series).
create policy "avisos: authenticated read"
  on public.avisos for select
  to authenticated
  using (true);

create policy "avisos_lidos: owner read"
  on public.avisos_lidos for select
  using (auth.uid() = user_id);

create policy "avisos_lidos: owner insert"
  on public.avisos_lidos for insert
  with check (auth.uid() = user_id);
