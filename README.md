# Educational Platform (EdTech)

A microservices-based educational platform built with NestJS using modern technologies and practices.

## Tech Stack

### Backend
- **NestJS** - main microservices framework
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
├── apps/
│   ├── api-gateway/           # KrakenD configuration
│   ├── auth-service/          # KeyCloak integration
│   ├── course-service/        # Course management
│   ├── user-service/          # User management
│   ├── payment-service/       # Stripe integration
│   ├── notification-service/  # Notifications
│   └── progress-service/      # Learning progress
├── libs/
│   ├── common/               # Common utilities and interfaces
│   ├── kafka/               # Kafka configuration

└── docs/                    # Documentation
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