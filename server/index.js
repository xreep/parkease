require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const slowDown = require('express-slow-down')
const hpp = require('hpp')
const cookieParser = require('cookie-parser')
const morgan = require('morgan')
const path = require('path')
const fs = require('fs')
const logger = require('./utils/logger')
const errorHandler = require('./middleware/errorHandler')

const app = express()

app.set('trust proxy', 1)

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}))

const allowedOrigins = [
  'http://localhost:5000',
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean)

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o)) || origin.includes('.replit.dev') || origin.includes('.pike.replit.dev')) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))

app.use(cookieParser())

app.use(hpp())

app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}))

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { message: 'Too many requests, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
})
app.use(globalLimiter)

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
})
app.use('/api/auth', authLimiter)

const authSpeedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 5,
  delayMs: () => 500
})
app.use('/api/auth', authSpeedLimiter)

app.use('/api/auth', require('./routes/auth'))
app.use('/api/parkings', require('./routes/parking'))
app.use('/api/bookings', require('./routes/booking'))
app.use('/api/admin', require('./routes/admin'))
app.use('/api/vehicles', require('./routes/vehicles'))
app.use('/api/owner', require('./routes/owner'))
app.use('/api/disputes', require('./routes/disputes'))
app.use('/api/payment', require('./routes/payment'))

const clientDistPath = path.join(__dirname, '../client/dist')
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath))
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'))
  })
} else {
  app.get('/', (req, res) => {
    res.json({ message: 'ParkEase API is running!' })
  })
}

app.use(errorHandler)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
})
