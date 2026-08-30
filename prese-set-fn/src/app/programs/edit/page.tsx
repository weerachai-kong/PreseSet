"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronLeft, Trash2 } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { NumberField } from "@/components/NumberField";
import { programsApi } from "@/lib/api";
import { stepDetail } from "@/lib/api/helpers";
import type { ExerciseStep, ProgramMode } from "@/lib/api/types";
import { useAuth, getAuthErrorMessage } from "@/lib/auth/AuthContext";
import { useLocale } from "@/lib/i18n/LocaleContext";

type StepKind = "INTERVAL" | "REPS_SETS";

type StepDraft = {
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

const numberInputClass =
  "w-full rounded-lg border border-border bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-lime";

function EditProgramContent() {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const programId = searchParams.get("id");
  const { token } = useAuth();

  const [mode, setMode] = useState<ProgramMode>("INTERVAL");
  const [name, setName] = useState("");
  const [steps, setSteps] = useState<StepDraft[]>([
    {
      order: 1,
      kind: "INTERVAL",
      title: "",
      workSeconds: 30,
      restSeconds: 30,
      rounds: 1,
    },
  ]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const fetchKey = token && programId ? `${programId}:${token}` : null;
  const loading = Boolean(programId && fetchKey !== loadedKey);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(1);

  const toggleStep = (order: number) => {
    setExpandedOrder((prev) => (prev === order ? null : order));
  };

  const patchStep = (order: number, patch: Partial<StepDraft>) => {
    setSteps((prev) =>
      prev.map((s) => (s.order === order ? { ...s, ...patch } : s)),
    );
  };

  const removeStep = (order: number) => {
    setExpandedOrder((exp) => {
      if (exp === order) return null;
      if (exp != null && exp > order) return exp - 1;
      return exp;
    });
    setSteps((prev) => renumberSteps(prev.filter((s) => s.order !== order)));
  };

  const addStep = (kind: StepKind = "INTERVAL") => {
    setSteps((prev) => {
      const newOrder = prev.length + 1;
      setExpandedOrder(newOrder);
      return renumberSteps([
        ...prev,
        kind === "INTERVAL"
          ? {
              order: newOrder,
              kind: "INTERVAL",
              title: "",
              workSeconds: 30,
              restSeconds: 30,
              rounds: 1,
            }
          : {
              order: newOrder,
              kind: "REPS_SETS",
              title: "",
              reps: 12,
              sets: 3,
              workSeconds: 45,
              restBetweenSetsSeconds: 30,
            },
      ]);
    });
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
        setMode(program.mode);
        setSteps(
          program.steps.map((s) => {
            const isReps = s.reps != null && s.sets != null;
            return {
              order: s.order,
              kind: isReps ? ("REPS_SETS" as const) : ("INTERVAL" as const),
              title: s.title,
              instruction: s.instruction ?? undefined,
              workSeconds: s.workSeconds ?? undefined,
              restSeconds: s.restSeconds ?? undefined,
              rounds: s.rounds ?? undefined,
              reps: s.reps ?? undefined,
              sets: s.sets ?? undefined,
              restBetweenSetsSeconds: s.restBetweenSetsSeconds ?? undefined,
            };
          }),
        );
        setExpandedOrder(null);
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
      const body = { name, mode, steps: toApiSteps() };
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

  if (!token) {
    return (
      <p className="px-6 text-sm text-muted">
        {t("loginRequired")}{" "}
        <Link href="/welcome" className="text-lime underline">
          {t("signIn")}
        </Link>
      </p>
    );
  }

  if (loading) {
    return <p className="px-6 text-sm text-muted">{t("loading")}</p>;
  }

  return (
    <>
      <div className="flex items-center justify-between px-6 pt-14 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/programs">
            <ChevronLeft className="h-6 w-6 text-white" />
          </Link>
          <h2 className="text-xl font-bold text-white">{t("editProgram")}</h2>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !name.trim()}
          className="text-sm font-bold text-lime disabled:opacity-50"
        >
          {saving ? t("loading") : t("save")}
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-6 pb-8">
        {error ? <p className="text-xs text-danger">{error}</p> : null}

        <div>
          <label className="mb-1 block text-xs text-muted">
            {t("programName")}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-white outline-none focus:border-lime"
          />
        </div>

        <div className="flex overflow-hidden rounded-lg bg-surface">
          <button
            type="button"
            onClick={() => setMode("INTERVAL")}
            className={`flex-1 py-2.5 text-sm font-bold ${
              mode === "INTERVAL" ? "bg-lime text-black" : "text-muted"
            }`}
          >
            {t("interval")}
          </button>
          <button
            type="button"
            onClick={() => setMode("REPS_SETS")}
            className={`flex-1 py-2.5 text-sm font-medium ${
              mode === "REPS_SETS" ? "bg-lime text-black" : "text-muted"
            }`}
          >
            {t("repsSets")}
          </button>
        </div>

        <div className="space-y-2">
          {steps.map((step) => {
            const isExpanded = expandedOrder === step.order;
            const summary = stepDetail(toExerciseStep(step), step.kind);

            return (
            <div key={step.order} className="rounded-xl bg-surface">
              <div className="flex items-start gap-1 p-3">
                <button
                  type="button"
                  onClick={() => toggleStep(step.order)}
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
                    <p className="truncate text-sm font-medium text-white">
                      <span className="text-lime">{t("stepLabel")} {step.order}</span>
                      {step.title.trim() ? (
                        <span className="text-white"> · {step.title}</span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {summary}
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => removeStep(step.order)}
                  disabled={steps.length <= 1}
                  className="shrink-0 rounded-lg p-2 text-danger disabled:opacity-30"
                  aria-label={t("deleteStep")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {isExpanded ? (
              <div className="space-y-3 border-t border-border px-4 pt-3 pb-4">
              <div>
              <label className="mb-1 block text-xs font-medium text-white">
                {t("stepTitle")}
              </label>
              <input
                type="text"
                value={step.title}
                placeholder={t("stepTitlePlaceholder")}
                onChange={(e) =>
                  patchStep(step.order, { title: e.target.value })
                }
                className="w-full rounded-lg border border-border bg-[#111] px-3 py-2.5 text-sm text-white outline-none focus:border-lime"
              />
              </div>

              <div className="flex gap-2">
                {(["INTERVAL", "REPS_SETS"] as StepKind[]).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => patchStep(step.order, { kind })}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                      step.kind === kind
                        ? "bg-lime text-black"
                        : "bg-[#222] text-muted"
                    }`}
                  >
                    {kind === "INTERVAL"
                      ? t("stepTypeInterval")
                      : t("stepTypeReps")}
                  </button>
                ))}
              </div>

              <label className="mb-1 block text-xs text-muted">
                {t("instruction")}
              </label>
              <input
                type="text"
                value={step.instruction ?? ""}
                onChange={(e) =>
                  patchStep(step.order, { instruction: e.target.value })
                }
                className="w-full rounded-lg border border-border bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-lime"
              />

              {step.kind === "INTERVAL" ? (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="mb-1 block text-[10px] text-muted">
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
                    <label className="mb-1 block text-[10px] text-muted">
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
                    <label className="mb-1 block text-[10px] text-muted">
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
                    <label className="mb-1 block text-[10px] text-muted">
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
                    <label className="mb-1 block text-[10px] text-muted">
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
                    <label className="mb-1 block text-[10px] text-muted">
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
                    <label className="mb-1 block text-[10px] text-muted">
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
              ) : null}
            </div>
            );
          })}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => addStep("INTERVAL")}
            className="flex-1 rounded-xl border border-dashed border-[#444] py-3 text-sm font-medium text-muted"
          >
            + {t("stepTypeInterval")}
          </button>
          <button
            type="button"
            onClick={() => addStep("REPS_SETS")}
            className="flex-1 rounded-xl border border-dashed border-[#444] py-3 text-sm font-medium text-muted"
          >
            + {t("stepTypeReps")}
          </button>
        </div>
      </div>
    </>
  );
}

export default function EditProgramPage() {
  return (
    <PhoneShell>
      <div className="flex h-full flex-col">
        <Suspense fallback={<p className="px-6 pt-14 text-sm text-muted">…</p>}>
          <EditProgramContent />
        </Suspense>
      </div>
    </PhoneShell>
  );
}
