"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Circle, LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { demoAnalysisStages, demoStageDuration, type DemoAnalysisStatus } from "@/lib/demo-analysis";

export function DemoAnalysis({ repository, slug }: { repository: string; slug: string }) {
  const [status, setStatus] = useState<DemoAnalysisStatus>("IDLE");
  const [scenario, setScenario] = useState("success");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const running = useRef(false);
  const busy = demoAnalysisStages.some(stage => stage.status === status);
  const activeIndex = demoAnalysisStages.findIndex(stage => stage.status === status);
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    running.current = false;
  };
  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    running.current = false;
  }, []);

  function start() {
    if (running.current) return;
    clearTimers();
    running.current = true;
    setStatus("QUEUED");
    timers.current = [
      setTimeout(() => setStatus("COLLECTING"), demoStageDuration),
      setTimeout(() => {
        if (scenario === "failure") { setStatus("FAILED"); clearTimers(); }
        else setStatus("CALCULATING");
      }, demoStageDuration * 2),
      setTimeout(() => { setStatus("COMPLETED"); clearTimers(); }, demoStageDuration * 3),
    ];
  }
  function cancel() { clearTimers(); setStatus("CANCELLED"); }
  const heading = status === "COMPLETED" ? "Демо-анализ завершён" : status === "FAILED" ? "Не удалось собрать данные" : status === "CANCELLED" ? "Демо-анализ остановлен" : busy ? demoAnalysisStages[activeIndex].title : "Готово к запуску";

  return <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
    <Link href="/my-repositories" className="text-sm text-primary underline-offset-4 hover:underline">← Мои репозитории</Link>
    <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">Анализ репозитория</h1>
    <p className="mt-3 break-words text-lg text-muted-foreground">{repository}</p>
    <p className="mt-6 rounded-xl border border-border bg-accent p-4 text-sm leading-6 text-muted-foreground">Локальный демо-режим. Данные не собираются, Score не пересчитывается. После завершения можно посмотреть существующий демонстрационный Dashboard. При уходе со страницы сценарий остановится.</p>
    <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-7" aria-labelledby="analysis-heading">
      <div role="status" aria-live="polite" aria-atomic="true">
        <p className="text-sm text-muted-foreground">{status === "IDLE" ? "Ожидание запуска" : status}</p>
        <h2 id="analysis-heading" className="mt-2 text-xl font-semibold">{heading}</h2>
      </div>
      <ol className="my-7 space-y-5" aria-label="Этапы демо-анализа">
        {demoAnalysisStages.map((stage, index) => {
          const done = status === "COMPLETED" || activeIndex > index || (status === "FAILED" && index === 0);
          const active = busy && index === activeIndex;
          const failed = status === "FAILED" && index === 1;
          return <li key={stage.status} className="flex gap-3" aria-current={active ? "step" : undefined}>
            <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${done || active ? "bg-accent text-primary" : "bg-muted text-muted-foreground"}`} aria-hidden="true">
              {done ? <Check size={18} /> : active ? <LoaderCircle size={18} className="motion-safe:animate-spin" /> : <Circle size={16} />}
            </span><div><p className="font-medium">{stage.title}<span className="ml-2 text-sm font-normal text-muted-foreground">{done ? "Выполнено" : active ? "В процессе" : failed ? "Ошибка" : status === "CANCELLED" ? "Остановлено" : "Ожидание"}</span></p><p className="mt-1 text-sm leading-6 text-muted-foreground">{stage.description}</p></div>
          </li>;
        })}
      </ol>
      {status === "FAILED" && <p role="alert" className="mb-5 rounded-xl border border-border bg-muted p-4 text-sm leading-6">Смоделирована ошибка доступа к источнику данных. Результат не обновлён. Выберите «Успешный анализ» ниже и повторите попытку. В реальном сценарии потребуется проверить права доступа или авторизоваться заново.</p>}
      {status === "COMPLETED" && <p className="mb-5 text-sm leading-6 text-muted-foreground">Этапы интерфейса пройдены. Оценки и дата анализа в Dashboard остаются демонстрационными. Скачивание реального отчёта будет доступно после подключения API.</p>}
      <label className="mb-5 block text-sm font-medium">Сценарий для проверки интерфейса
        <select value={scenario} onChange={event => setScenario(event.target.value)} disabled={busy} className="mt-2 block min-h-11 w-full rounded-lg border border-border bg-background px-3 font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60">
          <option value="success">Успешный анализ</option><option value="failure">Ошибка сбора данных</option>
        </select>
      </label>
      <div className="flex flex-wrap gap-3 border-t border-border pt-5">
        {status === "COMPLETED" && <Button render={<Link href={`/repositories/${slug}`} />}>Открыть Dashboard <ArrowRight size={16} /></Button>}
        <Button onClick={start} disabled={busy} variant={status === "COMPLETED" ? "outline" : "default"}>
          <RefreshCw size={16} />{busy ? "Анализ выполняется…" : status === "IDLE" ? "Запустить демо-анализ" : status === "FAILED" ? "Повторить попытку" : "Запустить повторно"}
        </Button>
        {busy && <Button variant="outline" onClick={cancel}>Остановить демо</Button>}
      </div>
    </section>
  </main>;
}
