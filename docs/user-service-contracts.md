# User Service API & Kafka Contracts

## REST/gRPC API

### Endpoints
- `GET /users/:id` — Get user profile
- `POST /users` — Create user
- `PUT /users/:id` — Update user
- `DELETE /users/:id` — Delete user

### DTOs
```typescript
interface UserDto {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

interface CreateUserDto {
  email: string;
  name: string;
  password: string;
}
```

## Kafka Events
- `USER_CREATED`
- `USER_UPDATED`
- `USER_DELETED`

### Event Example
```json
{
  "type": "USER_CREATED",
  "data": {
    "id": "...",
    "email": "...",
    "name": "..."
  },
  "metadata": {
    "timestamp": "2025-04-25T19:58:00Z",
    "correlationId": "..."
  }
}
```
