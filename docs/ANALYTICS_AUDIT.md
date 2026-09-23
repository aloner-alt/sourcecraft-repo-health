# Аналитический аудит реализации

Дата аудита: 2026-09-23

## Исправлено

- Security больше не выдаёт score на основании наличия файлов и явно возвращает `NO_DATA` без AppSec.
- Исправлен дублирующий импорт `DataStatus` в issue types.
- Potential Score ограничивается оставшимся вкладом категории и не складывает приросты сверх 100.
- Методология обновлена до v2 и отделяет реализованные сигналы от внешних зависимостей.

## Внешние зависимости

| Блок | Причина | Поведение |
|---|---|---|
| AppSec/SAST/SCA | endpoint не подтверждён в используемом API | Security = `NO_DATA` |
| Git history | collector получает только `last_updated` | Activity ограничена recency |
| Raw file content | tree не содержит содержимое файлов | README/TODO content не оценивается |
| Issue tracker availability | API не возвращает отдельный флаг | пустой ответ = `NO_DATA` |

## Definition of Done для аналитики

- [x] Шесть категорий и веса.
- [x] Перенормировка доступных категорий.
- [x] Разделение `NO_DATA`, permission и collection error.
- [x] Реальные evidence для реализованных collectors.
- [x] Potential Score с ограничением категории.
- [ ] Реальные AppSec findings.
- [ ] Полная проверка на репозиториях SourceCraft.
- [ ] Git activity, contributors, MR и releases.
- [ ] Числовой regression-набор из 15 контрольных сценариев.
