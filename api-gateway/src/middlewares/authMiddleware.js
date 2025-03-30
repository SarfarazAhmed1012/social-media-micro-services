const jwt = require("jsonwebtoken")

const validateToken = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
        return res.status(401).json({ success: false, message: 'Authorization required!' })
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log(err)
            return res.status(403).json({ success: false, message: 'Invalid token!' })
        }

        req.user = user
        next()
    })
}

module.exports = { validateToken }