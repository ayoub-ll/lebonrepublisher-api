const auth = require('./auth');

(async () => {
    var tokenn = await auth.main(process.env.lbc_username, process.env.lbc_password).then((value) => {
        console.log(value);
      });

      
  })();