const User = require("../models/User");
const generateTokens = require("../utils/generateToken");
const logger = require("../utils/logger");
const { validationRegisteration } = require("../utils/validation");

const registerUser = async (req, res) => {
    logger.info('register user endpoint hit')
    try {
        const { error } = validationRegisteration(req.body)
        if (error) {
            logger.warn('validation error', error.details[0].message)
            return res.status(400).json({ success: false, message: error.details[0].message })
        }

        const { username, email, password } = req.body
        let user = await User.findOne({ $or: [{ username }, { email }] })


        if (user) {
            logger.warn('user already exist')
            return res.status(400).json({ success: false, message: 'user already exist' })
        }

        user = new User({ username, email, password })
        await user.save()
        logger.info('user registered successfully', user._id)

        const { accessToken, refreshToken } = await generateTokens(user)

        return res.status(201).json({
            success: true,
            message: 'user registered successfully',
            accessToken,
            refreshToken
        })
    } catch (error) {
        logger.error(error.message)
        return res.status(500).json({ success: false, message: 'internal server error' })
    }
}

module.exports = { registerUser }