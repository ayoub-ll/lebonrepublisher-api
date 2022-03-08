const axios = require('axios')
const randomUseragent = require('random-useragent')
const {getFreshDatadomeCookie} = require("../utils/cookie");

function getAds(token, userAgent, cookiesWithoutDatadome) {
    const content = {
        filters: {},
        context: "default",
        limit: 30,
        offset: 0,
        sort_by: "date",
        sort_order: "desc",
        include_inactive: true,
        pivot: null
    }

    return new Promise(async (resolve, reject) => {
            axios
                .post('https://api.leboncoin.fr/api/dashboard/v1/search', content,
                    {
                        headers: {
                            'content-type': 'application/json',
                            'authority': 'api.leboncoin.fr',
                            'accept': '*/*',
                            'accept-encoding': 'gzip, deflate, br',
                            'authorization': 'Bearer ' + token,
                            'user-agent': userAgent,
                            'sec-gpc': 1,
                            'content-length': JSON.stringify(content).length,
                            'cookie': cookiesWithoutDatadome + await getFreshDatadomeCookie(),
                            'origin': 'https://www.leboncoin.fr',
                            'sec-fetch-site': 'same-site',
                            'sec-fetch-mode': 'cors',
                            'sec-fetch-dest': 'empty',
                            'referer': 'https://www.leboncoin.fr/compte/part/mes-annonces',
                            'accept-language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
                        }
                    })
                .then(function (response) {
                    resolve(response.data.ads)
                })
                .catch(function (e) {
                    if (e.response) {
                        console.log('getAds error HTTP STATUS: ', e.response.status)
                    }
                    reject()
                })
        }
    )
}

module.exports = {
  getAds: getAds,
}
