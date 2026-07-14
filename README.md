# Hub Gestão

Hub pessoal de gestão: **Projetos** (Kanban), **1:1s**, **Feedbacks** e **Pendências**.  
Os dados ficam num **Gist privado** na sua conta GitHub — acessível de qualquer lugar após o deploy.

## Stack

- Next.js 15 (App Router) + TypeScript
- Auth.js (NextAuth v5) com GitHub OAuth (`gist` scope)
- Persistência via GitHub Gist API
- Drag-and-drop com `@dnd-kit`

## Setup local

### 1. Variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha:

| Variável | Onde pegar |
|----------|------------|
| `GITHUB_ID` / `GITHUB_SECRET` | [GitHub OAuth Apps](https://github.com/settings/developers) → New OAuth App |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` no local |

**OAuth App:**
- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

### 2. Instalar e rodar

```bash
npm install
npm run dev
```

Abra http://localhost:3000 → **Entrar com GitHub**.

Na primeira leitura/gravação, o app cria automaticamente um Gist privado com description:

`Hub Gestão — dados`

Arquivos no Gist: `projetos.json`, `oneones.json`, `feedbacks.json`, `pendencias.json`, `meta.json`.

## Uso

| Área | Como usar |
|------|-----------|
| Projetos | `+ Novo projeto`, arraste entre colunas, clique no card para editar e adicionar updates diários |
| 1:1s | Registre pessoa, data, pauta, combinados, follow-ups |
| Feedbacks | De quem, tema, contexto |
| Pendências | Título, prazo, status aberta/feita |
| Home | Overview de pendências abertas, projetos em andamento e 1:1s recentes |

Cada alteração é salva no Gist com debounce (~500ms). O badge no topo mostra o status.

## Deploy (Vercel)

1. Crie o repositório no GitHub e faça push.
2. Importe no Vercel.
3. Configure as mesmas env vars; `NEXTAUTH_URL` = URL do deploy (ex.: `https://hub-gestao.vercel.app`).
4. Atualize o OAuth App:
   - Homepage = URL de produção
   - Callback = `https://SEU_DOMINIO/api/auth/callback/github`  
   (pode manter também o callback de localhost se o OAuth App aceitar um; em produção use um OAuth App separado ou URLs múltiplas se disponível.)

## Revisar o ano com IA

Com o Gist sincronizado, peça no Cursor:

> Leia os JSON do Gist “Hub Gestão — dados” (ou exporte `projetos.json` etc.) e classifique por KR, top 10 entregas e resumo executivo.

Ou use a API do GitHub Gist para baixar os arquivos.

## Scripts

```bash
npm run dev      # desenvolvimento
npm run build    # build produção
npm run start    # servidor produção
```
