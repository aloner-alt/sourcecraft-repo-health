# Методология Repo Health Score v1

## Категории и веса

| Категория | Вес | Основные сигналы |
|---|---:|---|
| Security | 20% | реальные SourceCraft AppSec findings: SAST, SCA, secret scanning, severity, remediation |
| Activity | 15% | давность активности, contributors, MR за 90 дней, свежесть релизов |
| Documentation | 15% | README, LICENSE, CONTRIBUTING, CODEOWNERS |
| CI/CD | 15% | наличие запусков, success rate, свежесть успешного запуска |
| Issues | 15% | закрытие, stale issues, заполненность описаний |
| Code Health | 20% | тесты, static analysis, форматирование, типизация |

Каждая метрика нормализуется в диапазон 0–100. Оценка категории является взвешенной суммой её метрик. Итоговый Score:

`Score = Σ(categoryScore × categoryWeight) / Σ(availableCategoryWeight)`

Если источник вернул `NO_DATA`, `PERMISSION_DENIED` или `COLLECTION_ERROR`, его вес не превращается в ноль, а исключается из знаменателя. `Data Coverage` показывает сумму реально использованных весов.

## Potential Score

Для каждой рекомендации вычисляется максимальный вклад исправляемой метрики в итоговую формулу. Potential Score равен текущему Score плюс сумма этих вкладов, но не выше 100. Это прогноз, а не обещание результата.

## Ограничения

Security рассчитывается только по реальным данным `src appsec defect list --json`. Открытые findings штрафуются с учётом критичности: critical сильнее high, high сильнее medium и low; отдельная метрика отражает долю исправленных или закрытых findings. Если актуальный SourceCraft CLI не подключён или AppSec недоступен, категория получает `NO_DATA` и не участвует в итоговом Score. Наличие `SECURITY.md`, lockfile или иных файлов не выдаётся за SAST/SCA/secret scanning.

Activity v1 использует подтверждённые `last_updated`, список contributors, merge requests и опубликованные релизы. Если один из дополнительных endpoints временно недоступен, его вес перераспределяется внутри категории. Частота коммитов и полноценный bus factor требуют отдельного проверенного источника Git history.
