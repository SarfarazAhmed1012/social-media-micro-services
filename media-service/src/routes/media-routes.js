const express = require('express')
const multer = require('multer')
const { authenticateRequest } = require('../middlewares/authMiddleware')
const logger = require('../utils/logger')
const { uploadMedia, getAllMedia } = require('../controllers/media-controller')

const router = express.Router()

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
}).single('file')

router.post('/upload', authenticateRequest,
    (req, res, next) => {
        upload(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                logger.error(err.message)
                return res.status(400).json({ success: false, message: err.message, stack: err.stack })
            } else if (err) {
                logger.error(err.message)
                return res.status(500).json({ success: false, message: 'Multer error', stack: err.stack })
            }

            next()
        })
    }, uploadMedia)

router.get('/get-all-media', authenticateRequest, getAllMedia)
module.exports = router