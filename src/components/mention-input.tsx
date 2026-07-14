"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  activeMentionQuery,
  applyMention,
  filterPeopleSuggestions,
} from "@/lib/mentions";

type CommonProps = {
  value: string;
  onChange: (value: string) => void;
  people: string[];
  label?: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
};

export function MentionInput({
  value,
  onChange,
  people,
  label,
  placeholder,
  multiline = false,
  rows = 3,
}: CommonProps) {
  const listId = useId();
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [start, setStart] = useState(0);
  const [active, setActive] = useState(0);
  const suggestions = filterPeopleSuggestions(people, query);

  const syncMention = useCallback((val: string, caret: number) => {
    const hit = activeMentionQuery(val, caret);
    if (!hit) {
      setOpen(false);
      setQuery("");
      return;
    }
    setStart(hit.start);
    setQuery(hit.query);
    setOpen(true);
    setActive(0);
  }, []);

  const pick = (name: string) => {
    const el = ref.current;
    const caret = el?.selectionStart ?? value.length;
    const next = applyMention(value, caret, start, name);
    onChange(next.value);
    setOpen(false);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(next.caret, next.caret);
    });
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      pick(suggestions[active] ?? suggestions[0]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);

  return (
    <div className="field mention-field" onClick={(e) => e.stopPropagation()}>
      {label ? <label>{label}</label> : null}
      <div className="mention-wrap">
        {multiline ? (
          <textarea
            ref={ref as React.RefObject<HTMLTextAreaElement>}
            rows={rows}
            value={value}
            placeholder={placeholder}
            aria-autocomplete="list"
            aria-controls={listId}
            onKeyDown={onKeyDown}
            onChange={(e) => {
              const val = e.target.value;
              const caret = e.target.selectionStart ?? val.length;
              onChange(val);
              syncMention(val, caret);
            }}
            onClick={(e) => {
              const t = e.currentTarget;
              syncMention(t.value, t.selectionStart ?? t.value.length);
            }}
            onKeyUp={(e) => {
              if (["ArrowDown", "ArrowUp", "Enter", "Tab", "Escape"].includes(e.key))
                return;
              const t = e.currentTarget;
              syncMention(t.value, t.selectionStart ?? t.value.length);
            }}
          />
        ) : (
          <input
            ref={ref as React.RefObject<HTMLInputElement>}
            value={value}
            placeholder={placeholder}
            aria-autocomplete="list"
            aria-controls={listId}
            onKeyDown={onKeyDown}
            onChange={(e) => {
              const val = e.target.value;
              const caret = e.target.selectionStart ?? val.length;
              onChange(val);
              syncMention(val, caret);
            }}
            onClick={(e) => {
              const t = e.currentTarget;
              syncMention(t.value, t.selectionStart ?? t.value.length);
            }}
            onKeyUp={(e) => {
              if (["ArrowDown", "ArrowUp", "Enter", "Tab", "Escape"].includes(e.key))
                return;
              const t = e.currentTarget;
              syncMention(t.value, t.selectionStart ?? t.value.length);
            }}
          />
        )}
        {open && suggestions.length > 0 ? (
          <ul id={listId} className="mention-suggest" role="listbox">
            {suggestions.map((name, i) => (
              <li key={name}>
                <button
                  type="button"
                  className={i === active ? "is-active" : ""}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(name);
                  }}
                >
                  @{name}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <p className="mention-hint">Digite @Nome (ex.: @Maria) para mencionar</p>
    </div>
  );
}
