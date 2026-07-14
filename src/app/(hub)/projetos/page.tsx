"use client";

import { SaveBadge } from "@/components/save-badge";
import { ProjetosBoard } from "@/components/kanban/projetos-board";
import { useCollection } from "@/hooks/use-collection";
import { syncUpdateIntoAtividades } from "@/lib/atividade-sync";
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
          <p>Board visual — alimente cards todos os dias.</p>
        </div>
        <SaveBadge status={status} error={error} />
      </header>

      {projetos === null ? (
        <p className="empty-hint">Carregando board…</p>
      ) : (
        <ProjetosBoard
          projetos={projetos}
          onChange={(next: Projeto[]) => setProjetos(() => next)}
          onUpdateMutated={(payload: {
            action: "upsert" | "delete";
            update?: ProjetoUpdate;
            updateId?: string;
          }) => {
            if (!atividades) return;
            setAtividades(() => syncUpdateIntoAtividades(atividades, payload));
          }}
        />
      )}
    </>
  );
}
