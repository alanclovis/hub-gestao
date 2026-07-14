"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState } from "react";
import { nanoid } from "nanoid";
import {
  buildProjetoReport,
  downloadTextFile,
  reportFilename,
} from "@/lib/report-projeto";
import {
  PAPEIS,
  STATUS_COLUMNS,
  type Projeto,
  type ProjetoStatus,
  type ProjetoUpdate,
} from "@/lib/types";

function SortableCard({
  projeto,
  onOpen,
}: {
  projeto: Projeto;
  onOpen: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: projeto.id, data: { status: projeto.status } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`proj-card${isDragging ? " is-dragging" : ""}`}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(projeto.id)}
    >
      <h3>{projeto.titulo || "Sem título"}</h3>
      <p className="meta">
        {projeto.kr || "Sem KR"} · {projeto.papel}
      </p>
    </article>
  );
}

function Column({
  status,
  label,
  items,
  onOpen,
}: {
  status: ProjetoStatus;
  label: string;
  items: Projeto[];
  onOpen: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { type: "column", status },
  });

  return (
    <section
      className="kanban-col"
      ref={setNodeRef}
      data-status={status}
      style={isOver ? { outline: "2px solid var(--teal-soft)" } : undefined}
    >
      <div className="kanban-col-head">
        <span>{label}</span>
        <span>{items.length}</span>
      </div>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="kanban-col-body">
          {items.map((p) => (
            <SortableCard key={p.id} projeto={p} onOpen={onOpen} />
          ))}
        </div>
      </SortableContext>
    </section>
  );
}

function ProjectDrawer({
  projeto,
  onChange,
  onClose,
  onDelete,
}: {
  projeto: Projeto;
  onChange: (next: Projeto) => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState<ProjetoUpdate>({
    id: "",
    date: new Date().toISOString().slice(0, 10),
    oQueFiz: "",
    decisao: "",
    evidencia: "",
    resultado: "",
  });
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState("");
  const [copied, setCopied] = useState(false);

  const patch = (partial: Partial<Projeto>) => {
    onChange({
      ...projeto,
      ...partial,
      updatedAt: new Date().toISOString(),
    });
  };

  const addUpdate = () => {
    if (!draft.oQueFiz.trim()) return;
    const item: ProjetoUpdate = { ...draft, id: nanoid() };
    patch({ updates: [item, ...projeto.updates] });
    setDraft({
      id: "",
      date: new Date().toISOString().slice(0, 10),
      oQueFiz: "",
      decisao: "",
      evidencia: "",
      resultado: "",
    });
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer">
        <div className="drawer-head">
          <h2>Projeto</h2>
          <button type="button" className="hub-ghost-btn" onClick={onClose}>
            Fechar
          </button>
        </div>

        <div className="field">
          <label>Título</label>
          <input
            value={projeto.titulo}
            onChange={(e) => patch({ titulo: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Descrição e contexto</label>
          <textarea
            value={projeto.descricao}
            onChange={(e) => patch({ descricao: e.target.value })}
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Status</label>
            <select
              value={projeto.status}
              onChange={(e) =>
                patch({ status: e.target.value as ProjetoStatus })
              }
            >
              {STATUS_COLUMNS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Papel</label>
            <select
              value={projeto.papel}
              onChange={(e) =>
                patch({ papel: e.target.value as Projeto["papel"] })
              }
            >
              {PAPEIS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label>KR relacionado</label>
          <input
            value={projeto.kr}
            onChange={(e) => patch({ kr: e.target.value })}
            placeholder="KR 1.1 — Data Labeling"
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Período</label>
            <input
              value={projeto.periodo}
              onChange={(e) => patch({ periodo: e.target.value })}
              placeholder="Abr/26 —"
            />
          </div>
          <div className="field">
            <label>Links (um por linha)</label>
            <textarea
              value={projeto.links.join("\n")}
              onChange={(e) =>
                patch({
                  links: e.target.value
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>
        </div>
        <div className="field">
          <label>Impacto / resultado</label>
          <textarea
            value={projeto.impacto}
            onChange={(e) => patch({ impacto: e.target.value })}
          />
        </div>

        <div className="drawer-actions">
          <button
            type="button"
            className="hub-secondary-btn"
            onClick={() => {
              const text = buildProjetoReport(projeto);
              setReportText(text);
              setCopied(false);
              setReportOpen(true);
            }}
          >
            Gerar relatório
          </button>
        </div>

        <div className="update-feed">
          <h3>Updates diários</h3>
          <div className="field">
            <label>Data</label>
            <input
              type="date"
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
            />
          </div>
          <div className="field">
            <label>O que fiz</label>
            <textarea
              value={draft.oQueFiz}
              onChange={(e) => setDraft({ ...draft, oQueFiz: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Decisão / mudança</label>
            <input
              value={draft.decisao}
              onChange={(e) => setDraft({ ...draft, decisao: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Evidência</label>
            <input
              value={draft.evidencia}
              onChange={(e) =>
                setDraft({ ...draft, evidencia: e.target.value })
              }
            />
          </div>
          <div className="field">
            <label>Resultado parcial</label>
            <input
              value={draft.resultado}
              onChange={(e) =>
                setDraft({ ...draft, resultado: e.target.value })
              }
            />
          </div>
          <button type="button" className="hub-primary-btn" onClick={addUpdate}>
            Adicionar update
          </button>

          {projeto.updates.map((u) => (
            <div key={u.id} className="update-item">
              <div className="date">{u.date}</div>
              <div>
                <strong>O que fiz:</strong> {u.oQueFiz}
              </div>
              {u.decisao ? (
                <div>
                  <strong>Decisão:</strong> {u.decisao}
                </div>
              ) : null}
              {u.evidencia ? (
                <div>
                  <strong>Evidência:</strong> {u.evidencia}
                </div>
              ) : null}
              {u.resultado ? (
                <div>
                  <strong>Resultado:</strong> {u.resultado}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div style={{ marginTop: "1.5rem" }}>
          <button type="button" className="hub-ghost-btn" onClick={onDelete}>
            Excluir projeto
          </button>
        </div>
      </aside>

      {reportOpen ? (
        <div
          className="report-modal-backdrop"
          onClick={() => setReportOpen(false)}
        >
          <div
            className="report-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Relatório do projeto"
          >
            <div className="drawer-head">
              <h2>Relatório</h2>
              <button
                type="button"
                className="hub-ghost-btn"
                onClick={() => setReportOpen(false)}
              >
                Fechar
              </button>
            </div>
            <p className="empty-hint" style={{ marginTop: 0 }}>
              Markdown gerado a partir do card e dos updates — copie ou baixe
              para apresentar / pedir revisão à IA.
            </p>
            <div className="drawer-actions">
              <button
                type="button"
                className="hub-primary-btn"
                onClick={async () => {
                  await navigator.clipboard.writeText(reportText);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                {copied ? "Copiado!" : "Copiar"}
              </button>
              <button
                type="button"
                className="hub-secondary-btn"
                onClick={() =>
                  downloadTextFile(reportFilename(projeto), reportText)
                }
              >
                Baixar .md
              </button>
            </div>
            <textarea
              className="report-preview"
              readOnly
              value={reportText}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

export function ProjetosBoard({
  projetos,
  onChange,
}: {
  projetos: Projeto[];
  onChange: (next: Projeto[]) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const byStatus = useMemo(() => {
    const map: Record<ProjetoStatus, Projeto[]> = {
      backlog: [],
      em_andamento: [],
      pausado: [],
      concluido: [],
      destaque: [],
    };
    projetos.forEach((p) => {
      map[p.status]?.push(p);
    });
    return map;
  }, [projetos]);

  const active = projetos.find((p) => p.id === activeId) ?? null;
  const open = projetos.find((p) => p.id === openId) ?? null;

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active: drag, over } = event;
    if (!over) return;

    const dragged = projetos.find((p) => p.id === drag.id);
    if (!dragged) return;

    let nextStatus: ProjetoStatus | null = null;
    const overId = String(over.id);

    if (STATUS_COLUMNS.some((c) => c.id === overId)) {
      nextStatus = overId as ProjetoStatus;
    } else {
      const overProjeto = projetos.find((p) => p.id === overId);
      if (overProjeto) nextStatus = overProjeto.status;
    }

    if (nextStatus && nextStatus !== dragged.status) {
      onChange(
        projetos.map((p) =>
          p.id === dragged.id
            ? {
                ...p,
                status: nextStatus!,
                updatedAt: new Date().toISOString(),
              }
            : p,
        ),
      );
    }
  };

  const createProjeto = () => {
    const now = new Date().toISOString();
    const novo: Projeto = {
      id: nanoid(),
      titulo: "Novo projeto",
      status: "backlog",
      kr: "Rotina / Projeto sem KR direto",
      periodo: "",
      papel: "Owner",
      impacto: "",
      descricao: "",
      links: [],
      destaque: false,
      updates: [],
      createdAt: now,
      updatedAt: now,
    };
    onChange([novo, ...projetos]);
    setOpenId(novo.id);
  };

  return (
    <>
      <div className="list-toolbar">
        <p className="empty-hint" style={{ margin: 0 }}>
          Arraste os cards entre colunas. Clique para editar e registrar updates.
        </p>
        <button type="button" className="hub-primary-btn" onClick={createProjeto}>
          + Novo projeto
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="kanban">
          {STATUS_COLUMNS.map((col) => (
            <Column
              key={col.id}
              status={col.id}
              label={col.label}
              items={byStatus[col.id]}
              onOpen={setOpenId}
            />
          ))}
        </div>
        <DragOverlay>
          {active ? (
            <article className="proj-card">
              <h3>{active.titulo}</h3>
              <p className="meta">{active.kr}</p>
            </article>
          ) : null}
        </DragOverlay>
      </DndContext>

      {open ? (
        <ProjectDrawer
          projeto={open}
          onClose={() => setOpenId(null)}
          onChange={(next) =>
            onChange(projetos.map((p) => (p.id === next.id ? next : p)))
          }
          onDelete={() => {
            onChange(projetos.filter((p) => p.id !== open.id));
            setOpenId(null);
          }}
        />
      ) : null}
    </>
  );
}
