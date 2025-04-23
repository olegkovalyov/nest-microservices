FROM quay.io/keycloak/keycloak:latest

USER root

# Устанавливаем curl для проверки готовности сервиса
RUN if command -v apt-get &> /dev/null; then \
        apt-get update && apt-get install -y curl; \
    elif command -v dnf &> /dev/null; then \
        dnf install -y curl; \
    elif command -v yum &> /dev/null; then \
        yum install -y curl; \
    else \
        echo "Cannot install packages - no supported package manager found"; \
    fi

# Копируем скрипт инициализации
COPY init-script.sh /opt/keycloak/init-script.sh
RUN chmod +x /opt/keycloak/init-script.sh

USER keycloak

# Устанавливаем переменные окружения
ENV KC_BOOTSTRAP_ADMIN_USERNAME=admin
ENV KC_BOOTSTRAP_ADMIN_PASSWORD=admin
ENV KC_SPI_LOGIN_DEFAULT_REALM=education

# Запускаем Keycloak и выполняем скрипт инициализации
ENTRYPOINT ["/bin/sh", "-c", "/opt/keycloak/bin/kc.sh start-dev & sleep 30 && /opt/keycloak/init-script.sh & wait"] 