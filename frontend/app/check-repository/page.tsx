import { RepositoryInput } from "@/components/repository-input";

export const metadata = { title: "Проверить репозиторий — SourceCraft Repo Health" };

export default function CheckRepositoryPage() {
  return <main className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
    <p className="text-sm font-semibold text-primary">Repo Health</p>
    <h1 className="mt-3 text-3xl font-semibold tracking-tight">Проверить свой репозиторий</h1>
    <p className="mt-4 leading-7 text-muted-foreground">Вставьте ссылку на репозиторий SourceCraft. После входа через Я ID сервис подключит проект и запустит анализ.</p>
    <RepositoryInput />
  </main>;
}
