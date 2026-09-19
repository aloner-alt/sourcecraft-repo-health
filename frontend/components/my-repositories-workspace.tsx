"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FolderGit2, LoaderCircle, LogIn, Play, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Analysis, RepositorySummary } from "@/lib/api-types";
import { clientRequest, loadMyRepositories, loadSession, publicApiBaseUrl, type SessionUser } from "@/lib/client-api";

export function MyRepositoriesWorkspace() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [repositories, setRepositories] = useState<RepositorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([loadSession(), loadMyRepositories()])
      .then(([session, items]) => { setUser(session); setRepositories(items); })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const startAnalysis = async (repositoryId: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const analysis = await clientRequest<Analysis>(`/repositories/${encodeURIComponent(repositoryId)}/analyses`, {
        method: "POST",
        body: JSON.stringify({ trigger: "MANUAL" }),
      });
      router.push(`/analyses/${analysis.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось запустить анализ.");
      setSubmitting(false);
    }
  };

  const importAndAnalyze = async (formData: FormData) => {
    const organization = String(formData.get("organization") ?? "").trim();
    const repository = String(formData.get("repository") ?? "").trim();
    if (!organization || !repository) return;
    setSubmitting(true);
    setError(null);
    try {
      const imported = await clientRequest<RepositorySummary>(`/repositories/sourcecraft/${encodeURIComponent(organization)}/${encodeURIComponent(repository)}/sync`, { method: "POST" });
      await startAnalysis(imported.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось подключить репозиторий.");
      setSubmitting(false);
    }
  };

  if (loading) return <main className="mx-auto max-w-5xl px-5 py-16"><LoaderCircle className="animate-spin text-primary" /><p className="mt-3 text-muted-foreground">Проверяем сессию…</p></main>;
  if (!user) return <main className="mx-auto max-w-3xl px-5 py-16 text-center"><LogIn className="mx-auto size-10 text-primary" /><h1 className="mt-5 text-3xl font-semibold">Войдите через Я ID</h1><p className="mx-auto mt-3 max-w-xl text-muted-foreground">После входа вы сможете подключить публичный репозиторий SourceCraft, запустить первичный или повторный анализ и получить отчёт.</p><Button className="mt-7" size="lg" render={<a href={`${publicApiBaseUrl()}/auth/yandex/login`} />}>Войти через Яндекс</Button></main>;

  return <main className="mx-auto max-w-5xl px-5 py-10 lg:px-8">
    <p className="text-sm text-primary">Рабочая область {user.name ?? user.login}</p>
    <h1 className="mt-2 text-4xl font-semibold tracking-tight">Мои репозитории</h1>
    <p className="mt-3 text-muted-foreground">Подключите публичный репозиторий SourceCraft и сразу запустите анализ.</p>
    <form action={importAndAnalyze} className="mt-7 grid gap-3 rounded-xl border border-border bg-card p-5 sm:grid-cols-[1fr_1fr_auto]">
      <label className="text-sm font-medium">Организация<input required name="organization" placeholder="divkit" className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3 font-normal outline-none" /></label>
      <label className="text-sm font-medium">Репозиторий<input required name="repository" placeholder="divkit" className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3 font-normal outline-none" /></label>
      <Button className="self-end" disabled={submitting} type="submit">{submitting ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}Подключить и проверить</Button>
    </form>
    {error && <p role="alert" className="mt-4 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900">{error}</p>}
    {repositories.length ? <ul className="mt-5 space-y-3">{repositories.map(repository => <li key={repository.id} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 lg:flex-row lg:items-center"><FolderGit2 className="size-6 shrink-0 text-primary" /><div className="min-w-0 flex-1"><h2 className="break-words font-semibold">{repository.ownerSlug}/{repository.name}</h2><p className="mt-1 text-sm text-muted-foreground">{repository.primaryLanguage ?? "Язык не определён"} · {repository.lastAnalyzedAt ? new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(repository.lastAnalyzedAt)) : "Ещё не анализировался"}</p></div><Badge variant="secondary">{repository.latestScore === null ? "Нет оценки" : `${Math.round(repository.latestScore)}/100`}</Badge><div className="flex flex-wrap gap-2">{repository.lastAnalyzedAt && <Button variant="outline" render={<Link href={`/repositories/${repository.id}`} />}>Dashboard <ArrowRight className="size-4" /></Button>}<Button disabled={submitting} onClick={() => startAnalysis(repository.id)}><Play className="size-4" />{repository.lastAnalyzedAt ? "Повторить" : "Запустить"}</Button></div></li>)}</ul> : <div className="mt-5 rounded-xl border border-dashed border-border p-10 text-center"><p className="font-medium">В рабочей области пока нет репозиториев</p><p className="mt-2 text-sm text-muted-foreground">Используйте форму выше для первого анализа.</p></div>}
  </main>;
}
