param name string
param location string
param skuName string = 'Free'
param skuTier string = 'Free'
param repositoryUrl string
param branch string
param appLocation string = '/'
param apiLocation string = ''
param appArtifactLocation string = 'build'
@secure()
param repositoryToken string = ''

resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' = {
  name: name
  location: location
  sku: {
    name: skuName
    tier: skuTier
  }
  properties: {
    repositoryUrl: repositoryUrl
    branch: branch
    repositoryToken: repositoryToken
    buildProperties: {
      appLocation: appLocation
      apiLocation: apiLocation
      appArtifactLocation: appArtifactLocation
    }
  }
}

output staticWebAppName string = staticWebApp.name
output staticWebAppDefaultHostname string = staticWebApp.properties.defaultHostname
