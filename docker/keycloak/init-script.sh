#!/bin/bash

# Ждем, пока Keycloak запустится
echo "Waiting for Keycloak to start..."
until curl -s http://localhost:8080 > /dev/null; do
    sleep 5
done
echo "Keycloak is up and running!"

# Логинимся в админскую консоль
/opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin

# Проверяем существует ли уже realm education
REALM_EXISTS=$(/opt/keycloak/bin/kcadm.sh get realms/education 2>/dev/null || echo "NOT_FOUND")

if [ "$REALM_EXISTS" == "NOT_FOUND" ]; then
    echo "Creating education realm..."
    /opt/keycloak/bin/kcadm.sh create realms -s realm=education -s enabled=true -s displayName="Education Platform"
else
    echo "Education realm already exists"
fi

# Создаем роли в realm education, если их нет
echo "Creating roles..."
/opt/keycloak/bin/kcadm.sh create roles -r education -s name=admin -s 'description=Administrator role' 2>/dev/null || echo "Admin role already exists"
/opt/keycloak/bin/kcadm.sh create roles -r education -s name=instructor -s 'description=Instructor role' 2>/dev/null || echo "Instructor role already exists"
/opt/keycloak/bin/kcadm.sh create roles -r education -s name=student -s 'description=Student role' 2>/dev/null || echo "Student role already exists"

# Создаем пользователей, если их нет
create_user() {
    local username=$1
    local email=$2
    local password=$3
    local role=$4
    
    # Проверяем существует ли уже пользователь
    USER_ID=$(/opt/keycloak/bin/kcadm.sh get users -r education -q username=$username 2>/dev/null | grep id | head -n 1 | cut -d '"' -f 4)
    
    if [ -z "$USER_ID" ]; then
        echo "Creating user $username..."
        USER_ID=$(/opt/keycloak/bin/kcadm.sh create users -r education -s username=$username -s email=$email -s enabled=true -i)
        
        # Устанавливаем пароль
        /opt/keycloak/bin/kcadm.sh set-password -r education --username $username --new-password $password
        
        # Назначаем роль
        /opt/keycloak/bin/kcadm.sh add-roles -r education --uusername $username --rolename $role
        
        echo "User $username created with role $role"
    else
        echo "User $username already exists"
    fi
}

create_user "admin_user" "admin@example.com" "password" "admin"
create_user "instructor_user" "instructor@example.com" "password" "instructor"
create_user "student_user" "student@example.com" "password" "student"

# Создаем клиент postman-client, если его нет
POSTMAN_CLIENT_ID=$(/opt/keycloak/bin/kcadm.sh get clients -r education -q clientId=postman-client 2>/dev/null | grep id | head -n 1 | cut -d '"' -f 4)

if [ -z "$POSTMAN_CLIENT_ID" ]; then
    echo "Creating postman-client..."
    /opt/keycloak/bin/kcadm.sh create clients -r education -s clientId=postman-client -s name="Postman Client" -s enabled=true -s publicClient=true -s directAccessGrantsEnabled=true -s standardFlowEnabled=true -s implicitFlowEnabled=false -s "redirectUris=[\"https://oauth.pstmn.io/v1/callback\"]" -s "webOrigins=[\"*\"]"
    echo "Postman client created"
else
    echo "Postman client already exists"
fi

echo "Keycloak initialization completed!" 