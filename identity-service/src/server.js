const connectDB = require('./db/dbConnection')
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const logger = require('./utils/logger')
const { RateLimiterRedis } = require('rate-limiter-flexible')
const Redis = require('ioredis')
const { rateLimit } = require('express-rate-limit')
const { RedisStore } = require('rate-limit-redis')
require('dotenv').config()

const routes = require('./routes/identity-service')
const errorHandler = require('./middlewares/errorHandler')

const app = express()
const PORT = process.env.PORT || 3001

connectDB()

const redisClient = new Redis(process.env.REDIS_URL)

// MIDDLEWARES
app.use(helmet())
app.use(express.json())
app.use(cors())

app.use((req, res, next) => {
    logger.info(`Received request: ${req.method} ${req.url}`)
    logger.info(`Request body: ${JSON.stringify(req.body)}`)
    next()
})

// RATE LIMITER
const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'middleware',
    points: 10,
    duration: 1 // 10 requests per second
})

app.use((req, res, next) => {
    rateLimiter.consume(req.ip).then(() => {
        next()
    }).catch(() => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`)
        res.status(429).json({ success: false, message: 'Rate limit exceeded' })
    })
})

// IP based rate limiter for specific endpoints
const ipRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes,
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        logger.warn(`Endpoints Rate limit exceeded for IP: ${req.ip}`)
        res.status(429).json({ success: false, message: 'Rate limit exceeded' })
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    })
})

// apply this specific rate limiter to specific endpoints
app.use('/api/auth/register', ipRateLimiter)

// ROUTES
app.use('/api/auth', routes)

// ERROR HANDLER
app.use(errorHandler)

app.listen(PORT, () => logger.info(`Server running on port ${PORT}`))

// unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
})