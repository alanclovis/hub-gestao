# Hub Gestão

Hub pessoal de gestão: **Projetos** (Kanban), **1:1s**, **Feedbacks** e **Pendências**.

Dados no seu **Gist privado**. App hospedado no **GitHub Pages** (sem Vercel) — acessível de qualquer PC.

## URL

Depois do deploy:

**https://alanclovis.github.io/hub-gestao/**

## Como entrar (qualquer máquina)

1. Abra a URL do Pages.
2. Crie um [Personal Access Token](https://github.com/settings/tokens/new?scopes=gist&description=Hub%20Gestao) com scope **`gist`**.
3. Cole o token na tela de login.
4. O token fica só naquele navegador (`localStorage`). Em outro PC, cole de novo o mesmo (ou outro) token da sua conta.

Na primeira gravação, o app cria o Gist privado `Hub Gestão — dados`.

## Ativar GitHub Pages

1. Repo → **Settings** → **Pages**
2. **Source:** GitHub Actions
3. Faça push na `master` (o workflow `Deploy GitHub Pages` publica automaticamente)

## Desenvolvimento local

```bash
npm install
npm run dev
```

Abra http://localhost:3000 — mesmo login por token (não precisa de OAuth App nem `.env`).

Build estático local:

```bash
GITHUB_PAGES=true npm run build
npx serve out
```

## Segurança

- Use token **só com scope `gist`** (não precisa de `repo`).
- Não compartilhe o token.
- Em PC compartilhado, clique em **Sair** ao terminar.

## OAuth App antigo

Se você criou um OAuth App para a tentativa com Vercel, pode apagar em  
[GitHub Developer settings](https://github.com/settings/developers) — não é mais usado.
