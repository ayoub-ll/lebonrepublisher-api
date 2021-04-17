const dotenv = require('dotenv').config()
const express = require('express')
const auth = require('../services/authService')
const getAdsService = require('../services/getAdsService')
const apikeyMiddleware = require('./middlewares/apikeyMiddleware')
const app = express()
const port = 3000

app.use(express.json())

// auth middleware: check auth api-key
app.use(apikeyMiddleware.apiKeyMiddleware)

/**
 * POST /auth
 *
 * get bearer token LBC from LBC email & password
 */
app.post('/auth', async (req, res) => {
  let email = await req.body.email
  let password = await req.body.password

  if (!email || !password) {
    res.status(401).json({ error: 'Email or password not found in request' })
    res.send()
  }

  await auth.getToken(email, password).then((result) => {
    if (result == 404) {
      console.log('Account not found. Token promise timeout 30sec')
      res.status(404).json({ error: 'Account not found' })
      res.send()
    } else {
      const token = result.token
      const accountId = result.accountId

      console.log('token: ', token)
      console.log('accountId: ', accountId)

      if (!token) {
        res.status(500).json({ error: 'Token null' })
        res.send()
      } else {
        res.status(200)
        res.send({ token, accountId })
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
app.post('/getAds', async (req, res) => {
  let accountId = await req.body.accountId
  let token = await req.body.token

  if (!accountId) {
    res.status(400).json({ error: 'accountId not found' })
    res.send()
  }

  if (!token) {
    res.status(401).json({ error: 'token not found' })
    res.send()
  }

  const ads = await getAdsService.getAds(token, accountId)

  /*.then((result) => {
    return result
  });*/

  res.status(200)
  res.send(ads)
})

app.listen(port, () => {
  console.log(`LBP API listening at http://localhost:${port}`)
})
