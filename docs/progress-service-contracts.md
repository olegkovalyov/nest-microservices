# Progress Service API & Kafka Contracts

## REST/gRPC API

### Endpoints
- `POST /progress/lessons/:id` — Mark lesson as completed
- `GET /progress/users/:userId` — Get user progress

### DTOs
```typescript
interface ProgressDto {
  userId: string;
  courseId: string;
  completedLessons: string[];
}
```

## Kafka Events
- `LESSON_COMPLETED`
- `COURSE_COMPLETED`

### Event Example
```json
{
  "type": "LESSON_COMPLETED",
  "data": {
    "userId": "...",
    "courseId": "...",
    "lessonId": "..."
  },
  "metadata": {
    "timestamp": "2025-04-25T19:58:00Z",
    "correlationId": "..."
  }
}
```
