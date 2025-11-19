@description('Prefix for all resources')
param projectPrefix string = 'costsmanager'

@description('Location for Storage and Database')
param locationStorageAndDB string = 'westus3'

@description('Location for Static Web App')
param locationWebApp string = 'westus2'

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

@description('PostgreSQL Backup Retention Days')
param dbBackupRetentionDays int = 7

@description('App Service Plan SKU Name')
param appServiceSkuName string = 'F1'

@description('App Service Plan SKU Tier')
param appServiceSkuTier string = 'Free'

// Generate unique names
var uniqueSuffix = uniqueString(resourceGroup().id)
var storageAccountName = '${toLower(projectPrefix)}sa${uniqueSuffix}'
var postgresServerName = '${toLower(projectPrefix)}-db-${uniqueSuffix}'
var webAppName = '${toLower(projectPrefix)}-app-${uniqueSuffix}'

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
    version: '13' // Defaulting to 13, can be parameterized if needed
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
    location: locationWebApp
    appName: webAppName
    skuName: appServiceSkuName
    skuTier: appServiceSkuTier
  }
}

output storageAccountName string = storage.outputs.storageAccountName
output postgresServerFqdn string = postgres.outputs.serverFqdn
output webAppDefaultHostName string = appService.outputs.webAppDefaultHostName
