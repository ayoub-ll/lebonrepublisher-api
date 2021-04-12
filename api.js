const express = require('express')
const auth = require('./services/auth');
const config = require('config');
const app = express()
const port = 3000

app.use(express.json())

// auth middleware: check auth api-key 
app.use(function(req, res, next) {
  if (!req.headers.apikey || req.headers.apikey != config.get('apikey')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

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

  if (!token) {
    res.status(500).json({ error: 'Token null' })
    res.send()
  }

  res.status(200)
  res.send(token)
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})