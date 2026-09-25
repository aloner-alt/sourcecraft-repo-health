"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Analysis, RepositorySummary } from "@/lib/api-types";
import { clientRequest, loadSession, publicApiBaseUrl, type SessionUser } from "@/lib/client-api";

function parseSourceCraftUrl(value: string) {
  const url = new URL(value.trim());
  const parts = url.pathname.split("/").filter(Boolean);
  if (url.protocol !== "https:" || url.hostname !== "sourcecraft.dev" || url.username || url.password || parts.length !== 2 || url.search || url.hash) {
    throw new Error("Укажите ссылку вида https://sourcecraft.dev/организация/репозиторий без параметров и токенов.");
  }
  return { organization: parts[0], repository: parts[1] };
}

export function RepositoryInput() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadSession().then(setUser).catch(() => setUser(null)).finally(() => setCheckingSession(false));
  }, []);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    let location: ReturnType<typeof parseSourceCraftUrl>;
    try { location = parseSourceCraftUrl(url); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Неверная ссылка."); return; }
    if (!user) { setMessage("Сначала войдите через Я ID, чтобы запустить анализ."); return; }
    setSubmitting(true);
    try {
      const imported = await clientRequest<RepositorySummary>(`/repositories/sourcecraft/${encodeURIComponent(location.organization)}/${encodeURIComponent(location.repository)}/sync`, { method: "POST" });
      const analysis = await clientRequest<Analysis>(`/repositories/${encodeURIComponent(imported.id)}/analyses`, { method: "POST", body: JSON.stringify({ trigger: "MANUAL" }) });
      router.push(`/analyses/${analysis.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось запустить анализ.");
      setSubmitting(false);
    }
  };

  return <section className="mt-7 rounded-xl border border-border bg-card p-5 shadow-[var(--surface-shadow)] sm:p-6">
    <form onSubmit={submit}>
      <label className="text-sm font-medium" htmlFor="repository-url">Ссылка на репозиторий</label>
      <input className="mt-3 block h-12 w-full min-w-0 rounded-lg border border-border bg-background px-3 text-base text-foreground" id="repository-url" type="url" required value={url} onChange={event => { setUrl(event.target.value); setMessage(""); }} placeholder="https://sourcecraft.dev/owner/repository" autoComplete="off" aria-describedby="repository-input-note repository-input-message" />
      <p id="repository-input-note" className="mt-3 text-sm leading-6 text-muted-foreground">Для запуска анализа нужен вход через Я ID. Не добавляйте секреты в ссылку.</p>
      {checkingSession ? <p className="mt-5 text-sm text-muted-foreground">Проверяем сессию…</p> : !user ? <Button className="mt-5" size="lg" render={<a href={`${publicApiBaseUrl()}/auth/yandex/login`} />}>Войти через Я ID</Button> : <Button className="mt-5" size="lg" type="submit" disabled={submitting}>{submitting && <LoaderCircle className="size-4 animate-spin" />}{submitting ? "Запускаем анализ…" : "Проверить репозиторий"}</Button>}
      <p id="repository-input-message" role="alert" className="mt-4 text-sm leading-6">{message}</p>
    </form>
  </section>;
}
