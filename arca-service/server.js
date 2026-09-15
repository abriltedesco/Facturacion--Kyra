import 'dotenv/config'

import { createApp } from './src/app.js'
import { config, assertProductionSecrets } from './src/config.js'

assertProductionSecrets()

const app = createApp()

app.listen(config.port, () => {
  console.log(`arca-service listening on http://localhost:${config.port} (${config.nodeEnv})`)
})
