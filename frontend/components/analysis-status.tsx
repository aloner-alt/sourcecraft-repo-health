"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Circle, Download, LoaderCircle, RotateCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Analysis } from "@/lib/api-types";
import { loadAnalysis, publicApiBaseUrl } from "@/lib/client-api";

const stages = [
  { status: "QUEUED", title: "В очереди", description: "Задача зарегистрирована в BullMQ." },
  { status: "COLLECTING", title: "Сбор данных", description: "Источники SourceCraft опрашиваются параллельно и независимо." },
  { status: "CALCULATING", title: "Расчёт", description: "Метрики нормализуются и объединяются в итоговый Score." },
  { status: "COMPLETED", title: "Готово", description: "Результат, рекомендации и отчёты сохранены." },
] as const;

export function AnalysisStatus({ initial }: { initial: Analysis }) {
  const [analysis, setAnalysis] = useState(initial);
  const terminal = analysis.status === "COMPLETED" || analysis.status === "FAILED";
  useEffect(() => {
    if (terminal) return;
    const timer = window.setInterval(() => {
      loadAnalysis(analysis.id).then(setAnalysis).catch(() => undefined);
    }, 2_500);
    return () => window.clearInterval(timer);
  }, [analysis.id, terminal]);

  const activeIndex = stages.findIndex(stage => stage.status === analysis.status);
  const completed = analysis.status === "COMPLETED";
  const failed = analysis.status === "FAILED";
  const score = analysis.score === null ? null : Math.round(analysis.score);
  const coverage = analysis.dataCoverage === null ? null : Math.round(analysis.dataCoverage);
  const potential = analysis.potentialScore === null ? null : Math.round(analysis.potentialScore);
  const reportUrl = (format: "md" | "pdf") => `${publicApiBaseUrl()}/analyses/${encodeURIComponent(analysis.id)}/reports/report.${format}`;

  return <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
    <Link href={`/repositories/${analysis.repositoryId}`} className="text-sm text-primary underline-offset-4 hover:underline">← Dashboard</Link>
    <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">Результат анализа</h1>
    <p className="mt-3 break-words text-lg text-muted-foreground">{analysis.repository.ownerSlug}/{analysis.repository.name}</p>
    <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-7" aria-labelledby="analysis-heading">
      <div role="status" aria-live="polite"><p className="text-sm text-muted-foreground">{analysis.status}</p><h2 id="analysis-heading" className="mt-2 text-xl font-semibold">{completed ? `Score ${score} из 100` : failed ? "Анализ завершился с ошибкой" : "Анализ выполняется — страница обновляется автоматически"}</h2></div>
      <ol className="my-7 space-y-5" aria-label="Этапы анализа">{stages.map((stage, index) => { const done = completed || (!failed && activeIndex > index); const active = !completed && !failed && activeIndex === index; return <li key={stage.status} className="flex gap-3" aria-current={active ? "step" : undefined}><span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${done || active ? "bg-accent text-primary" : "bg-muted text-muted-foreground"}`} aria-hidden="true">{done ? <Check size={18} /> : active ? <LoaderCircle size={18} className="motion-safe:animate-spin" /> : <Circle size={16} />}</span><div><p className="font-medium">{stage.title}<span className="ml-2 text-sm font-normal text-muted-foreground">{done ? "Выполнено" : active ? "В процессе" : "Ожидание"}</span></p><p className="mt-1 text-sm leading-6 text-muted-foreground">{stage.description}</p></div></li>; })}</ol>
      {failed && <div role="alert" className="mb-5 flex gap-3 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm leading-6 text-rose-900"><XCircle className="mt-1 size-5 shrink-0" /><div><b>{analysis.errorCode ?? "ANALYSIS_FAILED"}</b><p>{analysis.errorMessage ?? "Неизвестная ошибка анализа."}</p></div></div>}
      {completed && <div className="grid gap-3 rounded-xl bg-accent p-4 sm:grid-cols-3"><Metric label="Score" value={score} /><Metric label="Coverage" value={coverage === null ? null : `${coverage}%`} /><Metric label="Potential" value={potential} /></div>}
      <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-5"><Button render={<Link href={`/repositories/${analysis.repositoryId}`} />}>Открыть Dashboard</Button>{!terminal && <Button variant="outline" onClick={() => loadAnalysis(analysis.id).then(setAnalysis)}><RotateCw size={16} />Обновить</Button>}{completed && <><Button variant="outline" render={<a href={reportUrl("md")} />}><Download size={16} />Markdown</Button><Button variant="outline" render={<a href={reportUrl("pdf")} />}><Download size={16} />PDF</Button></>}</div>
    </section>
  </main>;
}

function Metric({ label, value }: { label: string; value: string | number | null }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{value ?? "—"}</p></div>; }
