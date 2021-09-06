const dotenv = require('dotenv').config()
const express = require('express')
const auth = require('../services/authService')
const authh = require('../services/authhservice')
const getAdsService = require('../services/getAdsService')
const republishAdService = require('../services/republishAdsService')
const mainMiddlewares = require('./middlewares/mainMiddlewares')
const app = express()

app.use(express.json())
app.use(clientErrorHandler)

app.get('/ping', (req, res) => {
    res.status(200).json({msg: 'pong'})
})

// auth middleware: check auth api-key
app.use(mainMiddlewares.apiKeyMiddleware)

/**
 * POST /auth
 *
 * get bearer token LBC from LBC email & password
 */
app.post('/auth', (req, res) => {
    let email = req.body.email
    let password = req.body.password

    if (!req) {
        console.error('[ERROR]: Req null in api.js')
        res.status(500).json({error: 'Req null'})
        res.send()
        res.end()
    }

    if (!email || !password) {
        console.error('[ERROR]: Email or password not found in request')
        res.status(401).json({error: 'Email or password not found in request'})
        res.send()
    }

    auth.getToken(email, password)
        .then((result) => {
            if (result === 404) {
                console.error('Account not found. Token promise timeout')
                res.status(404).json({error: 'Account not found'})
                res.send()
            } else {
                console.info('api.js SUCCESS: authService result not null')
                const token = result.token
                const cookie = result.cookie
                const accountId = result.accountId

                if (!token) {
                    res.status(500).json({error: 'Token null'})
                    res.send()
                } else {
                    res.status(200)
                    res.send({token, cookie, accountId})
                }
            }
        })
        .catch((e) => {
            console.error("getToken error: ", e)
            res.status(500).json({error: 'serv error'})
            res.send()
            process.exit()
        })
})

/**
 * POST /authh
 *
 * get bearer token LBC from LBC email & password
 */
app.post('/authh', (req, res) => {
    let email = req.body.email
    let password = req.body.password

    if (!req) {
        console.error('[ERROR]: Req null in api.js')
        res.status(500).json({error: 'Req null'})
        res.send()
        res.end()
    }

    if (!email || !password) {
        console.error('[ERROR]: Email or password not found in request')
        res.status(401).json({error: 'Email or password not found in request'})
        res.send()
    }

    authh.getToken(email, password)
        .then((result) => {
            if (result === 404) {
                console.error('Account not found. Token promise timeout')
                res.status(404).json({error: 'Account not found'})
                res.send()
            } else {
                console.info('api.js SUCCESS: authService result not null')
                const token = result.token

                const cookies = result.cookies
                const accountId = result.accountId

                if (!token) {
                    res.status(500).json({error: 'Token null'})
                    res.send()
                } else {
                    res.status(200)
                    res.send({token, cookies, accountId})
                }
            }
        })
        .catch((e) => {
            console.error("getToken error: ", e)
            res.status(500).json({error: 'serv error'})
            res.send()
            process.exit()
        })
})


/**
 * POST /getAds
 *
 * get ads from LBC
 *
 * need:
 * - accountId
 * - token
 */
app.post('/getAds', mainMiddlewares.tokenMiddleware, async (req, res) => {
    let accountId = await req.body.accountId
    let token = await req.body.token

    if (!accountId) {
        res.status(400).json({error: 'accountId not found'})
        res.send()
    }

    await getAdsService.getAds(token, accountId)
        .then((result) => {
            res.status(200)
            res.send(result)
        })
        .catch((e) => {
            res.status(500)
            res.send()
            process.exit()
        })
})

/**
 * POST /republishAds
 *
 * republish ads to LBC
 *
 * need:
 * - ads (array)
 * - token
 */
app.post('/republishAds', mainMiddlewares.tokenMiddleware, async (req, res) => {
    let adsIds = await req.body.adsIds
    let cookie = await req.body.cookie

    if (!adsIds) {
        res.status(400).json({error: 'adsIds not found'})
        res.send()
    }

    if (!cookie) {
        res.status(400).json({error: 'cookie not found'})
        res.send()
    }

    await republishAdService.republishAds(req.body.token, adsIds, cookie)
        .then((result) => {
            res.status(200)
            res.send(result)
        })
        .catch((error) => {
            res.status(500)
            res.send(error)
            process.exit()
        })
})

app.listen(process.env.PORT || 3000, () => {
    console.log(`LBP API listening at http://localhost:`, process.env.PORT)
})

function clientErrorHandler (err, req, res, next) {
    if (req.xhr) {
        res.status(500).send({ error: 'Something failed!' })
    } else {
        next(err)
    }
}