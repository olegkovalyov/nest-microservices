# Course Service API & Kafka Contracts

## REST/gRPC API

### Endpoints
- `GET /courses/:id` — Get course details
- `POST /courses` — Create course
- `PUT /courses/:id` — Update course
- `DELETE /courses/:id` — Delete course
- `GET /courses/:id/lessons` — List lessons

### DTOs
```typescript
interface CourseDto {
  id: string;
  title: string;
  description: string;
  lessons: LessonDto[];
}

interface CreateCourseDto {
  title: string;
  description: string;
}
```

## Kafka Events
- `COURSE_CREATED`
- `COURSE_UPDATED`
- `COURSE_DELETED`
- `LESSON_ADDED`

### Event Example
```json
{
  "type": "COURSE_CREATED",
  "data": {
    "id": "...",
    "title": "...",
    "description": "..."
  },
  "metadata": {
    "timestamp": "2025-04-25T19:58:00Z",
    "correlationId": "..."
  }
}
```
