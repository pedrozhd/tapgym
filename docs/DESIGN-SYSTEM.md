# Design system do app

Linguagem visual do RealGains: o que existe, quando usar e por quê. Escrito a
partir do código, não de um mockup, então cada regra aqui aponta para onde ela
mora.

Escopo: as telas do app (grupo de rotas `(app)`), header, bottom nav e diálogos.
A landing page (`/`) segue uma direção própria, editorial e 3D, documentada em
`docs/superpowers/specs/2026-07-23-lp-3d-editorial-dark-design.md`.

Configuração fora do repo, acesso, cobrança e o atalho do iOS estão em
`docs/CEREBRO.md`. Este arquivo não cobre isso.

## 1. Fundamentos

**Dark only.** O tema claro existe em `:root` (`src/app/globals.css`) apenas
como fallback morto: `src/lib/theme.tsx` força a classe `dark` no `<html>` antes
da hidratação e limpa qualquer preferência salva. Ao escrever componente novo,
mire no escuro. Não adicione variantes `dark:` novas por reflexo, e nunca
dependa do tema claro para legibilidade.

**Um acento só.** O lime `#d6ff3f` é o único acento. Ele significa três coisas
que no contexto de treino são a mesma: o app, progresso e o estado ativo. Um
segundo verde criaria dois tons para o mesmo significado.

**Soft UI escuro.** Superfícies não têm borda: têm sombra dupla (realce quase
imperceptível em cima, preto embaixo). Borda visível é exceção, usada só onde
uma linha separa conteúdo (`border-t` de rodapé, trilha de barra).

**Mobile primeiro e único.** O shell tem `max-w-[430px]` centralizado
(`src/app/(app)/layout.tsx`). Não há layout de desktop: em telas largas o app
aparece como uma coluna de celular. Não invente breakpoints.

**Altura travada.** O shell usa `h-svh`, não `h-dvh`. A altura dinâmica
recalcula ao vivo quando a barra do Safari aparece e desaparece durante a
rolagem, o que abria vão no topo e cortava o nav embaixo.

## 2. Cor

Tokens em `src/app/globals.css`, bloco `.dark`. Use sempre o token semântico do
Tailwind (`bg-card`, `text-muted-foreground`), nunca o hex.

| Token | Valor | Uso |
| --- | --- | --- |
| `background` | `#08090b` | Fundo da tela e das rows dentro de card |
| `card` | `#111317` | Superfície de card, popover, sheet |
| `secondary` / `muted` / `accent` | `#16181c` | Fundo de controle, badge neutro |
| `foreground` | `#ededed` | Texto principal |
| `muted-foreground` | `#8a8f94` | Texto secundário, ícone inativo |
| `primary` | `#d6ff3f` | Acento, aba ativa, dado mais recente, CTA |
| `primary-foreground` | `#08090b` | Texto sobre `primary` |
| `border` | `#23262b` | Fio divisor, trilha de barra |
| `input` | `#2a2d33` | Borda de input |
| `success` | `#d6ff3f` | Tendência de carga subindo (mesmo lime, de propósito) |
| `destructive` | `#f87171` | Erro, ação destrutiva, tendência estagnada |
| `warning` | `#f59e0b` | Aviso de trial |
| `info` | `#38bdf8` | Informativo |
| `ring` | `#d6ff3f` | Anel de foco |

Contrastes que já foram verificados: `foreground` sobre `background` é
aproximadamente 17:1, `primary` sobre `background` 17:1,
`muted-foreground` sobre `card` 5,7:1. Ou seja, `muted-foreground` é o piso:
qualquer cinza mais escuro que ele em cima de card cai abaixo de AA.

### Cor por região muscular

Exceção deliberada ao acento único, em `src/components/treino/grupo-muscular-select.tsx`.
São treze grupamentos e treze cores viram confete, então a cor vem da região do
corpo, quatro famílias, mapeadas em `REGIAO_GRUPO_MUSCULAR`
(`src/lib/grupos-musculares.ts`):

| Região | Grupamentos | Classes |
| --- | --- | --- |
| empurrar | ombros, peito, tríceps | `bg-sky-500/15 text-sky-300` |
| puxar | costas, bíceps, antebraço, trapézio | `bg-violet-500/15 text-violet-300` |
| pernas | quadríceps, posterior de coxa, glúteo, panturrilha, adutores | `bg-orange-500/15 text-orange-300` |
| core | abdômen | `bg-rose-500/15 text-rose-300` |

Tons `-300` porque todos passam de 9:1 sobre as superfícies escuras. O nome do
grupamento está sempre escrito ao lado: a cor reforça, nunca é o único sinal.

Ao criar categoria nova de dado, primeiro tente resolver com `primary` mais
neutros. Só abra uma paleta se o usuário precisar comparar categorias batendo o
olho, e nesse caso mantenha entre quatro e seis famílias.

## 3. Tipografia

Fonte única: Satoshi, via `--font-satoshi` (`src/app/layout.tsx`). Sem fonte de
display separada.

A escala mora em `src/components/ui/typography.tsx` e é a única fonte de
verdade. Não escreva `text-lg font-bold` solto quando existe um componente para
aquele nível.

| Componente | Tamanho e peso | Uso |
| --- | --- | --- |
| `TypographyH1` | 22px, extrabold, tracking-tight | Saudação do header, nome do treino de hoje |
| `TypographyH2` | 18px, extrabold | Título de tela |
| `TypographyH3` | 17px, bold | Título de header com voltar |
| `TypographyH4` | 15px, bold | Nome de exercício em row, título de card vazio |
| `TypographySectionTitle` | 15px, bold, `<h2>` | Título de seção da página, acima de uma lista |
| `TypographyP` | 15px, leading-relaxed | Texto corrido |
| `TypographyMuted` | 13px, muted | Texto de apoio, legenda, rodapé de card |
| `TypographyEyebrow` | 11px, bold, uppercase, muted | Rótulo no topo de um card |

`SectionTitle` e `Eyebrow` são níveis diferentes e não intercambiáveis: título de
seção da página em caixa normal e cor cheia, rótulo dentro de card em versalete
e muted. Enquanto os dois usavam o mesmo estilo, não se distinguia o que estava
dentro do quê.

Números grandes de destaque (carga, total de séries) fogem da escala de
propósito: `text-2xl font-bold tabular-nums`, alinhados à direita no topo do
card. Ver `exercicio-em-foco-card.tsx` e `volume-series-por-grupo-card.tsx`.

Regras:

- Todo número que muda (carga, reps, contagem, cronômetro) leva `tabular-nums`,
  senão a largura dança a cada render.
- `truncate` nunca junto de `leading-none`. O `truncate` liga
  `overflow: hidden` e com `line-height: 1` a caixa da linha tem a altura exata
  da fonte, então o descendente do "g" é cortado. Use `leading-tight`.

## 4. Espaçamento e layout

Múltiplos de 4px, via escala do Tailwind. Os valores que já são convenção:

| Contexto | Valor |
| --- | --- |
| Gutter horizontal da tela | `px-5` |
| Header | `pt-5 pb-3.5` |
| Entre cards e seções da tela | `gap-5` |
| Altura da bottom nav | `--rg-bottom-nav-h` |
| Entre rows de uma lista | `gap-2.5` |
| Padding interno de card | `p-4` |
| Padding interno de row | `px-4 py-3.5` |
| Blocos dentro de um card | `gap-2.5` a `gap-3.5` |
| Respiro do topo do scroll | `pt-6` |

O `pt-6` do `<main>` do dashboard não é estético: o brilho do
`shadow-soft-elevated` do primeiro card se espalha uns 24px para cima e, sem
esse respiro, o container com overflow corta a sombra em aresta dura em vez de
deixar esmaecer.

Estrutura de tela:

```
AppHeader        flex-none
<main>           flex-1, min-h-0, overflow-y-auto, px-5 pt-6 pb-6
BottomNav        flex-none, full-bleed
```

O nav fica no fluxo normal e reserva a própria linha, não flutua por cima. Foi
testado em aparelho: nav flutuante deixava a área de rolagem curta demais e
escondia permanentemente o fim das listas.

## 5. Raio

Base `--radius: 0.75rem`, com a escala derivada no `@theme` do `globals.css`.
Na prática:

| Elemento | Classe |
| --- | --- |
| Card, row de lista | `rounded-2xl` |
| Row de edição, botão grande | `rounded-xl` |
| Botão padrão | `rounded-lg` |
| Badge, pill, toast, avatar | `rounded-full` |

## 6. Elevação

Três classes utilitárias no `globals.css`, e nenhuma sombra ad hoc fora delas:

- `shadow-soft-elevated`: card de conteúdo, avatar do header, CTA. Deslocamento
  de 8px e blur de 16px.
- `shadow-soft-subtle`: row dentro de lista, superfície secundária. 3px e 8px.
- `shadow-soft-pressed`: fundo encaixado. Sem uso hoje (era a aba ativa da
  bottom nav, que virou full-bleed), mantido como par natural das outras duas.

`SoftCard` (`src/components/ui/soft-card.tsx`) encapsula superfície mais raio
mais sombra. Prefira ele a remontar `rounded-2xl bg-card shadow-soft-*` na mão.

Cuidado conhecido: `box-shadow` no mesmo nó que `backdrop-blur` mais
`overflow-hidden` faz alguns navegadores quebrarem o clip dos cantos e pintarem
um retângulo sólido ali. Se precisar dos três, separe em nós diferentes.

## 7. Movimento

Durações e curvas em uso:

| Animação | Duração | Onde |
| --- | --- | --- |
| Traço do sparkline | 980ms, spline `0.25 1 0.5 1` | `sparkline.tsx` |
| Crescimento das barras de volume | 380ms, `cubic-bezier(0.22, 1, 0.36, 1)` | `.rg-bar-grow` |
| Cascata entre barras | 40ms por linha | `volume-series-por-grupo-card.tsx` |
| Toast | 1,8s total, entra em 12% | `.rg-toast` |
| Feedback de toque | imediato, `active:opacity-70` ou `active:opacity-80` | rows, links, badge |

Regras:

- Anime `transform` e `opacity`. Nunca `width`, `height`, `top` ou `left`:
  entram em layout e forçam reflow a cada frame. A barra de volume cresce com
  `scaleX` e `transform-origin: left` por isso.
- Animação com atraso em cascata precisa de `animation-fill-mode: backwards`,
  senão o elemento aparece no estado final e só depois começa a animar.
- Toda animação declarada em CSS ganha um bloco
  `@media (prefers-reduced-motion: reduce)` que a desliga.
- Feedback de toque é opacidade, não transform que mexa no layout ao redor.

## 8. Componentes

### Superfícies

- **`SoftCard`**: card padrão, `elevation="elevated"` ou `"subtle"`. Aceita
  `as="div" | "section" | "button"`.
- **`ExercicioRow`**: row navegável. `shadow-soft-subtle`, `bg-card`,
  `px-4 py-3.5`, nome em `TypographyH4` mais legenda em `TypographyMuted`,
  ícone de tendência mais `ChevronRight` à direita. É o padrão para qualquer
  lista que leve a um detalhe.

### Controles

- **`Button`** (`src/components/ui/button.tsx`): base do shadcn com variantes
  `default`, `outline`, `secondary`, `ghost`, `destructive`, `link`. CTA de tela
  usa `default` com `h-[52px] w-full rounded-xl text-[15px] font-bold` mais
  `shadow-soft-elevated`.
- **`BlurCommitInput`**: input que só comita no blur. Padrão para edição inline
  em lista, evita salvar a cada tecla.
- **`GrupoMuscularSelect`**: badge colorido com `ChevronDown` que na verdade é
  um `<select>` nativo invisível posicionado por cima. No iPhone isso abre o
  picker nativo do iOS, melhor que qualquer dropdown desenhado à mão. O badge
  não pode ser o próprio `<select>` porque o Chrome dimensiona select pela opção
  mais larga, e o badge precisa ter a largura do rótulo atual. O select usa
  `-inset-y-2` para o alvo de toque chegar a 44px sem inflar o visual de 28px.
- **`ToastPill`**: pill fixa centralizada, `bg-foreground` com `text-background`,
  posicionada em `calc(var(--rg-bottom-nav-h) + 1rem)`. Some sozinha em 1,8s.

### Navegação

- **`AppHeader`**: três variantes, `dashboard` (saudação mais avatar mais botão
  do atalho no iOS), `title`, `back`.
- **`BottomNav`**: full-bleed, `border-t border-border bg-background`,
  `paddingBottom: env(safe-area-inset-bottom)` e `min-height` vindo de
  `--rg-bottom-nav-h`. Quatro abas, ícone mais rótulo de 10px bold. Aba ativa em
  `text-primary` mais fio de 2px encostado na borda de cima e `aria-current="page"`,
  inativa em `text-muted-foreground`. Sem pill e sem fundo. Comportamentos
  embutidos: Dashboard sempre recarrega via `window.location` para garantir dado
  fresco, tocar na aba já ativa rebusca os dados, e `/exercicio/[id]` conta como
  aba Histórico via `extraPrefix`.

`--rg-bottom-nav-h` (em `globals.css`) é a fonte de verdade da altura do nav.
Quem precisa se posicionar acima dele usa a variável, nunca um offset cravado.

## 9. Dados numéricos e gráficos

- **`Sparkline`** (`src/components/ui/sparkline.tsx`): tendência ao longo do
  tempo. Herda cor de `currentColor`, então quem chama define com
  `text-primary`. `glow` liga duas camadas desfocadas atrás do traço,
  `showEndpoint` marca o ponto mais recente. Série constante fica no meio da
  altura e não na base, e um ponto único é repetido nas pontas para formar uma
  reta: sem isso o path viraria um `M` solitário, invisível.
- **Barras horizontais de ranking**
  (`src/components/dashboard/volume-series-por-grupo-card.tsx`): comparação
  entre categorias. Ordenadas desc, valor sempre escrito ao lado do rótulo,
  comprimento proporcional ao líder, piso de 6% para que o menor valor ainda
  leia como barra. Líder em `bg-primary` com brilho discreto, resto em
  `bg-primary/30` sobre trilha `bg-border`. Barra é `aria-hidden`, porque o
  rótulo e o número já são texto.

Escolha do tipo: tendência no tempo é linha, comparação entre categorias é barra
horizontal ordenada. Sem pizza.

Regras de gráfico neste app:

- Valor exato sempre visível como texto. Não existe tooltip de hover num app de
  celular, e no meio da série o usuário não vai tocar em cada ponto.
- A trilha e o fio divisor ficam em `border`, contraste baixo de propósito, para
  não competirem com o dado.
- Estado vazio é texto explicando, nunca eixo vazio ou gráfico em branco.
- Um ponto só não é gráfico. Considere escrever o valor em vez de desenhar.

## 10. Acessibilidade

- Alvo de toque mínimo de 44px. Quando o visual é menor, estique a área com
  `-inset-*` num overlay ou padding invisível, não aumente o desenho.
- Botão só de ícone leva `aria-label`. Ver o handle de arrastar e o botão de
  remover em `treino-exercicio-row.tsx`.
- Cor nunca é o único sinal. Tendência tem ícone mais cor, grupamento tem nome
  mais cor, ranking tem número mais comprimento.
- Decoração que duplica texto vai com `aria-hidden` para o leitor de tela não
  falar duas vezes.
- `prefers-reduced-motion` desliga animação, e `scroll-behavior: smooth` já cai
  para `auto` nesse modo.
- Foco visível vem do `ring` lime. Não remova `focus-visible`.

## 11. Anti-padrões

Todos já aconteceram neste código, e cada um custou uma correção:

| Não faça | Por quê |
| --- | --- |
| `truncate` com `leading-none` | Corta o descendente de g, p, q, y |
| Animar `width` para crescer barra | Reflow por frame. Use `scaleX` |
| `box-shadow` no mesmo nó que `backdrop-blur` mais `overflow-hidden` | Alguns navegadores pintam retângulo sólido nos cantos |
| Brilho dentro de container com `overflow-hidden` | O brilho é cortado em aresta dura |
| `h-dvh` no shell | Oscila com a barra do Safari, abre vão e corta o nav |
| Nav flutuante por cima do conteúdo | Encurta a área de rolagem e esconde o fim das listas |
| Uma cor por categoria quando são mais de seis | Vira confete. Agrupe em famílias |
| Hex solto no componente | Quebra o tema. Use token semântico |
| Escrever `text-lg font-bold` no lugar de um `Typography*` | A escala deixa de ser fonte de verdade |
| Glifo de texto como ícone (`✕`, `←`) | Depende de fonte do sistema e não aceita token de cor nem tamanho. Use Lucide |
| Offset cravado para se posicionar perto do nav | Vira número mágico na primeira mudança do nav. Use `--rg-bottom-nav-h` |
| Repetir o mesmo item em dois blocos vizinhos | Lê como bug, não como destaque. Ou filtra da lista, ou tira o card |

Sobre o penúltimo: as setas de voltar do `AppHeader` ainda são `←` como texto.
É a dívida que sobrou.

## 12. Avaliação do dashboard, 28/07/2026

Os cinco pontos levantados e como cada um foi resolvido:

1. **Exercício em foco duplicado.** O card EM FOCO e a primeira row da lista
   mostravam o mesmo exercício, um embaixo do outro. O exercício em foco agora
   sai da lista, e o título dela vira "Resto do treino" enquanto o card está
   presente, para a lista não mentir sobre o que contém. Quando não há exercício
   em foco (treino do dia fechado), o título volta a ser "Exercícios de hoje" e
   a lista mostra tudo. `ExercicioGrid` devolve `null` com lista vazia, caso do
   treino de um exercício só.
2. **Card TREINO DE HOJE sem função.** Ganhou o progresso do dia no lugar que
   era do CTA: contagem `feitas/total` de séries à direita e barra fina embaixo.
   O dado vem de `progressoHoje` no `DashboardVM`, contado por exercício com
   teto na meta dele, senão quem faz 5 séries num exercício de 3 estouraria a
   barra com metade do treino intocada.
3. **Hierarquia achatada.** Criado `TypographySectionTitle`, 15px bold em caixa
   normal, para título de seção de página. Aplicado no dashboard, na lista de
   exercícios e no detalhe do exercício. `TypographyEyebrow` passou a ser
   exclusivamente rótulo dentro de card.
4. **Aba ativa só por cor.** Fio de 2px em `primary` encostado na borda de cima
   da aba ativa, mais `aria-current="page"`. Não é o pill de volta: o `py-2` do
   grid virou `pb-2` para o indicador poder encostar na borda do nav.
5. **Offset mágico do toast.** `--rg-bottom-nav-h` no `globals.css` virou a
   fonte de verdade da altura do nav. O nav aplica como `min-height` e o toast
   se posiciona em `calc(var(--rg-bottom-nav-h) + 1rem)`.

Também nesta rodada: o `✕` de texto do botão de remover virou `X` do Lucide.
Sobrou como dívida a seta `←` de voltar do `AppHeader`.
