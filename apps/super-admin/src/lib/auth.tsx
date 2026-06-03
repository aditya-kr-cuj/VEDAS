"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { api } from "./api";

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  tenantId?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ACCESS_KEY = "vedas_sa_access_token";
const REFRESH_KEY = "vedas_sa_refresh_token";
const USER_KEY = "vedas_sa_user";

function readLocalStorage(key: string) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

function writeLocalStorage(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  if (!value) {
    window.localStorage.removeItem(key);
    return;
  }
  window.localStorage.setItem(key, value);
}

export function getStoredAccessToken() {
  return readLocalStorage(ACCESS_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = readLocalStorage(USER_KEY);
    const storedAccess = readLocalStorage(ACCESS_KEY);
    const storedRefresh = readLocalStorage(REFRESH_KEY);
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as AuthUser;
        // Guard: only restore if super_admin
        if (parsed.role === "super_admin") {
          setUser(parsed);
          setAccessToken(storedAccess);
          setRefreshToken(storedRefresh);
        }
      } catch {
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Super admin login — no tenantCode needed
      const response = await api.post("/auth/login", { email: email.trim(), password });
      const payload = response.data;
      const nextUser = payload.user as AuthUser;

      if (nextUser.role !== "super_admin") {
        throw new Error("Access denied. This portal is for super admins only.");
      }

      const nextAccess = payload.tokens?.accessToken as string;
      const nextRefresh = payload.tokens?.refreshToken as string;

      setUser(nextUser);
      setAccessToken(nextAccess);
      setRefreshToken(nextRefresh);

      writeLocalStorage(USER_KEY, JSON.stringify(nextUser));
      writeLocalStorage(ACCESS_KEY, nextAccess);
      writeLocalStorage(REFRESH_KEY, nextRefresh);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const apiMessage = error.response?.data?.message;
        if (typeof apiMessage === "string" && apiMessage.trim().length > 0) {
          throw new Error(apiMessage);
        }
        if (!error.response) {
          throw new Error("Cannot reach API server. Make sure backend is running on http://localhost:4000.");
        }
      }
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    writeLocalStorage(USER_KEY, null);
    writeLocalStorage(ACCESS_KEY, null);
    writeLocalStorage(REFRESH_KEY, null);
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
