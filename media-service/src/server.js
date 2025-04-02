require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const logger = require("./utils/logger");
const mediaRoutes = require("./routes/media-routes");
const errorHandler = require("./middlewares/errorHandler");
const Redis = require('ioredis')
const { rateLimit } = require('express-rate-limit')
const { RedisStore } = require('rate-limit-redis');
const { connectRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const { handlePostDeleted } = require("./eventHandlers/media-event-handlers");

const app = express();

const PORT = process.env.PORT || 3002;

mongoose.connect(process.env.MONGODB_URI).then(() => {
    logger.info("Database Connected in Media Service...");
}).catch((error) => {
    console.error('Database connection failed', error.message)
    logger.error('Database connection failed', error.message)
    process.exit(1)
})

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

// rate limiting
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

app.use('/api/media', ipRateLimiter, (req, res, next) => {
    req.redisClient = redisClient
    next()
}, mediaRoutes)

app.use(errorHandler)

async function startServer() {
    try {
        await connectRabbitMQ()

        // consume the event from the queue
        await consumeEvent('post.deleted', handlePostDeleted)
        app.listen(PORT, () => {
            logger.info('MEDIA Service listening on Port ', PORT)
        })
    } catch (error) {
        logger.error(error.message)
        process.exit(1)
    }
}

startServer()

// unhandled promise rejection
process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at:", promise, "reason:", reason)
})