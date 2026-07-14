const TOKEN_KEY = "hub-gestao-github-token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token.trim());
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

export async function validateToken(token: string): Promise<{
  login: string;
  name: string | null;
  avatar: string | null;
}> {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) {
    throw new Error("Token inválido. Verifique o PAT e o scope gist.");
  }
  const user = (await res.json()) as {
    login: string;
    name: string | null;
    avatar_url: string | null;
  };
  return { login: user.login, name: user.name, avatar: user.avatar_url };
}
