import Link from "next/link";
import { ArrowRight, BarChart3, ScanSearch, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { connection } from "next/server";
import { getRanking } from "@/lib/api";


const steps = [
  ["01", "Выберите репозиторий", "Подключите публичный проект или войдите через Я ID."],
  ["02", "Получите анализ", "Сервис соберёт доступные сигналы и рассчитает покрытие."],
  ["03", "Исправляйте точечно", "Факты и рекомендации объяснят следующий полезный шаг."],
];

export default async function Home() {
  await connection();
  const ranking = await getRanking(1);
  const featured = ranking.items[0];
  const score = featured?.latestScore ?? 0;
  const coverage = featured?.latestDataCoverage ?? 0;
  const potential = featured?.latestPotentialScore ?? score;
  return <div className="min-h-screen overflow-x-hidden bg-background">
    
    <main>
      <section className="mx-auto grid max-w-7xl items-start gap-10 px-5 py-16 xl:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <Badge>REPOSITORY INTELLIGENCE</Badge>
          <h1 className="mt-6 text-5xl font-bold tracking-[-0.07em] sm:text-5xl">Понимайте здоровье репозитория, а не просто счёт.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">SourceCraft Repo Health превращает сигналы разработки в понятную оценку, подтверждающие факты и следующие действия.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Button size="lg" render={<Link href="/ranking" />}>Открыть рейтинг <ArrowRight className="size-4" /></Button>{featured && <Button size="lg" variant="outline" render={<Link href={`/repositories/${featured.id}`} />}>Посмотреть анализ</Button>}</div>
          <p className="mt-5 text-xs text-muted-foreground">Данные загружаются из работающего Repo Health API.</p>
        </div>
        <Card className="relative h-fit self-start overflow-hidden border-blue-400/35 bg-card">
          <CardHeader className="relative pb-3"><p className="text-sm text-muted-foreground">REPO HEALTH SCORE</p><CardTitle className="mt-4 flex items-end gap-3 text-7xl tracking-[-0.08em]">{score}<span className="mb-2 text-lg tracking-normal text-muted-foreground">/ 100</span></CardTitle><Badge className="mt-4">{featured ? `${featured.ownerSlug}/${featured.name}` : "Нет данных"}</Badge></CardHeader>
          <CardContent className="relative space-y-5"><p className="text-sm leading-6 text-muted-foreground">{featured?.description ?? "После первого анализа здесь появится лучший репозиторий рейтинга."}</p><div className="grid grid-cols-3 gap-3 border-t border-blue-200/15 pt-5 text-sm"><Metric label="Coverage" value={`${coverage}%`} /><Metric label="Репозитории" value={String(ranking.pagination.total)} /><Metric label="Potential" value={String(potential)} /></div></CardContent>
        </Card>
      </section>
      <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8"><div className="grid gap-4 md:grid-cols-3"><Feature icon={<BarChart3 />} title="Единый Score" text="Шесть категорий дают понятную общую картину." /><Feature icon={<ShieldCheck />} title="Факты, а не догадки" text="Каждый вывод связан с исходными данными." /><Feature icon={<ScanSearch />} title="Следующий шаг" text="Рекомендации показывают ожидаемый эффект." /></div><div className="mt-16"><p className="text-sm text-primary">КАК ЭТО РАБОТАЕТ</p><h2 className="mt-2 text-3xl font-bold tracking-tight">От репозитория к ясному плану улучшений</h2><div className="mt-6 grid gap-4 md:grid-cols-3">{steps.map(([number, title, text]) => <Card key={number}><CardContent className="p-5"><span className="text-sm font-semibold text-primary">{number}</span><h3 className="mt-8 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></CardContent></Card>)}</div></div></section>
    </main>
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div>; }
function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <Card><CardContent className="p-5"><div className="text-primary">{icon}</div><h2 className="mt-6 font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></CardContent></Card>; }
