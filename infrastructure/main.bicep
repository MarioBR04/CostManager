@description('Prefix for all resources')
param projectPrefix string = 'costsmanager'

@description('Location for Storage and Database')
param locationStorageAndDB string = 'westus3'

@description('Location for Static Web App')
param locationWebApp string = 'westus2'

@description('Location for App Service')
param locationAppService string = 'westus3'

@description('PostgreSQL Administrator Login')
param administratorLogin string = 'costsmanager'

@description('PostgreSQL Administrator Password')
@secure()
param administratorLoginPassword string

@description('PostgreSQL Server Edition')
param dbServerEdition string = 'Burstable'

@description('PostgreSQL Storage Size in GB')
param dbStorageSizeGB int = 32

@description('PostgreSQL VM Name')
param dbVmName string = 'Standard_B1ms'

@description('Static Web App Name')
param swaName string = 'CostsManager-Frontend'

@description('Static Web App SKU')
param swaSku string = 'Free'

@description('Repository URL for Static Web App')
param repositoryUrl string = 'https://github.com/MarioBR04/CostManager'

@description('Repository Branch')
param branch string = 'main'

@description('App Location in Repository')
param appLocation string = './frontend'

@description('App Artifact Location (build output)')
param appArtifactLocation string = 'build'

@description('Storage Account Type')
param storageAccountType string = 'Standard_LRS'

@description('Storage Access Tier')
param storageAccessTier string = 'Hot'

@description('Database Backup Retention Days')
param dbBackupRetentionDays int = 7

@description('App Service SKU Name')
param appServiceSkuName string = 'F1'

@description('App Service SKU Tier')
param appServiceSkuTier string = 'Free'

// Generate unique names
var uniqueSuffix = uniqueString(resourceGroup().id)
var storageAccountName = '${take(toLower(projectPrefix), 9)}sa${uniqueSuffix}'
var postgresServerName = '${toLower(projectPrefix)}-db-${uniqueSuffix}'
var webAppName = '${toLower(projectPrefix)}-api-${uniqueSuffix}' // Backend API
var staticWebAppName = '${toLower(projectPrefix)}-spa-${uniqueSuffix}' // Frontend SPA

module storage 'modules/storage.bicep' = {
  name: 'storageDeployment'
  params: {
    location: locationStorageAndDB
    accountName: storageAccountName
    skuName: storageAccountType
    accessTier: storageAccessTier
  }
}

module postgres 'modules/postgres.bicep' = {
  name: 'postgresDeployment'
  params: {
    location: locationStorageAndDB
    serverName: postgresServerName
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorLoginPassword
    skuName: dbVmName
    tier: dbServerEdition
    storageSizeGB: dbStorageSizeGB
    backupRetentionDays: dbBackupRetentionDays
    version: '13'
    firewallRules: [
      {
        name: 'AllowAllAzureServices'
        startIpAddress: '0.0.0.0'
        endIpAddress: '0.0.0.0'
      }
    ]
  }
}

module appService 'modules/appService.bicep' = {
  name: 'appServiceDeployment'
  params: {
    location: locationAppService // Using separate location for App Service

    appName: webAppName
    skuName: appServiceSkuName
    skuTier: appServiceSkuTier
    linuxFxVersion: 'NODE|20-lts' // Backend is Node.js
    appSettings: {
      DB_HOST: postgres.outputs.serverFqdn
      DB_USER: administratorLogin
      DB_PASSWORD: administratorLoginPassword
      DB_NAME: 'costmanager'
      DB_PORT: '5432'
      DB_SSL: 'true'
      AZURE_STORAGE_CONNECTION_STRING: 'DefaultEndpointsProtocol=https;AccountName=${storageAccountName};AccountKey=${listKeys(storage.outputs.storageAccountId, '2021-09-01').keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
    }
  }
}


module staticWebApp 'modules/staticWebApp.bicep' = {
  name: 'staticWebAppDeployment'
  params: {
    location: locationWebApp
    name: staticWebAppName
    skuName: swaSku
    repositoryUrl: repositoryUrl
    branch: branch
    appLocation: appLocation
    appArtifactLocation: appArtifactLocation
  }
}

output storageAccountName string = storage.outputs.storageAccountName
output postgresServerFqdn string = postgres.outputs.serverFqdn
output postgresServerName string = postgres.outputs.serverName
output backendApiHostName string = appService.outputs.webAppDefaultHostName
output appServiceName string = webAppName // Or appService.outputs.webAppName if available, but variable is safe
output frontendUrl string = staticWebApp.outputs.staticWebAppDefaultHostname
output staticWebAppName string = staticWebAppName
