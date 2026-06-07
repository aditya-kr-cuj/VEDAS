"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import { api } from "./api";

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  tenantId?: string | null;
  tenantName?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string, tenantCode?: string) => Promise<AuthUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const ACCESS_KEY = "vedas_access_token";
export const REFRESH_KEY = "vedas_refresh_token";
export const USER_KEY = "vedas_user";

function readSessionStorage(key: string) {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(key);
}

function writeSessionStorage(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  if (!value) {
    window.sessionStorage.removeItem(key);
    return;
  }
  window.sessionStorage.setItem(key, value);
}

function clearLegacyLocalAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}

export function getStoredAccessToken() {
  return readSessionStorage(ACCESS_KEY);
}

export function getStoredUser() {
  const storedUser = readSessionStorage(USER_KEY);
  if (!storedUser) return null;
  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser) {
  writeSessionStorage(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  writeSessionStorage(USER_KEY, null);
  writeSessionStorage(ACCESS_KEY, null);
  writeSessionStorage(REFRESH_KEY, null);
  clearLegacyLocalAuth();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [accessToken, setAccessToken] = useState<string | null>(() => readSessionStorage(ACCESS_KEY));
  const [refreshToken, setRefreshToken] = useState<string | null>(() => readSessionStorage(REFRESH_KEY));
  const [isLoading] = useState(false);

  const login = async (email: string, password: string, tenantCode?: string) => {
    const response = await api.post("/auth/login", { email, password, tenantCode });
    const payload = response.data;
    let nextUser = payload.user as AuthUser;
    const nextAccess = payload.tokens?.accessToken as string;
    const nextRefresh = payload.tokens?.refreshToken as string;

    clearLegacyLocalAuth();
    writeSessionStorage(ACCESS_KEY, nextAccess);
    writeSessionStorage(REFRESH_KEY, nextRefresh);

    if (nextUser.tenantId) {
      try {
        const tenantResponse = await api.get("/tenant/me");
        const tenantName = tenantResponse.data?.name;
        if (typeof tenantName === "string" && tenantName.trim()) {
          nextUser = { ...nextUser, tenantName };
        }
      } catch {
        // Login should not fail if tenant profile fetch is temporarily unavailable.
      }
    }

    setUser(nextUser);
    setAccessToken(nextAccess);
    setRefreshToken(nextRefresh);
    setStoredUser(nextUser);
    return nextUser;
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    clearStoredAuth();
  };

  const value = useMemo(
    () => ({ user, accessToken, refreshToken, isLoading, login, logout }),
    [user, accessToken, refreshToken, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
