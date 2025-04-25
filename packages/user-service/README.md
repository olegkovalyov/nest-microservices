# User Service

A microservice for managing users of an educational platform. Implemented with NestJS using gRPC, PostgreSQL (TypeORM), Kafka, and Auth0.

---

## Project Structure

```
user-service/
  src/
    app/
      user/
        user.controller.ts      # gRPC controller
        user.service.ts         # Business logic (Auth0, DB, Kafka)
        user.entity.ts          # TypeORM user entity
        user.dto.ts             # DTOs with validation
        user.pb.ts              # Types for gRPC
      app.module.ts             # Main module
    main.ts                     # Entry point
  README.md
  project.json
  ...
```

---

## Main Technologies and Integrations
- **NestJS** (gRPC microservice)
- **TypeORM** (PostgreSQL)
- **Kafka** (kafkajs)
- **Auth0** (REST Management API)
- **class-validator** (DTO validation)
- **@nestjs/config** (environment variable management)

---

## Environment Variables (.env)

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

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the root of user-service and fill it out as shown above.
3. Start the services:
   ```bash
   npm run start:services
   ```
   This will launch both user-service and api-orchestrator in parallel via NX.

---

## Main Flow
- **CreateUser**: gRPC request → user creation in Auth0 → creation in DB (atomic, with rollback) → publishing USER_CREATED event to Kafka
- **GetUser**: gRPC request → fetch user from DB

---

## Contracts and Documentation
- gRPC contracts: `docs/user-service-grpc.proto`
- Flow and sequence diagram: `docs/user-service-flow.md`

---

## Testing
- (Recommended) Cover services with unit and e2e tests
- You can use built-in NestJS and Jest tools for testing

---

## TODO
- Implement additional methods
- Connect Notification Service to Kafka
- Advanced tests and monitoring
