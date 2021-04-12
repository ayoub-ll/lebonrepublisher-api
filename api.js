const express = require('express')
const auth = require('./services/auth');
const config = require('config');
const app = express()
const port = 3000

app.use(express.json())

app.post('/auth', (req, res) => {
  let email = req.body.email
  let password = req.body.password

  if (email == null || password == null ) {
    res.status(401).json({ error: 'Account not found' })
    res.send()
  }

  const { token, accountId } = auth.getToken(config.get('lbc_username'), config.get('lbc_password')).then((result) => {
    return result
  });

  console.log(token)

  res.send(token)
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})