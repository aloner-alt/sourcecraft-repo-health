import { notFound } from "next/navigation";
import Link from "next/link";
import { DemoReport } from "@/components/demo-report";
import { ArrowRight, ChevronDown } from "lucide-react";
import { dashboardPreview, rankingPreview, myRepositoriesPreview } from "@/lib/dashboard-preview";
import "./dashboard.css";
import { DashboardDetails } from "@/components/dashboard-details";
import { AnimatedScore } from "@/components/animated-score";

export default async function RepositoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const selected = [...rankingPreview, ...myRepositoriesPreview].find(item => item.slug === slug);
  if (!selected) notFound();
  const repository = { ...dashboardPreview, repository: selected.name, language: selected.language, score: "score" in selected ? selected.score : dashboardPreview.score };
  return <div className="repository-dashboard">
      <main className="design-main" id="overview">
        
        <section className="repo-header"><div><p className="eyebrow">Обзор репозитория</p><h1>{repository.repository}<span className="repo-dot">.</span></h1><p>{repository.description}</p><div className="repo-meta"><span>{repository.language}</span><span>Демонстрационный репозиторий</span><span>Пример анализа: 15.09.2026, 14:32</span></div></div><div className="repo-actions"><a href="#recommendations">План улучшений <ArrowRight size={16} /></a><span>Демонстрационные данные</span></div></section>
        <div className="repository-tools"><Link className="settings-link" href={`/analyses/${slug}-demo`}>Повторить демо-анализ</Link><DemoReport repository={repository.repository} score={repository.score} /><span>Ссылка на SourceCraft не предоставлена в демо. Анализ не меняет оценки.</span></div>
        <div className="overview-grid">
          <section className="score-panel"><p className="eyebrow">Repo Health Score</p><AnimatedScore value={repository.score} /><div className="health-label"><span />Хорошее состояние</div><p className="score-description">Сильный CI/CD и документация.<br />Приоритет — безопасность и старые issues.</p><a className="mobile-primary-action" href="#recommendations">План улучшений <ArrowRight size={18} /></a></section>
          <section className="coverage-panel"><p className="eyebrow">Полнота анализа</p><div className="coverage-value">82<span>%</span></div><h2>Покрытие данных</h2><div className="coverage-line"><i /></div><p>Часть сигналов недоступна.<br />Отсутствие данных не равно нулю.</p><details><summary>Что это означает? <ChevronDown size={14} /></summary><p>Coverage показывает полноту анализа. Нет отчёта о покрытии тестами, поэтому качество кода не получает низкую оценку автоматически.</p></details></section>
          <section className="potential-panel"><p className="eyebrow">Потенциал улучшений</p><div className="potential-value">88<span aria-hidden="true">▲</span></div><h2>Potential Score</h2><p>Ориентир после исправлений.<br />Оценка эффекта в этом примере условная.</p><a href="#recommendations">Посмотреть действия <ArrowRight size={15} /></a></section>
        </div>
        <DashboardDetails />
        <footer className="design-footer"><span>SourceCraft Repo Health</span><span>Демонстрационные данные</span></footer>
      </main>
  </div>;
}
