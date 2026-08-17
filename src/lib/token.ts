import { githubApiUrl } from "./github-api";

const TOKEN_KEY = "hub-gestao-github-token";

export type TokenErrorKind = "invalid" | "forbidden" | "transient";

export class TokenValidationError extends Error {
  readonly kind: TokenErrorKind;

  constructor(message: string, kind: TokenErrorKind) {
    super(message);
    this.name = "TokenValidationError";
    this.kind = kind;
  }
}

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

/** Ping sem token — só para diagnosticar se a API responde neste browser. */
export async function probeGitHubApi(): Promise<{ ok: boolean; detail: string }> {
  try {
    const res = await fetch(githubApiUrl("/"), {
      method: "GET",
      cache: "no-store",
    });
    if (res.status >= 500) {
      return {
        ok: false,
        detail: `API instável (HTTP ${res.status}). Veja githubstatus.com`,
      };
    }
    if (!res.ok && res.status !== 401 && res.status !== 403) {
      return { ok: false, detail: `API respondeu HTTP ${res.status}` };
    }
    return { ok: true, detail: "API alcançável neste navegador" };
  } catch (err) {
    return {
      ok: false,
      detail:
        err instanceof TypeError
          ? "Browser não alcança a API (rede/VPN/adblock ou outage). Tente npm run local"
          : err instanceof Error
            ? err.message
            : "Falha desconhecida",
    };
  }
}

export async function validateToken(token: string): Promise<{
  login: string;
  name: string | null;
  avatar: string | null;
}> {
  const cleaned = sanitizeToken(token);
  if (!cleaned) {
    throw new TokenValidationError("Cole o token do GitHub.", "invalid");
  }
  if (
    !cleaned.startsWith("ghp_") &&
    !cleaned.startsWith("github_pat_") &&
    !cleaned.startsWith("gho_")
  ) {
    throw new TokenValidationError(
      "Token com formato inesperado. Crie um Personal Access Token (classic) com scope gist.",
      "invalid",
    );
  }

  let res: Response;
  try {
    res = await fetch(githubApiUrl("/user"), {
      headers: {
        Authorization: `Bearer ${cleaned}`,
      },
      cache: "no-store",
    });
  } catch {
    throw new TokenValidationError(
      "Não foi possível falar com a API do GitHub (Failed to fetch). " +
        "Pode ser outage (githubstatus.com), VPN/firewall ou bloqueador. " +
        "Na rede corporativa, rode localmente: npm run local",
      "transient",
    );
  }

  if (res.status === 401) {
    throw new TokenValidationError(
      "Token inválido ou revogado. Crie um novo Personal Access Token (classic) com scope gist.",
      "invalid",
    );
  }
  if (res.status === 403) {
    throw new TokenValidationError(
      "Acesso negado (403). Confira SSO da organização ou se o token tem scope gist.",
      "forbidden",
    );
  }
  if (res.status >= 500) {
    throw new TokenValidationError(
      `API do GitHub instável (HTTP ${res.status}). Veja https://www.githubstatus.com e tente de novo.`,
      "transient",
    );
  }
  if (!res.ok) {
    throw new TokenValidationError(
      `GitHub respondeu ${res.status}. Verifique o PAT e o scope gist.`,
      "transient",
    );
  }

  const user = (await res.json()) as {
    login: string;
    name: string | null;
    avatar_url: string | null;
  };
  return { login: user.login, name: user.name, avatar: user.avatar_url };
}
