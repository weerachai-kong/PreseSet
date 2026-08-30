"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError, authApi, usersApi } from "@/lib/api";
import type { UserProfile } from "@/lib/api/types";

const TOKEN_KEY = "paceset.accessToken";
const GUEST_KEY = "paceset.guest";

type AuthContextValue = {
  token: string | null;
  user: UserProfile | null;
  isGuest: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  logout: () => void;
  enterGuest: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async (activeToken?: string) => {
    const t = activeToken ?? token;
    if (!t) return;
    const profile = await usersApi.me(t);
    setUser(profile);
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    const saved = window.localStorage.getItem(TOKEN_KEY);

    if (saved) {
      window.sessionStorage.removeItem(GUEST_KEY);
      queueMicrotask(() => {
        if (cancelled) return;
        setToken(saved);
        setIsGuest(false);
        void refreshProfile(saved)
          .catch(() => {
            if (cancelled) return;
            window.localStorage.removeItem(TOKEN_KEY);
            setToken(null);
            setUser(null);
          })
          .finally(() => {
            if (!cancelled) setIsLoading(false);
          });
      });
    } else {
      queueMicrotask(() => {
        if (cancelled) return;
        setIsGuest(window.sessionStorage.getItem(GUEST_KEY) === "1");
        setIsLoading(false);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [refreshProfile]);

  const persistToken = useCallback(
    async (accessToken: string) => {
      window.sessionStorage.removeItem(GUEST_KEY);
      window.localStorage.setItem(TOKEN_KEY, accessToken);
      setToken(accessToken);
      setIsGuest(false);
      setIsLoading(false);
      await refreshProfile(accessToken);
    },
    [refreshProfile],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login({ email, password });
      await persistToken(res.accessToken);
    },
    [persistToken],
  );

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      const res = await authApi.register({ email, password, displayName });
      await persistToken(res.accessToken);
    },
    [persistToken],
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(GUEST_KEY);
    setToken(null);
    setUser(null);
    setIsGuest(false);
    setIsLoading(false);
  }, []);

  const enterGuest = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.setItem(GUEST_KEY, "1");
    setToken(null);
    setUser(null);
    setIsGuest(true);
    setIsLoading(false);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isGuest,
      isLoading,
      login,
      register,
      logout,
      enterGuest,
      refreshProfile: () => refreshProfile(),
    }),
    [
      token,
      user,
      isGuest,
      isLoading,
      login,
      register,
      logout,
      enterGuest,
      refreshProfile,
    ],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function getAuthErrorMessage(err: unknown) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}
