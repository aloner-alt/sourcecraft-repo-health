"use client";

import { useRef, useState } from "react";
import { ArrowRight, Check, ChevronDown, CircleAlert, Info, X } from "lucide-react";
import { categoryDetailsPreview as categories, recommendationsPreview as recommendations, type DashboardCategory } from "@/lib/dashboard-details-preview";

type EvidenceView = "strengths" | "problems" | "missing";
type Priority = "all" | "high" | "medium";

function CategoryCard({ category, opened, onToggle, summaryRef, onRecommendation }: { category: DashboardCategory; opened: boolean; onToggle: () => void; summaryRef: (element: HTMLElement | null) => void; onRecommendation: (id: string) => void }) {
  const noData = category.value === null;
  return <details id={`category-${category.id}`} className={`category ${noData ? "no-data" : ""}`} open={opened}>
    <summary ref={summaryRef} onClick={event => { event.preventDefault(); onToggle(); }}>
      <span className="category-name">{category.name}<small>Вес категории {category.weight}%</small></span>
      <span className="category-value">{noData ? <span className="no-data-label">Нет данных</span> : <><strong>{category.value}</strong><small>/ 100</small></>}</span>
      {!noData && <span className="category-bar" aria-hidden="true"><i style={{ width: `${category.value}%` }} /></span>}
      <span className="category-reason">{category.reason}</span>
      <span className="category-toggle">{opened ? "Скрыть детали" : "Метрики и факты"}<ChevronDown size={16} className="expand-icon" /></span>
    </summary>
    <div className="category-details">
      <h3>Подтверждающий факт</h3><p className="evidence-value">{category.raw}</p>
      <dl className="metric-details"><div><dt>Источник данных</dt><dd>{category.fact}</dd></div><div><dt>Оценка категории</dt><dd>{noData ? "Не рассчитана" : `${category.value} из 100`}</dd></div><div><dt>Исходные метрики</dt><dd>{category.raw}</dd></div></dl>
      <div className="detail-note"><Info size={16} /><p>{noData ? "Источник не подключён. Это отсутствие данных, а не нулевая оценка. После подключения отчёта категорию можно будет оценить." : "Формулы нормализации и вклад отдельных метрик появятся после согласования методологии. Оценка категории не подменяет оценку отдельной метрики."}</p></div>
      <p className="source-unavailable">В этом демо ссылка на исходный источник не предоставлена.</p>
      {recommendations.some(item => item.categoryId === category.id) && <button className="detail-link" onClick={() => onRecommendation(recommendations.find(item => item.categoryId === category.id)!.id)}>Связанная рекомендация <ArrowRight size={15} /></button>}
    </div>
  </details>;
}

export function DashboardDetails() {
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const [priority, setPriority] = useState<Priority>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [view, setView] = useState<EvidenceView>("strengths");
  const summaryRefs = useRef<Record<string, HTMLElement | null>>({});
  const openFact = (id: string) => {
    setOpened(previous => new Set([...previous, id]));
    requestAnimationFrame(() => {
      const element = summaryRefs.current[id];
      element?.scrollIntoView({ block: "center", behavior: "instant" });
      element?.focus({ preventScroll: true });
    });
  };
  const showRecommendation = (id: string) => {
    setPriority("all"); setCategoryFilter("all");
    requestAnimationFrame(() => {
      const element = document.getElementById(`recommendation-${id}`) as HTMLDetailsElement | null;
      if (element) { element.open = true; element.scrollIntoView({ block: "center", behavior: "instant" }); element.querySelector("summary")?.focus({ preventScroll: true }); }
    });
  };
  const toggleCategory = (id: string) => setOpened(previous => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const filtered = recommendations.filter(item => (priority === "all" || item.priority === priority) && (categoryFilter === "all" || item.categoryId === categoryFilter));
  const evidenceIds = view === "strengths" ? ["ci", "documentation"] : view === "problems" ? ["security", "issues"] : ["code"];

  return <>
    <section className="category-section" id="categories"><div className="section-title"><h2>Шесть сторон здоровья</h2><span>Оценки, причины и подтверждающие факты</span></div>
      <div className="category-grid">{[0, 1].map(column => <div className="category-column" key={column}>{categories.filter((_, index) => index % 2 === column).map(category => <CategoryCard key={category.id} category={category} opened={opened.has(category.id)} onRecommendation={showRecommendation} onToggle={() => toggleCategory(category.id)} summaryRef={element => { summaryRefs.current[category.id] = element; }} />)}</div>)}</div>
    </section>
    <div className="bottom-grid">
      <section className="facts-panel"><div className="section-title"><h2>Что стоит за оценкой</h2></div><div className="dashboard-filters" aria-label="Тип фактов">{([{ id: "strengths", label: "Сильные стороны" }, { id: "problems", label: "Проблемы" }, { id: "missing", label: "Нет данных" }] as const).map(item => <button key={item.id} aria-pressed={view === item.id} onClick={() => setView(item.id)}>{item.label}</button>)}</div>
        {evidenceIds.map(id => { const category = categories.find(item => item.id === id)!; const Icon = view === "strengths" ? Check : view === "problems" ? CircleAlert : Info; return <div className="fact" key={id}><Icon size={18} /><div><b>{category.name}</b><p>{category.raw}</p><small>Источник: {category.fact}</small><button className="detail-link" onClick={() => openFact(id)}>Открыть факты <ArrowRight size={15} /></button></div></div>; })}
      </section>
      <section className="recommendations-panel" id="recommendations"><div className="section-title"><h2>План улучшений</h2><span>{filtered.length} из {recommendations.length} рекомендаций</span></div><p className="panel-intro">Начните с высокого приоритета. Каждое действие связано с обнаруженной проблемой и её источником.</p>
        <div className="dashboard-filters" aria-label="Приоритет рекомендаций">{([{ id: "all", label: "Все" }, { id: "high", label: "Высокий" }, { id: "medium", label: "Средний" }] as const).map(item => <button key={item.id} aria-pressed={priority === item.id} onClick={() => setPriority(item.id)}>{item.label}</button>)}<label className="recommendation-category"><span className="sr-only">Категория рекомендаций</span><select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)}><option value="all">Все категории</option>{categories.filter(category => recommendations.some(item => item.categoryId === category.id)).map(category => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label></div>
        <div aria-live="polite" className="filter-result">Показано рекомендаций: {filtered.length}</div>
        {filtered.length ? filtered.map(item => <details className="recommendation" id={`recommendation-${item.id}`} key={item.id}><summary><span className="priority">{item.priority === "high" ? "Высокий" : "Средний"} приоритет</span><b>{item.title}</b><ChevronDown size={18} /></summary><div className="recommendation-body"><span className="recommendation-tag">{categories.find(category => category.id === item.categoryId)!.name}</span><h3>Почему это важно</h3><p>{item.why}</p><h3>Что сделать</h3><ol>{item.steps.map(step => <li key={step}>{step}</li>)}</ol><div className="recommendation-evidence"><b>Подтверждение: {item.fact}</b><p>Источник: {item.source}</p><button className="detail-link" onClick={() => openFact(item.categoryId)}>Перейти к фактам категории <ArrowRight size={15} /></button></div><div className="detail-note"><Info size={16} /><p>Изменение Score и уверенность в прогнозе пока не рассчитаны. Числовой эффект появится после пересчёта по методологии.</p></div></div></details>) : <div className="recommendations-empty"><Info size={22} /><b>Нет рекомендаций с такими фильтрами</b><p>Выберите другую категорию или сбросьте фильтры.</p><button className="detail-link" onClick={() => { setPriority("all"); setCategoryFilter("all"); }}><X size={15} />Сбросить фильтры</button></div>}
      </section>
    </div>
  </>;
}
