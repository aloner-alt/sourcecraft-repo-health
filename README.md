# SourceCraft Repo Health

Веб-сервис для регулярной оценки здоровья репозиториев SourceCraft. Он рассчитывает объяснимый Repo Health Score, показывает факты по шести категориям, формирует приоритетные рекомендации и строит публичный рейтинг.

## Возможности

- реальные данные SourceCraft API, без демонстрационных результатов;
- шесть категорий: Documentation, CI/CD, Security, Activity, Issues, Code Health;
- различение низкой оценки, отсутствия данных и ошибки источника;
- Я ID, персональная рабочая область, первичный и повторный анализ;
- BullMQ worker, retry и периодический пересчёт известных публичных репозиториев;
- Dashboard, история Score, рейтинг, Markdown- и PDF-отчёты;
- PostgreSQL, Redis и воспроизводимый запуск через Docker Compose.
- CI для backend, frontend и Docker-образов, Dependabot для зависимостей.

## Быстрый запуск

1. Скопируйте `backend/.env.example` в `backend/.env` и заполните секреты.
2. Выполните:

```bash
docker compose up --build
```

- Frontend: http://localhost:3001
- API: http://localhost:3000/api
- Swagger: http://localhost:3000/docs

Подробности: [соответствие ТЗ](docs/COMPLIANCE.md), [архитектура](docs/ARCHITECTURE.md), [методология](docs/METHODOLOGY.md), [сценарий демонстрации](docs/DEMO.md) и [настройка окружения](backend/docs/ENVIRONMENT.md).
