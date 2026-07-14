"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
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
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [start, setStart] = useState(0);
  const [active, setActive] = useState(0);
  const [menuPos, setMenuPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const suggestions = filterPeopleSuggestions(people, query);
  const canConfirmTyped =
    query.trim().length > 0 &&
    !suggestions.some(
      (p) => p.toLowerCase() === query.trim().toLowerCase(),
    );
  const menuItems = canConfirmTyped
    ? [...suggestions, query.trim()]
    : suggestions;
  const showMenu = open && (menuItems.length > 0 || query.length === 0);

  const updateMenuPos = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setMenuPos({
      top: r.bottom + 4,
      left: r.left,
      width: r.width,
    });
  }, []);

  const syncMention = useCallback(
    (val: string, caret: number) => {
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
      requestAnimationFrame(updateMenuPos);
    },
    [updateMenuPos],
  );

  const pick = (name: string) => {
    const el = ref.current;
    const caret = el?.selectionStart ?? value.length;
    const next = applyMention(value, caret, start, name);
    onChange(next.value);
    setOpen(false);
    setQuery("");
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(next.caret, next.caret);
    });
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (!showMenu) return;
    if (menuItems.length === 0) {
      if (e.key === "Escape") setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % menuItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + menuItems.length) % menuItems.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      pick(menuItems[active] ?? menuItems[0]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  useLayoutEffect(() => {
    if (!showMenu) return;
    updateMenuPos();
  }, [showMenu, query, value, updateMenuPos]);

  useEffect(() => {
    if (!showMenu) return;
    const onScrollOrResize = () => updateMenuPos();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [showMenu, updateMenuPos]);

  useEffect(() => {
    if (!showMenu) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      if (listRef.current?.contains(t)) return;
      setOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [showMenu]);

  const sharedProps = {
    value,
    placeholder,
    "aria-autocomplete": "list" as const,
    "aria-controls": listId,
    "aria-expanded": showMenu,
    onKeyDown,
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      const val = e.target.value;
      const caret = e.target.selectionStart ?? val.length;
      onChange(val);
      syncMention(val, caret);
    },
    onClick: (
      e: React.MouseEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      const t = e.currentTarget;
      syncMention(t.value, t.selectionStart ?? t.value.length);
    },
    onKeyUp: (
      e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      if (["ArrowDown", "ArrowUp", "Enter", "Tab", "Escape"].includes(e.key))
        return;
      const t = e.currentTarget;
      syncMention(t.value, t.selectionStart ?? t.value.length);
    },
  };

  const menu =
    showMenu && menuPos && typeof document !== "undefined"
      ? createPortal(
          <ul
            ref={listRef}
            id={listId}
            className="mention-suggest"
            role="listbox"
            style={{
              position: "fixed",
              top: menuPos.top,
              left: menuPos.left,
              width: menuPos.width,
              zIndex: 80,
            }}
          >
            {menuItems.length === 0 ? (
              <li className="mention-suggest-empty">
                Digite o nome após @
              </li>
            ) : (
              menuItems.map((name, i) => {
                const isCreate =
                  canConfirmTyped && i === menuItems.length - 1;
                return (
                  <li key={`${name}-${i}`}>
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
                      {isCreate ? `Usar @${name}` : `@${name}`}
                    </button>
                  </li>
                );
              })
            )}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div className="field mention-field">
      {label ? <label>{label}</label> : null}
      <div className="mention-wrap" ref={wrapRef}>
        {multiline ? (
          <textarea
            ref={ref as React.RefObject<HTMLTextAreaElement>}
            rows={rows}
            {...sharedProps}
          />
        ) : (
          <input
            ref={ref as React.RefObject<HTMLInputElement>}
            {...sharedProps}
          />
        )}
      </div>
      {menu}
    </div>
  );
}
