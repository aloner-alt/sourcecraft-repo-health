import type { Metadata } from "next";
import "./test.css";
import Link from "next/link";
import { BarChart3, ScanSearch, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/animated-score";
import { SpotlightCard } from "./spotlight-card";
import { ViewportReveal } from "./viewport-reveal";
import { TestPageShell } from "./test-page-shell";
import { CheckRepositoryButton } from "@/components/check-repository-button";


const steps = [
  ["01", "Выберите репозиторий", "Подключите публичный проект или войдите через Я ID."],
  ["02", "Получите анализ", "Сервис соберёт доступные сигналы и рассчитает покрытие."],
  ["03", "Исправляйте точечно", "Факты и рекомендации объяснят следующий полезный шаг."],
];

export const metadata: Metadata = { title: "Test — SourceCraft Repo Health", robots: { index: false, follow: false } };

// Independent sandbox: do not import the production home page here.
export default function TestHome() {
  return <TestPageShell>

    <main>
      <section className="test-figma-hero mx-auto grid max-w-7xl items-start gap-10 px-5 py-16 xl:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
        <div className="test-figma-wave" aria-hidden="true"><i /><i /><i /></div>
        <ViewportReveal className="test-home-intro max-w-2xl">
          <Badge>REPOSITORY INTELLIGENCE</Badge>
          <h1 className="mt-6 text-5xl font-bold tracking-[-0.07em] sm:text-5xl">Проверьте здоровье своего репозитория.</h1>
          <p className="test-home-description mt-6 max-w-xl">SourceCraft Repo Health превращает сигналы разработки в понятную оценку, подтверждающие факты и следующие действия.</p>
          <div className="mt-8 flex flex-wrap gap-3"><CheckRepositoryButton className="test-figma-primary" /><Button className="test-figma-secondary" size="lg" variant="outline" render={<Link href="/repositories/api-gateway" />}>Посмотреть пример</Button></div>
          <Link href="/ranking" className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-primary">Посмотреть Топ-100 →</Link>
          <p className="mt-5 text-xs text-muted-foreground">Сейчас показана визуальная демо-версия. Подключение API появится после готовности OpenAPI.</p>
        </ViewportReveal>
        <SpotlightCard className="test-home-score relative h-fit self-start overflow-hidden">
          <CardHeader className="relative pb-3"><p className="text-sm text-muted-foreground">REPO HEALTH SCORE</p><CardTitle className="mt-4 flex items-end gap-3 text-7xl tracking-[-0.08em]"><span><AnimatedNumber value={76} /></span><span className="mb-2 text-lg tracking-normal text-muted-foreground">/ 100</span></CardTitle><Badge className="mt-4">Good</Badge></CardHeader>
          <CardContent className="relative space-y-5"><div className="test-home-score-track" aria-hidden="true"><i /></div><p className="text-sm leading-6 text-muted-foreground">Надёжный CI/CD и документация уже работают хорошо. Основной рост дадут security alerts и устаревшие issues.</p><div className="grid grid-cols-3 gap-3 border-t border-blue-200/15 pt-5 text-sm"><Metric label="Coverage" value={82} suffix="%" /><Metric label="Категории" value={5} suffix=" / 6" /><Metric label="Potential" value={88} /></div></CardContent>
        </SpotlightCard>
      </section>
      <section className="test-home-content mx-auto max-w-7xl px-5 pb-20 lg:px-8"><div className="test-feature-grid grid gap-4 md:grid-cols-3"><Feature icon={<BarChart3 />} title="Единый Score" text="Шесть категорий дают понятную общую картину." /><Feature icon={<ShieldCheck />} title="Факты, а не догадки" text="Каждый вывод связан с исходными данными." /><Feature icon={<ScanSearch />} title="Следующий шаг" text="Рекомендации показывают ожидаемый эффект." /></div><div className="mt-16"><ViewportReveal className="test-how-heading"><p className="text-sm text-primary">КАК ЭТО РАБОТАЕТ</p><h2 className="mt-2 text-3xl font-bold tracking-tight">От репозитория к ясному плану улучшений</h2></ViewportReveal><div className="test-step-grid mt-6 grid gap-4 md:grid-cols-3">{steps.map(([number, title, text]) => <SpotlightCard className="test-step-card" key={number}><CardContent className="relative z-10 p-5"><span className="text-sm font-semibold text-primary">{number}</span><h3 className="mt-8 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></CardContent></SpotlightCard>)}</div></div></section>
    </main>
  </TestPageShell>;
}

function Metric({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold"><AnimatedNumber value={value} />{suffix}</p></div>; }
function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <SpotlightCard className="test-feature-card"><CardContent className="relative z-10 p-5"><div className="text-primary">{icon}</div><h2 className="mt-6 font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></CardContent></SpotlightCard>; }
