import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, ArrowRight, ChevronDown, Clock3, Download, ExternalLink } from "lucide-react";
import { DashboardDetails } from "@/components/dashboard-details";
import { AnimatedScore } from "@/components/animated-score";
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
  let repository;
  try {
    repository = await getRepository(repositoryId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  try {
    const dashboard = await Promise.all([
      getHealth(repositoryId),
      getMetrics(repositoryId),
      getRecommendations(repositoryId),
      getHistory(repositoryId),
    ]);
    return { repository, dashboard };
  } catch (error) {
    // The repository is valid, but its first analysis may still be queued.
    // That is a normal state and must not be presented as a missing page.
    if (error instanceof ApiError && error.status === 404) {
      return { repository, dashboard: null };
    }
    throw error;
  }
}

export default async function RepositoryPage({ params }: PageProps<"/repositories/[slug]">) {
  await connection();
  const { slug: repositoryId } = await params;
  const { repository, dashboard } = await loadDashboard(repositoryId);

  if (!dashboard) {
    const latestAnalysis = repository.analyses[0];
    const failed = latestAnalysis?.status === "FAILED";
    const statusText = !latestAnalysis
      ? "Анализ ещё не запускался"
      : failed
        ? "Анализ завершился с ошибкой"
        : latestAnalysis.status === "QUEUED"
          ? "Анализ поставлен в очередь"
          : "Анализ выполняется";

    return <div className="min-h-screen bg-background"><main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center px-5 py-16">
      <section className="w-full rounded-2xl border border-border bg-card p-7 shadow-sm sm:p-10">
        <p className="text-sm font-medium text-primary">Обзор репозитория</p>
        <h1 className="mt-2 break-words text-3xl font-bold tracking-tight sm:text-4xl">{repository.ownerSlug}/{repository.name}</h1>
        <p className="mt-3 text-muted-foreground">{repository.description || "Описание репозитория не указано."}</p>
        <div className="mt-8 rounded-xl border border-border bg-background/40 p-6">
          <div className="flex items-start gap-4"><Clock3 className={`mt-0.5 size-6 shrink-0 ${failed ? "text-destructive" : "text-primary"}`} aria-hidden="true" />
            <div><h2 className="text-xl font-semibold">{statusText}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{failed
                ? latestAnalysis.errorMessage || "Повторите анализ из раздела «Мои репозитории»."
                : latestAnalysis
                  ? "Репозиторий найден. Dashboard появится автоматически после завершения фоновой проверки."
                  : "Добавьте репозиторий в рабочую область и запустите первую проверку."}</p>
            </div>
          </div>
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          {latestAnalysis && <Button render={<Link href={`/analyses/${latestAnalysis.id}`} />}>Следить за анализом <ArrowRight className="size-4" /></Button>}
          <Button variant="outline" render={<Link href="/ranking" />}><ArrowLeft className="size-4" />К рейтингу</Button>
          <Button variant="outline" render={<a href={repository.webUrl} target="_blank" rel="noreferrer" />}>Открыть SourceCraft <ExternalLink className="size-4" /></Button>
        </div>
      </section>
    </main></div>;
  }

  const [health, metrics, recommendationResult, history] = dashboard;
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
      <section className="repo-header"><div><p className="eyebrow">Обзор репозитория</p><h1>{repository.ownerSlug}/{repository.name}<span className="repo-dot">.</span></h1><p>{repository.description ?? "Описание репозитория не указано."}</p><div className="repo-meta"><span>{repository.primaryLanguage ?? "Язык не определён"}</span><span>SourceCraft</span><span>Анализ: {analyzedAt}</span></div></div><div className="repo-actions"><a href="#recommendations">План улучшений <ArrowRight size={16} /></a><span>Реальные данные</span></div></section>
      <div className="repository-tools"><a className="settings-link" href={repository.webUrl} target="_blank" rel="noreferrer">Открыть SourceCraft <ExternalLink size={16} /></a><a className="report-download" href={reportUrl(health.analysisId, "md")}><Download size={16} />Скачать Markdown</a><a className="report-download" href={reportUrl(health.analysisId, "pdf")}><Download size={16} />Скачать PDF</a><Link className="settings-link" href={`/analyses/${health.analysisId}`}>Открыть анализ <ArrowRight size={16} /></Link></div>
      <div className="overview-grid">
        <section className="score-panel"><p className="eyebrow">Repo Health Score</p><AnimatedScore value={Math.round(health.score)} /><div className="health-label"><span />{healthLabel(health.score)}</div><p className="score-description">Оценка рассчитана по доступным категориям.<br />Недоступные источники исключены из веса.</p><a className="mobile-primary-action" href="#recommendations">План улучшений <ArrowRight size={18} /></a></section>
        <details className="coverage-panel"><summary><p className="eyebrow">Полнота анализа</p><div className="coverage-value">{Math.round(health.dataCoverage)}<span>%</span></div><h2>Покрытие данных</h2><div className="coverage-line"><i style={{ width: `${health.dataCoverage}%` }} /></div><p>Coverage учитывает только реально доступные источники.<br />Отсутствие данных не равно нулю.</p><span className="coverage-toggle">Что это означает? <ChevronDown size={14} /></span></summary><div className="coverage-details"><p>Категории без данных или разрешений не занижают итоговую оценку: их вес перераспределяется между доступными категориями.</p></div></details>
        <section className="potential-panel"><p className="eyebrow">Потенциал улучшений</p><div className="potential-value">{Math.round(health.potentialScore)}<span aria-hidden="true">▲</span></div><h2>Potential Score</h2><p>Прогноз после выполнения рекомендаций.<br />Максимальное значение ограничено 100.</p><a href="#recommendations">Посмотреть действия <ArrowRight size={15} /></a></section>
      </div>
      <DashboardDetails categories={categories} recommendations={recommendations} />
      <section className="col-span-full rounded-xl border border-border bg-card p-5" aria-labelledby="history-title"><div className="flex flex-wrap items-end justify-between gap-2"><div><p className="eyebrow">Динамика</p><h2 id="history-title" className="text-xl font-semibold">История Repo Health Score</h2></div><span className="text-sm text-muted-foreground">{history.items.length} запусков</span></div>{history.items.length > 1 ? <div className="mt-6 flex min-h-48 items-end gap-2 overflow-x-auto border-b border-border pb-2">{history.items.map(item => <div key={item.id} className="flex min-w-16 flex-1 flex-col items-center gap-2"><span className="text-sm font-semibold">{Math.round(item.score)}</span><div className="w-full rounded-t-md bg-primary/80" style={{ height: `${Math.max(8, Math.round(item.score * 1.35))}px` }} /><time className="text-[10px] text-muted-foreground" dateTime={item.completedAt}>{new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit" }).format(new Date(item.completedAt))}</time></div>)}</div> : <p className="mt-4 text-sm text-muted-foreground">После повторного анализа здесь появится график изменения Score.</p>}</section>
      <div className="col-span-full flex flex-wrap items-center gap-3 text-sm"><Button variant="outline" render={<a href={badgeUrl(repository.id)} target="_blank" rel="noreferrer" />}>Badge SVG</Button><span className="text-muted-foreground">ID: {health.analysisId}</span></div>
      <footer className="design-footer"><span>SourceCraft Repo Health</span><span>Покрытие данных: {Math.round(health.dataCoverage)}%</span></footer>
  </main></div>;
}
