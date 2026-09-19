"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { loadSession } from "@/lib/client-api";

export default function AuthCallbackPage() {
  const router = useRouter();
  useEffect(() => {
    loadSession().catch(() => undefined).finally(() => router.replace("/my-repositories"));
  }, [router]);
  return <main className="mx-auto max-w-xl px-5 py-20 text-center"><LoaderCircle className="mx-auto size-9 animate-spin text-primary" /><h1 className="mt-5 text-2xl font-semibold">Завершаем вход</h1><p className="mt-2 text-muted-foreground">Проверяем сессию Я ID…</p></main>;
}
