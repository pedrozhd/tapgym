# Política de privacidade

Última atualização: 29 de julho de 2026.

Este documento descreve como o TapGym trata dados pessoais. É um rascunho alinhado à arquitetura atual do produto. Não substitui revisão jurídica.

**Controlador:** a pessoa física responsável pelo TapGym, no Brasil. Contato (também para privacidade e pedidos de titulares): [contato@tapgym.com.br](mailto:contato@tapgym.com.br).

## Quais dados tratamos

- Conta: e-mail, senha (hash no provedor de autenticação) ou dados básicos do Google (e-mail, nome), e o nome que você escolhe no app.
- Treino: exercícios, treinos, dias da semana, séries (carga, repetições, qualidade da execução), histórico de progressão.
- Atalho do iPhone: token de API associado à sua conta.
- Cobrança: identificadores de cliente/assinatura na Stripe. Não armazenamos número de cartão no TapGym.
- Técnicos: cookies de sessão de autenticação; logs e métricas operacionais dos provedores de hospedagem e infraestrutura.

Não pedimos CPF, telefone, endereço nem documentos no cadastro.

## Para que usamos

- Criar e autenticar sua conta.
- Prestar o serviço de registro e acompanhamento de treino (incluindo o atalho no iPhone).
- Processar assinatura, trial e cobrança.
- Enviar e-mails transacionais de autenticação (confirmação, quando aplicável).
- Proteger a conta e o serviço (rate limit, prevenção de abuso).
- Cumprir obrigações legais quando couber.

Bases legais em rascunho (sujeitas a revisão): execução de contrato / medidas preliminares para a prestação do serviço; legítimo interesse em segurança e melhoria operacional; obrigação legal quando aplicável. Marketing direto não é o foco atual do produto.

## Com quem compartilhamos

Usamos fornecedores que tratam dados para operar o produto:

- Supabase (banco e autenticação)
- Vercel (hospedagem)
- Stripe (pagamentos)
- Google (login OAuth, se você escolher)
- Resend (envio de e-mail via SMTP do Supabase)
- Upstash (rate limit)

Pode haver transferência internacional de dados, conforme a localização desses provedores. O TapGym não vende seus dados e não usa seus dados de treino para treinar modelos de IA de terceiros.

## Cookies

Usamos cookies essenciais de sessão do provedor de autenticação para manter você logado. Não usamos analytics nem pixels de marketing neste momento.

## Retenção

Mantemos os dados enquanto sua conta existir. Se você excluir a conta pelo app, removemos os dados de treino e o perfil no TapGym. Registros de cobrança podem permanecer na Stripe sob as regras dela. Cópias em backups de infraestrutura podem existir por um período limitado até rotação.

## Seus direitos

Você pode:

- Acessar e corrigir o nome no próprio app
- Excluir a conta pelo app (Conta → Excluir conta), o que apaga treinos e histórico associados
- Pedir informações sobre o tratamento pelo e-mail [contato@tapgym.com.br](mailto:contato@tapgym.com.br)

Pedidos feitos por e-mail (por exemplo, exportação manual nesta fase) são tratados com prazo interno documentado no mapa de dados do produto.

## Segurança

Adotamos controles razoáveis para um microSaaS: autenticação, restrição de acesso aos próprios dados (RLS), segredos em ambiente de produção e rate limit em rotas sensíveis. Nenhum sistema é absolutamente seguro.

## Alterações

Podemos atualizar esta política. A data no topo indica a versão vigente. Mudanças relevantes podem ser comunicadas no site ou por e-mail.

## Contato

Dúvidas sobre o produto ou sobre privacidade: [contato@tapgym.com.br](mailto:contato@tapgym.com.br).

Veja também os [Termos de uso](/termos).
