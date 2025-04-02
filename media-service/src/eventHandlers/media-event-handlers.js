const Media = require("../models/Media")
const { deleteMediaFromCloudinary } = require("../utils/cloudinary")
const logger = require("../utils/logger")

const handlePostDeleted = async (data) => {
    console.log('post deleted event received', data)

    const { postId, userId, mediaIds } = data

    try {
        const deletedMedia = await Media.find({ _id: { $in: mediaIds } })

        if (deletedMedia.length > 0) {
            for (const media of deletedMedia) {
                await deleteMediaFromCloudinary(media.publicId)
                await Media.findByIdAndDelete(media._id)

                logger.info(`Media deleted: ${media.publicId}, postId: ${postId}, userId: ${userId}`)
            }
        }

        logger.info(`Post deleted: ${postId}, userId: ${userId}`)
    } catch (error) {
        logger.error(error.message)
    }
}

module.exports = { handlePostDeleted }