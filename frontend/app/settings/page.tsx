import { SettingsPanel } from "@/components/settings-panel";
export const metadata = { title: "Настройки — SourceCraft Repo Health" };
export default function SettingsPage() { return <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8"><p className="text-sm text-primary">Рабочая область</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Настройки</h1><p className="mt-3 text-muted-foreground">Оформление интерфейса и подключение аккаунта.</p><SettingsPanel /></main>; }
