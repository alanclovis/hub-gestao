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
  const [draft, setDraft] = useState<OneOnOne | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [dirty, setDirty] = useState(false);
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

  const closeDrawer = () => {
    setDraft(null);
    setIsNew(false);
    setDirty(false);
  };

  const tryClose = () => {
    if (dirty && !window.confirm("Descartar alterações não salvas?")) return;
    closeDrawer();
  };

  const create = () => {
    setDraft(emptyOneOnOne());
    setIsNew(true);
    setDirty(false);
  };

  const openExisting = (o: OneOnOne) => {
    setDraft({ ...o });
    setIsNew(false);
    setDirty(false);
  };

  const patchDraft = (partial: Partial<OneOnOne>) => {
    setDraft((prev) => (prev ? { ...prev, ...partial } : prev));
    setDirty(true);
  };

  const save = () => {
    if (!draft) return;
    if (!draft.pessoa.trim()) {
      window.alert("Preencha a pessoa antes de salvar.");
      return;
    }
    const stamped = { ...draft, updatedAt: new Date().toISOString() };
    if (isNew) setData((prev) => [stamped, ...prev]);
    else
      setData((prev) =>
        prev.map((o) => (o.id === stamped.id ? stamped : o)),
      );
    closeDrawer();
  };

  const deleteOpen = () => {
    if (!draft || isNew) {
      closeDrawer();
      return;
    }
    setData((prev) => prev.filter((o) => o.id !== draft.id));
    closeDrawer();
  };

  return (
    <>
      <header className="hub-page-head">
        <div>
          <h1>1:1s</h1>
          <p>Pautas, combinados e follow-ups.</p>
        </div>
        <SaveBadge status={status} error={error} />
      </header>

      <div className="list-toolbar">
        <input
          className="list-filter"
          placeholder="Filtrar por pessoa ou pauta…"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
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
              onClick={() => openExisting(o)}
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

      {draft ? (
        <>
          <div className="drawer-backdrop" onClick={tryClose} />
          <aside className="drawer">
            <div className="drawer-head">
              <h2>{isNew ? "Novo 1:1" : "Editar 1:1"}</h2>
              <button type="button" className="hub-ghost-btn" onClick={tryClose}>
                Fechar
              </button>
            </div>
            <div className="drawer-scroll">
              <div className="field">
                <label>Pessoa</label>
                <input
                  value={draft.pessoa}
                  onChange={(e) => patchDraft({ pessoa: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Data</label>
                <input
                  type="date"
                  value={draft.data}
                  onChange={(e) => patchDraft({ data: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Pauta</label>
                <textarea
                  rows={3}
                  value={draft.pauta}
                  onChange={(e) => patchDraft({ pauta: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Combinados</label>
                <textarea
                  rows={3}
                  value={draft.combinados}
                  onChange={(e) => patchDraft({ combinados: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Follow-ups</label>
                <textarea
                  rows={2}
                  value={draft.followUps}
                  onChange={(e) => patchDraft({ followUps: e.target.value })}
                />
              </div>
            </div>
            <div className="drawer-footer">
              <div className="drawer-actions">
                <button type="button" className="hub-primary-btn" onClick={save}>
                  Salvar
                </button>
                <button
                  type="button"
                  className="hub-secondary-btn"
                  onClick={tryClose}
                >
                  Cancelar
                </button>
                {!isNew ? (
                  <button
                    type="button"
                    className="hub-ghost-btn"
                    onClick={deleteOpen}
                  >
                    Excluir
                  </button>
                ) : null}
              </div>
            </div>
          </aside>
        </>
      ) : null}
    </>
  );
}
