"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, Search, Trophy, X } from "lucide-react";
import { AnimatedSortIcon } from "@/components/animated-sort-icon";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LanguageFilter } from "@/components/language-filter";
import { rankingPreview } from "@/lib/dashboard-preview";

type SortKey = "score" | "likes" | "activity";
type SortDirection = "asc" | "desc";

const languages = ["Все языки", ...Array.from(new Set(rankingPreview.map((repository) => repository.language)))];

export default function RankingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [language, setLanguage] = useState(languages.includes(searchParams.get("language") ?? "") ? searchParams.get("language")! : "Все языки");
  const [sort, setSort] = useState<SortKey>(["score", "likes", "activity"].includes(searchParams.get("sort") ?? "") ? searchParams.get("sort") as SortKey : "score");
  const [direction, setDirection] = useState<SortDirection>(searchParams.get("direction") === "asc" ? "asc" : "desc");

  const updateUrl = (next: { q?: string; language?: string; sort?: SortKey; direction?: SortDirection }) => {
    const values = { q: query, language, sort, direction, ...next };
    const params = new URLSearchParams();
    if (values.q) params.set("q", values.q);
    if (values.language !== "Все языки") params.set("language", values.language);
    if (values.sort !== "score") params.set("sort", values.sort);
    if (values.direction !== "desc") params.set("direction", values.direction);
    router.replace(params.size ? `/ranking?${params.toString()}` : "/ranking");
  };

  const repositories = useMemo(() => {
    const filtered = rankingPreview.filter((repository) => {
      const matchesQuery = repository.name.toLowerCase().includes(query.trim().toLowerCase());
      return matchesQuery && (language === "Все языки" || repository.language === language);
    });
    return [...filtered].sort((first, second) => {
      const value = sort === "score" ? first.score - second.score : sort === "likes" ? first.likes - second.likes : first.rank - second.rank;
      return sort === "activity" ? (direction === "desc" ? value : -value) : direction === "desc" ? -value : value;
    });
  }, [direction, language, query, sort]);

  const setSortValue = (nextSort: SortKey) => {
    const nextDirection = nextSort === sort ? (direction === "desc" ? "asc" : "desc") : "desc";
    setSort(nextSort); setDirection(nextDirection); updateUrl({ sort: nextSort, direction: nextDirection });
  };
  const clearFilters = () => { setQuery(""); setLanguage("Все языки"); setSort("score"); setDirection("desc"); router.replace("/ranking"); };

  return <div className="min-h-screen bg-background"><main className="mx-auto max-w-7xl px-5 py-10 lg:px-8"><p className="text-sm text-primary">Публичные репозитории</p><div className="mt-2 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><h1 className="text-4xl font-bold tracking-[-0.06em]">Топ-100 репозиториев</h1><p className="mt-2 text-muted-foreground">Рейтинг по Repo Health Score. Данные показаны для демонстрации интерфейса.</p></div><Badge variant="secondary"><Trophy className="mr-1 size-3" />6 демо-репозиториев</Badge></div><Card className="mt-8"><CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center"><label className="flex min-h-11 flex-1 items-center gap-2 rounded-md border border-border bg-background/30 px-3 text-sm focus-within:ring-2 focus-within:ring-ring/60"><Search className="size-4 text-muted-foreground" /><input aria-label="Поиск репозитория" value={query} onChange={(event) => { const value = event.target.value; setQuery(value); updateUrl({ q: value }); }} placeholder="Найти репозиторий" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground" /></label><div className="flex flex-wrap gap-2"><LanguageFilter value={language} options={languages} onChange={value => { setLanguage(value); updateUrl({ language: value }); }} /><Button variant="outline" size="lg" onClick={clearFilters} disabled={!query && language === "Все языки" && sort === "score" && direction === "desc"}><X className="size-3.5" />Сбросить</Button></div></CardContent></Card><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p aria-live="polite" className="text-sm text-muted-foreground">Найдено: <span className="font-medium text-foreground">{repositories.length}</span></p><div className="flex flex-wrap gap-2"><SortButton label="Score" active={sort === "score"} direction={direction} onClick={() => setSortValue("score")} /><SortButton label="Лайки" active={sort === "likes"} direction={direction} onClick={() => setSortValue("likes")} /><SortButton label="Активность" active={sort === "activity"} direction={direction} onClick={() => setSortValue("activity")} /></div></div><Card className="mt-4 overflow-hidden"><div className="hidden grid-cols-[72px_1.5fr_110px_120px_120px] gap-4 border-b border-border px-5 py-3 text-sm font-medium text-muted-foreground xl:grid"><span>МЕСТО</span><span>РЕПОЗИТОРИЙ</span><span>SCORE</span><span>ЛАЙКИ</span><span>АКТИВНОСТЬ</span></div>{repositories.length > 0 ? repositories.map((repository) => <Link key={repository.slug} href={`/repositories/${repository.slug}`} className="grid gap-3 border-b border-border px-5 py-4 last:border-0 transition-colors hover:bg-accent/45 xl:grid-cols-[72px_1.5fr_110px_120px_120px] xl:items-center"><div className="flex items-center gap-3 font-semibold"><span className="text-lg">{repository.rank}</span><span className="text-xs text-emerald-700">{repository.trend}</span></div><div><p className="font-medium">{repository.name} <ArrowUpRight className="inline size-3 text-muted-foreground" /></p><p className="mt-1 text-xs text-muted-foreground">{repository.language}</p></div><div><span className={`text-xl font-bold ${repository.score >= 85 ? "text-emerald-700" : repository.score >= 70 ? "text-primary" : "text-amber-700"}`}>{repository.score}</span><span className="ml-1 text-xs text-muted-foreground">/100</span></div><p className="text-sm text-muted-foreground"><span className="xl:hidden">Лайки: </span>{repository.likes.toLocaleString("ru-RU")}</p><p className="text-sm text-muted-foreground"><span className="xl:hidden">Активность: </span>{repository.activity}</p></Link>) : <div className="px-5 py-16 text-center"><p className="font-medium">Ничего не найдено</p><p className="mt-2 text-sm text-muted-foreground">Попробуйте изменить запрос или сбросить фильтры.</p><Button className="mt-5" variant="outline" onClick={clearFilters}>Сбросить фильтры</Button></div>}</Card></main></div>;
}

function SortButton({ label, active, direction, onClick }: { label: string; active: boolean; direction: SortDirection; onClick: () => void }) { return <Button aria-pressed={active} aria-label={`Сортировка: ${label}${active ? direction === "desc" ? ", по убыванию" : ", по возрастанию" : ""}`} variant={active ? "default" : "outline"} size="sm" onClick={onClick}>{label}<AnimatedSortIcon /></Button>; }
