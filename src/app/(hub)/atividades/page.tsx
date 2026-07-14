"use client";

import { MentionInput } from "@/components/mention-input";
import { MentionText } from "@/components/mention-text";
import { SaveBadge } from "@/components/save-badge";
import { useCollection } from "@/hooks/use-collection";
import {
  removeAtividadeMirror,
  syncAtividadeIntoProjetos,
} from "@/lib/atividade-sync";
import { collectPeople } from "@/lib/mentions";
import type { Atividade } from "@/lib/types";
import { useMemo, useState } from "react";
import { nanoid } from "nanoid";

function emptyAtividade(): Atividade {
  const now = new Date().toISOString();
  return {
    id: nanoid(),
    date: now.slice(0, 10),
    titulo: "",
    decisao: "",
    evidencia: "",
    resultado: "",
    notas: "",
    createdAt: now,
    updatedAt: now,
  };
}

export default function AtividadesPage() {
  const {
    data: atividades,
    setData: setAtividades,
    status: statusA,
    error: errorA,
  } = useCollection("atividades");
  const {
    data: projetos,
    setData: setProjetos,
    status: statusP,
    error: errorP,
  } = useCollection("projetos");
  const { data: feedbacks } = useCollection("feedbacks");
  const { data: oneones } = useCollection("oneones");

  const [draft, setDraft] = useState<Atividade | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [filtro, setFiltro] = useState("");

  const people = useMemo(
    () =>
      collectPeople({
        feedbacks,
        atividades,
        projetos,
        oneones,
      }),
    [feedbacks, atividades, projetos, oneones],
  );

  const status =
    statusA === "error" || statusP === "error"
      ? "error"
      : statusA === "saving" || statusP === "saving"
        ? "saving"
        : statusA === "loading" || statusP === "loading"
          ? "loading"
          : statusA === "saved" || statusP === "saved"
            ? "saved"
            : "idle";
  const error = errorA || errorP;

  const items = useMemo(() => {
    const list = [...(atividades ?? [])].sort((a, b) =>
      b.date.localeCompare(a.date),
    );
    if (!filtro.trim()) return list;
    const q = filtro.toLowerCase();
    return list.filter(
      (a) =>
        a.titulo.toLowerCase().includes(q) ||
        (a.notas ?? "").toLowerCase().includes(q),
    );
  }, [atividades, filtro]);

  const projetoTitulo = (id?: string) =>
    projetos?.find((p) => p.id === id)?.titulo ?? "Avulso";

  const closeDrawer = () => {
    setDraft(null);
    setIsNew(false);
    setDirty(false);
  };

  const create = () => {
    setDraft(emptyAtividade());
    setIsNew(true);
    setDirty(false);
  };

  const openExisting = (a: Atividade) => {
    setDraft({ ...a });
    setIsNew(false);
    setDirty(false);
  };

  const patchDraft = (partial: Partial<Atividade>) => {
    setDraft((prev) => (prev ? { ...prev, ...partial } : prev));
    setDirty(true);
  };

  const save = () => {
    if (!draft) return;
    if (!draft.titulo.trim()) {
      window.alert('Preencha "O que fiz" antes de salvar.');
      return;
    }
    const previous = isNew
      ? null
      : (atividades ?? []).find((a) => a.id === draft.id) ?? null;
    const stamped = { ...draft, updatedAt: new Date().toISOString() };

    if (projetos) {
      const synced = syncAtividadeIntoProjetos(projetos, stamped, previous);
      setProjetos(() => synced.projetos);
      if (isNew) {
        setAtividades((prev) => [synced.atividade, ...prev]);
      } else {
        setAtividades((prev) =>
          prev.map((a) =>
            a.id === synced.atividade.id ? synced.atividade : a,
          ),
        );
      }
    } else if (isNew) {
      setAtividades((prev) => [stamped, ...prev]);
    } else {
      setAtividades((prev) =>
        prev.map((a) => (a.id === stamped.id ? stamped : a)),
      );
    }
    closeDrawer();
  };

  const deleteOpen = () => {
    if (!draft || isNew) {
      closeDrawer();
      return;
    }
    const existing = (atividades ?? []).find((a) => a.id === draft.id);
    if (existing && projetos) {
      setProjetos(() => removeAtividadeMirror(projetos, existing));
    }
    setAtividades((prev) => prev.filter((a) => a.id !== draft.id));
    closeDrawer();
  };

  const tryClose = () => {
    if (dirty && !window.confirm("Descartar alterações não salvas?")) return;
    closeDrawer();
  };

  return (
    <>
      <header className="hub-page-head">
        <div>
          <p className="hub-kicker">Dia a dia</p>
          <h1>Atividades</h1>
          <p>Registre o que fez e vincule a um projeto se quiser espelhar como update.</p>
        </div>
        <SaveBadge status={status} error={error} />
      </header>

      <div className="list-toolbar">
        <input
          className="list-filter"
          placeholder="Filtrar atividades…"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
        <button type="button" className="hub-primary-btn" onClick={create}>
          + Nova atividade
        </button>
      </div>

      {atividades === null || projetos === null ? (
        <p className="empty-hint">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="empty-hint">Nenhuma atividade ainda.</p>
      ) : (
        <div className="list-stack">
          {items.map((a) => (
            <button
              type="button"
              key={a.id}
              className="list-item"
              onClick={() => openExisting(a)}
              style={{ textAlign: "left", width: "100%" }}
            >
              <MentionText as="h3" text={a.titulo || "Sem título"} />
              <p className="meta">
                {a.date} · {projetoTitulo(a.projetoId)}
                {a.linkedUpdateId ? " · no projeto" : ""}
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
              <h2>{isNew ? "Nova atividade" : "Editar atividade"}</h2>
              <button type="button" className="hub-ghost-btn" onClick={tryClose}>
                Fechar
              </button>
            </div>
            <div className="drawer-scroll">
              <div className="field">
                <label>Data</label>
                <input
                  type="date"
                  value={draft.date}
                  onChange={(e) => patchDraft({ date: e.target.value })}
                />
              </div>
              <MentionInput
                label="O que fiz"
                value={draft.titulo}
                people={people}
                multiline
                rows={2}
                onChange={(v) => patchDraft({ titulo: v })}
              />
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
                  <option value="">Sem projeto (avulsa)</option>
                  {(projetos ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.titulo || "Sem título"}
                    </option>
                  ))}
                </select>
              </div>
              <MentionInput
                label="Notas"
                value={draft.notas ?? ""}
                people={people}
                multiline
                rows={2}
                onChange={(v) => patchDraft({ notas: v })}
              />
              {draft.projetoId ? (
                <p className="empty-hint">
                  Ao salvar, esta atividade entra como update no projeto.
                </p>
              ) : null}
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
