import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getRanking } from "@/lib/api";

export default async function RepositoryIndexPage() {
  await connection();
  const ranking = await getRanking(1);
  const first = ranking.items[0];
  if (first) redirect(`/repositories/${first.id}`);
  return <main className="mx-auto max-w-3xl px-5 py-16 lg:px-8">
    <h1 className="text-3xl font-semibold">Обзор репозитория</h1>
    <p className="mt-4 text-muted-foreground">Пока нет проанализированных репозиториев. Подключите проект, чтобы увидеть оценку и рекомендации.</p>
    <Link href="/check-repository" className="mt-6 inline-flex min-h-11 items-center font-medium text-primary">Проверить репозиторий →</Link>
  </main>;
}
