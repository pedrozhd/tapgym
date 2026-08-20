# Variação de exercício (cascata + troca do dia) — Design

Data: 2026-08-20  
Status: implementado

## Objetivo

O mesmo movimento na ficha (ex.: Stiff) pode ser feito com implementos
diferentes no dia (halter ocupado, vai de barra; máquina que não conhece).
A ficha continua **um** exercício. As variações vivem embaixo dele. No
histórico dá para filtrar. No atalho do iPhone, o nome e a última carga
passam a ser os da variação escolhida para hoje.

## Fora de escopo

- Escolher a variação **dentro** do atalho (menu extra). Exige atalho novo,
  reinstalação e colar o token de novo. Fica para uma versão posterior.
- PDF de Meu Treino: recorde continua no exercício pai, sem recorte por
  variação.
- Observação do dia: feature à parte (`exercicio_observacoes`). Não misturar
  texto livre com o rótulo da variação.
- Variação série a série (2 com halter, 2 com barra no mesmo dia).
- Exercício filho como linha extra no treino (três stiffs para cumprir).
- Enum fixo de implemento (halter/barra/cabo/máquina).

## Decisões

1. **Pai = exercício.** Entra no treino, tem `num_series`, faixa de reps,
   `grupo_muscular`, histórico e volume. Nome recomendado: o movimento
   (`Stiff`), não `Stiff com a barra`.
2. **Filho = variação.** Só um rótulo curto (`com halter`, `com a barra`,
   `na máquina`). Pertence ao `exercicio_id`. Não vira row no treino, não
   tem prescrição própria, não tem grupamento próprio.
3. **A escolha vale o dia civil inteiro** daquele exercício
   (`America/Sao_Paulo`, o mesmo recorte de `getDataLocalISO`). Sem série
   ainda, a troca já vale: escolhe e sai no atalho.
4. **Padrão** = nenhuma variação escolhida naquele dia. O atalho mostra só
   o nome do pai. A última carga é a das sessões Padrão (dias sem variação).
5. **Atalho: sem campo novo obrigatório.** O atalho instalado só lê `nome` e
   `ultima_carga`. Com variação ativa hoje, `nome` vira
   `{pai} · {variação}` e `ultima_carga` é a última dessa variação.
   `id` continua o do pai. `POST /api/registrar` não muda de contrato.
6. **Histórico:** um gráfico; chips de filtro se existir mais de uma
   classificação (`Todas` / `Padrão` / cada variação usada). `Todas` mistura.
7. **Exercício compartilhado** entre treinos: as variações são do exercício,
   não do treino. Vale em qualquer ficha que o use.

## Dados

Três fatos, grão `(exercicio, data)` alinhado à observação, sem coluna nova
em `series`:

```
exercicios                    # pai (já existe)
exercicio_variacoes           # catálogo: (exercicio_id, nome), unique por pai
exercicio_variacao_dia        # sessão: unique (exercicio_id, data) -> variacao_id
```

- `exercicio_variacoes`: `id`, `exercicio_id` (FK, cascade se o pai sumir),
  `nome` (1 a 40 caracteres depois do trim), `created_at`. Unique
  `(exercicio_id, lower(btrim(nome)))` para não nascerem `Halter` e `halter`.
- `exercicio_variacao_dia`: `exercicio_id`, `data date`, `variacao_id`
  (FK para `exercicio_variacoes`). Sem row = Padrão. Trocar para Padrão
  apaga a row daquele dia. A variação tem que pertencer àquele exercício
  (check na app + RLS via pai).
- Série não ganha coluna. Classificar uma série é olhar o dia civil dela
  nessa tabela. Trocar a variação no meio do dia reclassifica **todas** as
  séries daquele exercício naquele dia. É o comportamento pedido.
- Série já existente (antes desta feature) cai em Padrão: não há row em
  `exercicio_variacao_dia` para aquele dia.

RLS no mesmo espírito de `series` / `exercicio_observacoes`: dono do
exercício + `tem_acesso()`.

Exclusão de conta: apagar `exercicio_variacao_dia` e `exercicio_variacoes`
dos exercícios do usuário (cascade do pai já cobre se a ordem de delete
for exercício por último; na rota `/api/conta/excluir` apagar explícito
como nas observações, porque o cascade das migrações pode não estar
completo no banco).

## Cascata (Meu Treino e adicionar)

Diálogo **Adicionar exercício**:

```
+ Criar exercício novo

Stiff
     com a barra
     com halter
     na máquina
     + Adicionar variação
```

- **Criar exercício novo:** cria o pai e vincula ao treino (fluxo atual).
- **Toque no pai** (se ainda não está neste treino): vincula o pai, histórico
  junto. Se já está, não duplica a row.
- **Toque numa variação:** não adiciona linha no treino. A variação já é do
  pai. (O toque pode ser só leitura / sem ação, para não parecer que cria
  um segundo exercício.)
- **+ Adicionar variação:** pede o nome curto, cria em
  `exercicio_variacoes` daquele pai. Pai precisa existir; se a pessoa
  acabou de criar o pai sem nome, o fluxo atual de nomear a row continua.

Na row do Meu Treino, uma linha só (`Stiff · 3× 8–12`). Embaixo, indentadas,
as variações para renomear e apagar, mais `+ Adicionar variação`. Não entram
no drag-and-drop.

Apagar variação: só se nenhum dia em `exercicio_variacao_dia` a referencia.
Se já foi usada, só renomear. Apagar o pai continua apagando histórico,
variações e sessões (cascade).

## Trocar para variação X (hoje)

**Onde:** Registro, no exercício ativo, junto do nome. Controle do tipo
`Hoje: Padrão`. Toque abre a lista: Padrão + variações daquele pai, mais
campo para **criar e já selecionar** uma variação nova (`máquina 3`).

Esse é o gesto que o atalho enxerga. Pode acontecer **antes** de qualquer
série. Vale o dia civil de hoje.

O diálogo **Editar série** (lápis) também escolhe a variação do **dia civil
daquela série**, não necessariamente hoje. Serve para reclassificar um dia
em que a pessoa esqueceu de trocar e registrou pelo atalho como Padrão.
Mudar ali reclassifica o dia inteiro daquele exercício.

Observação do dia permanece no mesmo diálogo, campo separado.

## Atalho

Contrato estável (`docs/CEREBRO.md` §7). Não renomear campos. Sempre 200.

`GET /api/hoje`:

| Campo | Padrão hoje | Variação ativa hoje |
| --- | --- | --- |
| `id` | pai | pai |
| `nome` | `Stiff` | `Stiff · com halter` |
| `ultima_carga` | última série cujo dia civil é Padrão (0 se nunca) | última série cujo dia civil tem essa variação (0 se nunca) |
| `num_series`, `rep_min`, `rep_max` | da ficha | da ficha |

Separador do nome composto: ` · ` (espaço, ponto médio, espaço). Se o nome
do pai já estiver vazio, não prefixar o ponto médio: só o nome da variação,
ou `"Exercício"` se os dois faltarem (mesmo fallback de hoje).

Campo extra opcional (`variacao`) no JSON de hoje é permitido (atalho
antigo ignora), mas **não substitui** dobrar a variação em `nome`: senão o
atalho instalado não mostra o que a pessoa está fazendo.

`POST /api/registrar`: body igual. A série nasce no pai. A classificação do
dia é a row de `exercicio_variacao_dia` já escolhida (ou Padrão). Não exige
`variacao_id` no POST.

## Histórico do exercício

Acima da primeira série de cada dia civil, se aquele dia não for Padrão,
uma linha muted com o nome da variação (uma vez, não em cada set). Pode
coexistir com a observação do dia: variação primeiro, observação em seguida,
ambas uma vez por dia.

Chips de filtro **só se** houver pelo menos duas classificações distintas
no histórico (Padrão conta). Ordem: `Todas`, `Padrão` (se existir), depois
variações por nome. Chip ativo filtra o gráfico e a lista. `Todas` é o
default.

Volume por grupamento e dashboard: todas as séries do pai, variação
irrelevante.

## UI (app)

Dark-only, `SoftCard`, `TypographyEyebrow`, alvo de toque mínimo 44px.
Sem segundo ícone na row da série: a variação do dia passado se edita no
lápis que já existe. No Registro, o seletor de hoje é um controle à parte
(não um ícone de 14px colado no lápis).

Lista de variações no Meu Treino: texto muted indentado, alinhado à row
atual (`treino-exercicio-row`), sem card extra por variação.

## Aviso

Depois de no ar: seed na caixa de entrada (migração de insert idempotente
por título), no mesmo espírito de `0017` / `0019`. Texto: cascata na ficha,
troca no Registro, atalho mostra nome e carga da variação. Sem link. Não
bloqueia o merge desta spec.

## Não fazer

- Quebrar atalho antigo: mudar `id`, exigir campo novo no POST, ou deixar
  a variação só num campo que o atalho não lê.
- Pré-preencher variação com a última sessão. O dia nasce Padrão; a pessoa
  troca se precisar.
- Criar variação com o mesmo nome do pai. O nome da variação é só o
  implemento.
