"use client";

import { useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { SaveBadge } from "@/components/save-badge";
import { useCollection } from "@/hooks/use-collection";
import type { OneOnOne } from "@/lib/types";

function emptyOneOnOne(): OneOnOne {
  const now = new Date().toISOString();
  return {
    id: nanoid(),
    pessoa: "",
    data: now.slice(0, 10),
    pauta: "",
    combinados: "",
    followUps: "",
    createdAt: now,
    updatedAt: now,
  };
}

export default function OneOnesPage() {
  const { data, setData, status, error } = useCollection("oneones");
  const [openId, setOpenId] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("");

  const items = useMemo(() => {
    const list = [...(data ?? [])].sort((a, b) => b.data.localeCompare(a.data));
    if (!filtro.trim()) return list;
    const q = filtro.toLowerCase();
    return list.filter(
      (o) =>
        o.pessoa.toLowerCase().includes(q) ||
        o.pauta.toLowerCase().includes(q),
    );
  }, [data, filtro]);

  const open = data?.find((o) => o.id === openId) ?? null;

  const create = () => {
    const novo = emptyOneOnOne();
    setData((prev) => [novo, ...prev]);
    setOpenId(novo.id);
  };

  const patch = (next: OneOnOne) => {
    setData((prev) =>
      prev.map((o) =>
        o.id === next.id
          ? { ...next, updatedAt: new Date().toISOString() }
          : o,
      ),
    );
  };

  return (
    <>
      <header className="hub-page-head">
        <div>
          <h1>1:1s</h1>
          <p>Pauta, combinados e follow-ups por pessoa.</p>
        </div>
        <SaveBadge status={status} error={error} />
      </header>

      <div className="list-toolbar">
        <input
          placeholder="Filtrar por pessoa ou pauta…"
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
          + Novo 1:1
        </button>
      </div>

      {data === null ? (
        <p className="empty-hint">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="empty-hint">Nenhum 1:1 ainda. Crie o primeiro.</p>
      ) : (
        <div className="list-stack">
          {items.map((o) => (
            <button
              type="button"
              key={o.id}
              className="list-item"
              onClick={() => setOpenId(o.id)}
              style={{ textAlign: "left", width: "100%" }}
            >
              <h3>{o.pessoa || "Sem pessoa"}</h3>
              <p className="meta">
                {o.data}
                {o.followUps ? ` · follow-up: ${o.followUps.slice(0, 60)}` : ""}
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
              <h2>1:1</h2>
              <button
                type="button"
                className="hub-ghost-btn"
                onClick={() => setOpenId(null)}
              >
                Fechar
              </button>
            </div>
            <div className="field">
              <label>Pessoa</label>
              <input
                value={open.pessoa}
                onChange={(e) => patch({ ...open, pessoa: e.target.value })}
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
              <label>Pauta</label>
              <textarea
                value={open.pauta}
                onChange={(e) => patch({ ...open, pauta: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Combinados</label>
              <textarea
                value={open.combinados}
                onChange={(e) =>
                  patch({ ...open, combinados: e.target.value })
                }
              />
            </div>
            <div className="field">
              <label>Follow-ups</label>
              <textarea
                value={open.followUps}
                onChange={(e) =>
                  patch({ ...open, followUps: e.target.value })
                }
              />
            </div>
            <button
              type="button"
              className="hub-ghost-btn"
              onClick={() => {
                setData((prev) => prev.filter((o) => o.id !== open.id));
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
