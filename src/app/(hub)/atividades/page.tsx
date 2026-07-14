"use client";

import { MentionInput } from "@/components/mention-input";
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

  const [openId, setOpenId] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("");

  const people = useMemo(
    () =>
      collectPeople({
        feedbacks,
        atividades,
        projetos,
      }),
    [feedbacks, atividades, projetos],
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

  const open = atividades?.find((a) => a.id === openId) ?? null;

  const projetoTitulo = (id?: string) =>
    projetos?.find((p) => p.id === id)?.titulo ?? "Avulso";

  const create = () => {
    const novo = emptyAtividade();
    setAtividades((prev) => [novo, ...prev]);
    setOpenId(novo.id);
  };

  const persistAtividade = (
    next: Atividade,
    previous: Atividade | null | undefined,
  ) => {
    const stamped = { ...next, updatedAt: new Date().toISOString() };
    if (projetos) {
      const synced = syncAtividadeIntoProjetos(projetos, stamped, previous);
      setProjetos(() => synced.projetos);
      setAtividades((prev) =>
        prev.map((a) => (a.id === synced.atividade.id ? synced.atividade : a)),
      );
    } else {
      setAtividades((prev) =>
        prev.map((a) => (a.id === stamped.id ? stamped : a)),
      );
    }
  };

  const patchOpen = (partial: Partial<Atividade>) => {
    if (!open) return;
    const next = { ...open, ...partial };
    persistAtividade(next, open);
  };

  const deleteOpen = () => {
    if (!open) return;
    if (projetos) {
      setProjetos(() => removeAtividadeMirror(projetos, open));
    }
    setAtividades((prev) => prev.filter((a) => a.id !== open.id));
    setOpenId(null);
  };

  return (
    <>
      <header className="hub-page-head">
        <div>
          <h1>Atividades</h1>
          <p>
            Registre o que fez no dia — vincule a um projeto para espelhar como
            update.
          </p>
        </div>
        <SaveBadge status={status} error={error} />
      </header>

      <div className="list-toolbar">
        <input
          placeholder="Filtrar atividades…"
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
              onClick={() => setOpenId(a.id)}
              style={{ textAlign: "left", width: "100%" }}
            >
              <h3>{a.titulo || "Sem título"}</h3>
              <p className="meta">
                {a.date} · {projetoTitulo(a.projetoId)}
                {a.linkedUpdateId ? " · no projeto" : ""}
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
              <h2>Atividade</h2>
              <button
                type="button"
                className="hub-ghost-btn"
                onClick={() => setOpenId(null)}
              >
                Fechar
              </button>
            </div>
            <div className="field">
              <label>Data</label>
              <input
                type="date"
                value={open.date}
                onChange={(e) => patchOpen({ date: e.target.value })}
              />
            </div>
            <MentionInput
              label="O que fiz"
              value={open.titulo}
              people={people}
              multiline
              onChange={(v) => patchOpen({ titulo: v })}
            />
            <div className="field">
              <label>Projeto (opcional)</label>
              <select
                value={open.projetoId ?? ""}
                onChange={(e) =>
                  patchOpen({
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
              label="Decisão / mudança"
              value={open.decisao ?? ""}
              people={people}
              onChange={(v) => patchOpen({ decisao: v })}
            />
            <MentionInput
              label="Evidência"
              value={open.evidencia ?? ""}
              people={people}
              onChange={(v) => patchOpen({ evidencia: v })}
            />
            <MentionInput
              label="Resultado parcial"
              value={open.resultado ?? ""}
              people={people}
              onChange={(v) => patchOpen({ resultado: v })}
            />
            <MentionInput
              label="Notas"
              value={open.notas ?? ""}
              people={people}
              multiline
              onChange={(v) => patchOpen({ notas: v })}
            />
            {open.projetoId ? (
              <p className="empty-hint">
                Vinculada: esta atividade entra como update no projeto
                selecionado.
              </p>
            ) : null}
            <button type="button" className="hub-ghost-btn" onClick={deleteOpen}>
              Excluir
            </button>
          </aside>
        </>
      ) : null}
    </>
  );
}
