"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isProtectedDemoRoute } from "@/lib/demo-access";

type DemoAccountStatus = "loading" | "guest" | "registered";
type DemoAccountContextValue = {
  status: DemoAccountStatus;
  setStatus: (status: "guest" | "registered") => void;
};

const storageKey = "repo-health-demo-account";
const DemoAccountContext = createContext<DemoAccountContextValue | null>(null);
export function DemoAccountProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatusState] = useState<DemoAccountStatus>("loading");

  useEffect(() => {
    const readStatus = () => {
      try {
        setStatusState(localStorage.getItem(storageKey) === "registered" ? "registered" : "guest");
      } catch {
        setStatusState("guest");
      }
    };
    readStatus();
    window.addEventListener("storage", readStatus);
    return () => window.removeEventListener("storage", readStatus);
  }, []);

  const setStatus = (next: "guest" | "registered") => {
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // The demo still works for the current tab when storage is unavailable.
    }
    setStatusState(next);
  };

  return <DemoAccountContext.Provider value={{ status, setStatus }}>{children}</DemoAccountContext.Provider>;
}

export function useDemoAccount() {
  const account = useContext(DemoAccountContext);
  if (!account) throw new Error("DemoAccountProvider is missing");
  return account;
}

export function DemoAccessGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useDemoAccount();
  const protectedRoute = isProtectedDemoRoute(pathname);

  useEffect(() => {
    if (protectedRoute && status === "guest") {
      router.replace(`/register?next=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, protectedRoute, router, status]);

  if (protectedRoute && status !== "registered") {
    return <main className="mx-auto max-w-3xl px-5 py-12 text-sm text-muted-foreground" role="status">Проверяем доступ к разделу…</main>;
  }
  return children;
}
