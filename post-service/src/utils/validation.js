const Joi = require('joi')

const validationPost = (data) => {
    const schema = Joi.object({
        content: Joi.string().min(5).max(5000).required()
    })

    return schema.validate(data)
}

module.exports = { validationPost }