"use client";

import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { FormEvent, useState, useSyncExternalStore } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PhoneShell } from "@/components/PhoneShell";
import { authApi } from "@/lib/api";
import { APP_VERSION } from "@/lib/appVersion";
import { useAuth, getAuthErrorMessage } from "@/lib/auth/AuthContext";
import { useLocale } from "@/lib/i18n/LocaleContext";

type Mode = "login" | "register" | "reset";

const REMEMBER_FLAG_KEY = "paceset_remember_me";
const REMEMBER_EMAIL_KEY = "paceset_remember_email";

const DEV_LOGIN =
  process.env.NODE_ENV === "development"
    ? { email: "admin@paceset.app", password: "PassW0rd!" }
    : { email: "", password: "" };

function subscribeRememberStore(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

/** Stable string snapshot: "1:email" or "0:" */
function getRememberSnapshot() {
  const flag = window.localStorage.getItem(REMEMBER_FLAG_KEY) === "1" ? "1" : "0";
  const email = window.localStorage.getItem(REMEMBER_EMAIL_KEY) ?? "";
  return `${flag}:${email}`;
}

function getRememberServerSnapshot() {
  return "0:";
}

function parseRememberSnapshot(raw: string) {
  const sep = raw.indexOf(":");
  const flag = raw.slice(0, sep) === "1";
  const email = raw.slice(sep + 1);
  return { flag, email: email || null };
}

export default function WelcomePage() {
  const { t } = useLocale();
  const router = useRouter();
  const { login, register, enterGuest, isLoading } = useAuth();
  const remembered = parseRememberSnapshot(
    useSyncExternalStore(
      subscribeRememberStore,
      getRememberSnapshot,
      getRememberServerSnapshot,
    ),
  );

  const [mode, setMode] = useState<Mode>("login");
  const [emailDraft, setEmailDraft] = useState<string | null>(null);
  const [rememberDraft, setRememberDraft] = useState<boolean | null>(null);
  const [password, setPassword] = useState(DEV_LOGIN.password);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const email =
    emailDraft ??
    (remembered.flag && remembered.email ? remembered.email : DEV_LOGIN.email);
  const rememberMe = rememberDraft ?? remembered.flag;

  const persistRememberMe = (nextEmail: string, enabled: boolean) => {
    if (enabled) {
      window.localStorage.setItem(REMEMBER_FLAG_KEY, "1");
      window.localStorage.setItem(REMEMBER_EMAIL_KEY, nextEmail.trim());
    } else {
      window.localStorage.removeItem(REMEMBER_FLAG_KEY);
      window.localStorage.removeItem(REMEMBER_EMAIL_KEY);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      if (mode === "reset") {
        if (password !== confirmPassword) {
          setError(t("passwordMismatch"));
          return;
        }
        await authApi.resetPassword({ email, newPassword: password });
        setInfo(t("resetPasswordDone"));
        setPassword("");
        setConfirmPassword("");
        setMode("login");
        return;
      }
      if (mode === "login") {
        await login(email, password);
        persistRememberMe(email, rememberMe);
      } else {
        await register(email, password, displayName || "Athlete");
        persistRememberMe(email, rememberMe);
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

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setInfo(null);
    if (next === "reset") {
      setPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <PhoneShell>
      <div
        className="relative flex h-full flex-col items-center justify-center px-8 text-center"
        style={{
          background:
            "radial-gradient(ellipse at 50% 80%, #fff3e0 0%, #f0f2f5 70%)",
        }}
      >
        <div className="absolute right-4 bottom-5 z-10">
          <LanguageSwitcher compact />
        </div>

        <p className="absolute bottom-5 left-4 text-[11px] text-muted/70">
          {APP_VERSION}
        </p>

        <div className="timer-font mb-2 text-6xl font-black tracking-tight text-foreground">
          Pace<span className="text-lime">Set</span>
        </div>
        <p className="mt-4 mb-8 text-base text-muted">{t("tagline")}</p>

        {isLoading ? (
          <p className="text-sm text-muted">{t("loading")}</p>
        ) : (
          <form
            onSubmit={onSubmit}
            className="w-full space-y-3 text-left"
            autoComplete="on"
          >
            {mode === "register" ? (
              <input
                type="text"
                name="name"
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t("displayName")}
                className="app-input"
              />
            ) : null}
            <input
              type="email"
              name="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmailDraft(e.target.value)}
              placeholder={t("email")}
              className="app-input"
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                minLength={6}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  mode === "reset" ? t("newPassword") : t("password")
                }
                className="app-input py-3 pr-12 pl-4"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted hover:text-foreground"
                aria-label={showPassword ? t("hidePassword") : t("showPassword")}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {mode === "reset" ? (
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                required
                minLength={6}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("confirmPassword")}
                className="app-input"
              />
            ) : null}
            {mode === "login" ? (
              <div className="flex items-center justify-between gap-3 px-0.5 py-1">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberDraft(e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-[var(--lime)]"
                  />
                  <span>{t("rememberMe")}</span>
                </label>
                <button
                  type="button"
                  onClick={() => switchMode("reset")}
                  className="shrink-0 text-sm text-muted underline"
                >
                  {t("forgotPassword")}
                </button>
              </div>
            ) : null}
            {error ? (
              <p className="text-xs leading-relaxed text-danger">{error}</p>
            ) : null}
            {info ? (
              <p className="text-xs leading-relaxed text-lime">{info}</p>
            ) : null}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-lime py-4 text-lg font-bold text-white disabled:opacity-60"
            >
              {submitting
                ? t("loading")
                : mode === "login"
                  ? t("signIn")
                  : mode === "register"
                    ? t("createAccount")
                    : t("resetPassword")}
            </button>
          </form>
        )}

        {mode === "reset" ? (
          <button
            type="button"
            onClick={() => switchMode("login")}
            className="mt-4 text-sm text-lime underline"
          >
            {t("backToSignIn")}
          </button>
        ) : (
          <button
            type="button"
            onClick={() =>
              switchMode(mode === "login" ? "register" : "login")
            }
            className="mt-4 text-sm text-lime underline"
          >
            {mode === "login" ? t("noAccount") : t("haveAccount")}
          </button>
        )}

        {mode !== "reset" ? (
          <button
            type="button"
            onClick={onGuest}
            className="mt-5 text-sm text-muted underline"
          >
            {t("continueGuest")}
          </button>
        ) : null}
      </div>
    </PhoneShell>
  );
}
