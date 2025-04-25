# Educational Platform (EdTech)

A microservices-based educational platform built with NestJS, supporting both PostgreSQL and MongoDB, and leveraging modern cloud-native technologies.

## Tech Stack

### Backend
- **NestJS** – main microservices framework (gRPC, REST, CQRS)
- **Auth0** – authentication and authorization provider
- **Kafka** – event-driven message broker
- **Stripe** – payment gateway
- **PostgreSQL** – primary relational database (used by most services)
- **MongoDB** – document database (used by select services)
- **Redis** – caching and pub/sub

### Frontend
- **Next.js** – React framework
- **TypeScript** – type safety
- **Tailwind CSS** – styling
- **ShadCn UI** – UI components

## Project Structure

```
nest-microservices/
├── packages/
│   ├── api-orchestrator/      # Main API gateway (gRPC orchestrator)
│   ├── user-service/          # User microservice (NestJS, gRPC, Kafka, Auth0, PostgreSQL)
│   ├── course-service/        # Course management microservice (planned)
│   ├── payment-service/       # Payment microservice (planned)
│   ├── notification-service/  # Notification microservice (planned)
│   ├── progress-service/      # Learning progress microservice (planned)
├── docs/                      # Documentation, proto files, diagrams
```

## Documentation

- [System Architecture](docs/architecture.md)
- [Development Plan](docs/development-plan.md)
- [Service Contracts & Protos](docs/)

## Installation and Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/nest-microservices.git
   cd nest-microservices
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure environment variables:**
   - Copy `.env.example` or follow service-specific README instructions.
   - Set up PostgreSQL and/or MongoDB as required by each service.
4. **Run services (development mode):**
   ```bash
   npm run start:services
   # or with Docker Compose (if configured)
   docker-compose up -d
   ```
5. **Stop services:**
   ```bash
   docker-compose down
   ```

## Notes
- Each microservice may have its own `.env` file and database requirements.
- The platform is designed for modularity; you can add or remove services as needed.
- Both SQL (PostgreSQL) and NoSQL (MongoDB) databases are supported, depending on the service.

## License

MIT
