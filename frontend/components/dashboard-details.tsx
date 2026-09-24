"use client";

import { useRef, useState } from "react";
import { ArrowRight, Check, ChevronDown, CircleAlert, Info, X } from "lucide-react";
import type { DashboardCategory, DashboardRecommendation } from "@/lib/dashboard-view";

type EvidenceView = "strengths" | "problems" | "missing";
type Priority = "all" | "critical" | "high" | "medium" | "low";

const priorityLabels: Record<Exclude<Priority, "all">, string> = {
  critical: "Критический",
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

function CategoryCard({ category, recommendations, opened, onToggle, summaryRef, onRecommendation }: { category: DashboardCategory; recommendations: DashboardRecommendation[]; opened: boolean; onToggle: () => void; summaryRef: (element: HTMLElement | null) => void; onRecommendation: (id: string) => void }) {
  const noData = category.value === null;
  const recommendation = recommendations.find(item => item.categoryId === category.id);
  return <details id={`category-${category.id}`} className={`category ${noData ? "no-data" : ""}`} open={opened}>
    <summary ref={summaryRef} onClick={event => { event.preventDefault(); onToggle(); }}>
      <span className="category-name">{category.name}<small>Вес категории {category.weight}%</small></span>
      <span className="category-value">{noData ? <span className="no-data-label">Нет данных</span> : <><strong>{category.value}</strong><small>/ 100</small></>}</span>
      {!noData && <span className="category-bar" aria-hidden="true"><i style={{ width: `${category.value}%` }} /></span>}
      <span className="category-reason">{category.reason}</span>
      <span className="category-toggle">{opened ? "Скрыть детали" : "Метрики и факты"}<ChevronDown size={16} className="expand-icon" /></span>
    </summary>
    <div className="category-details">
      <h3>Метрики и подтверждающие факты</h3>
      {category.metrics.length ? <div className="mt-3 space-y-3">{category.metrics.map(metric => <article key={metric.id} className="rounded-lg border border-border bg-background/40 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><b>{metric.key.replaceAll("_", " ")}</b><p className="mt-1 text-sm text-muted-foreground">{metric.explanation}</p></div><span className="rounded-md bg-muted px-2 py-1 text-sm font-semibold">{metric.score === null ? "Нет данных" : `${metric.score}/100`}</span></div><dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3"><div><dt className="text-muted-foreground">Источник</dt><dd>{metric.source}</dd></div><div><dt className="text-muted-foreground">Вес внутри категории</dt><dd>{metric.weight}%</dd></div><div><dt className="text-muted-foreground">Статус</dt><dd>{metric.status}</dd></div></dl><p className="mt-3 break-words rounded-md bg-muted/60 p-2 text-xs">{metric.raw}</p>{metric.evidence.length > 0 && <ul className="mt-3 space-y-1 text-sm">{metric.evidence.map(evidence => <li key={evidence.id}>{evidence.url ? <a className="text-primary underline underline-offset-2" href={evidence.url} target="_blank" rel="noreferrer">{evidence.label}</a> : <span className="font-medium">{evidence.label}</span>}<span className="text-muted-foreground"> · {evidence.kind} · {evidence.value}</span></li>)}</ul>}</article>)}</div> : <p className="evidence-value">{category.raw}</p>}
      <dl className="metric-details"><div><dt>Источники данных</dt><dd>{category.metrics.length ? `${category.metrics.length} метрик SourceCraft` : category.fact}</dd></div><div><dt>Оценка категории</dt><dd>{noData ? "Не рассчитана" : `${category.value} из 100`}</dd></div><div><dt>Статус сбора</dt><dd>{category.status}</dd></div></dl>
      <div className="detail-note"><Info size={16} /><p>{noData ? "Источник не вернул доступные данные. Это не нулевая оценка и категория исключена из итогового веса." : "Оценка рассчитана backend по зафиксированной методологии и нормализованным метрикам."}</p></div>
      {recommendation && <button className="detail-link" onClick={() => onRecommendation(recommendation.id)}>Связанная рекомендация <ArrowRight size={15} /></button>}
    </div>
  </details>;
}

export function DashboardDetails({ categories, recommendations }: { categories: DashboardCategory[]; recommendations: DashboardRecommendation[] }) {
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const [priority, setPriority] = useState<Priority>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [view, setView] = useState<EvidenceView>("strengths");
  const summaryRefs = useRef<Record<string, HTMLElement | null>>({});
  const openFact = (id: string) => { setOpened(previous => new Set([...previous, id])); requestAnimationFrame(() => { const element = summaryRefs.current[id]; element?.scrollIntoView({ block: "center", behavior: "instant" }); element?.focus({ preventScroll: true }); }); };
  const showRecommendation = (id: string) => { setPriority("all"); setCategoryFilter("all"); requestAnimationFrame(() => { const element = document.getElementById(`recommendation-${id}`) as HTMLDetailsElement | null; if (element) { element.open = true; element.scrollIntoView({ block: "center", behavior: "instant" }); element.querySelector("summary")?.focus({ preventScroll: true }); } }); };
  const toggleCategory = (id: string) => setOpened(previous => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const filtered = recommendations.filter(item => (priority === "all" || item.priority === priority) && (categoryFilter === "all" || item.categoryId === categoryFilter));
  const evidenceCategories = categories.filter(category => view === "missing" ? category.value === null : view === "strengths" ? category.value !== null && category.value >= 70 : category.value !== null && category.value < 70);

  return <>
    <section className="category-section" id="categories"><div className="section-title"><h2>Шесть сторон здоровья</h2><span>Оценки, причины и подтверждающие факты</span></div>
      <div className="category-grid">{[0, 1].map(column => <div className="category-column" key={column}>{categories.filter((_, index) => index % 2 === column).map(category => <CategoryCard key={category.id} category={category} recommendations={recommendations} opened={opened.has(category.id)} onRecommendation={showRecommendation} onToggle={() => toggleCategory(category.id)} summaryRef={element => { summaryRefs.current[category.id] = element; }} />)}</div>)}</div>
    </section>
    <div className="bottom-grid">
      <section className="facts-panel"><div className="section-title"><h2>Что стоит за оценкой</h2></div><div className="dashboard-filters" aria-label="Тип фактов">{([{ id: "strengths", label: "Сильные стороны" }, { id: "problems", label: "Проблемы" }, { id: "missing", label: "Нет данных" }] as const).map(item => <button key={item.id} aria-pressed={view === item.id} onClick={() => setView(item.id)}>{item.label}</button>)}</div>
        {evidenceCategories.length ? evidenceCategories.map(category => { const Icon = view === "strengths" ? Check : view === "problems" ? CircleAlert : Info; return <div className="fact" key={category.id}><Icon size={18} /><div><b>{category.name}</b><p>{category.raw}</p><small>Источник: {category.fact}</small><button className="detail-link" onClick={() => openFact(category.id)}>Открыть факты <ArrowRight size={15} /></button></div></div>; }) : <p className="mt-5 text-sm text-muted-foreground">В этой группе пока нет категорий.</p>}
      </section>
      <section className="recommendations-panel" id="recommendations"><div className="section-title"><h2>План улучшений</h2><span>{filtered.length} из {recommendations.length} рекомендаций</span></div><p className="panel-intro">Начните с высокого приоритета. Каждое действие связано с обнаруженной проблемой и её источником.</p>
        <div className="dashboard-filters" aria-label="Приоритет рекомендаций">{([{ id: "all", label: "Все" }, { id: "high", label: "Высокий" }, { id: "medium", label: "Средний" }, { id: "low", label: "Низкий" }] as const).map(item => <button key={item.id} aria-pressed={priority === item.id} onClick={() => setPriority(item.id)}>{item.label}</button>)}<label className="recommendation-category"><span className="sr-only">Категория рекомендаций</span><select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)}><option value="all">Все категории</option>{categories.filter(category => recommendations.some(item => item.categoryId === category.id)).map(category => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label></div>
        <div aria-live="polite" className="filter-result">Показано рекомендаций: {filtered.length}</div>
        {filtered.length ? filtered.map(item => <details className="recommendation" id={`recommendation-${item.id}`} key={item.id}><summary><span className="priority">{priorityLabels[item.priority]} приоритет</span><b>{item.title}</b><ChevronDown size={18} /></summary><div className="recommendation-body"><span className="recommendation-tag">{categories.find(category => category.id === item.categoryId)?.name ?? item.categoryId}</span><h3>Почему это важно</h3><p>{item.why}</p><h3>Что сделать</h3><ol>{item.steps.map(step => <li key={step}>{step}</li>)}</ol><div className="recommendation-evidence"><b>Подтверждение: {item.fact}</b><p>Источник: {item.source}</p><button className="detail-link" onClick={() => openFact(item.categoryId)}>Перейти к фактам категории <ArrowRight size={15} /></button></div><div className="detail-note"><Info size={16} /><p>Ожидаемый прирост: +{item.expectedScoreDelta} Score. Уверенность: {Math.round(item.confidence * 100)}%.</p></div></div></details>) : <div className="recommendations-empty"><Info size={22} /><b>Нет рекомендаций с такими фильтрами</b><p>Выберите другую категорию или сбросьте фильтры.</p><button className="detail-link" onClick={() => { setPriority("all"); setCategoryFilter("all"); }}><X size={15} />Сбросить фильтры</button></div>}
      </section>
    </div>
  </>;
}
