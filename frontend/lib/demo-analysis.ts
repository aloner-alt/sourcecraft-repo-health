// Presentation only: no network requests, scoring or real collection.
export const demoAnalysisStages = [
  { status: "QUEUED", title: "В очереди", description: "Подготовка демонстрационной задачи." },
  { status: "COLLECTING", title: "Сбор данных", description: "Имитация получения сигналов репозитория." },
  { status: "CALCULATING", title: "Расчёт показателей", description: "Имитация обработки категорий и полноты данных." },
] as const;
export const demoStageDuration = 1800;
export type DemoAnalysisStatus = "IDLE" | typeof demoAnalysisStages[number]["status"] | "COMPLETED" | "FAILED" | "CANCELLED";
