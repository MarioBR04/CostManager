param serverName string
param location string
param administratorLogin string
@secure()
param administratorLoginPassword string
param skuName string = 'Standard_B1ms'
param tier string = 'Burstable'
param version string = '13'
param storageSizeGB int = 32
param backupRetentionDays int = 7
param geoRedundantBackup string = 'Disabled'
param haEnabled string = 'Disabled'
param availabilityZone string = '1'

// Firewall rules
param firewallRules array = []

// AAD Authentication
param aadEnabled bool = false
param aadAdminName string = ''
param aadAdminObjectId string = ''
param aadAdminType string = 'User'

resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2022-12-01' = {
  name: serverName
  location: location
  sku: {
    name: skuName
    tier: tier
  }
  properties: {
    version: version
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorLoginPassword
    storage: {
      storageSizeGB: storageSizeGB
    }
    backup: {
      backupRetentionDays: backupRetentionDays
      geoRedundantBackup: geoRedundantBackup
    }
    highAvailability: {
      mode: haEnabled
    }
    availabilityZone: availabilityZone
  }
}

resource firewallRule 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2022-12-01' = [for rule in firewallRules: {
  parent: postgresServer
  name: rule.name
  properties: {
    startIpAddress: rule.startIpAddress
    endIpAddress: rule.endIpAddress
  }
}]

resource aadAdmin 'Microsoft.DBforPostgreSQL/flexibleServers/administrators@2022-12-01' = if (aadEnabled) {
  parent: postgresServer
  name: aadAdminObjectId
  properties: {
    principalName: aadAdminName
    principalType: aadAdminType
    tenantId: subscription().tenantId
  }
}


resource database 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2022-12-01' = {
  parent: postgresServer
  name: 'costmanager'
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

resource postgresConfig 'Microsoft.DBforPostgreSQL/flexibleServers/configurations@2022-12-01' = {
  parent: postgresServer
  name: 'require_secure_transport'
  properties: {
    value: 'OFF'
    source: 'user-override'
  }
}

output serverName string = postgresServer.name
output serverFqdn string = postgresServer.properties.fullyQualifiedDomainName
