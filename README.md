# Educational Platform (EdTech)

A microservices-based educational platform built with NestJS using modern technologies and practices.

## Tech Stack

### Backend
- **NestJS** - main microservices framework
- **Auth0** - auth provider
- **Kafka** - message broker
- **Stripe** - payment system
- **PostgreSQL** - main database
- **Redis** - caching

### Frontend
- **Next.js** - React framework
- **TypeScript** - type safety
- **Tailwind CSS** - styling
- **ShadCn UI** - UI components

## Project Structure

```
nest-microservices/
├── packages/
│   ├── api-orchestrator/      # Основной API-шлюз (gRPC orchestrator)
│   ├── user-service/          # Микросервис пользователей (NestJS, gRPC, Kafka, Auth0)
│   ├── course-service/        # (Планируется) Управление курсами
│   ├── payment-service/       # (Планируется) Платежи
│   ├── notification-service/  # (Планируется) Уведомления
│   ├── progress-service/      # (Планируется) Прогресс обучения
├── libs/
│   ├── common/                # Общие утилиты и интерфейсы
│   ├── kafka/                 # Конфигурация и клиенты Kafka
├── docs/                      # Документация, proto, схемы

```

## Documentation

- [System Architecture](docs/architecture.md)
- [Development Plan](docs/development-plan.md)

## Installation and Setup

1. Clone the repository
2. Install dependencies
3. Configure environment variables
4. Run with Docker Compose

```bash
# Install dependencies
npm install

# Run in development mode
docker-compose up -d

# Stop
docker-compose down
```

## License

MIT 
