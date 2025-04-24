FROM quay.io/keycloak/keycloak:latest

USER keycloak

# Set environment variables
ENV KC_BOOTSTRAP_ADMIN_USERNAME=admin
ENV KC_BOOTSTRAP_ADMIN_PASSWORD=admin
ENV KC_SPI_LOGIN_DEFAULT_REALM=education
ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true

# Start Keycloak in development mode with realm import
ENTRYPOINT ["/opt/keycloak/bin/kc.sh", "start-dev", "--import-realm"] 