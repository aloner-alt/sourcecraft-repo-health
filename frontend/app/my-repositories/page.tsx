import Link from "next/link";
import { ArrowRight, FolderGit2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { myRepositoriesPreview } from "@/lib/dashboard-preview";

export default function MyRepositoriesPage() {
  return <main className="mx-auto max-w-5xl px-5 py-10 lg:px-8">
    <p className="text-sm text-primary">Рабочая область</p>
    <h1 className="mt-2 text-4xl font-semibold tracking-tight">Мои репозитории</h1>
    <p className="mt-3 text-muted-foreground">Выберите репозиторий для проверки сценария анализа.</p>
    <section className="mt-7 rounded-xl border border-border bg-accent p-5" aria-labelledby="connection-title">
      <h2 id="connection-title" className="font-medium">Подключение аккаунта пока недоступно</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">Это демонстрационный список, не ваши реальные репозитории. Вход через Я ID и добавление репозитория появятся после подключения backend. Не вводите здесь токены или пароли.</p>
    </section>
    <ul className="mt-5 space-y-3">{myRepositoriesPreview.map(repository => <li key={repository.slug} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 lg:flex-row lg:items-center">
      <FolderGit2 aria-hidden="true" className="size-6 shrink-0 text-primary" />
      <div className="min-w-0 flex-1"><h2 className="break-words font-semibold">{repository.name}</h2><p className="mt-1 text-sm text-muted-foreground">{repository.language} · {repository.lastAnalysis}</p></div>
      <Badge variant="secondary">{repository.status}</Badge>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" render={<Link href={`/repositories/${repository.slug}`} />}>Dashboard</Button>
        <Button render={<Link href={`/analyses/${repository.slug}-demo`} />}>Демо-анализ <ArrowRight aria-hidden="true" className="size-4" /></Button>
      </div>
    </li>)}</ul>
  </main>;
}
