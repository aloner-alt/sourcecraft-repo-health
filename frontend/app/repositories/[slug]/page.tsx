import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowRight, ChevronDown, Download, ExternalLink } from "lucide-react";
import { DashboardDetails } from "@/components/dashboard-details";
import { Button } from "@/components/ui/button";
import { ApiError, badgeUrl, getHealth, getHistory, getMetrics, getRecommendations, getRepository, reportUrl } from "@/lib/api";
import type { DashboardCategory, DashboardRecommendation } from "@/lib/dashboard-view";
import "./dashboard.css";

const categoryNames: Record<string, string> = {
  DOCUMENTATION: "Документация",
  CI_CD: "CI/CD",
  SECURITY: "Безопасность",
  ACTIVITY: "Активность",
  ISSUES: "Issues",
  CODE_HEALTH: "Качество кода",
};

const statusNames: Record<string, string> = {
  AVAILABLE: "Данные доступны",
  NO_DATA: "Нет данных",
  NOT_APPLICABLE: "Не применимо",
  COLLECTION_ERROR: "Ошибка сбора",
  PERMISSION_DENIED: "Нет доступа",
};

function Score({ value }: { value: number }) {
  const roundedValue = Math.round(value);
  return <div className="score-visual score-ring" role="img" aria-label={`Здоровье репозитория: ${roundedValue} из 100`}>
    <svg viewBox="0 0 200 200" aria-hidden="true"><circle className="track" cx="100" cy="100" r="86" /><circle className="progress" cx="100" cy="100" r="86" pathLength="100" strokeDasharray={`${roundedValue} 100`} /></svg>
    <div className="score-number"><strong>{roundedValue}</strong><span>/ 100</span></div>
  </div>;
}

function rawValue(value: unknown): string {
  if (value === null || value === undefined) return "Нет данных";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function healthLabel(score: number): string {
  if (score >= 85) return "Отличное состояние";
  if (score >= 70) return "Хорошее состояние";
  if (score >= 50) return "Требует внимания";
  return "Нужны улучшения";
}

async function loadDashboard(repositoryId: string) {
  try {
    return await Promise.all([
      getRepository(repositoryId),
      getHealth(repositoryId),
      getMetrics(repositoryId),
      getRecommendations(repositoryId),
      getHistory(repositoryId),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

export default async function RepositoryPage({ params }: PageProps<"/repositories/[slug]">) {
  await connection();
  const { slug: repositoryId } = await params;
  const [repository, health, metrics, recommendationResult, history] = await loadDashboard(repositoryId);
    const metricByCategory = new Map(metrics.categories.map(category => [category.category, category]));
    const categories: DashboardCategory[] = health.categories.map(category => {
      const metricCategory = metricByCategory.get(category.category);
      const firstMetric = metricCategory?.metrics[0];
      return {
        id: category.category.toLowerCase(),
        name: categoryNames[category.category] ?? category.category,
        value: category.score === null ? null : Math.round(category.score),
        weight: Math.round(category.weight * 100),
        status: statusNames[category.status] ?? category.status,
        reason: category.summary,
        fact: firstMetric?.source ?? "SourceCraft API",
        raw: firstMetric ? `${firstMetric.explanation} ${rawValue(firstMetric.rawValue)}` : category.summary,
        metrics: metricCategory?.metrics.map(metric => ({
          id: metric.id,
          key: metric.key,
          score: metric.normalizedScore === null ? null : Math.round(metric.normalizedScore),
          weight: Math.round(metric.weight * 100),
          status: statusNames[metric.status] ?? metric.status,
          source: metric.source,
          explanation: metric.explanation,
          raw: rawValue(metric.rawValue),
          evidence: metric.evidence.map(evidence => ({
            id: evidence.id,
            label: evidence.label,
            kind: evidence.kind,
            url: evidence.url,
            value: rawValue(evidence.value),
          })),
        })) ?? [],
      };
    });
    const recommendations: DashboardRecommendation[] = recommendationResult.items.map(item => ({
      id: item.id,
      categoryId: item.category.toLowerCase(),
      priority: item.priority.toLowerCase() as DashboardRecommendation["priority"],
      title: item.title,
      why: `${item.problem} ${item.rationale}`,
      fact: item.evidence[0]?.label ?? item.problem,
      source: item.evidence[0]?.kind ?? "Repo Health analysis",
      steps: [item.action],
      expectedScoreDelta: Math.round(item.expectedScoreDelta),
      confidence: item.confidence,
    }));
    const analyzedAt = new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(health.completedAt));

  return <div className="repository-dashboard"><main className="design-main" id="overview">
      <section className="repo-header"><div><p className="eyebrow">Обзор репозитория</p><h1>{repository.ownerSlug}/{repository.name}<span className="repo-dot">.</span></h1><p>{repository.description ?? "Описание репозитория не указано."}</p><div className="repo-meta"><span>{repository.primaryLanguage ?? "Язык не определён"}</span><span>SourceCraft</span><span>Анализ: {analyzedAt}</span></div></div><div className="repo-actions"><a href={repository.webUrl} target="_blank" rel="noreferrer">Открыть SourceCraft <ExternalLink size={16} /></a><span>Реальные данные</span></div></section>
      <div className="overview-grid">
        <section className="score-panel"><p className="eyebrow">Repo Health Score</p><Score value={health.score} /><div className="health-label"><span />{healthLabel(health.score)}</div><p className="score-description">Оценка рассчитана по доступным категориям.<br />Недоступные источники исключены из веса.</p><a className="mobile-primary-action" href="#recommendations">План улучшений <ArrowRight size={18} /></a></section>
        <section className="coverage-panel"><p className="eyebrow">Полнота анализа</p><div className="coverage-value">{Math.round(health.dataCoverage)}<span>%</span></div><h2>Покрытие данных</h2><div className="coverage-line"><i style={{ width: `${health.dataCoverage}%` }} /></div><p>Coverage учитывает только реально доступные источники.<br />Отсутствие данных не равно нулю.</p><details><summary>Что это означает? <ChevronDown size={14} /></summary><p>Категории без данных или разрешений не занижают итоговую оценку: их вес перераспределяется между доступными категориями.</p></details></section>
        <section className="potential-panel"><p className="eyebrow">Потенциал улучшений</p><div className="potential-value">{Math.round(health.potentialScore)}<span aria-hidden="true">▲</span></div><h2>Potential Score</h2><p>Прогноз после выполнения рекомендаций.<br />Максимальное значение ограничено 100.</p><a href="#recommendations">Посмотреть действия <ArrowRight size={15} /></a></section>
      </div>
      <DashboardDetails categories={categories} recommendations={recommendations} />
      <section className="col-span-full rounded-xl border border-border bg-card p-5" aria-labelledby="history-title"><div className="flex flex-wrap items-end justify-between gap-2"><div><p className="eyebrow">Динамика</p><h2 id="history-title" className="text-xl font-semibold">История Repo Health Score</h2></div><span className="text-sm text-muted-foreground">{history.items.length} запусков</span></div>{history.items.length > 1 ? <div className="mt-6 flex min-h-48 items-end gap-2 overflow-x-auto border-b border-border pb-2">{history.items.map(item => <div key={item.id} className="flex min-w-16 flex-1 flex-col items-center gap-2"><span className="text-sm font-semibold">{Math.round(item.score)}</span><div className="w-full rounded-t-md bg-primary/80" style={{ height: `${Math.max(8, Math.round(item.score * 1.35))}px` }} /><time className="text-[10px] text-muted-foreground" dateTime={item.completedAt}>{new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit" }).format(new Date(item.completedAt))}</time></div>)}</div> : <p className="mt-4 text-sm text-muted-foreground">После повторного анализа здесь появится график изменения Score.</p>}</section>
      <div className="col-span-full flex flex-wrap gap-3"><Button variant="outline" render={<a href={reportUrl(health.analysisId, "md")} />}><Download size={16} />Markdown</Button><Button variant="outline" render={<a href={reportUrl(health.analysisId, "pdf")} />}><Download size={16} />PDF</Button><Button variant="outline" render={<a href={badgeUrl(repository.id)} target="_blank" rel="noreferrer" />}>Badge SVG</Button></div>
      <div className="col-span-full flex flex-wrap items-center gap-3 text-sm"><Link className="rounded-lg border border-border bg-card px-4 py-3 font-medium text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" href={`/analyses/${health.analysisId}`}>Открыть результат анализа</Link><span className="text-muted-foreground">ID: {health.analysisId}</span></div>
      <footer className="design-footer"><span>SourceCraft Repo Health</span><span>Покрытие данных: {Math.round(health.dataCoverage)}%</span></footer>
  </main></div>;
}
