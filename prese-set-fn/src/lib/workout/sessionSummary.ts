import type { ProgramMode } from "@/lib/api/types";

const STORAGE_KEY = "paceset.sessionSummary";

export type SessionSummary = {
  programId: string;
  programName: string;
  mode: ProgramMode;
  startedAt: string;
  endedAt: string;
  totalSeconds: number;
  roundsCompleted: number;
  roundsTotal: number;
  saved: boolean;
};

const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedSnapshot: SessionSummary | null = null;

function notifySessionSummaryListeners() {
  listeners.forEach((listener) => listener());
}

function syncSnapshotFromStorage() {
  if (typeof window === "undefined") {
    cachedRaw = undefined;
    cachedSnapshot = null;
    return cachedSnapshot;
  }

  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) {
    return cachedSnapshot;
  }

  cachedRaw = raw;
  if (!raw) {
    cachedSnapshot = null;
    return cachedSnapshot;
  }

  try {
    cachedSnapshot = JSON.parse(raw) as SessionSummary;
  } catch {
    cachedSnapshot = null;
  }
  return cachedSnapshot;
}

export function subscribeSessionSummary(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readSessionSummary(): SessionSummary | null {
  return syncSnapshotFromStorage();
}

export function storeSessionSummary(summary: SessionSummary) {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(summary);
  sessionStorage.setItem(STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedSnapshot = summary;
  notifySessionSummaryListeners();
}

export function clearSessionSummary() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
  cachedRaw = null;
  cachedSnapshot = null;
  notifySessionSummaryListeners();
}
