# Infrastructure Services Ports Documentation

This table lists all infrastructure containers and their port mappings for the current docker-compose setup. Use it as a quick reference to avoid confusion.

| Service       | Container (docker-compose) | Host Port | Container Port | Description                 |
|---------------|---------------------------|-----------|----------------|-----------------------------|
| Redis         | redis                     | 6379      | 6379           | In-memory key-value store   |
| Redis Commander | redis-commander          | 8081      | 8081           | UI for Redis management     |
| RedisInsight  | redisinsight              | 8001      | 8001           |                             |
| Kafka         | kafka                     | 9092      | 9092           | Message broker              |
| Kafka UI      | kafka-ui                  | 8090      | 8080           | Kafka UI                    |
| MongoDB       | mongodb                   | 27017     | 27017          | NoSQL database              |
| Postgres      | postgres                  | 5432      | 5432           | SQL database                |
| Zookeeper     | zookeeper                 | 2181      | 2181           | Kafka coordination          |

## Notes
- **Host Port** — Port exposed on localhost (accessible from outside the container).
- **Container Port** — Port used inside the container.
- To add a new service, simply extend the table.

---

_Document generated automatically. Applies to the current docker-compose.yml configuration._
