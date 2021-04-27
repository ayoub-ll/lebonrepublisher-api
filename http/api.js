const dotenv = require('dotenv').config()
const express = require('express')
const auth = require('../services/authService')
const getAdsService = require('../services/getAdsService')
const republishAdService = require('../services/republishAdsService')
const mainMiddlewares = require('./middlewares/mainMiddlewares')
const app = express()
const port = 3000

app.use(express.json())

// auth middleware: check auth api-key
app.use(mainMiddlewares.apiKeyMiddleware)

/**
 * POST /auth
 *
 * get bearer token LBC from LBC email & password
 */
app.post('/auth', async (req, res) => {
    let email = await req.body.email
    let password = await req.body.password

    if (!email || !password) {
        res.status(401).json({error: 'Email or password not found in request'})
        res.send()
    }

    await auth.getToken(email, password).then((result) => {
        if (result == 404) {
            console.log('Account not found. Token promise timeout')
            res.status(404).json({error: 'Account not found'})
            res.send()
        } else {
            const token = result.token
            const accountId = result.accountId

            console.log('token: ', token)
            console.log('accountId: ', accountId)

            if (!token) {
                res.status(500).json({error: 'Token null'})
                res.send()
            } else {
                res.status(200)
                res.send({token, accountId})
            }
        }
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
        .catch((error) => {
            res.status(500)
            res.send()
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

    if (!adsIds) {
        res.status(400).json({error: 'adsIds not found'})
        res.send()
    }

    await republishAdService.republishAds(req.body.token, adsIds)
        .then((result) => {
            res.status(200)
            res.send(result)
        })
        .catch((error) => {
            res.status(500)
            res.send(error)
        })
})

app.listen(port, () => {
    console.log(`LBP API listening at http://localhost:${port}`)
})
