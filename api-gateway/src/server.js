require('dotenv').config()

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const logger = require('./utils/logger')
const { RateLimiterRedis } = require('rate-limiter-flexible')
const Redis = require('ioredis')
const { rateLimit } = require('express-rate-limit')
const { RedisStore } = require('rate-limit-redis')
// const routes = require('./routes/api-gateway')
const proxy = require('express-http-proxy')
const errorHandler = require('./middlewares/errorHandler')

const app = express()
const PORT = process.env.PORT || 3000

const redisClient = new Redis(process.env.REDIS_URL)

app.use(cors())
app.use(helmet())
app.use(express.json())

// RATE LIMITER
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

app.use((req, res, next) => {
    logger.info(`Received request: ${req.method} ${req.url}`)
    logger.info(`Request body: ${JSON.stringify(req.body)}`)
    next()
})
app.use(ipRateLimiter)

const proxyOptions = {
    proxyReqPathResolver: function (req) {
        return req.originalUrl.replace(/^\/v1/, '/api')
    },
    proxyErrorHandler: function (err, req, res, next) {
        logger.error(`Proxy error: ${err.message}`)
        res.status(500).json({ success: false, message: 'Internal Server Error' })
    }
}

//setting up the proxy for api-gateway
app.use('/v1/auth', proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        if (srcReq.headers["content-type"]) {
            proxyReqOpts.headers["Content-Type"] = "application/json";
        }
        return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response received from Identity Service: ${proxyRes.statusCode}`)
        return proxyResData
    }

}))

app.use(errorHandler)

app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`)
    logger.info(`Identity Service URL: ${process.env.IDENTITY_SERVICE_URL}`)
    logger.info(`Redis URL ${process.env.REDIS_URL}`)
})