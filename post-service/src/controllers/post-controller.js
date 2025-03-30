const Post = require("../models/post")
const logger = require("../utils/logger")
const { validationPost } = require("../utils/validation")

const createPost = async (req, res) => {
    logger.info('create post endpoint hit')

    try {
        const { content, mediaIds } = req.body

        const { error } = validationPost(req.body)
        if (error) {
            logger.warn('validation error', error.details[0].message)
            return res.status(400).json({ success: false, message: error.details[0].message })
        }
        const newlyCreatedPost = new Post({
            user: req.user.userId,
            content,
            mediaIds: mediaIds || []
        })

        await newlyCreatedPost.save()

        return res.status(201).json({ success: true, message: 'post created successfully', post: newlyCreatedPost })

    } catch (error) {
        logger.error(error.message)
        return res.status(500).json({ success: false, message: 'internal server error' })
    }
}

const getAllPosts = async (req, res) => {
    logger.info('get all posts endpoint hit')

    try {

    } catch (error) {
        logger.error(error.message)
        return res.status(500).json({ success: false, message: 'internal server error' })
    }
}

const getPost = async (req, res) => {
    logger.info('get post endpoint hit')

    try {

    } catch (error) {
        logger.error(error.message)
        return res.status(500).json({ success: false, message: 'internal server error' })
    }
}

const deletePost = async (req, res) => {
    logger.info('delete post endpoint hit')

    try {

    } catch (error) {
        logger.error(error.message)
        return res.status(500).json({ success: false, message: 'internal server error' })
    }
}

module.exports = {
    createPost,
    getAllPosts,
    getPost,
    deletePost
}