"use client";

export function SaveBadge({
  status,
  error,
}: {
  status: string;
  error?: string | null;
}) {
  const label =
    status === "loading"
      ? "Carregando…"
      : status === "saving"
        ? "Salvando no Gist…"
        : status === "saved"
          ? "Salvo"
          : status === "error"
            ? "Erro ao salvar"
            : "Sincronizado";

  return (
    <div className={`save-badge status-${status}`} title={error ?? undefined}>
      <span className="save-dot" />
      {label}
      {error ? <span className="save-error"> — {error}</span> : null}
    </div>
  );
}
