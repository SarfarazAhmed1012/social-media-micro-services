const Joi = require('joi')

const validationPost = (data) => {
    const schema = Joi.object({
        content: Joi.string().min(5).max(5000).required(),
        mediaIds: Joi.array().items(Joi.string())
    })

    return schema.validate(data)
}

module.exports = { validationPost }