"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { probeGitHubApi } from "@/lib/token";

export default function LoginPage() {
  const { loginWithToken, ready, token } = useAuth();
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [probe, setProbe] = useState<{ ok: boolean; detail: string } | null>(
    null,
  );
  const [probing, setProbing] = useState(false);

  useEffect(() => {
    if (ready && token) {
      router.replace("/");
    }
  }, [ready, token, router]);

  useEffect(() => {
    let cancelled = false;
    setProbing(true);
    void probeGitHubApi().then((result) => {
      if (!cancelled) {
        setProbe(result);
        setProbing(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await loginWithToken(value);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no login");
    } finally {
      setLoading(false);
    }
  };

  const runProbe = async () => {
    setProbing(true);
    setProbe(await probeGitHubApi());
    setProbing(false);
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div
          className="hub-brand"
          style={{ justifyContent: "center", marginBottom: "1rem" }}
        >
          <span className="hub-brand-mark">BF</span>
        </div>
        <h1>BF</h1>
        <p>
          Seu best friend de gestão. Sem Vercel: use um{" "}
          <strong>Personal Access Token (classic)</strong> do GitHub com
          permissão <code>gist</code>. Os dados ficam no seu Gist privado.
        </p>
        <ol
          style={{
            textAlign: "left",
            color: "var(--ink-muted)",
            fontSize: "0.9rem",
            lineHeight: 1.45,
            paddingLeft: "1.2rem",
          }}
        >
          <li>
            Abra{" "}
            <a
              href="https://github.com/settings/tokens/new?scopes=gist&description=Hub%20Gestao"
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--teal)", textDecoration: "underline" }}
            >
              criar token classic
            </a>{" "}
            (marque só <code>gist</code> — não use fine-grained)
          </li>
          <li>
            Copie o token completo (começa com <code>ghp_</code>)
          </li>
          <li>Ele fica só neste navegador (localStorage)</li>
        </ol>

        <p
          className="empty-hint"
          style={{
            marginTop: "1rem",
            textAlign: "left",
            color: probe && !probe.ok ? "var(--danger)" : undefined,
          }}
        >
          {probing
            ? "Testando conexão com a API…"
            : probe
              ? probe.ok
                ? `✓ ${probe.detail}`
                : `✗ ${probe.detail}`
              : null}
          {!probing ? (
            <>
              {" "}
              <button
                type="button"
                className="hub-ghost-btn"
                onClick={() => void runProbe()}
                style={{ display: "inline", padding: "0.15rem 0.45rem" }}
              >
                testar de novo
              </button>
            </>
          ) : null}
        </p>
        {probe && !probe.ok ? (
          <p
            className="empty-hint"
            style={{ textAlign: "left", marginTop: "0.5rem" }}
          >
            Se a API estiver fora:{" "}
            <a
              href="https://www.githubstatus.com"
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--teal)", textDecoration: "underline" }}
            >
              githubstatus.com
            </a>
            . Na rede corporativa, no terminal do projeto:{" "}
            <code>npm run local</code> e abra{" "}
            <code>http://localhost:4173</code>.
          </p>
        ) : null}

        <form onSubmit={onSubmit} style={{ marginTop: "1.25rem" }}>
          <div className="field" style={{ textAlign: "left" }}>
            <label>GitHub token</label>
            <input
              type="password"
              autoComplete="off"
              placeholder="ghp_..."
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />
          </div>
          {error ? (
            <p style={{ color: "var(--danger)", fontSize: "0.9rem" }}>{error}</p>
          ) : null}
          <button
            type="submit"
            className="hub-primary-btn"
            disabled={loading || !value.trim()}
            style={{ width: "100%" }}
          >
            {loading ? "Validando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
