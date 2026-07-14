import { splitMentionParts } from "@/lib/mention-parts";

export function MentionText({
  text,
  as: Tag = "span",
  className,
}: {
  text: string;
  as?: "span" | "h3" | "p" | "div";
  className?: string;
}) {
  const parts = splitMentionParts(text || "");
  if (parts.length === 0) {
    return <Tag className={className}>{text || ""}</Tag>;
  }
  return (
    <Tag className={className}>
      {parts.map((part, i) =>
        part.type === "mention" ? (
          <mark key={`${part.value}-${i}`} className="mention-mark">
            @{part.value}
          </mark>
        ) : (
          <span key={`t-${i}`}>{part.value}</span>
        ),
      )}
    </Tag>
  );
}
