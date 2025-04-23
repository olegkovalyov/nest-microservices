# Educational Platform Architecture

## System Overview

The educational platform is a microservices architecture built with NestJS. The system consists of several independent services that communicate through an API Gateway and message broker.

## Architectural Decisions

### 1. Monorepo

The choice of a monorepo is based on the following factors:
- Simplified dependency management
- Unified versioning
- Simplified CI/CD
- Local development

### 2. Microservices Architecture

Each service is responsible for a specific business function:
- Auth Service - authentication and authorization
- Course Service - course management
- User Service - user management
- Payment Service - payments
- Notification Service - notifications
- Progress Service - progress tracking

### 3. Service Communication

#### Synchronous Communication
- REST API through KrakenD
- gRPC for internal communication

#### Asynchronous Communication
- Kafka for events
- WebSocket for real-time updates

## Service Details

### Auth Service

```typescript
interface IAuthService {
  login(credentials: LoginDto): Promise<TokenResponse>;
  register(userData: RegisterDto): Promise<User>;
  validateToken(token: string): Promise<UserPayload>;
  refreshToken(token: string): Promise<TokenResponse>;
}
```

### Course Service

```typescript
interface ICourseService {
  createCourse(data: CreateCourseDto): Promise<Course>;
  updateCourse(id: string, data: UpdateCourseDto): Promise<Course>;
  getCourse(id: string): Promise<Course>;
  getLessons(courseId: string): Promise<Lesson[]>;
  addLesson(courseId: string, data: CreateLessonDto): Promise<Lesson>;
}
```

### Payment Service

```typescript
interface IPaymentService {
  createSubscription(userId: string, planId: string): Promise<Subscription>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  purchaseCourse(userId: string, courseId: string): Promise<Payment>;
  processRefund(paymentId: string): Promise<Refund>;
}
```

### Notification Service

```typescript
interface INotificationService {
  sendEmail(to: string, template: string, data: any): Promise<void>;
  sendPush(userId: string, notification: PushNotification): Promise<void>;
  sendInAppNotification(userId: string, notification: InAppNotification): Promise<void>;
}
```

## Database

### PostgreSQL
- Main database
- Schemas per service
- Migrations via TypeORM

### Redis
- Caching
- Sessions
- Queues

## Security

### KeyCloak
- Centralized authentication
- OAuth 2.0 / OpenID Connect
- Roles and permissions
- SSO

### API Gateway (KrakenD)
- Rate limiting
- CORS
- JWT validation
- Logging

## Monitoring and Logging

### ELK Stack
- Centralized logging
- Analytics
- Visualization

### Prometheus + Grafana
- Metrics
- Alerts
- Dashboards

## Deployment

### Docker
- Service containerization
- Docker Compose for development
- Docker Swarm/Kubernetes for production

### CI/CD
- GitHub Actions
- Automated deployment
- Testing
- Linting

## Frontend

### Next.js
- SSR/SSG
- API Routes
- TypeScript
- Tailwind CSS
- ShadCn UI

## Kafka Events

```typescript
enum KafkaTopics {
  USER_EVENTS = 'user-events',
  COURSE_EVENTS = 'course-events',
  PAYMENT_EVENTS = 'payment-events',
  PROGRESS_EVENTS = 'progress-events',
  NOTIFICATION_EVENTS = 'notification-events'
}

interface KafkaEvent<T> {
  type: string;
  data: T;
  metadata: {
    timestamp: Date;
    correlationId: string;
  };
}
```

## Use Case Examples

### 1. Registration and Course Purchase

```mermaid
sequenceDiagram
    Client->>API Gateway: POST /api/auth/register
    API Gateway->>Auth Service: Create user
    Auth Service->>KeyCloak: Create account
    KeyCloak-->>Auth Service: Success
    Auth Service->>Kafka: USER_CREATED
    Notification Service->>Client: Welcome email
    Client->>API Gateway: POST /api/payments/courses/{id}
    API Gateway->>Payment Service: Create payment
    Payment Service->>Stripe: Process payment
    Stripe-->>Payment Service: Success
    Payment Service->>Kafka: COURSE_PURCHASED
    Course Service->>Kafka: COURSE_ACCESS_GRANTED
    Notification Service->>Client: Purchase confirmation
```

### 2. Course Progress

```mermaid
sequenceDiagram
    Client->>API Gateway: GET /api/courses/{id}/lessons
    API Gateway->>Course Service: Get lessons
    Course Service-->>Client: Lesson list
    Client->>API Gateway: POST /api/progress/lessons/{id}
    API Gateway->>Progress Service: Mark as viewed
    Progress Service->>Kafka: LESSON_COMPLETED
    Progress Service->>Kafka: COURSE_COMPLETED
    Notification Service->>Client: Completion congratulation
```

## Scaling

### Horizontal Scaling
- Service replication
- Load balancing
- Caching

### Vertical Scaling
- Query optimization
- Indexing
- Partitioning

## Backup

### Database
- Daily backups
- Point-in-time recovery
- Geo-replication

### Files
- Object storage
- CDN
- Replication 