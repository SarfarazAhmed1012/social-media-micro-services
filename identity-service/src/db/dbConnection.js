const mongoose = require('mongoose')
const logger = require('../utils/logger')

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        logger.info('Database Connected...')
    } catch (error) {
        console.error('Database connection failed', error.message)
        logger.error('Database connection failed', error.message)
        process.exit(1)
    }
}

module.exports = connectDB