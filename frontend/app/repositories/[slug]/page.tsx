import { notFound } from "next/navigation";
import Link from "next/link";
import { DemoReport } from "@/components/demo-report";
import { ArrowRight, ChevronDown } from "lucide-react";
import { dashboardPreview, rankingPreview, myRepositoriesPreview } from "@/lib/dashboard-preview";
import "./dashboard.css";
import { DashboardDetails } from "@/components/dashboard-details";

function Score({ value }: { value: number }) {
  return <div className="score-visual score-ring" role="img" aria-label={`Здоровье репозитория: ${value} из 100`}>
    <svg viewBox="0 0 200 200" aria-hidden="true"><circle className="track" cx="100" cy="100" r="86" /><circle className="progress" cx="100" cy="100" r="86" pathLength="100" strokeDasharray={`${value} 100`} /></svg>
    <div className="score-number"><strong>{value}</strong><span>/ 100</span></div>
  </div>;
}
export default async function RepositoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const selected = [...rankingPreview, ...myRepositoriesPreview].find(item => item.slug === slug);
  if (!selected) notFound();
  const repository = { ...dashboardPreview, repository: selected.name, language: selected.language, score: "score" in selected ? selected.score : dashboardPreview.score };
  return <div className="repository-dashboard">
      <main className="design-main" id="overview">
        
        <section className="repo-header"><div><p className="eyebrow">Обзор репозитория</p><h1>{repository.repository}<span className="repo-dot">.</span></h1><p>{repository.description}</p><div className="repo-meta"><span>{repository.language}</span><span>Демонстрационный репозиторий</span><span>Пример анализа: 15.09.2026, 14:32</span></div></div><div className="repo-actions"><a href="#recommendations">План улучшений <ArrowRight size={16} /></a><span>Демонстрационные данные</span></div></section>
        <div className="overview-grid">
          <section className="score-panel"><p className="eyebrow">Repo Health Score</p><Score value={repository.score} /><div className="health-label"><span />Хорошее состояние</div><p className="score-description">Сильный CI/CD и документация.<br />Приоритет — безопасность и старые issues.</p><a className="mobile-primary-action" href="#recommendations">План улучшений <ArrowRight size={18} /></a></section>
          <section className="coverage-panel"><p className="eyebrow">Полнота анализа</p><div className="coverage-value">82<span>%</span></div><h2>Покрытие данных</h2><div className="coverage-line"><i /></div><p>Часть сигналов недоступна.<br />Отсутствие данных не равно нулю.</p><details><summary>Что это означает? <ChevronDown size={14} /></summary><p>Coverage показывает полноту анализа. Нет отчёта о покрытии тестами, поэтому качество кода не получает низкую оценку автоматически.</p></details></section>
          <section className="potential-panel"><p className="eyebrow">Потенциал улучшений</p><div className="potential-value">88<span aria-hidden="true">▲</span></div><h2>Potential Score</h2><p>Ориентир после исправлений.<br />Оценка эффекта в этом примере условная.</p><a href="#recommendations">Посмотреть действия <ArrowRight size={15} /></a></section>
        </div>
        <DashboardDetails />
        <div className="col-span-full"><DemoReport repository={repository.repository} score={repository.score} /></div>
        <div className="col-span-full flex flex-wrap items-center gap-3 text-sm"><Link className="rounded-lg border border-border bg-card px-4 py-3 font-medium text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" href={`/analyses/${slug}-demo`}>Повторить демо-анализ</Link><span className="text-muted-foreground">Без сбора данных и изменения оценок</span></div>
        <footer className="design-footer"><span>SourceCraft Repo Health</span><span>Демонстрационные данные</span></footer>
      </main>
  </div>;
}
