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
  const { data: projetos } = useCollection("projetos");
  const [draft, setDraft] = useState<Pendencia | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [dirty, setDirty] = useState(false);
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
    setDraft(emptyPendencia());
    setIsNew(true);
    setDirty(false);
  };

  const openExisting = (p: Pendencia) => {
    setDraft({ ...p });
    setIsNew(false);
    setDirty(false);
  };

  const patchDraft = (partial: Partial<Pendencia>) => {
    setDraft((prev) => (prev ? { ...prev, ...partial } : prev));
    setDirty(true);
  };

  const save = () => {
    if (!draft) return;
    if (!draft.titulo.trim()) {
      window.alert("Preencha o título antes de salvar.");
      return;
    }
    const stamped = { ...draft, updatedAt: new Date().toISOString() };
    if (isNew) setData((prev) => [stamped, ...prev]);
    else
      setData((prev) =>
        prev.map((p) => (p.id === stamped.id ? stamped : p)),
      );
    closeDrawer();
  };

  const deleteOpen = () => {
    if (!draft || isNew) {
      closeDrawer();
      return;
    }
    setData((prev) => prev.filter((p) => p.id !== draft.id));
    closeDrawer();
  };

  return (
    <>
      <header className="hub-page-head">
        <div>
          <p className="hub-kicker">Agenda</p>
          <h1>Pendências</h1>
          <p>O que ainda precisa fechar.</p>
        </div>
        <SaveBadge status={status} error={error} />
      </header>

      <div className="list-toolbar">
        <select
          className="list-filter list-filter-sm"
          value={filtroStatus}
          onChange={(e) =>
            setFiltroStatus(e.target.value as "todas" | PendenciaStatus)
          }
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
              onClick={() => openExisting(p)}
              style={{ textAlign: "left", width: "100%" }}
            >
              <h3>{p.titulo || "Sem título"}</h3>
              <p className="meta">
                {p.status === "aberta" ? "Aberta" : "Feita"}
                {p.prazo ? ` · prazo ${p.prazo}` : ""}
                {p.projetoId
                  ? ` · ${projetos?.find((x) => x.id === p.projetoId)?.titulo ?? "projeto"}`
                  : ""}
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
              <h2>{isNew ? "Nova pendência" : "Editar pendência"}</h2>
              <button type="button" className="hub-ghost-btn" onClick={tryClose}>
                Fechar
              </button>
            </div>
            <div className="drawer-scroll">
              <div className="field">
                <label>Título</label>
                <input
                  value={draft.titulo}
                  onChange={(e) => patchDraft({ titulo: e.target.value })}
                />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Status</label>
                  <select
                    value={draft.status}
                    onChange={(e) =>
                      patchDraft({
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
                    value={draft.prazo ?? ""}
                    onChange={(e) => patchDraft({ prazo: e.target.value })}
                  />
                </div>
              </div>
              <div className="field">
                <label>Notas</label>
                <textarea
                  rows={3}
                  value={draft.notas}
                  onChange={(e) => patchDraft({ notas: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Projeto (opcional)</label>
                <select
                  value={draft.projetoId ?? ""}
                  onChange={(e) =>
                    patchDraft({
                      projetoId: e.target.value || undefined,
                    })
                  }
                >
                  <option value="">Sem projeto</option>
                  {(projetos ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.titulo || "Sem título"}
                    </option>
                  ))}
                </select>
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
