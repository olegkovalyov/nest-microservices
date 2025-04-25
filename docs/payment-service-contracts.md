# Payment Service API & Kafka Contracts

## REST/gRPC API

### Endpoints
- `POST /payments` — Create payment
- `GET /payments/:id` — Get payment details
- `POST /subscriptions` — Create subscription
- `DELETE /subscriptions/:id` — Cancel subscription

### DTOs
```typescript
interface PaymentDto {
  id: string;
  userId: string;
  courseId: string;
  amount: number;
  status: 'pending' | 'succeeded' | 'failed';
}

interface CreatePaymentDto {
  userId: string;
  courseId: string;
  amount: number;
}
```

## Kafka Events
- `PAYMENT_SUCCEEDED`
- `PAYMENT_FAILED`
- `SUBSCRIPTION_CREATED`
- `SUBSCRIPTION_CANCELLED`

### Event Example
```json
{
  "type": "PAYMENT_SUCCEEDED",
  "data": {
    "id": "...",
    "userId": "...",
    "courseId": "...",
    "amount": 100
  },
  "metadata": {
    "timestamp": "2025-04-25T19:58:00Z",
    "correlationId": "..."
  }
}
```
