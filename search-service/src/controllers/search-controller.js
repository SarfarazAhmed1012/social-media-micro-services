const Search = require("../models/Search");
const logger = require("../utils/logger");

const searchPost = async (req, res) => {
    try {
        const { query } = req.query

        const cacheKey = `search:${query}`
        const cachedResults = await req.redisClient.get(cacheKey)

        if (cachedResults) {
            return res.status(200).json({ success: true, results: JSON.parse(cachedResults) })
        }


        const results = await Search.find(
            {
                $text: {
                    $search: query
                }
            },
            {
                score: {
                    $meta: "textScore"
                }
            }
        ).sort({ score: { $meta: "textScore" } }).limit(10)

        // save the data in the cache
        await req.redisClient.setex(cacheKey, 500, JSON.stringify(results))

        res.status(200).json({ success: true, results })
    } catch (error) {
        logger.error(error.message)
        return res.status(500).json({ success: false, message: 'internal server error' })
    }
}

module.exports = { searchPost }