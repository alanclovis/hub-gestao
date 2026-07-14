"use client";

import { useMemo } from "react";
import { SaveBadge } from "@/components/save-badge";
import { ProjetosBoard } from "@/components/kanban/projetos-board";
import { useCollection } from "@/hooks/use-collection";
import { syncUpdateIntoAtividades } from "@/lib/atividade-sync";
import { collectPeople } from "@/lib/mentions";
import type { Projeto, ProjetoUpdate } from "@/lib/types";

export default function ProjetosPage() {
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
  const { data: feedbacks } = useCollection("feedbacks");

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
  const error = errorP || errorA;

  return (
    <>
      <header className="hub-page-head">
        <div>
          <h1>Projetos</h1>
          <p>Board visual — use @Nome nos updates para mencionar pessoas.</p>
        </div>
        <SaveBadge status={status} error={error} />
      </header>

      {projetos === null ? (
        <p className="empty-hint">Carregando board…</p>
      ) : (
        <ProjetosBoard
          projetos={projetos}
          people={people}
          onChange={(next: Projeto[]) => setProjetos(() => next)}
          onUpdateMutated={(payload: {
            action: "upsert" | "delete";
            update?: ProjetoUpdate;
            updateId?: string;
          }) => {
            setAtividades((prev) =>
              syncUpdateIntoAtividades(prev, payload),
            );
          }}
        />
      )}
    </>
  );
}
