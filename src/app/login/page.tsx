"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export default function LoginPage() {
  const { loginWithToken, ready, token } = useAuth();
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && token) {
      router.replace("/");
    }
  }, [ready, token, router]);

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
          <strong>Personal Access Token</strong> do GitHub com permissão{" "}
          <code>gist</code>. Os dados ficam no seu Gist privado — acessível de
          qualquer PC pelo GitHub Pages.
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
              criar token
            </a>{" "}
            (scope <code>gist</code>)
          </li>
          <li>Copie o token e cole abaixo</li>
          <li>Ele fica só neste navegador (localStorage)</li>
        </ol>
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
