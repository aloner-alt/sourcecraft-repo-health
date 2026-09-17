import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, FolderGit2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRanking } from "@/lib/api";

export default async function MyRepositoriesPage() {
  await connection();
  const ranking = await getRanking();
  return <main className="mx-auto max-w-5xl px-5 py-10 lg:px-8">
    <p className="text-sm text-primary">Локальная рабочая область</p>
    <h1 className="mt-2 text-4xl font-semibold tracking-tight">Подключённые репозитории</h1>
    <p className="mt-3 text-muted-foreground">Репозитории, уже синхронизированные backend с SourceCraft.</p>
    <section className="mt-7 rounded-xl border border-border bg-accent p-5" aria-labelledby="connection-title"><h2 id="connection-title" className="font-medium">Авторизация через Яндекс ID подключена</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Импорт и повторный запуск анализа защищены сессионной cookie. Публичные результаты и отчёты доступны без входа.</p></section>
    {ranking.items.length ? <ul className="mt-5 space-y-3">{ranking.items.map(repository => <li key={repository.id} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 lg:flex-row lg:items-center"><FolderGit2 aria-hidden="true" className="size-6 shrink-0 text-primary" /><div className="min-w-0 flex-1"><h2 className="break-words font-semibold">{repository.ownerSlug}/{repository.name}</h2><p className="mt-1 text-sm text-muted-foreground">{repository.primaryLanguage ?? "Язык не определён"} · {repository.lastAnalyzedAt ? new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(repository.lastAnalyzedAt)) : "Не анализировался"}</p></div><Badge variant="secondary">{repository.latestScore === null ? "Нет оценки" : `${repository.latestScore}/100`}</Badge><div className="flex flex-wrap gap-2"><Button variant="outline" render={<Link href={`/repositories/${repository.id}`} />}>Dashboard</Button>{repository.lastAnalyzedAt && <Button render={<Link href={`/repositories/${repository.id}`} />}>Результаты <ArrowRight aria-hidden="true" className="size-4" /></Button>}</div></li>)}</ul> : <div className="mt-5 rounded-xl border border-dashed border-border p-10 text-center"><p className="font-medium">Репозитории ещё не синхронизированы</p><p className="mt-2 text-sm text-muted-foreground">Добавьте репозиторий через backend API или CLI анализа.</p></div>}
  </main>;
}
