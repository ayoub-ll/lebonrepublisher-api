const auth = require('./auth');

(async () => {
    var token = await auth.main();

    await console.log(token);
  })();