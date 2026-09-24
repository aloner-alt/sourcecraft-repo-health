# Развёртывание на Yandex Cloud VM

Конфигурация рассчитана на одну Ubuntu VM с публичным IP, DNS именем и Docker
Compose. Caddy автоматически получает TLS сертификат после настройки DNS.

## 1. Подготовка VM

Открыть входящие TCP-порты 22, 80 и 443, а также UDP 443. Установить Docker с
Compose plugin и клонировать репозиторий.

## 2. Переменные

Создать рядом с `compose.production.yaml` файл `.env.production`:

```dotenv
APP_DOMAIN=repo-health.example.ru
POSTGRES_PASSWORD=<случайный пароль>
```

Скопировать `deploy/yandex-cloud/backend.env.example` в
`deploy/yandex-cloud/backend.env` и заполнить секреты. Сгенерировать JWT secret:

```bash
openssl rand -base64 48
```

Файлы с секретами не добавлять в Git.

## 3. Я ID

Добавить callback `https://APP_DOMAIN/api/auth/yandex/callback` в приложение Я ID
и использовать те же Client ID и Client secret в backend environment.

## 4. Запуск

```bash
docker compose --env-file .env.production -f compose.production.yaml up -d --build
docker compose --env-file .env.production -f compose.production.yaml ps
```

## 5. Проверка

```bash
curl -fsS https://APP_DOMAIN/api/health/ready
curl -I https://APP_DOMAIN/ranking
```

Проверить в браузере `/ranking`, `/my-repositories`, Dashboard, Swagger `/docs`
и скачивание отчётов. Резервировать volume PostgreSQL до обновления VM.
