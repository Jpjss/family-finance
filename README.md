# Family Finance

Aplicativo simples para controle financeiro pessoal (Next.js + TypeScript + Tailwind).

Este README descreve como rodar o projeto localmente, procedimentos de deploy, variáveis de ambiente e opções de migração de dados do `localStorage` para MongoDB Atlas.

---

## Sumário

- Requisitos
- Instalação
- Rodando em desenvolvimento
- Build e produção
- Variáveis de ambiente
- Export / Import de dados (backup local)
- Migrando dados do `localStorage` para MongoDB Atlas
- Deploy no Vercel
- Estrutura do projeto
- Contato / Próximos passos

---

## Requisitos

- Node.js 18+ (recomendado)
- npm (ou pnpm/yarn)
- Conta no Vercel (para deploy)
- Opcional: conta MongoDB Atlas (para persistência em nuvem)

---

## Instalação

No Windows PowerShell, na pasta do projeto:

```powershell
npm install
```

---

## Rodando em desenvolvimento

```powershell
npm run dev
```

O app será servido em `http://localhost:3000` (se 3000 estiver ocupado, o Next tentará outra porta).

---

## Build e produção (local)

```powershell
npm run build
npm start
```

---

## Variáveis de ambiente

O projeto usa (opcionalmente) `MONGODB_URI` quando você configurar o MongoDB Atlas para persistência server-side.

- `MONGODB_URI`: string de conexão do MongoDB Atlas no formato `mongodb+srv://<user>:<pass>@<cluster>/<dbname>?retryWrites=true&w=majority`

Ao usar Vercel, adicione essa variável nas configurações do projeto (Project → Settings → Environment Variables) para os ambientes `Preview` e `Production`.

---

## Export / Import de dados (backup local)

O projeto inclui uma opção para exportar as anotações mensais como JSON (botão "Exportar Todas"). Para transferir dados entre navegadores:

1. Clique em "Exportar Todas" e baixe o arquivo JSON.
2. No outro navegador/PC, ainda não existe um import automático por padrão; você pode colar manualmente no `localStorage` ou executar um script de import.

Se quiser, posso adicionar no projeto uma rota/funcionalidade de `Import` para carregar esse JSON diretamente no app.

---

## Migrando dados do `localStorage` para MongoDB Atlas

Opções:

A) Script de migração local (sugestão)
- Criar um arquivo `scripts/migrate-local-to-atlas.js` que lê um JSON exportado e insere em coleções `transactions` e `monthlyNotes`.
- Instalar dependência: `npm i mongodb`.
- Executar:

```powershell
$env:MONGODB_URI="mongodb+srv://user:pass@cluster/family-finance?retryWrites=true&w=majority"
node scripts/migrate-local-to-atlas.js ./exported-data.json
```

B) Rota de import no servidor
- Implementar `POST /api/import` que aceite o JSON e grave no banco (mais segura quando hospedada e autenticada).

Posso gerar o script `scripts/migrate-local-to-atlas.js` e/ou a rota de import se desejar.

---

## Deploy no Vercel

1. Commit e push para o repositório Git (GitHub/GitLab/Bitbucket).
2. Conecte o repositório no Vercel (ou use `vercel` CLI).
3. Configure `MONGODB_URI` em Project → Settings → Environment Variables.
4. Deploy através do Vercel (deploy automático via push ou `vercel --prod`).

---

## Estrutura do projeto (resumo)

- `app/` - rotas e páginas (App Router)
- `components/` - componentes React reutilizáveis
- `lib/` - helpers, conexão com MongoDB e modelos
- `public/` - assets
- `styles/` - estilos Tailwind / CSS

---

## Contato / Próximos passos

Se quiser, posso:
- Adicionar funcionalidade de `Import` no frontend
- Criar o script de migração para MongoDB Atlas
- Implementar persistência server-side usando MongoDB Atlas (rotas + modelos)

Escolha uma opção e eu implemento os próximos passos.
