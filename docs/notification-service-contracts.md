# Notification Service API & Kafka Contracts

## REST/gRPC API

### Endpoints
- `POST /notifications/email` — Send email notification
- `POST /notifications/push` — Send push notification
- `POST /notifications/in-app` — Send in-app notification
- `GET /notifications/user/:userId` — Get user notifications

### DTOs
```typescript
interface NotificationDto {
  id: string;
  userId: string;
  type: 'email' | 'push' | 'in-app';
  message: string;
  createdAt: string;
}

interface SendNotificationDto {
  userId: string;
  type: 'email' | 'push' | 'in-app';
  message: string;
}
```

## Kafka Events
- `NOTIFICATION_SENT`
- `NOTIFICATION_FAILED`

### Event Example
```json
{
  "type": "NOTIFICATION_SENT",
  "data": {
    "id": "...",
    "userId": "...",
    "type": "email",
    "message": "..."
  },
  "metadata": {
    "timestamp": "2025-04-25T19:58:00Z",
    "correlationId": "..."
  }
}
```
