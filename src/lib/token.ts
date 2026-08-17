const TOKEN_KEY = "hub-gestao-github-token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, sanitizeToken(token));
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

/** Remove espaços/quebras comuns ao colar o PAT. */
export function sanitizeToken(raw: string): string {
  return raw.replace(/\s+/g, "").trim();
}

function friendlyFetchError(err: unknown): Error {
  if (err instanceof TypeError) {
    return new Error(
      "Não foi possível falar com a API do GitHub (Failed to fetch). " +
        "Verifique internet, VPN/firewall e se algum bloqueador está impedindo api.github.com. " +
        "Use um Personal Access Token clássico com scope gist (não fine-grained).",
    );
  }
  if (err instanceof Error) return err;
  return new Error("Falha ao validar o token.");
}

export async function validateToken(token: string): Promise<{
  login: string;
  name: string | null;
  avatar: string | null;
}> {
  const cleaned = sanitizeToken(token);
  if (!cleaned) {
    throw new Error("Cole o token do GitHub.");
  }
  if (
    !cleaned.startsWith("ghp_") &&
    !cleaned.startsWith("github_pat_") &&
    !cleaned.startsWith("gho_")
  ) {
    throw new Error(
      "Token com formato inesperado. Crie um Personal Access Token (classic) com scope gist.",
    );
  }

  let res: Response;
  try {
    res = await fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${cleaned}`,
      },
      cache: "no-store",
    });
  } catch (err) {
    throw friendlyFetchError(err);
  }

  if (res.status === 401) {
    throw new Error(
      "Token inválido ou revogado. Crie um novo Personal Access Token (classic) com scope gist.",
    );
  }
  if (res.status === 403) {
    throw new Error(
      "Acesso negado (403). Confira SSO da organização ou se o token tem scope gist.",
    );
  }
  if (!res.ok) {
    throw new Error(
      `GitHub respondeu ${res.status}. Verifique o PAT e o scope gist.`,
    );
  }

  const user = (await res.json()) as {
    login: string;
    name: string | null;
    avatar_url: string | null;
  };
  return { login: user.login, name: user.name, avatar: user.avatar_url };
}
