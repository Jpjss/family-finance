# Family Finance

Controle financeiro em Next.js, React e TypeScript, com parcelamentos e lembretes de vencimento.

## Executar

Use Node.js 20 ou superior e instale as dependências:

```powershell
npm.cmd ci --legacy-peer-deps
npm.cmd run dev
```

Abra http://localhost:3000. Sem variáveis de ambiente, o modo **Neste navegador** permite cadastrar contas, receitas e despesas parceladas. Os dados ficam no localStorage e não geram notificações externas.

## Parcelamentos

Informe o valor total, quantidade de parcelas (1 a 360) e primeiro vencimento. Cada parcela tem seu próprio valor, mês e status de pagamento. Os centavos restantes são distribuídos entre as primeiras parcelas, mantendo o total. Datas como dia 31 usam o último dia dos meses menores, sem deslocar os vencimentos seguintes.

O filtro **Período dos gastos** controla os cartões, a lista, as ações rápidas e a análise. **Todos os meses** mostra também as parcelas futuras. Despesas antigas sem vencimento continuam no mês de cadastro e não recebem lembretes. O pagamento só aparece como concluído depois de salvo.

## Sincronização e contas existentes

Copie `.env.example` para `.env.local` e configure `MONGODB_URI` e `AUTH_SECRET` (segredo aleatório com pelo menos 32 caracteres). O banco utilizado é `family-finance`. Reinicie o servidor.

Na tela inicial, escolha **Sincronizado — com lembretes**. Contas locais precisam ser cadastradas também nesse modo; use o mesmo e-mail para localizar a cópia local. Após entrar, o painel oferece **Importar gastos locais**. A importação usa IDs estáveis e pode ser repetida após uma falha sem duplicar registros. A cópia original permanece no navegador. As anotações mensais continuam locais.

O servidor autentica com tokens assinados e senhas com hash. Sessões antigas do servidor precisam de novo login; tokens locais não autorizam chamadas ao servidor. `login-temp` foi desativado. Não há sincronização automática entre os dois modos depois da importação: use o modo sincronizado para atualizar pagamentos que devem interromper os avisos.

## E-mail e WhatsApp

Os conectores estão implementados, mas dependem de contas e credenciais externas. Nenhum envio é ativado por padrão.

1. **Resend:** configure `RESEND_API_KEY` e `NOTIFICATION_FROM_EMAIL` com um remetente em domínio verificado. O sistema usa a API de e-mails e uma chave de idempotência por parcela/dia/canal. [Documentação do envio](https://resend.com/docs/api-reference/emails/send-email).
2. **Twilio:** configure `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` no formato `whatsapp:+...` e `TWILIO_WHATSAPP_CONTENT_SID`. Use um remetente WhatsApp habilitado e um template aprovado. Os lembretes proativos usam `ContentSid` e `ContentVariables`. [Documentação dos templates](https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates).
3. Cadastre o template com estas variáveis, na ordem:
   - `{{1}}`: descrição e identificação da parcela;
   - `{{2}}`: valor em reais;
   - `{{3}}`: vencimento em DD/MM/AAAA;
   - `{{4}}`: situação: “vence em 2 dias”, “vence hoje” ou “está vencida”.

Exemplo de texto para submeter à aprovação:

> Finanças Familiares: o pagamento de {{1}}, no valor de {{2}}, com vencimento em {{3}}, {{4}}. Marque a parcela como paga no aplicativo para encerrar seus lembretes. Você pode desativar os avisos nas preferências.

4. Configure um `CRON_SECRET` aleatório com pelo menos 32 caracteres, diferente de `AUTH_SECRET`.
5. Publique o app, habilite os canais desejados em **Lembretes de vencimento** e informe o próprio número com código do país e DDD (ex.: +5511999999999).
6. Defina `REMINDERS_ENABLED=true` no servidor e faça novo deploy. Serviços podem cobrar pelos envios; consulte as contas contratadas.

## Rotina automática

`vercel.json` agenda `GET /api/cron/reminders` diariamente às 12h UTC, equivalente às 9h em Brasília. A Vercel envia o `CRON_SECRET` no cabeçalho de autorização. O cron depende de uma implantação de produção e dos limites do plano; em outros hosts configure um agendador para chamar a mesma rota. [Gerenciamento de cron na Vercel](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

Cabeçalho exigido: `Authorization: Bearer <CRON_SECRET>`. Não exponha essa chave no navegador. Para conferir candidatos sem enviar ou consumir as chaves dos avisos, use a rota com `?dryRun=1`.

A rotina considera a data no fuso `America/Sao_Paulo`: avisa em D-2, no vencimento e todos os dias posteriores enquanto a parcela estiver pendente. Não avisa em D-1. Cada parcela e canal têm um registro por dia em `notificationDeliveries`, com reserva atômica para evitar duplicação entre execuções concorrentes. O pagamento é consultado novamente imediatamente antes do envio. Uma mensagem já submetida ao serviço não pode ser recolhida.

Falhas confirmadas podem ser tentadas novamente em outra execução do mesmo dia, após 10 minutos, até três tentativas. Respostas incertas (timeout, erro 5xx ou execução interrompida) ficam como **Envio não confirmado**, sem reenvio automático no mesmo dia, para evitar duplicatas no WhatsApp. Consulte o provedor nesses casos. O dia seguinte tem sua própria chave. “Aceito pelo serviço” não garante entrega final; consulte os painéis de Resend/Twilio para entrega e bloqueios.

Cada execução trabalha por até aproximadamente 45 segundos antes de terminar o lote. Se `incomplete=true`, execute a rota novamente no mesmo dia para continuar; para volumes maiores configure chamadas mais frequentes após as 9h, conforme seu plano de hospedagem. Execuções ignoram parcelas já processadas. Um agendador fora do ar não recupera avisos de dias passados: processa a situação da data atual.

O painel mostra a configuração dos serviços, a última execução e os últimos registros de envio. Nenhum serviço externo ou deploy é configurado apenas por instalar as dependências.

## Verificação

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
```

Os testes usam respostas simuladas para os provedores e não enviam mensagens. Cobrem centavos, fim de mês/ano, anos bissextos, datas em Brasília, regras de aviso, idempotência e interrupção após pagamento.
