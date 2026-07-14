"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { MentionInput } from "@/components/mention-input";
import { MentionText } from "@/components/mention-text";
import { SaveBadge } from "@/components/save-badge";
import { useCollection } from "@/hooks/use-collection";
import {
  collectPeople,
  findPersonHits,
  isSamePerson,
  textMentionsPerson,
} from "@/lib/mentions";
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

const kindLabel = {
  feedback: "Feedback",
  atividade: "Atividade",
  projeto: "Projeto",
  update: "Update",
} as const;

export default function FeedbacksPage() {
  const { data, setData, status, error } = useCollection("feedbacks");
  const { data: atividades } = useCollection("atividades");
  const { data: projetos } = useCollection("projetos");
  const { data: oneones } = useCollection("oneones");
  const [draft, setDraft] = useState<Feedback | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [pessoa, setPessoa] = useState("");

  const people = useMemo(
    () =>
      collectPeople({
        feedbacks: data,
        atividades,
        projetos,
        oneones,
      }),
    [data, atividades, projetos, oneones],
  );

  const items = useMemo(() => {
    const list = [...(data ?? [])].sort((a, b) => b.data.localeCompare(a.data));
    return list.filter((f) => {
      if (pessoa) {
        const matchPerson =
          isSamePerson(f.deQuem, pessoa) ||
          textMentionsPerson(f.deQuem, pessoa) ||
          textMentionsPerson(f.tema, pessoa) ||
          textMentionsPerson(f.contexto, pessoa);
        if (!matchPerson) return false;
      }
      if (!filtroTexto.trim()) return true;
      const q = filtroTexto.toLowerCase();
      return (
        f.deQuem.toLowerCase().includes(q) ||
        f.tema.toLowerCase().includes(q) ||
        f.contexto.toLowerCase().includes(q)
      );
    });
  }, [data, filtroTexto, pessoa]);

  const personHits = useMemo(
    () =>
      pessoa
        ? findPersonHits(pessoa, {
            feedbacks: data,
            atividades,
            projetos,
          })
        : [],
    [pessoa, data, atividades, projetos],
  );

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
    const novo = emptyFeedback();
    if (pessoa) novo.deQuem = pessoa.startsWith("@") ? pessoa.slice(1) : pessoa;
    setDraft(novo);
    setIsNew(true);
    setDirty(false);
  };

  const openExisting = (f: Feedback) => {
    setDraft({ ...f });
    setIsNew(false);
    setDirty(false);
  };

  const patchDraft = (partial: Partial<Feedback>) => {
    setDraft((prev) => (prev ? { ...prev, ...partial } : prev));
    setDirty(true);
  };

  const save = () => {
    if (!draft) return;
    if (!draft.tema.trim() && !draft.deQuem.trim()) {
      window.alert("Preencha ao menos pessoa ou tema antes de salvar.");
      return;
    }
    const stamped = { ...draft, updatedAt: new Date().toISOString() };
    if (isNew) setData((prev) => [stamped, ...prev]);
    else
      setData((prev) =>
        prev.map((f) => (f.id === stamped.id ? stamped : f)),
      );
    closeDrawer();
  };

  const deleteOpen = () => {
    if (!draft || isNew) {
      closeDrawer();
      return;
    }
    setData((prev) => prev.filter((f) => f.id !== draft.id));
    closeDrawer();
  };

  return (
    <>
      <header className="hub-page-head">
        <div>
          <p className="hub-kicker">Histórico</p>
          <h1>Feedbacks</h1>
          <p>Filtre por pessoa ou tema para achar o histórico.</p>
        </div>
        <SaveBadge status={status} error={error} />
      </header>

      <div className="list-toolbar">
        <select
          className="list-filter list-filter-sm"
          value={pessoa}
          onChange={(e) => setPessoa(e.target.value)}
        >
          <option value="">Todas as pessoas</option>
          {people.map((p) => (
            <option key={p} value={p}>
              @{p}
            </option>
          ))}
        </select>
        <input
          className="list-filter"
          placeholder="Filtrar por tema ou contexto…"
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
        />
        <button type="button" className="hub-primary-btn" onClick={create}>
          + Novo feedback
        </button>
      </div>

      {pessoa ? (
        <section className="overview-panel" style={{ marginBottom: "1rem" }}>
          <h2>Histórico de @{pessoa}</h2>
          {personHits.length === 0 ? (
            <p className="empty-hint">
              Nada encontrado. Mencione com @{pessoa} em atividades ou updates.
            </p>
          ) : (
            <ul className="overview-list">
              {personHits.map((h) => (
                <li key={h.id}>
                  <Link href={h.href}>
                    <span>
                      [{kindLabel[h.kind]}]{" "}
                      <MentionText text={h.titulo} />
                    </span>
                  </Link>
                  <span className="muted">
                    {h.data} · {h.detalhe}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {data === null ? (
        <p className="empty-hint">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="empty-hint">Nenhum feedback neste filtro.</p>
      ) : (
        <div className="list-stack">
          {items.map((f) => (
            <button
              type="button"
              key={f.id}
              className="list-item"
              onClick={() => openExisting(f)}
              style={{ textAlign: "left", width: "100%" }}
            >
              <MentionText as="h3" text={f.tema || "Sem tema"} />
              <p className="meta">
                {f.deQuem || "—"} · {f.data}
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
              <h2>{isNew ? "Novo feedback" : "Editar feedback"}</h2>
              <button type="button" className="hub-ghost-btn" onClick={tryClose}>
                Fechar
              </button>
            </div>
            <div className="drawer-scroll">
              <MentionInput
                label="De quem"
                value={draft.deQuem}
                people={people}
                placeholder="Maria ou @Maria"
                onChange={(v) => patchDraft({ deQuem: v })}
              />
              <div className="field">
                <label>Data</label>
                <input
                  type="date"
                  value={draft.data}
                  onChange={(e) => patchDraft({ data: e.target.value })}
                />
              </div>
              <MentionInput
                label="Tema"
                value={draft.tema}
                people={people}
                onChange={(v) => patchDraft({ tema: v })}
              />
              <MentionInput
                label="Citação / contexto"
                value={draft.contexto}
                people={people}
                multiline
                rows={3}
                onChange={(v) => patchDraft({ contexto: v })}
              />
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
