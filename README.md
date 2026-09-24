# SourceCraft Repo Health

Сервис анализирует репозитории SourceCraft и показывает, что в проекте уже в порядке, а что стоит исправить. Результат — оценка от 0 до 100, факты по каждой категории и список рекомендаций.

## Возможности

- данные SourceCraft API, без заранее подготовленных результатов;
- шесть категорий: Documentation, CI/CD, Security, Activity, Issues, Code Health;
- различение низкой оценки, отсутствия данных и ошибки источника;
- Я ID, персональная рабочая область, первичный и повторный анализ;
- BullMQ worker, retry и периодический пересчёт известных публичных репозиториев;
- Dashboard, история Score, рейтинг, Markdown- и PDF-отчёты;
- PostgreSQL, Redis и запуск через Docker Compose;
- CI для backend, frontend и Docker-образов, Dependabot для зависимостей.

## Быстрый запуск

1. Скопируйте `backend/.env.example` в `backend/.env` и заполните значения. Минимально нужен `SOURCECRAFT_TOKEN`; для входа через Яндекс также нужны OAuth-параметры.
2. Выполните:

```bash
docker compose up --build
```

- Frontend: http://localhost:3001
- API: http://localhost:3000/api
- Swagger: http://localhost:3000/docs

Основная документация: [docs/PROJECT.md](docs/PROJECT.md).

Дополнительно: [соответствие ТЗ](docs/COMPLIANCE.md), [архитектура](docs/ARCHITECTURE.md), [методология](docs/METHODOLOGY.md), [сценарий демонстрации](docs/DEMO.md) и [настройка окружения](backend/docs/ENVIRONMENT.md).

Материалы защиты: [текст выступления](docs/PITCH.md), [сценарий видео](docs/VIDEO-SCRIPT.md), [чек-лист сдачи](docs/SUBMISSION-CHECKLIST.md) и [развёртывание в Yandex Cloud](docs/DEPLOY-YANDEX-CLOUD.md).
