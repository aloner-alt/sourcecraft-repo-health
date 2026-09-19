# Методология Repo Health Score v1

## Категории и веса

| Категория | Вес | Основные сигналы |
|---|---:|---|
| Security | 20% | security policy, manifest, lockfile, dependency updates |
| Activity | 15% | давность последней активности |
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

Публичный REST API SourceCraft на момент реализации не публикует результаты AppSec/SAST/SCA. Поэтому security-hygiene сигналы не следует интерпретировать как отсутствие уязвимостей. После появления официального интерфейса AppSec его данные должны заменить или дополнить текущие security-метрики.

Activity v1 использует подтверждённый `last_updated`; частота коммитов и bus factor требуют отдельного проверенного источника Git history.
