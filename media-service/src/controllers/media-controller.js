const Media = require("../models/Media")
const { uploadMediaToCloudinary } = require("../utils/cloudinary")
const logger = require("../utils/logger")

const uploadMedia = async (req, res) => {
    logger.info("uploadMedia called")

    try {
        const file = req.file

        if (!file) {
            logger.warn("No file uploaded")
            return res.status(400).json({ success: false, message: 'No file uploaded' })
        }

        console.log({ file })
        const { originalname, mimetype, size, buffer } = file
        logger.info(`File uploading started: ${originalname}, type: ${mimetype}`)

        const result = await uploadMediaToCloudinary(file)

        logger.info(`File uploaded: ${result.public_id}`)

        const newMedia = new Media({
            publicId: result.public_id,
            url: result.secure_url,
            mimeType: mimetype,
            originalName: originalname,
            userId: req.user.userId
        })

        await newMedia.save()

        res.status(200).send({
            success: true,
            mediaId: newMedia._id,
            url: result.secure_url,
            message: "File uploaded successfully"
        })
    }
    catch (error) {
        logger.error(error.message)
        return res.status(500).json({ success: false, message: 'internal server error' })
    }
}

const getAllMedia = async (req, res) => {
    logger.info("getAllMedia called")

    try {
        const media = await Media.find()

        res.status(200).send({
            success: true,
            media,
            message: "Media fetched successfully"
        })
    }
    catch (error) {
        logger.error(error.message)
        return res.status(500).json({ success: false, message: 'internal server error' })
    }
}

module.exports = { uploadMedia, getAllMedia }