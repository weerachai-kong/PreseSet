"use client";

import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { FormEvent, useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { useAuth, getAuthErrorMessage } from "@/lib/auth/AuthContext";
import { useLocale } from "@/lib/i18n/LocaleContext";

type Mode = "login" | "register";

export default function WelcomePage() {
  const { t } = useLocale();
  const router = useRouter();
  const { login, register, enterGuest, isLoading } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, displayName || "Athlete");
      }
      router.push("/home");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onGuest = () => {
    enterGuest();
    router.push("/home");
  };

  return (
    <PhoneShell>
      <div
        className="flex h-full flex-col items-center justify-center px-8 text-center"
        style={{
          background:
            "radial-gradient(ellipse at 50% 80%, #1a2010 0%, #0B0D0F 70%)",
        }}
      >
        <div className="timer-font mb-2 text-6xl font-black tracking-tight text-white">
          Pace<span className="text-lime">Set</span>
        </div>
        <p className="mt-4 mb-8 text-base text-muted">{t("tagline")}</p>

        {isLoading ? (
          <p className="text-sm text-muted">{t("loading")}</p>
        ) : (
          <form onSubmit={onSubmit} className="w-full space-y-3 text-left">
            {mode === "register" ? (
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t("displayName")}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-white outline-none focus:border-lime"
              />
            ) : null}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("email")}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-white outline-none focus:border-lime"
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("password")}
                className="w-full rounded-xl border border-border bg-surface py-3 pr-12 pl-4 text-white outline-none focus:border-lime"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted hover:text-white"
                aria-label={showPassword ? t("hidePassword") : t("showPassword")}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {error ? (
              <p className="text-xs leading-relaxed text-danger">{error}</p>
            ) : null}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-lime py-4 text-lg font-bold text-black disabled:opacity-60"
            >
              {submitting
                ? t("loading")
                : mode === "login"
                  ? t("signIn")
                  : t("createAccount")}
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={() =>
            setMode((m) => (m === "login" ? "register" : "login"))
          }
          className="mt-4 text-sm text-lime underline"
        >
          {mode === "login" ? t("noAccount") : t("haveAccount")}
        </button>

        <button
          type="button"
          onClick={onGuest}
          className="mt-5 text-sm text-muted underline"
        >
          {t("continueGuest")}
        </button>
      </div>
    </PhoneShell>
  );
}
