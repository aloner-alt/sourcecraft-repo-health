# Analytics audit — fix/analytics-tz-v2

## Реализовано в коде

- Новая ветка создана от `origin/main`; API, OAuth, отчёты и Docker-файлы main сохранены.
- Перенесены только UI-изменения frontend без demo-данных в рабочих экранах.
- Методология v2: шесть категорий, веса 20/15/15/15/15/20, score 0..100, перенормировка доступных весов, Data Coverage, NO_DATA/PERMISSION_DENIED/COLLECTION_ERROR.
- Potential Score пересчитывается теми же формулами и ограничен оставшимся вкладом каждой категории.
- Security не выполняет самописный анализ: без подтверждённого AppSec findings результат NO_DATA.
- Activity использует подтверждённые REST endpoints `/pulls` и `/releases`, если они доступны; recency, PR и releases имеют явные окна и веса. Commit frequency/contributors остаются NO_DATA до подтверждения формы API.
- Аналитика и UI получают категории, метрики, evidence, статус источника, Data Coverage и methodology.

## Проверено в работающем приложении

- Сравнение `origin/main` и `origin/frontend` выполнено; защищённые main-файлы не заменены demo-экранами.
- SourceCraft API без PAT вернул 401 на публичном запросе; это подтверждает, что приложение не подставляет синтетический security результат.
- Unit/build в этой копии требуют полного pnpm store; установка пакетов заблокирована политикой EACCES, поэтому локальный запуск тестов в данной среде не завершён.
- Docker CLI отсутствует, Compose и live-анализ реального репозитория здесь не запускались.

## Осталось неподтверждённым/недоступным

- Реальный AppSec ответ SourceCraft (SAST/SCA/secret scanning, severity, remediation) и архив `sourcecraft-repo-health-security.zip` не доступны в рабочей среде.
- OAuth callback, Postgres/Redis, Docker Compose и первичный/повторный live analysis требуют секретов и Docker runtime.
- Commit frequency, contributors, raw README quality/launch instructions, TODO/FIXME и test coverage не извлекаются без подтверждённых API/CLI форм.

Security adapter теперь принимает только явно настроенный `SOURCECRAFT_APPSEC_ENDPOINT` с валидированным массивом `findings`; без него сохраняется `NO_DATA`. Живой официальный endpoint и форма ответа всё ещё требуют проверки владельцем SourceCraft.
