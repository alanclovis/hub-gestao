"use client";

import { useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { SaveBadge } from "@/components/save-badge";
import { useCollection } from "@/hooks/use-collection";
import type { Feedback } from "@/lib/types";

function emptyFeedback(): Feedback {
  const now = new Date().toISOString();
  return {
    id: nanoid(),
    deQuem: "",
    data: now.slice(0, 10),
    tema: "",
    contexto: "",
    createdAt: now,
    updatedAt: now,
  };
}

export default function FeedbacksPage() {
  const { data, setData, status, error } = useCollection("feedbacks");
  const [openId, setOpenId] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("");

  const items = useMemo(() => {
    const list = [...(data ?? [])].sort((a, b) => b.data.localeCompare(a.data));
    if (!filtro.trim()) return list;
    const q = filtro.toLowerCase();
    return list.filter(
      (f) =>
        f.deQuem.toLowerCase().includes(q) ||
        f.tema.toLowerCase().includes(q) ||
        f.contexto.toLowerCase().includes(q),
    );
  }, [data, filtro]);

  const open = data?.find((f) => f.id === openId) ?? null;

  const create = () => {
    const novo = emptyFeedback();
    setData((prev) => [novo, ...prev]);
    setOpenId(novo.id);
  };

  const patch = (next: Feedback) => {
    setData((prev) =>
      prev.map((f) =>
        f.id === next.id
          ? { ...next, updatedAt: new Date().toISOString() }
          : f,
      ),
    );
  };

  return (
    <>
      <header className="hub-page-head">
        <div>
          <h1>Feedbacks</h1>
          <p>O que você recebeu — de quem, quando e em que contexto.</p>
        </div>
        <SaveBadge status={status} error={error} />
      </header>

      <div className="list-toolbar">
        <input
          placeholder="Filtrar por pessoa, tema ou contexto…"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
            border: "1px solid var(--line)",
            borderRadius: 10,
            padding: "0.55rem 0.75rem",
            background: "#fff",
          }}
        />
        <button type="button" className="hub-primary-btn" onClick={create}>
          + Novo feedback
        </button>
      </div>

      {data === null ? (
        <p className="empty-hint">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="empty-hint">Nenhum feedback registrado.</p>
      ) : (
        <div className="list-stack">
          {items.map((f) => (
            <button
              type="button"
              key={f.id}
              className="list-item"
              onClick={() => setOpenId(f.id)}
              style={{ textAlign: "left", width: "100%" }}
            >
              <h3>{f.tema || "Sem tema"}</h3>
              <p className="meta">
                {f.deQuem || "—"} · {f.data}
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
              <h2>Feedback</h2>
              <button
                type="button"
                className="hub-ghost-btn"
                onClick={() => setOpenId(null)}
              >
                Fechar
              </button>
            </div>
            <div className="field">
              <label>De quem</label>
              <input
                value={open.deQuem}
                onChange={(e) => patch({ ...open, deQuem: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Data</label>
              <input
                type="date"
                value={open.data}
                onChange={(e) => patch({ ...open, data: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Tema</label>
              <input
                value={open.tema}
                onChange={(e) => patch({ ...open, tema: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Citação / contexto</label>
              <textarea
                value={open.contexto}
                onChange={(e) => patch({ ...open, contexto: e.target.value })}
              />
            </div>
            <button
              type="button"
              className="hub-ghost-btn"
              onClick={() => {
                setData((prev) => prev.filter((f) => f.id !== open.id));
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
