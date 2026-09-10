import 'dotenv/config'
import express from 'express'
import cors from 'cors'

const app = express()

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173'
const PORT = process.env.PORT || 3001

// CORS: permitir peticiones del frontend
app.use(cors({ origin: CORS_ORIGIN }))

// Parseo de JSON
app.use(express.json())

// Ruta de prueba / health check
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'arca-service' })
})

app.listen(PORT, () => {
  console.log(`arca-service escuchando en http://localhost:${PORT} (CORS: ${CORS_ORIGIN})`)
})
