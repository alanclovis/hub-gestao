"use client";

import Link from "next/link";
import { useAllData } from "@/hooks/use-collection";
import { SaveBadge } from "@/components/save-badge";

export default function HomePage() {
  const { data, status, error } = useAllData();

  const pendencias = (data?.pendencias ?? []).filter((p) => p.status === "aberta");
  const projetos = (data?.projetos ?? []).filter((p) => p.status === "em_andamento");
  const oneones = [...(data?.oneones ?? [])].sort((a, b) =>
    b.data.localeCompare(a.data),
  ).slice(0, 5);

  return (
    <>
      <header className="hub-page-head">
        <div>
          <h1>Hoje</h1>
          <p>Overview do que está em aberto e em movimento.</p>
        </div>
        <SaveBadge status={status} error={error} />
      </header>

      <div className="overview-grid">
        <section className="overview-panel">
          <h2>Pendências abertas</h2>
          {pendencias.length === 0 ? (
            <p className="empty-hint">Nenhuma pendência aberta.</p>
          ) : (
            <ul className="overview-list">
              {pendencias.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <span>{p.titulo}</span>
                  <span className="muted">{p.prazo || "sem prazo"}</span>
                </li>
              ))}
            </ul>
          )}
          <p style={{ marginTop: "1rem" }}>
            <Link href="/pendencias" className="hub-secondary-btn">
              Ver pendências
            </Link>
          </p>
        </section>

        <section className="overview-panel">
          <h2>Projetos em andamento</h2>
          {projetos.length === 0 ? (
            <p className="empty-hint">Nenhum projeto em andamento.</p>
          ) : (
            <ul className="overview-list">
              {projetos.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <span>{p.titulo}</span>
                  <span className="muted">{p.kr || "sem KR"}</span>
                </li>
              ))}
            </ul>
          )}
          <p style={{ marginTop: "1rem" }}>
            <Link href="/projetos" className="hub-secondary-btn">
              Abrir board
            </Link>
          </p>
        </section>

        <section className="overview-panel">
          <h2>1:1s recentes</h2>
          {oneones.length === 0 ? (
            <p className="empty-hint">Nenhum 1:1 registrado.</p>
          ) : (
            <ul className="overview-list">
              {oneones.map((o) => (
                <li key={o.id}>
                  <span>{o.pessoa}</span>
                  <span className="muted">{o.data}</span>
                </li>
              ))}
            </ul>
          )}
          <p style={{ marginTop: "1rem" }}>
            <Link href="/one-ones" className="hub-secondary-btn">
              Ver 1:1s
            </Link>
          </p>
        </section>
      </div>
    </>
  );
}
