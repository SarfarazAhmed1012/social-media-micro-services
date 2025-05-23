const logger = require("./logger");

const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadMediaToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({
            resource_type: "auto"
        },
            (error, result) => {
                if (error) {
                    logger.error("Error while uploading to cloudinary", error)
                    reject(error)
                } else {
                    resolve(result)
                }
            }
        )
        uploadStream.end(file.buffer)
    })
}

const deleteMediaFromCloudinary = (publicId) => {
    try {
        const result = cloudinary.uploader.destroy(publicId)
        logger.info("Successfully deleted from cloudinary", result)

        return result
    } catch (error) {
        logger.error("Error while deleting from cloudinary", error)
        throw error
    }
}

module.exports = { uploadMediaToCloudinary, deleteMediaFromCloudinary }