const auth = require('./auth');
const config = require('config');

(async () => {
    const {token, accountId} = await auth.main(config.get('lbc_username'), config.get('lbc_password')).then((result) => {
        console.log("result ", result)
        return result
      });
    
    request(token, accountId)
  })();

function request(token, accountId) {
    console.log("getAds REQUEST")

    const https = require('https')
    const options = {
    hostname: 'api.leboncoin.fr',
    port: 443,
    path: '/api/stats/proxy/v2/account/classifieds/analysis/list',
    method: 'POST',
    headers: {
        'content-type': 'application/json;charset=UTF-8',
        'authority': 'api.leboncoin.fr',
        'authorization': token,
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.86 Safari/537.36',
        'sec-gpc': 1,
        'origin': 'https://www.leboncoin.fr',
        'sec-fetch-site': 'same-site',
        'sec-fetch-mode': 'cors',
        'sec-fetch-dest': 'empty',
        'referer': 'https://www.leboncoin.fr/',
        'accept-language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    }

    const req = https.request(options, res => {
    console.log(`getAds request statusCode: ${res.statusCode}`)

    res.on('data', d => {
        process.stdout.write(d) 
    })
    })

    req.on('error', error => {
    console.error("getAds request error: ", error)
    })

    req.end('{"AccountId":"' + accountId + '","Filters":{"Categories":[],"Keywords":"","State":null},"Format":"","Limit":100,"Page":1,"SortOrder":"Desc","SortParam":"LastToplistTime"}')
}