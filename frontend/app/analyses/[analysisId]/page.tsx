import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Check, Circle, Download, LoaderCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError, getAnalysis, reportUrl } from "@/lib/api";

const stages = [
  { status: "QUEUED", title: "В очереди", description: "Задача зарегистрирована в BullMQ." },
  { status: "COLLECTING", title: "Сбор данных", description: "SourceCraft API и дерево репозитория опрашиваются параллельно." },
  { status: "CALCULATING", title: "Расчёт", description: "Категории нормализуются и объединяются в итоговый Score." },
  { status: "COMPLETED", title: "Готово", description: "Результат, рекомендации и отчёты сохранены." },
] as const;

async function loadAnalysis(analysisId: string) {
  try {
    return await getAnalysis(analysisId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

export default async function AnalysisPage({ params }: PageProps<"/analyses/[analysisId]">) {
  await connection();
  const { analysisId } = await params;
  const analysis = await loadAnalysis(analysisId);
  const activeIndex = stages.findIndex(stage => stage.status === analysis.status);
  const completed = analysis.status === "COMPLETED";
  const failed = analysis.status === "FAILED";
  const score = analysis.score === null ? null : Math.round(analysis.score);
  const coverage = analysis.dataCoverage === null ? null : Math.round(analysis.dataCoverage);
  const potential = analysis.potentialScore === null ? null : Math.round(analysis.potentialScore);
  return <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <Link href={`/repositories/${analysis.repositoryId}`} className="text-sm text-primary underline-offset-4 hover:underline">← Dashboard</Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">Результат анализа</h1>
      <p className="mt-3 break-words text-lg text-muted-foreground">{analysis.repository.ownerSlug}/{analysis.repository.name}</p>
      <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-7" aria-labelledby="analysis-heading">
        <div role="status" aria-live="polite"><p className="text-sm text-muted-foreground">{analysis.status}</p><h2 id="analysis-heading" className="mt-2 text-xl font-semibold">{completed ? `Score ${score} из 100` : failed ? "Анализ завершился с ошибкой" : "Анализ выполняется"}</h2></div>
        <ol className="my-7 space-y-5" aria-label="Этапы анализа">{stages.map((stage, index) => { const done = completed || (!failed && activeIndex > index); const active = !completed && !failed && activeIndex === index; return <li key={stage.status} className="flex gap-3" aria-current={active ? "step" : undefined}><span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${done || active ? "bg-accent text-primary" : "bg-muted text-muted-foreground"}`} aria-hidden="true">{done ? <Check size={18} /> : active ? <LoaderCircle size={18} className="motion-safe:animate-spin" /> : <Circle size={16} />}</span><div><p className="font-medium">{stage.title}<span className="ml-2 text-sm font-normal text-muted-foreground">{done ? "Выполнено" : active ? "В процессе" : "Ожидание"}</span></p><p className="mt-1 text-sm leading-6 text-muted-foreground">{stage.description}</p></div></li>; })}</ol>
        {failed && <div role="alert" className="mb-5 flex gap-3 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm leading-6 text-rose-900"><XCircle className="mt-1 size-5 shrink-0" /><div><b>{analysis.errorCode ?? "ANALYSIS_FAILED"}</b><p>{analysis.errorMessage ?? "Неизвестная ошибка анализа."}</p></div></div>}
        {completed && <div className="grid gap-3 rounded-xl bg-accent p-4 sm:grid-cols-3"><Metric label="Score" value={score} /><Metric label="Coverage" value={coverage === null ? null : `${coverage}%`} /><Metric label="Potential" value={potential} /></div>}
        <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-5"><Button render={<Link href={`/repositories/${analysis.repositoryId}`} />}>Открыть Dashboard</Button>{completed && <><Button variant="outline" render={<a href={reportUrl(analysis.id, "md")} />}><Download size={16} />Markdown</Button><Button variant="outline" render={<a href={reportUrl(analysis.id, "pdf")} />}><Download size={16} />PDF</Button></>}</div>
      </section>
  </main>;
}

function Metric({ label, value }: { label: string; value: string | number | null }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{value ?? "—"}</p></div>; }
