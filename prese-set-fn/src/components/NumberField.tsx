"use client";

import { useState } from "react";

type NumberFieldProps = {
  value: number | undefined;
  fallback: number;
  min?: number;
  onChange: (n: number) => void;
  className?: string;
};

function clamp(n: number, min: number) {
  return Math.max(min, n);
}

function isValidDraft(digits: string, min: number) {
  if (digits === "") return true;
  if (!/^\d+$/.test(digits)) return false;
  if (min >= 1 && digits === "0") return false;
  const n = parseInt(digits, 10);
  return !Number.isNaN(n) && n >= min;
}

/** ช่องตัวเลข: ลบแล้วว่างได้ระหว่างพิมพ์, blur แล้ว normalize (5 ไม่ใช่ 05) */
export function NumberField({
  value,
  fallback,
  min = 0,
  onChange,
  className,
}: NumberFieldProps) {
  const safeValue = value === undefined || value < min ? fallback : value;
  const display = String(safeValue);
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? display;

  const commit = (raw: string) => {
    if (raw === "" || !isValidDraft(raw, min)) {
      onChange(clamp(fallback, min));
      return;
    }
    onChange(clamp(parseInt(raw, 10), min));
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={text}
      onFocus={() => setDraft(display)}
      onBlur={() => {
        commit(draft ?? display);
        setDraft(null);
      }}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "");
        if (digits === "") {
          setDraft("");
          return;
        }
        if (!isValidDraft(digits, min)) return;
        const n = clamp(parseInt(digits, 10), min);
        setDraft(String(n));
        onChange(n);
      }}
      className={className}
    />
  );
}
