# Repo Health Score: аналитическая методология v2

## Статус реализации

Методология отделяет фактическое измерение от отсутствия источника. Значение `0` означает подтверждённый плохой результат, а `NO_DATA` означает, что источник не дал наблюдение. `PERMISSION_DENIED` и `COLLECTION_ERROR` отображаются отдельно.

На текущей версии SourceCraft REST API в проекте отсутствует подтверждённый endpoint результатов AppSec/SAST/SCA. Поэтому Security не входит в Score до появления реального AppSec-результата. Файлы `SECURITY.md`, lockfile и manifest могут быть диагностическими сигналами, но не являются security score.

## Категории и веса

| Категория | Вес |
|---|---:|
| Security | 20% |
| Activity | 15% |
| Documentation and Best Practices | 15% |
| CI/CD | 15% |
| Issues | 15% |
| Code Health and Technical Debt | 20% |

## Агрегация

Для доступных категорий:

```text
RepoHealthScore =
  sum(categoryScore * categoryWeight) /
  sum(categoryWeight for available categories)
```

`DataCoverage = sum(available category weights) / 100`.

Результат округляется до двух знаков и ограничивается диапазоном `0..100`. Публикация Score рекомендуется только при `DataCoverage >= 60%` и минимум четырёх доступных категориях. При меньшем покрытии UI должен показывать `LOW_CONFIDENCE` или `INSUFFICIENT_DATA`.

## Реализованные метрики

### Documentation — 15%

- README, License, CONTRIBUTING, CODEOWNERS — бинарные наблюдения по дереву файлов.
- Внутри категории веса: 40%, 25%, 20%, 15%.
- Ограничение: содержимое README и качество инструкции запуска пока не извлекаются из подтверждённого API.

### CI/CD — 15%

- наличие запусков — 20%;
- доля успешных terminal runs — 60%;
- свежесть последнего успешного run — 20%.

`successRate = successfulTerminalRuns / terminalRuns * 100`.

### Security — 20%

- Реальные AppSec findings обязательны по ТЗ.
- Пока endpoint AppSec не подтверждён, категория имеет `NO_DATA` и исключается из знаменателя.
- Самостоятельный SAST/SCA/secret scanning не выполняется.

### Activity — 15%

- Реализован только `repository.last_updated` с порогами: 7/30/90/180 дней.
- Commit frequency, active days, contributors, MR и releases требуют подтверждённых SourceCraft endpoints.
- Пустые commits не должны использоваться как доказательство meaningful activity.

### Issues — 15%

- resolution rate — 45%;
- свежесть открытых issues — 35%;
- заполненность description — 20%.

Stale issue — открытый issue без обновления более 30 дней. Пустой ответ API сейчас обозначается `NO_DATA`; отдельный `NOT_APPLICABLE` потребует подтверждённого поля состояния issue tracker.

### Code Health — 20%

- наличие автоматических тестов — 45%;
- конфигурация static analysis — 25%;
- правила форматирования — 15%;
- typed project configuration — 15%.

Это verifiable engineering-practice signals, а не доказательство фактического test coverage. TODO/FIXME, coverage и результаты quality jobs требуют API/CLI для содержимого и истории Git.

## Potential Score

`Potential Score` строится на тех же весах и доступных категориях. Приросты рекомендаций группируются по категории и ограничиваются оставшимся вкладом категории до 100. Это предотвращает суммирование нескольких рекомендаций сверх максимально возможного Score.

## Обязательные контрольные сценарии

Перед демонстрацией проверить:

1. AppSec отсутствует → Security `NO_DATA`, Score не обнуляется.
2. CI отсутствует → CI/CD `NO_DATA`, вес перенормируется.
3. Большинство runs failed → CI/CD существенно снижается.
4. Старый `last_updated` → Activity снижается.
5. README отсутствует → Documentation снижается.
6. Issues API недоступен → `COLLECTION_ERROR` или `PERMISSION_DENIED`, не ноль.
7. Несколько рекомендаций одной категории → Potential Score не превышает 100.
8. Все категории недоступны → Score не вычисляется.

## Зависимости для следующей версии

- подтверждённый AppSec endpoint;
- endpoint Git history/commits;
- raw file/content endpoint для README и TODO/FIXME;
- contributors, MR и releases;
- explicit issue tracker availability flag;
- реальные репозитории SourceCraft для воспроизводимой проверки.

### Activity v2: подтверждённые дополнительные сигналы

При наличии прав SourceCraft API запрашиваются `GET /repos/{org}/{repo}/pulls` и `GET /repos/{org}/{repo}/releases` с пагинацией (до 100 страниц). В окно 90 дней попадают PR по `created_at`/`updated_at`, в окно 180 дней — опубликованные releases по `released_at`. Веса внутри Activity: recency 60%, PR 25%, releases 15%; нормализация PR — `min(100, count_90d * 10)`, releases — `min(100, published_count_180d * 25)`. Ошибка или отсутствие endpoint не превращается в ноль: доступные сигналы сохраняются, а отсутствие всех сигналов даёт `NO_DATA`. Commit frequency, contributors и code churn остаются `NO_DATA`, пока их форма ответа не зафиксирована.

Официальная документация подтверждает REST endpoints pull requests и releases: https://sourcecraft.dev/portal/docs/en/api-ref/Repository-or-PullRequest/ListRepositoryPullRequests и https://sourcecraft.dev/portal/docs/en/api-ref/Repository-or-Releases/GetLatest.
