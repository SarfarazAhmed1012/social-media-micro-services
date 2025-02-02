const RefreshToken = require("../models/RefreshToken");
const User = require("../models/User");
const generateTokens = require("../utils/generateToken");
const logger = require("../utils/logger");
const { validationRegisteration, validationLogin } = require("../utils/validation");

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

const login = async (req, res) => {
    logger.info('login endpoint hit')
    try {
        const { error } = validationLogin(req.body)
        if (error) {
            logger.warn('validation error', error.details[0].message)
            return res.status(400).json({ success: false, message: error.details[0].message })
        }

        const { email, password } = req.body

        let user = await User.findOne({ email })

        if (!user) {
            logger.warn('user not found')
            return res.status(400).json({ success: false, message: 'user not found' })
        }

        // password validation
        const validPassword = await user.comparePassword(password)

        if (!validPassword) {
            logger.warn('invalid password')
            return res.status(400).json({ success: false, message: 'invalid password' })
        }

        const { accessToken, refreshToken } = await generateTokens(user)

        return res.status(200).json({
            success: true,
            message: 'user logged in successfully',
            accessToken,
            refreshToken,
            userId: user._id
        })
    } catch (error) {
        logger.error(error.message)
        return res.status(500).json({ success: false, message: 'internal server error' })
    }
}

const refreshTokenUser = async (req, res) => {
    logger.info('refresh token endpoint hit')
    try {
        const { refreshToken } = req.body

        if (!refreshToken) {
            logger.warn('refresh token not found')
            return res.status(400).json({ success: false, message: 'refresh token not found' })
        }

        const storedToken = await RefreshToken.findOne({ token: refreshToken })

        if (!storedToken || storedToken.expiresAt < new Date()) {
            logger.warn('refresh token not found or expired')
            return res.status(400).json({ success: false, message: 'refresh token not found or expired' })
        }

        const user = await User.findById(storedToken.userId)

        if (!user) {
            logger.warn('user not found')
            return res.status(400).json({ success: false, message: 'user not found' })
        }

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generateTokens(user)

        // deleting the old refresh Token
        await RefreshToken.findByIdAndDelete(storedToken._id)

        return res.status(200).json({
            success: true,
            message: 'user logged in successfully',
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            userId: user._id
        })
    } catch (error) {
        logger.error(error.message)
        return res.status(500).json({ success: false, message: 'internal server error' })
    }
}

const logout = async (req, res) => {
    logger.info('logout endpoint hit')
    try {
        const { refreshToken } = req.body

        if (!refreshToken) {
            logger.warn('refresh token not found')
            return res.status(400).json({ success: false, message: 'refresh token not found' })
        }

        const storedToken = await RefreshToken.findOne({ token: refreshToken })

        if (!storedToken || storedToken.expiresAt < new Date()) {
            logger.warn('refresh token not found or expired')
            return res.status(400).json({ success: false, message: 'refresh token not found or expired' })
        }

        // deleting the refresh token
        await RefreshToken.findByIdAndDelete(storedToken._id)

        logger.info('user logged out successfully')
        return res.status(200).json({ success: true, message: 'user logged out successfully' })
    } catch (error) {
        logger.error(error.message)
        return res.status(500).json({ success: false, message: 'internal server error' })
    }
}
module.exports = { registerUser, login, logout, refreshTokenUser }