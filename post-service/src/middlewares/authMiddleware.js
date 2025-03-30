const logger = require("../utils/logger")

const authenticateRequest = async (req, res, next) => {
    const userId = req.headers['x-user-id']

    if (!userId) {
        logger.warn('user id not found in request headers')
        return res.status(400).json({ success: false, message: 'Authentication failed. Please login again' })
    }

    req.user = { userId }
    next()
}

module.exports = { authenticateRequest }