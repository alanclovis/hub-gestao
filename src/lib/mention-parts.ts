import { MENTION_RE } from "@/lib/mentions";

export type MentionPart =
  | { type: "text"; value: string }
  | { type: "mention"; value: string };

/** Quebra texto em partes de texto comum e @menções. */
export function splitMentionParts(text: string): MentionPart[] {
  if (!text) return [];
  const parts: MentionPart[] = [];
  let last = 0;
  const re = new RegExp(MENTION_RE.source, MENTION_RE.flags);
  for (const m of text.matchAll(re)) {
    const idx = m.index ?? 0;
    if (idx > last) {
      parts.push({ type: "text", value: text.slice(last, idx) });
    }
    parts.push({ type: "mention", value: m[1] });
    last = idx + m[0].length;
  }
  if (last < text.length) {
    parts.push({ type: "text", value: text.slice(last) });
  }
  return parts;
}
