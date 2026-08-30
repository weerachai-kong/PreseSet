"use client";

import type { ReactNode } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  confirmLabel: string;
  cancelLabel: string;
  tone?: "danger" | "primary";
  message?: string;
  promptBefore?: string;
  itemName?: string;
  promptAfter?: string;
  loading?: boolean;
  loadingLabel?: string;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

function DialogBody({
  message,
  promptBefore,
  itemName,
  promptAfter,
}: {
  message?: string;
  promptBefore?: string;
  itemName?: string;
  promptAfter?: string;
}) {
  if (message) {
    return (
      <p className="mt-3 text-sm leading-relaxed text-muted">{message}</p>
    );
  }

  if (promptBefore && itemName != null) {
    return (
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {promptBefore}{" "}
        <span className="font-bold text-foreground">&quot;{itemName}&quot;</span>
        {promptAfter}
      </p>
    );
  }

  return null;
}

export function ConfirmDialog({
  open,
  title,
  confirmLabel,
  cancelLabel,
  tone = "danger",
  message,
  promptBefore,
  itemName,
  promptAfter,
  loading = false,
  loadingLabel = "…",
  error = null,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const isPrimary = tone === "primary";
  const iconRing = isPrimary ? "border-lime/45" : "border-danger/45";
  const iconText = isPrimary ? "text-lime" : "text-danger/75";
  const confirmBtn = isPrimary
    ? "bg-lime shadow-sm"
    : "bg-danger shadow-sm";

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <button
        type="button"
        className="absolute inset-0 bg-foreground/40"
        aria-label={cancelLabel}
        disabled={loading}
        onClick={onCancel}
      />
      <div className="relative w-full max-w-[280px] rounded-3xl bg-surface px-6 py-7 text-center shadow-xl">
        <div
          className={`mx-auto mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-full border-[3px] ${iconRing}`}
        >
          <span className={`text-4xl font-semibold leading-none ${iconText}`}>
            {isPrimary ? "?" : "!"}
          </span>
        </div>

        <h2
          id="confirm-dialog-title"
          className="text-xl font-bold tracking-tight text-foreground"
        >
          {title}
        </h2>

        <div id="confirm-dialog-message">
          <DialogBody
            message={message}
            promptBefore={promptBefore}
            itemName={itemName}
            promptAfter={promptAfter}
          />
        </div>

        {error ? (
          <p className="mt-3 text-xs text-danger">{error}</p>
        ) : null}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`flex-1 rounded-full py-3 text-sm font-semibold text-white disabled:opacity-60 ${confirmBtn}`}
          >
            {loading ? loadingLabel : confirmLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="flex-1 rounded-full bg-[#b0bec5] py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
