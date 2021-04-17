const auth = require('./authService')
const axios = require('axios')

function getAds(token, accountId) {
  axios
    .post('https://api.leboncoin.fr/api/stats/proxy/v2/account/classifieds/analysis/list', {
      AccountId: accountId,
      Filters: {
        Categories: [],
        Keywords: "",
        State: null
      },
      Format: "",
      Limit: 100,
      Page: 1,
      SortOrder: "Desc",
      SortParam: "LastToplistTime",
    },
    {
      headers: {
        'content-type': 'application/json;charset=UTF-8',
        'authority': 'api.leboncoin.fr',
        'authorization': token,
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.86 Safari/537.36',
        'sec-gpc': 1,
        'origin': 'https://www.leboncoin.fr',
        'sec-fetch-site': 'same-site',
        'sec-fetch-mode': 'cors',
        'sec-fetch-dest': 'empty',
        'referer': 'https://www.leboncoin.fr/',
        'accept-language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    })
    .then(function (response) {
      console.log("response: ", response.data.Ads[0])
    })
    .catch(function (error) {
      console.log(error)
    })
}

module.exports = {
  getAds: getAds,
}
