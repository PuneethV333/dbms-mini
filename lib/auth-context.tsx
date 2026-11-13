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
import { apiClient } from "@/lib/client/api";
import type { UserDto } from "@/lib/types";

interface AuthContextValue {
  user: UserDto | null;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<UserDto>;
  signUp: (name: string, email: string, password: string) => Promise<UserDto>;
  signOut: () => Promise<void>;
  refresh: () => Promise<UserDto | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [initializing, setInitializing] = useState(true);

  const refresh = useCallback(async (): Promise<UserDto | null> => {
    try {
      const response = await apiClient.get<UserDto>("/auth/me");
      setUser(response.data);
      return response.data;
    } catch {
      setUser(null);
      return null;
    } finally {
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = useCallback(async (email: string, password: string): Promise<UserDto> => {
    const response = await apiClient.post<UserDto>("/auth/signin", { email, password });
    setUser(response.data);
    return response.data;
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string): Promise<UserDto> => {
      const response = await apiClient.post<UserDto>("/auth/signup", { name, email, password });
      setUser(response.data);
      return response.data;
    },
    [],
  );

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await apiClient.post("/auth/signout");
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, initializing, signIn, signUp, signOut, refresh }),
    [user, initializing, signIn, signUp, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
