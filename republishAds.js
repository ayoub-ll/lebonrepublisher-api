const auth = require('./auth');
const config = require('config');

(async () => {
    var tokenn = await auth.main(config.get('lbc_username'), config.get('lbc_password')).then((value) => {
        console.log(value);
      });
  })();