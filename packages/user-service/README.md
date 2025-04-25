# User Service

Микросервис для управления пользователями образовательной платформы. Реализован на NestJS с использованием gRPC, PostgreSQL (TypeORM), Kafka и Auth0.

---

## Структура проекта

```
user-service/
  src/
    app/
      user/
        user.controller.ts      # gRPC контроллер
        user.service.ts         # Бизнес-логика (Auth0, БД, Kafka)
        user.entity.ts          # TypeORM сущность пользователя
        user.dto.ts             # DTO с валидацией
        user.pb.ts              # Типы для gRPC
      app.module.ts             # Главный модуль
    main.ts                     # Точка входа
  README.md
  project.json
  ...
```

---

## Основные технологии и интеграции
- **NestJS** (gRPC microservice)
- **TypeORM** (PostgreSQL)
- **Kafka** (kafkajs)
- **Auth0** (REST Management API)
- **class-validator** (валидация DTO)
- **@nestjs/config** (работа с .env)

---

## Переменные окружения (.env)

```
# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=user_service

# Kafka
KAFKA_BROKER=localhost:9092

# Auth0
AUTH0_DOMAIN=your-auth0-domain
AUTH0_MGMT_TOKEN=your-auth0-management-api-token
AUTH0_CONNECTION=Username-Password-Authentication

# gRPC
GRPC_URL=0.0.0.0:5001
```

---

## Запуск локально

1. Установите зависимости:
   ```bash
   npm install
   ```
2. Создайте файл `.env` в корне user-service и заполните его по примеру выше.
3. Запустите сервисы:
   ```bash
   npm run start:services
   ```
   Это запустит user-service и api-orchestrator параллельно через NX.

---

## Основной flow
- **CreateUser**: gRPC-запрос → создание пользователя в Auth0 → создание в БД (атомарно, с rollback) → публикация события USER_CREATED в Kafka
- **GetUser**: gRPC-запрос → получение пользователя из БД

---

## Контракты и документация
- gRPC контракты: `docs/user-service-grpc.proto`
- Flow и sequence diagram: `docs/user-service-flow.md`

---

## Тестирование
- (Рекомендуется) покрыть сервисы unit и e2e тестами
- Для тестов можно использовать встроенные средства NestJS и Jest

---

## TODO
- Реализация дополнительных методов
- Подключение Notification Service к Kafka
- Продвинутые тесты и мониторинг
