const Post = require("../models/post")
const logger = require("../utils/logger")
const { publishEvent } = require("../utils/rabbitmq")
const { validationPost } = require("../utils/validation")

async function invalidatePostCache(req, input) {

    const cachedKey = `post:${input}`
    await req.redisClient.del(cachedKey)

    const keys = await req.redisClient.keys('posts:*')

    if (keys.length > 0) {
        await req.redisClient.del(keys)
    }
}

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

        await invalidatePostCache(req, newlyCreatedPost._id.toString())

        return res.status(201).json({ success: true, message: 'post created successfully', post: newlyCreatedPost })

    } catch (error) {
        logger.error(error.message)
        return res.status(500).json({ success: false, message: 'internal server error' })
    }
}

const getAllPosts = async (req, res) => {
    logger.info('get all posts endpoint hit')

    try {
        const page = req.query.page || 1
        const limit = req.query.limit || 10
        const startingIndex = (page - 1) * limit

        const cacheKey = `posts:${page}:${limit}`
        const cachedPosts = await req.redisClient.get(cacheKey)

        if (cachedPosts) {
            return res.status(200).json({ success: true, message: 'posts fetched successfully', posts: JSON.parse(cachedPosts) })
        }

        const posts = await Post.find({}).skip(startingIndex).limit(limit).sort({ createdAt: -1 })
        const totalNoOfPosts = await Post.countDocuments()

        const result = {
            posts: allPosts,
            totalPosts: totalNoOfPosts,
            currentPage: page,
            totalPages: Math.ceil(totalNoOfPosts / limit)
        }

        // save the data in the cache
        await req.redisClient.setex(cacheKey, 300, JSON.stringify(result))

        res.status(200).json({ success: true, message: 'posts fetched successfully', posts: result })

    } catch (error) {
        logger.error(error.message)
        return res.status(500).json({ success: false, message: 'internal server error' })
    }
}

const getPost = async (req, res) => {
    logger.info('get post endpoint hit')

    const id = req.params.id

    try {
        const cacheKey = `post:${id}`
        const cachedPost = await req.redisClient.get(cacheKey)

        if (cachedPost) {
            return res.status(200).json(
                {
                    success: true,
                    message: 'post fetched successfully',
                    post: JSON.parse(cachedPost)
                })
        }

        const post = await Post.findById(id)

        if (!post) {
            return res.status(404).json({ success: false, message: 'post not found' })
        }

        // save the data in the cache
        await req.redisClient.setex(cacheKey, 300, JSON.stringify(post))

        res.status(200).json({ success: true, message: 'post fetched successfully', post })


    } catch (error) {
        logger.error(error.message)
        return res.status(500).json({ success: false, message: 'internal server error' })
    }
}

const deletePost = async (req, res) => {
    logger.info('delete post endpoint hit')

    const id = req.params.id

    try {
        const deletedPost = await Post.findOneAndDelete({ _id: id, user: req.user.userId })

        if (!deletedPost) {
            return res.status(404).json({ success: false, message: 'post not found' })
        }

        await invalidatePostCache(req, id)

        res.status(200).json({ success: true, message: 'post deleted successfully', post: deletedPost })

        // publish post delete method event to media service using rabbitmq
        await publishEvent('post.deleted', {
            postId: id,
            userId: req.user.userId,
            mediaIds: deletedPost.mediaIds
        })

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