const Joi = require('joi')

const validationRegisteration = (data) => {
    const schema = Joi.object({
        username: Joi.string().min(3).max(30).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required()
    })

    return schema.validate(data)
}
const validationLogin = (data) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required()
    })

    return schema.validate(data)
}

module.exports = { validationRegisteration, validationLogin }