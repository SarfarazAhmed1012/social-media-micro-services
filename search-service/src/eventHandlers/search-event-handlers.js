const Search = require("../models/Search")
const logger = require("../utils/logger")

const handlePostCreated = async (data) => {
    console.log('post created event received', data)

    const { postId, userId, content } = data

    try {
        const search = new Search({
            postId,
            userId,
            content
        })

        await search.save()

        logger.info(`Post created: ${postId}, userId: ${userId}`)
    } catch (error) {
        logger.error(error.message)
    }
}

const handlePostDeleted = async (data) => {
    console.log('post deleted event received', data)

    const { postId, userId } = data

    try {
        await Search.deleteOne({ postId, userId })

        logger.info(`Post deleted: ${postId}, userId: ${userId}`)
    } catch (error) {
        logger.error(error.message)
    }
}

module.exports = { handlePostCreated, handlePostDeleted }