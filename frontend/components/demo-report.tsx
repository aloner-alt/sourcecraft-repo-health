"use client";
import { AnimatedDownloadIcon } from "@/components/animated-download-icon";
import { Button } from "@/components/ui/button";
import { categoryDetailsPreview as categoriesPreview } from "@/lib/dashboard-details-preview";

export function DemoReport({ repository, score }: { repository: string; score: number }) {
  function download() {
    const text = [`# ${repository} — демонстрационный отчёт`, "", "> Это статический пример интерфейса, не результат реального анализа. Источники не проверены. Оценки не пересчитаны.", "", `Repo Health Score (демо): ${score}/100`, "", "## Категории", ...categoriesPreview.map(category => `- ${category.name}: ${category.value ?? "Нет данных"} · вес ${category.weight}% · ${category.reason}`), "", "Реальный отчёт, ссылки на факты и PDF требуют подключения backend."].join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = `${repository}-demo.md`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <Button className="report-download" variant="outline" onClick={download}><AnimatedDownloadIcon />Скачать демо Markdown</Button>;
}
