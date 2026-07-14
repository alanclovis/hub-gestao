"use client";

import { AiFeedbackDrawer } from "@/components/ai-feedback-drawer";
import { MentionInput } from "@/components/mention-input";
import { MentionText } from "@/components/mention-text";
import { SaveBadge } from "@/components/save-badge";
import { useCollection } from "@/hooks/use-collection";
import { getAnthropicKey } from "@/lib/ai";
import {
  removeAtividadeMirror,
  syncAtividadeIntoProjetos,
} from "@/lib/atividade-sync";
import { collectPeople } from "@/lib/mentions";
import type { Atividade } from "@/lib/types";
import { useCallback, useMemo, useState } from "react";
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
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [aiOpen, setAiOpen] = useState(false);

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

  const projetoTitulo = useCallback(
    (id?: string) => projetos?.find((p) => p.id === id)?.titulo ?? "Avulso",
    [projetos],
  );

  const selectedAtividades = useMemo(
    () => (atividades ?? []).filter((a) => selected.has(a.id)),
    [atividades, selected],
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const openAiFeedback = () => {
    if (selected.size === 0) {
      window.alert("Selecione ao menos uma atividade.");
      return;
    }
    if (!getAnthropicKey()) {
      window.alert(
        "Configure a API key da Anthropic em Configurações (ícone de engrenagem).",
      );
      return;
    }
    setAiOpen(true);
  };

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
    if (draft.projetoId && projetos === null) {
      window.alert("Aguarde o carregamento dos projetos e tente de novo.");
      return;
    }
    const previous = isNew
      ? null
      : (atividades ?? []).find((a) => a.id === draft.id) ?? null;
    const stamped = { ...draft, updatedAt: new Date().toISOString() };

    let nextAtividade = stamped;
    if (projetos !== null) {
      setProjetos((prev) => {
        const synced = syncAtividadeIntoProjetos(prev, stamped, previous);
        nextAtividade = synced.atividade;
        return synced.projetos;
      });
    }

    if (isNew) {
      setAtividades((prev) => [nextAtividade, ...prev]);
    } else {
      setAtividades((prev) =>
        prev.map((a) => (a.id === nextAtividade.id ? nextAtividade : a)),
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
    if (existing?.projetoId) {
      setProjetos((prev) => removeAtividadeMirror(prev, existing));
    }
    setAtividades((prev) => prev.filter((a) => a.id !== draft.id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(draft.id);
      return next;
    });
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
          <p>
            Registre o que fez, selecione itens e gere um feedback resumido com
            Claude.
          </p>
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

      {selected.size > 0 ? (
        <div className="ai-select-bar" role="status">
          <span>
            {selected.size} selecionada{selected.size === 1 ? "" : "s"}
          </span>
          <div className="ai-select-actions">
            <button
              type="button"
              className="hub-primary-btn"
              onClick={openAiFeedback}
            >
              Gerar feedback
            </button>
            <button
              type="button"
              className="hub-ghost-btn"
              onClick={clearSelection}
            >
              Limpar
            </button>
          </div>
        </div>
      ) : null}

      {atividades === null || projetos === null ? (
        <p className="empty-hint">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="empty-hint">Nenhuma atividade ainda.</p>
      ) : (
        <div className="list-stack">
          {items.map((a) => {
            const checked = selected.has(a.id);
            return (
              <div
                key={a.id}
                className={`list-item list-item-selectable${checked ? " is-selected" : ""}`}
              >
                <label className="list-item-check">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSelect(a.id)}
                    aria-label={`Selecionar ${a.titulo || "atividade"}`}
                  />
                </label>
                <button
                  type="button"
                  className="list-item-main"
                  onClick={() => openExisting(a)}
                >
                  <MentionText as="h3" text={a.titulo || "Sem título"} />
                  <p className="meta">
                    {a.date} · {projetoTitulo(a.projetoId)}
                    {a.linkedUpdateId ? " · no projeto" : ""}
                  </p>
                </button>
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
                  Ao salvar, cria (ou atualiza) um update em{" "}
                  {projetos?.find((p) => p.id === draft.projetoId)?.titulo ||
                    "projeto"}
                  .
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

      <AiFeedbackDrawer
        open={aiOpen}
        atividades={selectedAtividades}
        projetoTitulo={projetoTitulo}
        onClose={() => setAiOpen(false)}
      />
    </>
  );
}
