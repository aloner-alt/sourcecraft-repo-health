import { SettingsPanel } from "@/components/settings-panel";

export const metadata = { title: "Настройки — SourceCraft Repo Health" };

export default function SettingsPage() {
  return <main className="mx-auto max-w-3xl px-5 py-12 lg:px-8"><p className="text-sm font-semibold text-primary">РАБОЧАЯ ОБЛАСТЬ</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Настройки</h1><SettingsPanel /></main>;
}
