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
import { MentionInput } from "@/components/mention-input";
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

function emptyUpdateDraft(): ProjetoUpdate {
  return {
    id: "",
    date: new Date().toISOString().slice(0, 10),
    oQueFiz: "",
    decisao: "",
    evidencia: "",
    resultado: "",
  };
}

function newProjeto(): Projeto {
  const now = new Date().toISOString();
  return {
    id: nanoid(),
    titulo: "",
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
}

function ProjectDrawer({
  initial,
  isNew,
  onSave,
  onClose,
  onDelete,
  onUpdateMutated,
  people = [],
}: {
  initial: Projeto;
  isNew: boolean;
  onSave: (next: Projeto) => void;
  onClose: () => void;
  onDelete: () => void;
  people?: string[];
  onUpdateMutated?: (payload: {
    action: "upsert" | "delete";
    update?: ProjetoUpdate;
    updateId?: string;
  }) => void;
}) {
  const [local, setLocal] = useState<Projeto>(() => ({
    ...initial,
    updates: initial.updates.map((u) => ({ ...u })),
    links: [...initial.links],
  }));
  const [dirty, setDirty] = useState(false);
  const [updateDraft, setUpdateDraft] = useState<ProjetoUpdate>(emptyUpdateDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState("");
  const [copied, setCopied] = useState(false);

  const patchLocal = (partial: Partial<Projeto>) => {
    setLocal((prev) => ({ ...prev, ...partial }));
    setDirty(true);
  };

  const tryClose = () => {
    if (dirty && !window.confirm("Descartar alterações não salvas?")) return;
    onClose();
  };

  const clearUpdateForm = () => {
    setEditingId(null);
    setUpdateDraft(emptyUpdateDraft());
  };

  const saveUpdateToLocal = () => {
    if (!updateDraft.oQueFiz.trim()) {
      window.alert('Preencha "O que fiz" antes de adicionar o update.');
      return;
    }
    if (editingId) {
      setLocal((prev) => ({
        ...prev,
        updates: prev.updates.map((u) =>
          u.id === editingId ? { ...updateDraft, id: editingId } : u,
        ),
      }));
    } else {
      const item: ProjetoUpdate = { ...updateDraft, id: nanoid() };
      setLocal((prev) => ({
        ...prev,
        updates: [item, ...prev.updates],
      }));
    }
    setDirty(true);
    clearUpdateForm();
  };

  const deleteUpdateFromLocal = () => {
    if (!editingId) return;
    setLocal((prev) => ({
      ...prev,
      updates: prev.updates.filter((u) => u.id !== editingId),
    }));
    setDirty(true);
    clearUpdateForm();
  };

  const startEdit = (u: ProjetoUpdate) => {
    setEditingId(u.id);
    setUpdateDraft({ ...u });
  };

  const save = () => {
    if (!local.titulo.trim()) {
      window.alert("Preencha o título antes de salvar.");
      return;
    }
    const stamped = { ...local, updatedAt: new Date().toISOString() };
    const prevIds = new Set(initial.updates.map((u) => u.id));
    const nextIds = new Set(stamped.updates.map((u) => u.id));

    for (const id of prevIds) {
      if (!nextIds.has(id)) {
        onUpdateMutated?.({ action: "delete", updateId: id });
      }
    }
    for (const u of stamped.updates) {
      const before = initial.updates.find((x) => x.id === u.id);
      if (
        !before ||
        before.date !== u.date ||
        before.oQueFiz !== u.oQueFiz ||
        before.decisao !== u.decisao ||
        before.evidencia !== u.evidencia ||
        before.resultado !== u.resultado
      ) {
        onUpdateMutated?.({ action: "upsert", update: u });
      }
    }

    onSave(stamped);
    setDirty(false);
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={tryClose} />
      <aside className="drawer">
        <div className="drawer-head">
          <h2>{isNew ? "Novo projeto" : "Editar projeto"}</h2>
          <button type="button" className="hub-ghost-btn" onClick={tryClose}>
            Fechar
          </button>
        </div>

        <div className="drawer-scroll">
          <div className="field">
            <label>Título</label>
            <input
              value={local.titulo}
              onChange={(e) => patchLocal({ titulo: e.target.value })}
            />
          </div>
          <MentionInput
            label="Descrição e contexto"
            value={local.descricao}
            people={people}
            multiline
            rows={2}
            onChange={(v) => patchLocal({ descricao: v })}
          />
          <div className="field-row">
            <div className="field">
              <label>Status</label>
              <select
                value={local.status}
                onChange={(e) =>
                  patchLocal({ status: e.target.value as ProjetoStatus })
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
                value={local.papel}
                onChange={(e) =>
                  patchLocal({ papel: e.target.value as Projeto["papel"] })
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
              value={local.kr}
              onChange={(e) => patchLocal({ kr: e.target.value })}
              placeholder="KR 1.1 — Data Labeling"
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Período</label>
              <input
                value={local.periodo}
                onChange={(e) => patchLocal({ periodo: e.target.value })}
                placeholder="Abr/26 —"
              />
            </div>
            <div className="field">
              <label>Links (um por linha)</label>
              <textarea
                rows={2}
                value={local.links.join("\n")}
                onChange={(e) =>
                  patchLocal({
                    links: e.target.value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>
          </div>
          <MentionInput
            label="Impacto / resultado"
            value={local.impacto}
            people={people}
            multiline
            rows={2}
            onChange={(v) => patchLocal({ impacto: v })}
          />

          <div className="update-feed">
            <h3>{editingId ? "Editando update" : "Novo update"}</h3>
            <p className="empty-hint" style={{ marginTop: 0 }}>
              Inclua updates e clique em Salvar no rodapé para gravar.
            </p>
            <div className="field">
              <label>Data</label>
              <input
                type="date"
                value={updateDraft.date}
                onChange={(e) =>
                  setUpdateDraft({ ...updateDraft, date: e.target.value })
                }
              />
            </div>
            <MentionInput
              label="O que fiz"
              value={updateDraft.oQueFiz}
              people={people}
              multiline
              rows={2}
              onChange={(v) => setUpdateDraft({ ...updateDraft, oQueFiz: v })}
            />
            <div className="field-group">
              <p className="field-group-title">Detalhe do update</p>
              <MentionInput
                label="Decisão / mudança"
                value={updateDraft.decisao}
                people={people}
                onChange={(v) => setUpdateDraft({ ...updateDraft, decisao: v })}
              />
              <MentionInput
                label="Evidência"
                value={updateDraft.evidencia}
                people={people}
                onChange={(v) =>
                  setUpdateDraft({ ...updateDraft, evidencia: v })
                }
              />
              <MentionInput
                label="Resultado parcial"
                value={updateDraft.resultado}
                people={people}
                onChange={(v) =>
                  setUpdateDraft({ ...updateDraft, resultado: v })
                }
              />
            </div>
            <div className="drawer-actions drawer-actions-inline">
              <button
                type="button"
                className="hub-primary-btn"
                onClick={saveUpdateToLocal}
              >
                {editingId ? "Aplicar update" : "Incluir update"}
              </button>
              {editingId ? (
                <>
                  <button
                    type="button"
                    className="hub-secondary-btn"
                    onClick={clearUpdateForm}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="hub-ghost-btn"
                    onClick={deleteUpdateFromLocal}
                  >
                    Excluir update
                  </button>
                </>
              ) : null}
            </div>

            {local.updates.map((u) => (
              <button
                type="button"
                key={u.id}
                className={`update-item update-item-btn${editingId === u.id ? " is-editing" : ""}`}
                onClick={() => startEdit(u)}
              >
                <div className="date">
                  {u.date}
                  <span className="muted"> · clique para editar</span>
                </div>
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
              </button>
            ))}
          </div>

          {!isNew ? (
            <div style={{ marginTop: "1rem" }}>
              <button type="button" className="hub-ghost-btn" onClick={onDelete}>
                Excluir projeto
              </button>
            </div>
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
            <button
              type="button"
              className="hub-secondary-btn"
              onClick={() => {
                const text = buildProjetoReport(local);
                setReportText(text);
                setCopied(false);
                setReportOpen(true);
              }}
            >
              Gerar relatório
            </button>
          </div>
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
            <div className="drawer-actions drawer-actions-inline">
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
                  downloadTextFile(reportFilename(local), reportText)
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
  onUpdateMutated,
  people = [],
}: {
  projetos: Projeto[];
  onChange: (next: Projeto[]) => void;
  people?: string[];
  onUpdateMutated?: (payload: {
    action: "upsert" | "delete";
    update?: ProjetoUpdate;
    updateId?: string;
  }) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<{
    projeto: Projeto;
    isNew: boolean;
  } | null>(null);

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
    setDrawer({ projeto: newProjeto(), isNew: true });
  };

  const openExisting = (id: string) => {
    const p = projetos.find((x) => x.id === id);
    if (!p) return;
    setDrawer({
      projeto: {
        ...p,
        updates: p.updates.map((u) => ({ ...u })),
        links: [...p.links],
      },
      isNew: false,
    });
  };

  return (
    <>
      <div className="list-toolbar">
        <p className="empty-hint" style={{ margin: 0, flex: 1 }}>
          Arraste cards entre colunas.
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
              onOpen={openExisting}
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

      {drawer ? (
        <ProjectDrawer
          key={drawer.projeto.id}
          initial={drawer.projeto}
          isNew={drawer.isNew}
          onClose={() => setDrawer(null)}
          onSave={(next) => {
            if (drawer.isNew) onChange([next, ...projetos]);
            else
              onChange(projetos.map((p) => (p.id === next.id ? next : p)));
            setDrawer(null);
          }}
          onDelete={() => {
            onChange(projetos.filter((p) => p.id !== drawer.projeto.id));
            setDrawer(null);
          }}
          onUpdateMutated={onUpdateMutated}
          people={people}
        />
      ) : null}
    </>
  );
}
