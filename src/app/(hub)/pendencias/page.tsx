"use client";

import { useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { SaveBadge } from "@/components/save-badge";
import { useCollection } from "@/hooks/use-collection";
import type { Pendencia, PendenciaStatus } from "@/lib/types";

function emptyPendencia(): Pendencia {
  const now = new Date().toISOString();
  return {
    id: nanoid(),
    titulo: "",
    status: "aberta",
    prazo: "",
    notas: "",
    createdAt: now,
    updatedAt: now,
  };
}

export default function PendenciasPage() {
  const { data, setData, status, error } = useCollection("pendencias");
  const [openId, setOpenId] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<"todas" | PendenciaStatus>(
    "aberta",
  );

  const items = useMemo(() => {
    const list = [...(data ?? [])].sort((a, b) =>
      (a.prazo || "9999").localeCompare(b.prazo || "9999"),
    );
    if (filtroStatus === "todas") return list;
    return list.filter((p) => p.status === filtroStatus);
  }, [data, filtroStatus]);

  const open = data?.find((p) => p.id === openId) ?? null;

  const create = () => {
    const novo = emptyPendencia();
    setData((prev) => [novo, ...prev]);
    setOpenId(novo.id);
  };

  const patch = (next: Pendencia) => {
    setData((prev) =>
      prev.map((p) =>
        p.id === next.id
          ? { ...next, updatedAt: new Date().toISOString() }
          : p,
      ),
    );
  };

  return (
    <>
      <header className="hub-page-head">
        <div>
          <h1>Pendências</h1>
          <p>O que você precisa fazer — com prazo e notas.</p>
        </div>
        <SaveBadge status={status} error={error} />
      </header>

      <div className="list-toolbar">
        <select
          value={filtroStatus}
          onChange={(e) =>
            setFiltroStatus(e.target.value as "todas" | PendenciaStatus)
          }
          style={{
            border: "1px solid var(--line)",
            borderRadius: 10,
            padding: "0.55rem 0.75rem",
            background: "#fff",
          }}
        >
          <option value="aberta">Abertas</option>
          <option value="feita">Feitas</option>
          <option value="todas">Todas</option>
        </select>
        <button type="button" className="hub-primary-btn" onClick={create}>
          + Nova pendência
        </button>
      </div>

      {data === null ? (
        <p className="empty-hint">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="empty-hint">Nada por aqui.</p>
      ) : (
        <div className="list-stack">
          {items.map((p) => (
            <button
              type="button"
              key={p.id}
              className={`list-item${p.status === "feita" ? " is-done" : ""}`}
              onClick={() => setOpenId(p.id)}
              style={{ textAlign: "left", width: "100%" }}
            >
              <h3>{p.titulo || "Sem título"}</h3>
              <p className="meta">
                {p.status === "aberta" ? "Aberta" : "Feita"}
                {p.prazo ? ` · prazo ${p.prazo}` : ""}
              </p>
            </button>
          ))}
        </div>
      )}

      {open ? (
        <>
          <div className="drawer-backdrop" onClick={() => setOpenId(null)} />
          <aside className="drawer">
            <div className="drawer-head">
              <h2>Pendência</h2>
              <button
                type="button"
                className="hub-ghost-btn"
                onClick={() => setOpenId(null)}
              >
                Fechar
              </button>
            </div>
            <div className="field">
              <label>Título</label>
              <input
                value={open.titulo}
                onChange={(e) => patch({ ...open, titulo: e.target.value })}
              />
            </div>
            <div className="field-row">
              <div className="field">
                <label>Status</label>
                <select
                  value={open.status}
                  onChange={(e) =>
                    patch({
                      ...open,
                      status: e.target.value as PendenciaStatus,
                    })
                  }
                >
                  <option value="aberta">Aberta</option>
                  <option value="feita">Feita</option>
                </select>
              </div>
              <div className="field">
                <label>Prazo</label>
                <input
                  type="date"
                  value={open.prazo ?? ""}
                  onChange={(e) => patch({ ...open, prazo: e.target.value })}
                />
              </div>
            </div>
            <div className="field">
              <label>Notas</label>
              <textarea
                value={open.notas}
                onChange={(e) => patch({ ...open, notas: e.target.value })}
              />
            </div>
            <div className="field-row">
              <div className="field">
                <label>Projeto ID (opcional)</label>
                <input
                  value={open.projetoId ?? ""}
                  onChange={(e) =>
                    patch({ ...open, projetoId: e.target.value || undefined })
                  }
                />
              </div>
              <div className="field">
                <label>1:1 ID (opcional)</label>
                <input
                  value={open.oneOnOneId ?? ""}
                  onChange={(e) =>
                    patch({
                      ...open,
                      oneOnOneId: e.target.value || undefined,
                    })
                  }
                />
              </div>
            </div>
            <button
              type="button"
              className="hub-ghost-btn"
              onClick={() => {
                setData((prev) => prev.filter((p) => p.id !== open.id));
                setOpenId(null);
              }}
            >
              Excluir
            </button>
          </aside>
        </>
      ) : null}
    </>
  );
}
