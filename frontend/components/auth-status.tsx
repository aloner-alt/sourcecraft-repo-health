"use client";

import { useEffect, useState } from "react";
import { LogIn, LogOut } from "lucide-react";
import { clientRequest, loadSession, publicApiBaseUrl, type SessionUser } from "@/lib/client-api";

export function AuthStatus() {
  const [user, setUser] = useState<SessionUser | null>(null);
  useEffect(() => { loadSession().then(setUser).catch(() => setUser(null)); }, []);
  if (!user) return <a className="app-auth-link" href={`${publicApiBaseUrl()}/auth/yandex/login`}><LogIn size={15} />Войти</a>;
  return <button className="app-auth-link" onClick={async () => { await clientRequest<void>("/auth/logout", { method: "POST" }); setUser(null); }}><LogOut size={15} />{user.name ?? user.login}</button>;
}
