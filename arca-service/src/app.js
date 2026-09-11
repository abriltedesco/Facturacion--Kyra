import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import { config } from './config.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: config.corsOrigin, credentials: true }))
  app.use(express.json())
  app.use(cookieParser())

  app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'arca-service' })
  })

  // Routers are mounted here in later phases:
  //   app.use('/auth', authRouter)
  //   app.use('/entities', authMiddleware, entitiesRouter)
  //   app.use('/clients', authMiddleware, clientsRouter)
  //   app.use(catalogsRouter) // /countries, /fiscal-conditions, /tax-categories
  //   app.use('/files', filesRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
