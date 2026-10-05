"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { SessionUser } from "@/lib/auth";
import type { Permission } from "@/lib/access";
type AuthContextValue = { user: SessionUser | null; loading: boolean; refresh: () => Promise<void>; logout: () => Promise<void>; can: (permission: Permission) => boolean };
const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try { const response = await fetch("/api/auth/session", { cache: "no-store" }); const data = await response.json(); setUser(response.ok ? data.user : null); }
    catch { setUser(null); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const logout = useCallback(async () => { await fetch("/api/auth/logout", { method: "POST" }); setUser(null); window.location.assign("/login"); }, []);
  const can = useCallback((permission: Permission) => Boolean(user && (user.role === "Admin" || user.permissions.includes(permission))), [user]);
  return <AuthContext.Provider value={{ user, loading, refresh, logout, can }}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error("useAuth must be used inside AuthProvider"); return value; }
