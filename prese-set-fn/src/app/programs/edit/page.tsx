"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, GripVertical, Repeat2, Timer } from "lucide-react";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { LoginPrompt, PageLoading } from "@/components/LoginPrompt";
import { PageContent } from "@/components/PageContent";
import { PageHeader } from "@/components/PageHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DeleteIconButton } from "@/components/DeleteIconButton";
import { PhoneShell } from "@/components/PhoneShell";
import { NumberField } from "@/components/NumberField";
import { programsApi } from "@/lib/api";
import { deriveProgramMode, inferStepKind, stepDetail } from "@/lib/api/helpers";
import type { ExerciseStep, ProgramMode, StepKind } from "@/lib/api/types";
import { useAuth, getAuthErrorMessage } from "@/lib/auth/AuthContext";
import { useLocale } from "@/lib/i18n/LocaleContext";

type StepDraft = {
  clientId: string;
  order: number;
  kind: StepKind;
  title: string;
  instruction?: string;
  workSeconds?: number;
  restSeconds?: number;
  rounds?: number;
  reps?: number;
  sets?: number;
  restBetweenSetsSeconds?: number;
};

function serializeDraft(name: string, steps: StepDraft[]) {
  return JSON.stringify({ name, steps });
}

function renumberSteps(steps: StepDraft[]): StepDraft[] {
  return steps.map((s, i) => ({ ...s, order: i + 1 }));
}

function toExerciseStep(step: StepDraft): ExerciseStep {
  return {
    id: "",
    order: step.order,
    title: step.title,
    instruction: step.instruction ?? null,
    mediaUrl: null,
    workSeconds: step.workSeconds ?? null,
    restSeconds: step.restSeconds ?? null,
    rounds: step.rounds ?? null,
    reps: step.reps ?? null,
    sets: step.sets ?? null,
    restBetweenSetsSeconds: step.restBetweenSetsSeconds ?? null,
  };
}

function stepWithKind(step: StepDraft, kind: StepKind): StepDraft {
  if (step.kind === kind) return step;
  if (kind === "INTERVAL") {
    return {
      ...step,
      kind,
      workSeconds: step.workSeconds ?? 30,
      restSeconds: 30,
      rounds: 1,
    };
  }
  return {
    ...step,
    kind,
    reps: step.reps ?? 12,
    sets: step.sets ?? 3,
    workSeconds: step.workSeconds ?? 45,
    restBetweenSetsSeconds: 30,
  };
}

function newClientId() {
  return crypto.randomUUID();
}

function createStep(order: number, kind: StepKind): StepDraft {
  return kind === "INTERVAL"
    ? {
        clientId: newClientId(),
        order,
        kind: "INTERVAL",
        title: "",
        workSeconds: 30,
        restSeconds: 30,
        rounds: 1,
      }
    : {
        clientId: newClientId(),
        order,
        kind: "REPS_SETS",
        title: "",
        reps: 12,
        sets: 3,
        workSeconds: 45,
        restBetweenSetsSeconds: 30,
      };
}

function createInitialNewProgram() {
  const steps = [createStep(1, "INTERVAL")];
  return { steps, baseline: serializeDraft("", steps) };
}

const numberInputClass = "app-input py-2.5 text-sm";

const modeVisual = {
  INTERVAL: {
    badge: "border-lime/30 bg-lime/10 text-lime",
    panel: "border-lime/25 bg-lime/[0.06]",
    iconClass: "text-lime",
  },
  REPS_SETS: {
    badge: "border-sky-500/30 bg-sky-500/10 text-sky-600",
    panel: "border-sky-500/25 bg-sky-500/[0.06]",
    iconClass: "text-sky-600",
  },
} as const;

function StepModeBadge({
  kind,
  label,
}: {
  kind: StepKind;
  label: string;
}) {
  const visual = modeVisual[kind];
  const Icon = kind === "INTERVAL" ? Timer : Repeat2;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${visual.badge}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function EditProgramContent() {
  const [initialNewProgram] = useState(createInitialNewProgram);
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const programId = searchParams.get("id");
  const { token, isLoading: authLoading } = useAuth();

  const [preset, setPreset] = useState<ProgramMode>("MIXED");
  const [name, setName] = useState("");
  const [steps, setSteps] = useState<StepDraft[]>(initialNewProgram.steps);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const fetchKey = token && programId ? `${programId}:${token}` : null;
  const loading = Boolean(programId && fetchKey !== loadedKey);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [pendingStepClientId, setPendingStepClientId] = useState<string | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [baseline, setBaseline] = useState<string | null>(null);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(
    initialNewProgram.steps[0]?.clientId ?? null,
  );
  const [dragStepId, setDragStepId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const dragStateRef = useRef<{ fromId: string | null; overId: string | null }>({
    fromId: null,
    overId: null,
  });

  const showStepNumber = preset === "MIXED";
  const canReorder = preset === "MIXED";

  const toggleStep = (clientId: string) => {
    setExpandedClientId((prev) => (prev === clientId ? null : clientId));
  };

  const patchStep = (order: number, patch: Partial<StepDraft>) => {
    setSteps((prev) =>
      prev.map((s) => (s.order === order ? { ...s, ...patch } : s)),
    );
  };

  const removeStep = (clientId: string) => {
    setExpandedClientId((exp) => (exp === clientId ? null : exp));
    setSteps((prev) =>
      renumberSteps(prev.filter((s) => s.clientId !== clientId)),
    );
  };

  const moveStep = useCallback((fromClientId: string, toClientId: string) => {
    if (fromClientId === toClientId) return;
    setSteps((prev) => {
      const fromIdx = prev.findIndex((s) => s.clientId === fromClientId);
      const toIdx = prev.findIndex((s) => s.clientId === toClientId);
      if (fromIdx < 0 || toIdx < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return renumberSteps(next);
    });
  }, []);

  const startDrag = (clientId: string) => {
    dragStateRef.current = { fromId: clientId, overId: null };
    setDragStepId(clientId);
    setDropTargetId(null);
  };

  const endDrag = useCallback(() => {
    const { fromId, overId } = dragStateRef.current;
    if (fromId && overId && fromId !== overId) {
      moveStep(fromId, overId);
    }
    dragStateRef.current = { fromId: null, overId: null };
    setDragStepId(null);
    setDropTargetId(null);
  }, [moveStep]);

  useEffect(() => {
    if (!dragStepId) return;

    const onMove = (e: PointerEvent) => {
      const row = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest("[data-step-id]");
      const id = row?.getAttribute("data-step-id");
      if (!id || id === dragStateRef.current.fromId) return;
      if (dragStateRef.current.overId !== id) {
        dragStateRef.current.overId = id;
        setDropTargetId(id);
      }
    };

    const onEnd = () => endDrag();

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
    };
  }, [dragStepId, endDrag]);

  const addStep = () => {
    const kind: StepKind =
      preset === "REPS_SETS"
        ? "REPS_SETS"
        : preset === "INTERVAL"
          ? "INTERVAL"
          : "INTERVAL";
    setSteps((prev) => {
      const newOrder = prev.length + 1;
      const step = createStep(newOrder, kind);
      setExpandedClientId(step.clientId);
      return renumberSteps([...prev, step]);
    });
  };

  const setProgramPreset = (next: ProgramMode) => {
    setPreset(next);
    setExpandedClientId(null);
    dragStateRef.current = { fromId: null, overId: null };
    setDragStepId(null);
    setDropTargetId(null);
  };

  const setStepKind = (order: number, kind: StepKind) => {
    setSteps((prev) =>
      prev.map((s) => (s.order === order ? stepWithKind(s, kind) : s)),
    );
  };

  useEffect(() => {
    if (!token || !programId) return;

    let cancelled = false;
    const key = `${programId}:${token}`;

    programsApi
      .get(token, programId)
      .then((program) => {
        if (cancelled) return;
        setName(program.name);
        const loadedSteps = program.steps.map((s) => ({
          clientId: s.id,
          order: s.order,
          kind: inferStepKind(s),
          title: s.title,
          instruction: s.instruction ?? undefined,
          workSeconds: s.workSeconds ?? undefined,
          restSeconds: s.restSeconds ?? undefined,
          rounds: s.rounds ?? undefined,
          reps: s.reps ?? undefined,
          sets: s.sets ?? undefined,
          restBetweenSetsSeconds: s.restBetweenSetsSeconds ?? undefined,
        }));
        setPreset("MIXED");
        setSteps(loadedSteps);
        setExpandedClientId(loadedSteps[0]?.clientId ?? null);
        setBaseline(serializeDraft(program.name, loadedSteps));
        setLoadedKey(key);
      })
      .catch(() => {
        if (cancelled) return;
        setError(t("saveFailed"));
        setLoadedKey(key);
      });

    return () => {
      cancelled = true;
    };
  }, [token, programId, t]);

  const toApiSteps = () =>
    steps.map((s) => {
      if (s.kind === "REPS_SETS") {
        return {
          order: s.order,
          title: s.title.trim() || `Step ${s.order}`,
          instruction: s.instruction?.trim() || undefined,
          reps: Math.max(0, s.reps ?? 0),
          sets: Math.max(0, s.sets ?? 0),
          workSeconds: s.workSeconds,
          restBetweenSetsSeconds: s.restBetweenSetsSeconds,
        };
      }
      return {
        order: s.order,
        title: s.title.trim() || `Step ${s.order}`,
        instruction: s.instruction?.trim() || undefined,
        workSeconds: s.workSeconds,
        restSeconds: s.restSeconds,
        rounds: Math.max(0, s.rounds ?? 0),
      };
    });

  const onSave = async () => {
    if (!token) {
      router.push("/welcome");
      return;
    }
    if (steps.length === 0) {
      setError(t("saveFailed"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = {
        name,
        mode: deriveProgramMode(
          steps.map((s) => ({ reps: s.reps ?? null, sets: s.sets ?? null })),
        ),
        steps: toApiSteps(),
      };
      if (programId) {
        await programsApi.update(token, programId, body);
      } else {
        await programsApi.create(token, body);
      }
      router.push("/programs");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const onDeleteProgram = async () => {
    if (!token || !programId) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await programsApi.delete(token, programId);
      router.push("/programs");
    } catch (err) {
      setDeleteError(getAuthErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading) {
    return <PageLoading />;
  }

  if (!token) {
    return <LoginPrompt />;
  }

  if (loading) {
    return <PageLoading />;
  }

  const visibleSteps =
    preset === "MIXED"
      ? steps
      : steps.filter((s) => s.kind === preset);

  const isDirty = programId
    ? baseline !== null && serializeDraft(name, steps) !== baseline
    : serializeDraft(name, steps) !== initialNewProgram.baseline;

  const onBack = () => {
    if (isDirty) {
      setLeaveConfirmOpen(true);
      return;
    }
    router.push("/programs");
  };

  const pendingStep =
    pendingStepClientId != null
      ? steps.find((s) => s.clientId === pendingStepClientId)
      : null;
  const deleteDialogOpen = deleteConfirm || pendingStepClientId !== null;
  const deleteDialogItemName = deleteConfirm
    ? name || "…"
    : pendingStep?.title.trim() ||
      `${t("stepLabel")} ${pendingStep?.order ?? ""}`.trim();

  const onConfirmDelete = () => {
    if (deleteConfirm) {
      void onDeleteProgram();
      return;
    }
    if (pendingStepClientId != null) {
      removeStep(pendingStepClientId);
      setPendingStepClientId(null);
    }
  };

  const onCancelDelete = () => {
    if (deleting) return;
    setDeleteConfirm(false);
    setPendingStepClientId(null);
    setDeleteError(null);
  };

  return (
    <>
      <div className="flex h-full min-h-0 flex-col">
        <PageHeader
          onBackClick={onBack}
          title={t("editProgram")}
          trailing={
            <button
              type="button"
              onClick={() => setSaveConfirmOpen(true)}
              disabled={saving || !name.trim()}
              className="text-sm font-semibold text-lime transition-colors hover:text-accent-dark disabled:opacity-40"
            >
              {saving ? t("loading") : t("save")}
            </button>
          }
        />

        <PageContent className="min-h-0 flex-1 space-y-5 overflow-y-auto">
        {error ? <p className="text-xs text-danger">{error}</p> : null}

        <div>
          <label className="field-label">
            {t("programName")}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="app-input"
          />
        </div>

        <div>
          <label className="field-label">
            {t("programMode")}
          </label>
          <div className="flex overflow-hidden rounded-xl border border-border bg-surface-muted p-1">
            <button
              type="button"
              onClick={() => setProgramPreset("MIXED")}
              className={`flex-1 rounded-lg px-1 py-2.5 text-xs font-bold sm:text-sm ${
                preset === "MIXED" ? "bg-lime text-white shadow-sm" : "text-foreground/70"
              }`}
            >
              {t("programModeMixed")}
            </button>
            <button
              type="button"
              onClick={() => setProgramPreset("INTERVAL")}
              className={`flex-1 rounded-lg px-1 py-2.5 text-xs font-bold sm:text-sm ${
                preset === "INTERVAL" ? "bg-lime text-white shadow-sm" : "text-foreground/70"
              }`}
            >
              {t("interval")}
            </button>
            <button
              type="button"
              onClick={() => setProgramPreset("REPS_SETS")}
              className={`flex-1 rounded-lg px-1 py-2.5 text-xs font-medium sm:text-sm ${
                preset === "REPS_SETS" ? "bg-lime text-white shadow-sm" : "text-foreground/70"
              }`}
            >
              {t("repsSets")}
            </button>
          </div>
          <p className="mt-2 text-sm text-muted">{t("programModeHint")}</p>
        </div>

        <div className="space-y-2">
          {visibleSteps.length === 0 ? (
            <p className="rounded-xl bg-surface app-card p-4 text-center text-sm text-muted">
              {t("stepFilterEmpty")}
            </p>
          ) : null}
          {visibleSteps.map((step) => {
            const isExpanded = expandedClientId === step.clientId;
            const summary = stepDetail(toExerciseStep(step), step.kind);
            const visual = modeVisual[step.kind];
            const ModeIcon = step.kind === "INTERVAL" ? Timer : Repeat2;
            const isDragging = dragStepId === step.clientId;
            const isDropTarget =
              dropTargetId === step.clientId &&
              dragStepId != null &&
              dragStepId !== step.clientId;

            return (
            <div
              key={step.clientId}
              data-step-id={step.clientId}
              className={`rounded-xl bg-surface app-card transition-shadow ${
                isDragging ? "opacity-50" : ""
              } ${isDropTarget ? "ring-2 ring-lime/60" : ""} ${
                dragStepId ? "select-none" : ""
              }`}
            >
              <div className="flex items-start gap-1 p-3">
                {canReorder ? (
                  <button
                    type="button"
                    aria-label={t("dragStep")}
                    className="mt-0.5 shrink-0 cursor-grab touch-none rounded p-1 text-muted active:cursor-grabbing"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      startDrag(step.clientId);
                    }}
                  >
                    <GripVertical className="h-5 w-5" />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => toggleStep(step.clientId)}
                  aria-expanded={isExpanded}
                  aria-label={
                    isExpanded ? t("collapseStep") : t("expandStep")
                  }
                  className="flex min-w-0 flex-1 items-start gap-2 rounded-lg py-1 text-left"
                >
                  <ChevronDown
                    className={`mt-0.5 h-5 w-5 shrink-0 text-muted transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      {showStepNumber ? (
                        <span className="text-sm font-bold text-accent-dark">
                          {t("stepLabel")} {step.order}
                        </span>
                      ) : null}
                      <StepModeBadge
                        kind={step.kind}
                        label={
                          step.kind === "INTERVAL"
                            ? t("stepModeInterval")
                            : t("stepModeReps")
                        }
                      />
                    </div>
                    <p className="truncate text-sm font-medium text-foreground">
                      {step.title.trim() || t("stepTitlePlaceholder")}
                    </p>
                    <p className={`mt-0.5 truncate text-xs ${visual.iconClass}`}>
                      {summary}
                    </p>
                  </div>
                </button>
                <DeleteIconButton
                  label={t("deleteStep")}
                  disabled={steps.length <= 1}
                  onClick={() => {
                    setPendingStepClientId(step.clientId);
                    setDeleteConfirm(false);
                    setDeleteError(null);
                  }}
                />
              </div>

              {isExpanded ? (
              <div className="space-y-3 border-t border-border px-4 pt-3 pb-4">
              <div>
              <label className="field-label">
                {t("stepTitle")}
              </label>
              <input
                type="text"
                value={step.title}
                placeholder={t("stepTitlePlaceholder")}
                onChange={(e) =>
                  patchStep(step.order, { title: e.target.value })
                }
                className="app-input py-2.5 text-sm"
              />
              </div>

              <label className="field-label">
                {t("instruction")}
              </label>
              <input
                type="text"
                value={step.instruction ?? ""}
                onChange={(e) =>
                  patchStep(step.order, { instruction: e.target.value })
                }
                className="app-input py-2.5 text-sm"
              />

              <div className={`rounded-xl border p-3 ${visual.panel}`}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ModeIcon className={`h-4 w-4 ${visual.iconClass}`} />
                    <p className={`text-xs font-bold ${visual.iconClass}`}>
                      {step.kind === "INTERVAL"
                        ? t("stepSettingsInterval")
                        : t("stepSettingsReps")}
                    </p>
                  </div>
                  {preset === "MIXED" ? (
                    <div className="flex gap-1">
                      {(["INTERVAL", "REPS_SETS"] as StepKind[]).map((kind) => (
                        <button
                          key={kind}
                          type="button"
                          onClick={() => setStepKind(step.order, kind)}
                          className={`rounded-lg px-2 py-1 text-[10px] font-bold ${
                            step.kind === kind
                              ? kind === "INTERVAL"
                                ? "bg-lime text-white"
                                : "bg-sky-500 text-white"
                              : "bg-surface-muted text-muted"
                          }`}
                        >
                          {kind === "INTERVAL"
                            ? t("stepModeInterval")
                            : t("stepModeReps")}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

              {step.kind === "INTERVAL" ? (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="mb-1 block text-[10px] text-lime/80">
                      {t("workSec")}
                    </label>
                    <NumberField
                      value={step.workSeconds}
                      fallback={30}
                      onChange={(n) => patchStep(step.order, { workSeconds: n })}
                      className={numberInputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] text-lime/80">
                      {t("restSec")}
                    </label>
                    <NumberField
                      value={step.restSeconds}
                      fallback={30}
                      onChange={(n) => patchStep(step.order, { restSeconds: n })}
                      className={numberInputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] text-lime/80">
                      {t("stepRounds")}
                    </label>
                    <NumberField
                      value={step.rounds}
                      fallback={1}
                      onChange={(n) => patchStep(step.order, { rounds: n })}
                      className={numberInputClass}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-[10px] text-sky-300/80">
                      {t("repsCount")}
                    </label>
                    <NumberField
                      value={step.reps}
                      fallback={12}
                      onChange={(n) => patchStep(step.order, { reps: n })}
                      className={numberInputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] text-sky-300/80">
                      {t("setsCount")}
                    </label>
                    <NumberField
                      value={step.sets}
                      fallback={3}
                      onChange={(n) => patchStep(step.order, { sets: n })}
                      className={numberInputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] text-sky-300/80">
                      {t("workSec")}
                    </label>
                    <NumberField
                      value={step.workSeconds}
                      fallback={45}
                      onChange={(n) => patchStep(step.order, { workSeconds: n })}
                      className={numberInputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] text-sky-300/80">
                      {t("restBetweenSets")}
                    </label>
                    <NumberField
                      value={step.restBetweenSetsSeconds}
                      fallback={30}
                      onChange={(n) =>
                        patchStep(step.order, {
                          restBetweenSetsSeconds: n,
                        })
                      }
                      className={numberInputClass}
                    />
                  </div>
                </div>
              )}
              </div>
              </div>
              ) : null}
            </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addStep}
          className="w-full rounded-xl border border-dashed border-border py-3 text-sm font-medium text-muted"
        >
          + {t("addStep")}
        </button>

        {programId ? (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setDeleteConfirm(true);
                setPendingStepClientId(null);
                setDeleteError(null);
              }}
              className="w-full rounded-xl border border-danger/30 py-3 text-sm font-medium text-danger"
            >
              {t("deleteProgram")}
            </button>
          </div>
        ) : null}
        </PageContent>
      </div>

      <ConfirmDialog
        open={saveConfirmOpen}
        tone="primary"
        title={t("saveConfirmTitle")}
        message={t("saveConfirmMessage")}
        confirmLabel={t("save")}
        cancelLabel={t("cancel")}
        loading={saving}
        loadingLabel={t("loading")}
        error={saveConfirmOpen ? error : null}
        onConfirm={() => {
          setSaveConfirmOpen(false);
          void onSave();
        }}
        onCancel={() => {
          if (saving) return;
          setSaveConfirmOpen(false);
        }}
      />

      <ConfirmDialog
        open={leaveConfirmOpen}
        tone="danger"
        title={t("leaveConfirmTitle")}
        message={t("leaveConfirmMessage")}
        confirmLabel={t("leave")}
        cancelLabel={t("keepEditing")}
        onConfirm={() => {
          setLeaveConfirmOpen(false);
          router.push("/programs");
        }}
        onCancel={() => setLeaveConfirmOpen(false)}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        title={t("deleteConfirmTitle")}
        itemName={deleteDialogItemName}
        promptBefore={t("deleteConfirmPromptBefore")}
        promptAfter={t("deleteConfirmPromptAfter")}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        loading={deleting && deleteConfirm}
        loadingLabel={t("loading")}
        error={deleteConfirm ? deleteError : null}
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
      />
    </>
  );
}

export default function EditProgramPage() {
  return (
    <PhoneShell>
      <Suspense fallback={<p className="px-6 pt-14 text-sm text-muted">…</p>}>
        <EditProgramContent />
      </Suspense>
    </PhoneShell>
  );
}
