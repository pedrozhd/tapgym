# Mapa de dados (rascunho LGPD)

Registro interno das operações de tratamento do TapGym, no espírito do modelo
simplificado da ANPD para agentes de pequeno porte. Não é parecer jurídico.

Contato titular: `contatotapgym@gmail.com`  
Prazo interno para pedidos manuais (ex.: exportação): **15 dias úteis**.

| Dado | Etapa | Finalidade | Base (rascunho) | Onde | Quem acessa | Fornecedor | Retenção | Como titular age |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| E-mail, senha (hash) | Cadastro / login | Criar e autenticar conta | Execução de contrato | Auth Supabase | Titular; admin via service role | Supabase | Enquanto a conta existir | Excluir conta; e-mail |
| Nome / metadados Google | Cadastro Google / perfil | Saudação e identificação | Execução de contrato | `profiles`, Auth | Titular | Supabase, Google (OAuth) | Idem | Corrigir nome no app; excluir |
| Treinos, exercícios, séries | Uso do app / atalho | Prestação do serviço | Execução de contrato | Postgres (RLS) | Titular | Supabase | Idem; apagado na exclusão | Excluir conta; editar no app |
| `api_token` do atalho | AccountSheet / atalho iOS | Autenticar Atalhos | Execução de contrato | `profiles` | Titular; rotas `/api/hoje`, `/api/registrar` | Supabase, Vercel | Idem; rotacionável | Rotacionar token; excluir |
| IDs Stripe (customer, subscription, status) | Checkout / webhook | Cobrança e gate de acesso | Execução de contrato | `profiles` + Stripe | Webhook service role; portal | Stripe, Vercel | Conta + regras Stripe | Portal Stripe; excluir conta |
| IP / rate limit | Rotas API | Prevenir abuso | Legítimo interesse (segurança) | Upstash Redis | Automático | Upstash, Vercel | Curta (janela do limitador) | N/A |
| Logs de hosting | Runtime | Operação e debug | Legítimo interesse | Vercel | Operador do projeto | Vercel | Conforme provedor | E-mail |
| E-mail transacional | Auth SMTP | Entregar links/mensagens de auth | Execução de contrato | Resend via Supabase SMTP | Automático | Resend, Supabase | Logs do provedor | E-mail |

## Fornecedores (resumo)

Supabase, Vercel, Stripe, Google OAuth, Resend, Upstash. Pode haver transferência internacional.

## Observações

- TapGym atua como **controlador** dos dados dos próprios usuários (B2C).
- Não há analytics/pixel no app neste momento.
- Não há uso de dados de treino para treinar IA de terceiros pelo TapGym.
- Placeholders de empresa/CNPJ não se aplicam enquanto o produto for operado por pessoa física; o contato único é `contatotapgym@gmail.com`.
