GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' 

echo -e "${BLUE}=== Iniciando despliegue de infraestructura en Azure ===${NC}"

# 1. Definir variables
RESOURCE_GROUP="CostsManager"
LOCATION="westus3"
BICEP_FILE="./infrastructure/main.bicep"
PARAMETERS_FILE="./infrastructure/main.parameters.json"

# 2. Crear Resource Group
echo -e "${BLUE}Creando Resource Group '$RESOURCE_GROUP' en '$LOCATION'...${NC}"
az group create --name $RESOURCE_GROUP --location $LOCATION

# 3. Definir contraseña de BD
DB_PASSWORD="P@ssw0rdSegura123!"

# 4. Desplegar Bicep
echo -e "${BLUE}Desplegando plantilla Bicep... (Esto puede tardar unos minutos)${NC}"
# Desplegar Bicep y capturar outputs
echo "Desplegando plantilla Bicep... (Esto puede tardar unos minutos)"
# Desplegar Bicep
az deployment group create \
  --resource-group $RESOURCE_GROUP \
  --template-file $BICEP_FILE \
  --parameters $PARAMETERS_FILE \
  administratorLoginPassword=$DB_PASSWORD \
  --name main

# Extraer valores de los outputs usando az query (más robusto que grep)
echo "Obteniendo información del despliegue..."
DB_SERVER_NAME=$(az deployment group show --resource-group $RESOURCE_GROUP --name main --query properties.outputs.postgresServerName.value -o tsv)
DB_FQDN=$(az deployment group show --resource-group $RESOURCE_GROUP --name main --query properties.outputs.postgresServerFqdn.value -o tsv)

echo "DB Server: $DB_SERVER_NAME"
echo "DB Host: $DB_FQDN"

echo "=== Configuración Post-Despliegue ==="

# 1. Configurar Firewall

echo "Agregando regla de firewall para tu IP en el servidor $DB_SERVER_NAME..."
az postgres flexible-server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER_NAME \
  --rule-name AllowMyIP_Auto \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 255.255.255.255\
  --output none

# 2. Inicializar Base de Datos
echo "Inicializando base de datos..."
export DB_HOST=$DB_FQDN
export DB_USER="costsmanager"
export DB_NAME="costmanager"
export DB_PORT="5432"
export DB_SSL="true"
export DB_PASSWORD=$DB_PASSWORD

node backend/scripts/init-db.js

echo "=== Despliegue e Inicialización Completados ==="

# 3. Trigger GitHub Actions

echo "Haciendo push de un commit vacío para disparar el workflow..."
git commit --allow-empty -m "Trigger deployment via script"
git push origin main

