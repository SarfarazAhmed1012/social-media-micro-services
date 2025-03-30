const express = require('express')
const { authenticateRequest } = require('../middlewares/authMiddleware')
const { createPost } = require('../controllers/post-controller')

const router = express.Router()

router.use(authenticateRequest)

router.post('/create-post', createPost)

module.exports = router