const express = require('express')
const { registerUser, login, logout, refreshTokenUser } = require('../controllers/identity-controller')
const router = express.Router()

router.post('/register', registerUser)
router.post('/login', login)
router.post('/logout', logout)
router.post('/refresh-token', refreshTokenUser)

module.exports = router