param location string
param appName string
param skuName string = 'F1' 
param skuTier string = 'Free'
param linuxFxVersion string = 'NODE|20-lts'
param appSettings object = {}

resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: '${appName}-plan'
  location: location
  sku: {
    name: skuName
    tier: skuTier
  }
  kind: 'linux'
  properties: {
    reserved: true 
  }
}

resource webApp 'Microsoft.Web/sites@2022-09-01' = {
  name: appName
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: linuxFxVersion
      appSettings: [for setting in items(appSettings): {
        name: setting.key
        value: setting.value
      }]
    }
    httpsOnly: true
  }
}

output webAppName string = webApp.name
output webAppDefaultHostName string = webApp.properties.defaultHostName
