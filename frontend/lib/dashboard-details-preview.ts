// Temporary, explicitly fictional UI fixtures. Replace with the agreed OpenAPI model.
export const categoryDetailsPreview = [
  { id: "documentation", name: "Документация", value: 84, weight: 15, reason: "README и инструкция запуска доступны", fact: "README.md · разделы «Запуск» и «Участие»", raw: "2 документа найдены" },
  { id: "ci", name: "CI/CD", value: 91, weight: 15, reason: "Стабильная сборка и автоматические тесты", fact: "История pipeline · последние 24 запуска", raw: "24 из 24 сборок успешны" },
  { id: "security", name: "Безопасность", value: 58, weight: 20, reason: "Два предупреждения о зависимостях", fact: "Демонстрационный результат AppSec", raw: "2 открытых предупреждения" },
  { id: "activity", name: "Активность", value: 70, weight: 15, reason: "Регулярные изменения в проекте", fact: "История изменений · последние 30 дней", raw: "18 активных дней" },
  { id: "issues", name: "Issues", value: 45, weight: 15, reason: "Есть обращения без ответа", fact: "Список issues · фильтр старше 90 дней", raw: "13 устаревших issues" },
  { id: "code", name: "Качество кода", value: null, weight: 20, reason: "Отчёт о покрытии тестами недоступен", fact: "Источник coverage не подключён", raw: "Нет данных" },
] as const;

export const recommendationsPreview = [
  { id: "dependencies", categoryId: "security", priority: "high", title: "Обновить уязвимые зависимости", expectedScoreGain: null as number | null, why: "Предупреждения AppSec требуют проверки затронутых пакетов и версий.", fact: "2 открытых предупреждения", source: "Демонстрационный результат AppSec", steps: ["Проверьте затронутые пакеты и версии в отчёте AppSec.", "Обновите зависимости до исправленных совместимых версий.", "Проверьте сборку и тесты, затем повторите анализ." ] },
  { id: "old-issues", categoryId: "issues", priority: "medium", title: "Разобрать старые issues", expectedScoreGain: null as number | null, why: "Долгое отсутствие ответа затрудняет понимание статуса обращений.", fact: "13 issues старше 90 дней", source: "Список issues · фильтр старше 90 дней", steps: ["Проверьте актуальность обращений старше 90 дней.", "Ответьте на актуальные issues и назначьте ответственных.", "Закройте неактуальные обращения с пояснением." ] },
] as const;

export type DashboardCategory = (typeof categoryDetailsPreview)[number];
