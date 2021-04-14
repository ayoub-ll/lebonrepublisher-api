const dotenv = require('dotenv').config()
const express = require('express')
const auth = require('../services/authService');
const apikeyMiddleware = require('./middlewares/apikeyMiddleware');
const app = express()
const port = 3000

app.use(express.json())

// auth middleware: check auth api-key 
app.use(apikeyMiddleware.apiKeyMiddleware);

/**
 * POST /auth
 * 
 * get bearer token LBC from LBC email & password
 */
app.post('/auth', async (req, res) => {
  let email = await req.body.email
  let password = await req.body.password

  if (!email || !password) {
    res.status(401).json({ error: 'Account not found' })
    res.send()
  }

  const { token, accountId } = await auth.getToken(email, password).then((result) => {
    return result
  });
  
  console.log("token: ", token)

  if (!token) {
    res.status(500).json({ error: 'Token null' })
    res.send()
  }

  res.status(200)
  res.send(token)
})

app.listen(port, () => {
  console.log(`LBP API listening at http://localhost:${port}`)
})