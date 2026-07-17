"use client";

import { useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { SaveBadge } from "@/components/save-badge";
import { useCollection } from "@/hooks/use-collection";
import {
  comparePendenciasByPriorityAndPrazo,
  completePendenciaAsAtividade,
  pendenciaPrioridadeLabel,
  pendenciaPrioridadeOrDefault,
} from "@/lib/pendencia-sync";
import type { Pendencia, PendenciaPrioridade, PendenciaStatus } from "@/lib/types";
import { PENDENCIA_PRIORIDADES } from "@/lib/types";

function emptyPendencia(): Pendencia {
  const now = new Date().toISOString();
  return {
    id: nanoid(),
    titulo: "",
    status: "aberta",
    prioridade: "media",
    prazo: "",
    notas: "",
    createdAt: now,
    updatedAt: now,
  };
}

export default function PendenciasPage() {
  const { data, setData, status, error } = useCollection("pendencias");
  const {
    data: projetos,
    setData: setProjetos,
    status: statusP,
    error: errorP,
  } = useCollection("projetos");
  const {
    data: atividades,
    setData: setAtividades,
    status: statusA,
    error: errorA,
  } = useCollection("atividades");

  const [draft, setDraft] = useState<Pendencia | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<"todas" | PendenciaStatus>(
    "aberta",
  );

  const saveStatus =
    status === "error" || statusP === "error" || statusA === "error"
      ? "error"
      : status === "saving" || statusP === "saving" || statusA === "saving"
        ? "saving"
        : status === "loading" || statusP === "loading" || statusA === "loading"
          ? "loading"
          : status === "saved" || statusP === "saved" || statusA === "saved"
            ? "saved"
            : "idle";
  const saveError = error || errorP || errorA;

  const items = useMemo(() => {
    const list = [...(data ?? [])].sort(comparePendenciasByPriorityAndPrazo);
    if (filtroStatus === "todas") return list;
    return list.filter((p) => p.status === filtroStatus);
  }, [data, filtroStatus]);

  const projetoTitulo = (id?: string) =>
    projetos?.find((p) => p.id === id)?.titulo ?? "projeto";

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

  const persistPendencia = (next: Pendencia) => {
    const stamped = { ...next, updatedAt: new Date().toISOString() };
    const exists = (data ?? []).some((p) => p.id === stamped.id);
    if (exists) {
      setData((prev) =>
        prev.map((p) => (p.id === stamped.id ? stamped : p)),
      );
    } else {
      setData((prev) => [stamped, ...prev]);
    }
    return stamped;
  };

  /** Conclui virando atividade (+ update no projeto se houver vínculo). */
  const completeAsAtividade = (p: Pendencia) => {
    if (!p.titulo.trim()) {
      window.alert("Preencha o título antes de concluir.");
      return;
    }
    if (projetos === null || atividades === null) {
      window.alert("Aguarde o carregamento dos dados e tente de novo.");
      return;
    }
    const result = completePendenciaAsAtividade(p, projetos, atividades);
    setProjetos(() => result.projetos);
    setAtividades(() => result.atividades);
    persistPendencia(result.pendencia);
    closeDrawer();
  };

  const prepareAndComplete = () => {
    if (!draft) return;
    if (!draft.titulo.trim()) {
      window.alert("Preencha o título antes de concluir.");
      return;
    }
    const base =
      isNew || !(data ?? []).some((p) => p.id === draft.id)
        ? persistPendencia({ ...draft, status: "aberta" })
        : draft;
    completeAsAtividade({ ...base, ...draft, status: "aberta" });
  };

  const save = () => {
    if (!draft) return;
    if (!draft.titulo.trim()) {
      window.alert("Preencha o título antes de salvar.");
      return;
    }
    persistPendencia(draft);
    closeDrawer();
  };

  const markOpen = (p: Pendencia) => {
    if (p.status === "aberta") return;
    persistPendencia({ ...p, status: "aberta" });
    if (draft?.id === p.id) {
      setDraft({ ...p, status: "aberta" });
      setDirty(false);
    }
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
          <p>
            Concluir ou transformar vira atividade. Com projeto, também gera
            update.
          </p>
        </div>
        <SaveBadge status={saveStatus} error={saveError} />
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

      {data === null || projetos === null || atividades === null ? (
        <p className="empty-hint">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="empty-hint">Nada por aqui.</p>
      ) : (
        <div className="list-stack">
          {items.map((p) => {
            const prioridade = pendenciaPrioridadeOrDefault(p);
            return (
            <div
              key={p.id}
              className={`list-item list-item-row pend-priority-border--${prioridade}${p.status === "feita" ? " is-done" : ""}`}
            >
              <button
                type="button"
                className="list-item-main"
                onClick={() => openExisting(p)}
              >
                <h3>
                  <span
                    className={`pend-priority-badge pend-priority-badge--${prioridade}`}
                  >
                    {pendenciaPrioridadeLabel(prioridade)}
                  </span>
                  {p.titulo || "Sem título"}
                </h3>
                <p className="meta">
                  {p.status === "aberta" ? "Aberta" : "Concluída"}
                  {p.prazo ? ` · prazo ${p.prazo}` : ""}
                  {p.projetoId ? ` · ${projetoTitulo(p.projetoId)}` : ""}
                </p>
              </button>
              {p.status === "aberta" ? (
                <button
                  type="button"
                  className="hub-secondary-btn pend-done-btn"
                  onClick={() => completeAsAtividade(p)}
                >
                  Concluir
                </button>
              ) : (
                <button
                  type="button"
                  className="hub-ghost-btn pend-done-btn"
                  onClick={() => markOpen(p)}
                >
                  Reabrir
                </button>
              )}
            </div>
            );
          })}
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
              <div className="field">
                <label>Prioridade</label>
                <select
                  value={draft.prioridade ?? "media"}
                  onChange={(e) =>
                    patchDraft({
                      prioridade: e.target.value as PendenciaPrioridade,
                    })
                  }
                >
                  {PENDENCIA_PRIORIDADES.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
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
              {draft.status === "aberta" ? (
                <p className="empty-hint">
                  Concluir ou transformar cria uma atividade
                  {draft.projetoId
                    ? ` e um update em ${projetoTitulo(draft.projetoId)}`
                    : ""}
                  .
                </p>
              ) : (
                <p className="empty-hint">Status: concluída.</p>
              )}
            </div>
            <div className="drawer-footer">
              <div className="drawer-actions">
                {draft.status === "aberta" ? (
                  <>
                    <button
                      type="button"
                      className="hub-primary-btn"
                      onClick={prepareAndComplete}
                    >
                      Marcar como concluída
                    </button>
                    <button
                      type="button"
                      className="hub-secondary-btn"
                      onClick={prepareAndComplete}
                    >
                      Transformar em atividade
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="hub-secondary-btn"
                    onClick={() => {
                      persistPendencia({ ...draft, status: "aberta" });
                      setDraft({ ...draft, status: "aberta" });
                      setDirty(false);
                    }}
                  >
                    Reabrir
                  </button>
                )}
                <button
                  type="button"
                  className="hub-secondary-btn"
                  onClick={save}
                >
                  Salvar
                </button>
                <button
                  type="button"
                  className="hub-ghost-btn"
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
