#!/bin/bash

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Iniciando despliegue de infraestructura en Azure ===${NC}"

# 1. Definir variables
RESOURCE_GROUP="CostsManager"
LOCATION="westus3"
BICEP_FILE="./infrastructure/main.bicep"
PARAMETERS_FILE="./infrastructure/main.parameters.json"

# 2. Crear Resource Group
echo -e "${BLUE}Creando Resource Group '$RESOURCE_GROUP' en '$LOCATION'...${NC}"
az group create --name $RESOURCE_GROUP --location $LOCATION

# 3. Solicitar contraseña de BD
echo -e "${BLUE}Por favor, introduce la contraseña para el administrador de la base de datos:${NC}"
read -s DB_PASSWORD

# 4. Desplegar Bicep
echo -e "${BLUE}Desplegando plantilla Bicep... (Esto puede tardar unos minutos)${NC}"
az deployment group create \
  --resource-group $RESOURCE_GROUP \
  --template-file $BICEP_FILE \
  --parameters $PARAMETERS_FILE \
  administratorLoginPassword=$DB_PASSWORD

echo -e "${GREEN}=== Despliegue completado exitosamente ===${NC}"
echo -e "${BLUE}Ahora puedes configurar los secretos en GitHub para el despliegue de código.${NC}"
