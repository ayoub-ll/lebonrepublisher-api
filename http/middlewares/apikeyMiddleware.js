var apiKeyMiddleware = function (req, res, next) {
    if (req.headers.apikey != process.env.APIKEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

module.exports = {
	apiKeyMiddleware: apiKeyMiddleware
}
