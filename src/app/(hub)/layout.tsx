"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/components/auth-provider";

export default function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ready, token, sessionWarning } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !token) {
      router.replace("/login");
    }
  }, [ready, token, router]);

  if (!ready) {
    return (
      <div className="login-screen">
        <p className="empty-hint">Carregando…</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="login-screen">
        <p className="empty-hint">Redirecionando para login…</p>
      </div>
    );
  }

  return (
    <div className="hub-shell">
      <Sidebar />
      <main className="hub-main">
        {sessionWarning ? (
          <p
            className="empty-hint"
            style={{
              margin: "0.75rem 1rem 0",
              padding: "0.55rem 0.75rem",
              borderRadius: 10,
              background: "color-mix(in srgb, var(--highlight) 18%, #fff)",
              color: "var(--ink)",
            }}
          >
            Sessão mantida, mas a API falhou agora: {sessionWarning}
          </p>
        ) : null}
        <div className="hub-stage">{children}</div>
      </main>
    </div>
  );
}
