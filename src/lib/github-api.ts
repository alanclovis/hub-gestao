/** Base da API GitHub no browser. Em localhost usa proxy same-origin. */
export function getGitHubApiBase(): string {
  if (typeof window === "undefined") return "https://api.github.com";
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return `${window.location.origin}/github-api`;
  }
  return "https://api.github.com";
}

export function githubApiUrl(path: string): string {
  const base = getGitHubApiBase().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
