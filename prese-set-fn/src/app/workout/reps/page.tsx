"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageLoading } from "@/components/LoginPrompt";
import { PhoneShell } from "@/components/PhoneShell";

/** Reps/sets workouts share the interval player (manual confirm for sets). */
function RepsRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const programId = searchParams.get("programId");
    const qs = programId
      ? `?programId=${encodeURIComponent(programId)}`
      : "";
    router.replace(`/workout/interval${qs}`);
  }, [router, searchParams]);

  return <PageLoading />;
}

export default function RepsWorkoutPage() {
  return (
    <PhoneShell>
      <Suspense fallback={<PageLoading />}>
        <RepsRedirect />
      </Suspense>
    </PhoneShell>
  );
}
