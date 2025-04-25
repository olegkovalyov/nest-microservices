# Microservices Functional Overview and Interactions

## Technologies Used
- **Kafka**: Event-driven communication between services
- **Redis**: Caching, sessions, queues
- **PostgreSQL**: Main relational database for business data
- **MongoDB**: Non-relational storage for logs, notifications, and dynamic data

## Services and Their Responsibilities

### 1. **API Orchestrator (Gateway)**
- Authenticates/authorizes via Auth0
- Validates JWT, proxies requests to internal services (REST/gRPC)
- Provides unified API for frontend/mobile
- Aggregates data from other services

### 2. **User Service**
- User CRUD, profiles, roles
- Sync with Auth0 (via Kafka events)
- Profile caching in Redis
- Stores profiles in PostgreSQL

### 3. **Course Service**
- CRUD for courses and lessons
- Stores courses in PostgreSQL
- Search/filter (cache popular courses in Redis)
- Publishes/subscribes to Kafka events (e.g., COURSE_CREATED, LESSON_COMPLETED)

### 4. **Payment Service**
- Integrates with Stripe/YooKassa
- CRUD for payments, subscriptions
- Stores payments in PostgreSQL
- Publishes/subscribes to Kafka events (e.g., PAYMENT_SUCCEEDED, PAYMENT_FAILED)

### 5. **Progress Service**
- Tracks user progress in courses/lessons
- Stores progress in PostgreSQL
- Publishes/subscribes to Kafka events (e.g., LESSON_COMPLETED, COURSE_COMPLETED)

### 6. **Notification Service**
- Sends email, push, and in-app notifications
- Stores notification history in MongoDB
- Uses Redis for notification queues
- Publishes/subscribes to Kafka events (e.g., NOTIFICATION_SENT)

## Example Interactions

- **User Registration**: API Orchestrator authenticates via Auth0 → User Service receives USER_CREATED event from Kafka → saves profile in PostgreSQL and caches in Redis.
- **Course Purchase**: API Orchestrator → Payment Service → Stripe → on success, Payment Service publishes COURSE_PURCHASED event → Course, Progress, and Notification Services react via Kafka.
- **Lesson Completion**: API Orchestrator → Progress Service → publishes LESSON_COMPLETED event → Notification Service sends congratulation.

---

All services are containerized (Docker), monitored (Prometheus/Grafana), and log to a centralized system (ELK).
