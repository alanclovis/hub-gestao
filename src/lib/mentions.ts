import type { Atividade, Feedback, OneOnOne, Projeto } from "./types";

/** @Nome, @Ana_Paula, @João.Silva — até espaço ou pontuação */
export const MENTION_RE = /@([\p{L}\p{N}_.-]+)/gu;

export function normalizePerson(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export function extractMentions(text: string | undefined | null): string[] {
  if (!text) return [];
  const found: string[] = [];
  const seen = new Set<string>();
  for (const m of text.matchAll(MENTION_RE)) {
    const raw = m[1];
    const key = normalizePerson(raw);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    found.push(raw);
  }
  return found;
}

function remember(
  map: Map<string, string>,
  name: string | undefined | null,
) {
  if (!name?.trim()) return;
  const bare = name.trim().replace(/^@+/, "");
  if (!bare) return;
  const key = normalizePerson(bare);
  if (!key) return;
  if (!map.has(key)) map.set(key, bare);
}

/** Pessoas conhecidas: campos de pessoa + @mentions em textos. */
export function collectPeople(data: {
  feedbacks?: Feedback[] | null;
  atividades?: Atividade[] | null;
  projetos?: Projeto[] | null;
  oneones?: OneOnOne[] | null;
}): string[] {
  const map = new Map<string, string>();

  (data.feedbacks ?? []).forEach((f) => {
    remember(map, f.deQuem);
    extractMentions(f.tema).forEach((m) => remember(map, m));
    extractMentions(f.contexto).forEach((m) => remember(map, m));
  });

  (data.oneones ?? []).forEach((o) => {
    remember(map, o.pessoa);
    extractMentions(o.pauta).forEach((m) => remember(map, m));
    extractMentions(o.combinados).forEach((m) => remember(map, m));
    extractMentions(o.followUps).forEach((m) => remember(map, m));
  });

  (data.atividades ?? []).forEach((a) => {
    extractMentions(a.titulo).forEach((m) => remember(map, m));
    extractMentions(a.decisao).forEach((m) => remember(map, m));
    extractMentions(a.evidencia).forEach((m) => remember(map, m));
    extractMentions(a.resultado).forEach((m) => remember(map, m));
    extractMentions(a.notas).forEach((m) => remember(map, m));
  });

  (data.projetos ?? []).forEach((p) => {
    (p.colaboradores ?? []).forEach((c) => remember(map, c.nome));
    extractMentions(p.titulo).forEach((m) => remember(map, m));
    extractMentions(p.descricao).forEach((m) => remember(map, m));
    extractMentions(p.impacto).forEach((m) => remember(map, m));
    p.updates.forEach((u) => {
      extractMentions(u.oQueFiz).forEach((m) => remember(map, m));
      extractMentions(u.decisao).forEach((m) => remember(map, m));
      extractMentions(u.evidencia).forEach((m) => remember(map, m));
      extractMentions(u.resultado).forEach((m) => remember(map, m));
    });
  });

  return [...map.values()].sort((a, b) =>
    a.localeCompare(b, "pt-BR", { sensitivity: "base" }),
  );
}

export function textMentionsPerson(
  text: string | undefined | null,
  person: string,
): boolean {
  if (!text || !person.trim()) return false;
  const target = normalizePerson(person);
  return extractMentions(text).some((m) => normalizePerson(m) === target);
}

export function isSamePerson(a: string, b: string): boolean {
  return normalizePerson(a) === normalizePerson(b);
}

export type PersonHit = {
  id: string;
  kind: "feedback" | "atividade" | "projeto" | "update";
  titulo: string;
  detalhe: string;
  data: string;
  href: string;
};

/** Tudo que menciona ou está ligado à pessoa. */
export function findPersonHits(
  person: string,
  data: {
    feedbacks?: Feedback[] | null;
    atividades?: Atividade[] | null;
    projetos?: Projeto[] | null;
  },
): PersonHit[] {
  if (!person.trim()) return [];
  const hits: PersonHit[] = [];

  (data.feedbacks ?? []).forEach((f) => {
    const match =
      isSamePerson(f.deQuem, person) ||
      textMentionsPerson(f.deQuem, person) ||
      textMentionsPerson(f.tema, person) ||
      textMentionsPerson(f.contexto, person);
    if (!match) return;
    hits.push({
      id: `fb-${f.id}`,
      kind: "feedback",
      titulo: f.tema || "Feedback",
      detalhe: f.deQuem || "—",
      data: f.data,
      href: "/pessoas/",
    });
  });

  (data.atividades ?? []).forEach((a) => {
    const blob = [a.titulo, a.decisao, a.evidencia, a.resultado, a.notas]
      .filter(Boolean)
      .join(" ");
    if (!textMentionsPerson(blob, person)) return;
    hits.push({
      id: `at-${a.id}`,
      kind: "atividade",
      titulo: a.titulo || "Atividade",
      detalhe: "Atividade",
      data: a.date,
      href: "/atividades/",
    });
  });

  (data.projetos ?? []).forEach((p) => {
    const isColab = (p.colaboradores ?? []).some((c) =>
      isSamePerson(c.nome, person),
    );
    const projText = [p.titulo, p.descricao, p.impacto].join(" ");
    if (isColab || textMentionsPerson(projText, person)) {
      hits.push({
        id: `pj-${p.id}`,
        kind: "projeto",
        titulo: p.titulo || "Projeto",
        detalhe: isColab ? "Colaborador" : "Projeto",
        data: p.updatedAt.slice(0, 10),
        href: "/projetos/",
      });
    }
    p.updates.forEach((u) => {
      const ub = [u.oQueFiz, u.decisao, u.evidencia, u.resultado].join(" ");
      if (!textMentionsPerson(ub, person)) return;
      hits.push({
        id: `up-${p.id}-${u.id}`,
        kind: "update",
        titulo: u.oQueFiz || "Update",
        detalhe: `Update · ${p.titulo || "projeto"}`,
        data: u.date,
        href: "/projetos/",
      });
    });
  });

  return hits.sort((a, b) => b.data.localeCompare(a.data));
}

export function filterPeopleSuggestions(
  people: string[],
  query: string,
): string[] {
  const q = normalizePerson(query);
  if (!q) return people.slice(0, 8);
  return people
    .filter((p) => normalizePerson(p).startsWith(q) || normalizePerson(p).includes(q))
    .slice(0, 8);
}

/** Posição do @ ativo no texto (caret). */
export function activeMentionQuery(
  value: string,
  caret: number,
): { start: number; query: string } | null {
  const before = value.slice(0, caret);
  const at = before.lastIndexOf("@");
  if (at < 0) return null;
  const frag = before.slice(at + 1);
  if (/[\s,;:!?]/.test(frag)) return null;
  if (at > 0 && /[\p{L}\p{N}]/u.test(before[at - 1] ?? "")) return null;
  return { start: at, query: frag };
}

export function applyMention(
  value: string,
  caret: number,
  start: number,
  name: string,
): { value: string; caret: number } {
  const before = value.slice(0, start);
  const after = value.slice(caret);
  const insert = `@${name} `;
  const next = `${before}${insert}${after}`;
  return { value: next, caret: before.length + insert.length };
}
