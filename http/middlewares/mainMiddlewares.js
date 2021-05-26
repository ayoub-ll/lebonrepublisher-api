const mainMiddlewares = function (req, res, next) {
    if (req.headers.apikey != process.env.APIKEY) {
        return res.status(401).json({error: 'Unauthorized'});
    }
    next();
}

const tokenMiddleware = function (req, res, next) {
    if (!req) {
        console.error('[ERROR]: Req null in tokenMiddleware')
        res.status(500).json({error: 'Req null'})
        res.send()
        res.end()
    }

    if (!req.body.token) {
        res.status(401).json({error: 'token not found in body request'})
        res.send()
        res.end()
    }
    next()
};

module.exports = {
	apiKeyMiddleware: mainMiddlewares,
    tokenMiddleware: tokenMiddleware
}
