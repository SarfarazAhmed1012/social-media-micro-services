const express = require('express')
const { authenticateRequest } = require('../middlewares/authMiddleware')
const { createPost, getAllPosts, getPost, deletePost } = require('../controllers/post-controller')

const router = express.Router()

router.use(authenticateRequest)

router.post('/create-post', createPost)
router.get('/get-all-posts', getAllPosts)
router.get('/get-post/:id', getPost)
router.delete('/delete-post/:id', deletePost)

module.exports = router