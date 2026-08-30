"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DeleteIconButton } from "@/components/DeleteIconButton";
import { LoginPrompt, PageLoading } from "@/components/LoginPrompt";
import { PageContent } from "@/components/PageContent";
import { PageHeader, HeaderMeta } from "@/components/PageHeader";
import { PhoneShell } from "@/components/PhoneShell";
import { programsApi } from "@/lib/api";
import { programSummary, programModeLabel } from "@/lib/api/helpers";
import type { Program } from "@/lib/api/types";
import { useAuth, getAuthErrorMessage } from "@/lib/auth/AuthContext";
import { useLocale } from "@/lib/i18n/LocaleContext";

export default function ProgramsPage() {
  const { t } = useLocale();
  const { token, isLoading: authLoading } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loadedToken, setLoadedToken] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Program | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !token) return;

    let cancelled = false;
    programsApi
      .list(token)
      .then((data) => {
        if (!cancelled) setPrograms(data);
      })
      .catch(() => {
        if (!cancelled) setPrograms([]);
      })
      .finally(() => {
        if (!cancelled) setLoadedToken(token);
      });

    return () => {
      cancelled = true;
    };
  }, [token, authLoading]);

  const onDelete = async () => {
    if (!token || !pendingDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await programsApi.delete(token, pendingDelete.id);
      setPrograms((prev) => prev.filter((p) => p.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err) {
      setDeleteError(getAuthErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const loading = authLoading || (Boolean(token) && loadedToken !== token);

  return (
    <PhoneShell showNav>
      <div className="flex h-full flex-col">
        <PageHeader
          title={t("programs")}
          subtitle={t("programsSubtitle")}
          trailing={
            !loading && token ? (
              <HeaderMeta>{programs.length}</HeaderMeta>
            ) : null
          }
        />

        <PageContent className="overflow-y-auto">
          {loading ? (
            <PageLoading />
          ) : !token ? (
            <LoginPrompt />
          ) : programs.length === 0 ? (
            <div className="rounded-2xl bg-surface app-card p-8 text-center">
              <p className="text-base font-medium text-foreground">
                {t("noProgramAssigned")}
              </p>
              <p className="mt-2 text-sm text-muted">{t("programsSubtitle")}</p>
            </div>
          ) : (
            programs.map((program) => {
              const summary = programSummary(program);

              return (
                <div
                  key={program.id}
                  className="mb-3 flex items-center rounded-xl bg-surface p-4 app-card"
                >
                  <Link
                    href={`/programs/edit?id=${program.id}`}
                    className="flex min-w-0 flex-1 items-center"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-bold text-foreground">{program.name}</p>
                      <p className="mt-1 text-sm text-muted">
                        {programModeLabel(program.mode, t)} · {summary.stepCount}{" "}
                        {t("steps")}
                      </p>
                    </div>
                  </Link>
                  <DeleteIconButton
                    label={t("deleteProgram")}
                    onClick={() => {
                      setPendingDelete(program);
                      setDeleteError(null);
                    }}
                  />
                  <Link
                    href={`/programs/edit?id=${program.id}`}
                    className="shrink-0 pl-1 text-muted"
                    aria-hidden
                    tabIndex={-1}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                </div>
              );
            })
          )}
        </PageContent>

        <div className="border-t border-border bg-surface px-6 py-5">
          <Link
            href={token ? "/programs/edit" : "/welcome"}
            className="block w-full rounded-xl bg-lime py-4 text-center font-bold text-white"
          >
            {t("newProgram")}
          </Link>
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t("deleteConfirmTitle")}
        itemName={pendingDelete?.name ?? ""}
        promptBefore={t("deleteConfirmPromptBefore")}
        promptAfter={t("deleteConfirmPromptAfter")}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        loading={deleting}
        loadingLabel={t("loading")}
        error={deleteError}
        onConfirm={() => void onDelete()}
        onCancel={() => {
          if (deleting) return;
          setPendingDelete(null);
          setDeleteError(null);
        }}
      />
    </PhoneShell>
  );
}
