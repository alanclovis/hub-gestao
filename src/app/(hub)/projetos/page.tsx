"use client";

import { SaveBadge } from "@/components/save-badge";
import { ProjetosBoard } from "@/components/kanban/projetos-board";
import { useCollection } from "@/hooks/use-collection";
import type { Projeto } from "@/lib/types";

export default function ProjetosPage() {
  const { data, setData, status, error } = useCollection("projetos");

  return (
    <>
      <header className="hub-page-head">
        <div>
          <h1>Projetos</h1>
          <p>Board visual — alimente cards todos os dias.</p>
        </div>
        <SaveBadge status={status} error={error} />
      </header>

      {data === null ? (
        <p className="empty-hint">Carregando board…</p>
      ) : (
        <ProjetosBoard
          projetos={data}
          onChange={(next: Projeto[]) => setData(() => next)}
        />
      )}
    </>
  );
}
