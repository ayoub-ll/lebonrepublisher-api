const randomUseragent = require('random-useragent')
const axios = require('axios')
const axiosRetry = require('axios-retry')

/*
axiosRetry(axios, {
    retries: 3, // number of retries
    retryDelay: (retryCount) => {
        console.log(`retry attempt: ${retryCount}`);
        return 1000; // time interval between retries
    },
    retryCondition: (_error) => true
});
 */

const {v4: uuidv4} = require('uuid')
const jsdom = require("jsdom")
const {JSDOM} = jsdom

//const HttpsProxyAgent = require("https-proxy-agent")
//const httpsAgent = new HttpsProxyAgent({host: "server.proxyland.io", port: "9090", auth: "HRcGoXHpUXiBlMPGorTCGdCal:jKBIQMqXXAoKaHGsTxKBcUOCD", rejectUnauthorized: false})
//const httpAgent = new HttpsProxyAgent({host: "server.proxyland.io", port: "9090", auth: "HRcGoXHpUXiBlMPGorTCGdCal:jKBIQMqXXAoKaHGsTxKBcUOCD", rejectUnauthorized: false})
//axios = axios.create({httpsAgent: httpsAgent, httpAgent: httpAgent, proxy: false})

async function main(username, password) {
    const stateId = await uuidv4()
    const userAgent = randomUseragent.getRandom(function (ua) {
        return parseFloat(ua.browserVersion) >= 20;
    })

    let {
        cookieSecureLogin,
        cookieSecureLoginLax
    } = await loginRequest(username, password, stateId, userAgent)

    const [temporaryToken, cookiesWithoutDatadome ]= await apiAuthorizeRequest(stateId, cookieSecureLogin, cookieSecureLoginLax, userAgent)

    const {token, referer} = await tokenRequest(stateId, temporaryToken, userAgent)

    const {accountId, cookies} = await personalDataRequest(token, userAgent, referer, cookiesWithoutDatadome)

    console.log('accountId: ', accountId)
    /*
    const temporaryToken = await apiAuthorizeRequest(stateId, freshDatadomeCookie)
    const {token, cookieDatadome3} = await tokenRequest(stateId, temporaryToken)
    const {accountId, cookieDatadome4, cookies} = await personalDataRequest(cookieSecureInstall, cookieDatadome3, token)
*/
    return Promise.all([
        token,
        accountId,
        cookies
    ])
        .then((values) => {
            return {token, accountId, cookies}
        })
        .catch((reason) => {
            console.log('AUTHH ERROR: ', reason)
            throw reason
        })
}

function getFreshDatadomeCookie() {
    return new Promise((resolve, reject) =>
        axios
            .get('http://f51340b.online-server.cloud/cookie')
            .then(function (response) {
                resolve(response.data.datadome)
            })
            .catch(function (e) {
                if (e.response) {
                    console.log('getFreshDatadomeCookie error HTTP STATUS: ', e.response.status)
                }
                reject()
            })
    )
}

function loginRequest(username, password, stateId, userAgent) {
    return new Promise(async (resolve, reject) =>
        axios
            .post('https://auth.leboncoin.fr/api/authenticator/v1/users/login', {
                    email: username,
                    password: password,
                    redirect_uri: "https://auth.leboncoin.fr/api/authorizer/v2/authorize?client_id=lbc-front-web&redirect_uri=https%3A%2F%2Fwww.leboncoin.fr%2Fnextoauth2callback&response_type=code&scope=%2A+offline&state=" + stateId,
                    client_id: "lbc-front-web",
                    from_to: "https://www.leboncoin.fr/"
                },
                {
                    headers: {
                        'authority': 'auth.leboncoin.fr',
                        "sec-ch-ua": '"Chromium";v="92", " Not A;Brand";v="99", "Google Chrome";v="92"',
                        'accept': 'en-GB,en-US;q=0.9,en;q=0.8,fr;q=0.7',
                        'sec-ch-ua-mobile': '?0',
                        'user-agent': userAgent,
                        'content-type': 'application/json',
                        'origin': 'https://auth.leboncoin.fr',
                        'sec-fetch-site': 'same-origin',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-dest': 'empty',
                        'referer': 'https://auth.leboncoin.fr/login/?client_id=lbc-front-web&error=login_required&error_debug=session+token+is+not+found+or+expired&error_description=you+should+login+first%2C+the+__Secure-login+cookie+is+not+found.&error_hint=you+should+login+first%2C+you+can+follow+this+url+https%3A%2F%2Fauth.leboncoin.fr%2Flogin%2F%3Fclient_id%3Dlbc-front-web%26from_to%3Dhttps%253A%252F%252Fwww.leboncoin.fr%252F%26redirect_uri%3Dhttps%253A%252F%252Fauth.leboncoin.fr%252Fapi%252Fauthorizer%252Fv2%252Fauthorize%253Fclient_id%253Dlbc-front-web%2526redirect_uri%253Dhttps%25253A%25252F%25252Fwww.leboncoin.fr%25252Fnextoauth2callback%2526response_type%253Dcode%2526scope%253D%25252A%252Boffline%2526state%253D' + stateId + '+to+retrieve+__Secure-login+cookie&from_to=https%3A%2F%2Fwww.leboncoin.fr%2F&redirect_uri=https%3A%2F%2Fauth.leboncoin.fr%2Fapi%2Fauthorizer%2Fv2%2Fauthorize%3Fclient_id%3Dlbc-front-web%26redirect_uri%3Dhttps%253A%252F%252Fwww.leboncoin.fr%252Fnextoauth2callback%26response_type%3Dcode%26scope%3D%252A%2Boffline%26state%3D' + stateId,
                        'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8,fr;q=0.7',
                        'cookie': '__Secure-InstanceId=e9d0652a-2815-4f24-af08-d41842a9f7f0; ry_ry-l3b0nco_realytics=eyJpZCI6InJ5XzVCOUI1NkMzLTQxQTEtNDMzNS1CMTlGLTg3QTMyN0FFQUEzNSIsImNpZCI6bnVsbCwiZXhwIjoxNjc3NjkzMTA3MDAzLCJjcyI6bnVsbH0%3D; didomi_token=eyJ1c2VyX2lkIjoiMTdmNDY5YzAtNTIzMy02NzU1LWFmMDYtMzIxMWU3ZWM5ZmU4IiwiY3JlYXRlZCI6IjIwMjItMDMtMDFUMTc6NTE6NTMuMDY5WiIsInVwZGF0ZWQiOiIyMDIyLTAzLTAxVDE3OjUxOjUzLjA2OVoiLCJ2ZW5kb3JzIjp7ImRpc2FibGVkIjpbImdvb2dsZSIsImM6cm9ja3lvdSIsImM6cHVib2NlYW4tYjZCSk10c2UiLCJjOnJ0YXJnZXQtR2VmTVZ5aUMiLCJjOnNjaGlic3RlZC1NUVBYYXF5aCIsImM6Z3JlZW5ob3VzZS1RS2JHQmtzNCIsImM6cmVhbHplaXRnLWI2S0NreHlWIiwiYzpsZW1vbWVkaWEtemJZaHAyUWMiLCJjOnlvcm1lZGlhcy1xbkJXaFF5UyIsImM6c2Fub21hIiwiYzpyYWR2ZXJ0aXMtU0pwYTI1SDgiLCJjOnF3ZXJ0aXplLXpkbmdFMmh4IiwiYzpyZXZsaWZ0ZXItY1JwTW5wNXgiLCJjOnJlc2VhcmNoLW5vdyIsImM6d2hlbmV2ZXJtLThWWWh3YjJQIiwiYzphZG1vdGlvbiIsImM6dGhpcmRwcmVzZS1Tc0t3bUhWSyIsImM6aW50b3dvd2luLXFhenQ1dEdpIiwiYzpkaWRvbWkiLCJjOmpxdWVyeSIsImM6YWItdGFzdHkiLCJjOm1vYmlmeSIsImM6bGJjZnJhbmNlIiwiYzpwb3dlcmxpbmstQTNMZURNRjQiXX0sInB1cnBvc2VzIjp7ImRpc2FibGVkIjpbImV4cGVyaWVuY2V1dGlsaXNhdGV1ciIsIm1lc3VyZWF1ZGllbmNlIiwicGVyc29ubmFsaXNhdGlvbm1hcmtldGluZyIsInBlcnNvbm5hbGlzYXRpb25jb250ZW51IiwicHJpeCJdfSwidmVuZG9yc19saSI6eyJkaXNhYmxlZCI6WyJnb29nbGUiXX0sInZlcnNpb24iOjIsImFjIjoiQUFBQS5BQUFBIn0=; euconsent-v2=CPVJdQAPVJdQAAHABBENCECgAAAAAAAAAAAAAAAAAABigAMAAQRLGAAYAAgiWQAAwABBEsAA.YAAAAAAAAAAA; include_in_experiment=false; __Secure-Install=63d0df27-b270-4d3c-ab84-32b22ecaf979; ry_ry-l3b0nco_so_realytics=eyJpZCI6InJ5XzVCOUI1NkMzLTQxQTEtNDMzNS1CMTlGLTg3QTMyN0FFQUEzNSIsImNpZCI6bnVsbCwib3JpZ2luIjp0cnVlLCJyZWYiOm51bGwsImNvbnQiOm51bGwsIm5zIjpmYWxzZX0%3D; utag_main=v_id:017f469c0416001d25e29b616ddc02078001907000838$_sn:4$_ss:0$_st:1646560693018$_pn:4%3Bexp-session$ses_id:1646558883046%3Bexp-session; datadome=' + await getFreshDatadomeCookie(),
                    }
                })
            .then(function (response) {
                let cookieSecureLogin = ''
                let cookieSecureLoginLax = ''

                console.log('loginRequest: counter of redirections: ', response.request._redirectable._redirectCount)

                response.headers['set-cookie'].forEach((cookies) => {
                    const cookiesObject =
                        Object.fromEntries(cookies.split('; ').map(c => {
                            const [key, ...v] = c.split('=')
                            return [key, v.join('=')]
                        }))

                    if (cookiesObject['__Secure-Login']) {
                        cookieSecureLogin = cookiesObject['__Secure-Login']
                    }

                    if (cookiesObject['__Secure-Login-Lax']) {
                        cookieSecureLoginLax = cookiesObject['__Secure-Login-Lax']
                    }
                })

                resolve({cookieSecureLogin, cookieSecureLoginLax})
            })
            .catch(function (error) {
                console.log("login error: ", error.response.status)
                reject()
            })
    )
}

async function apiAuthorizeRequest(stateId, cookieSecureLogin, cookieSecureLoginLax, userAgent) {
    const cookiesWithoutDatadome = '__Secure-InstanceId=e9d0652a-2815-4f24-af08-d41842a9f7f0; ry_ry-l3b0nco_realytics=eyJpZCI6InJ5XzVCOUI1NkMzLTQxQTEtNDMzNS1CMTlGLTg3QTMyN0FFQUEzNSIsImNpZCI6bnVsbCwiZXhwIjoxNjc3NjkzMTA3MDAzLCJjcyI6bnVsbH0%3D; didomi_token=eyJ1c2VyX2lkIjoiMTdmNDY5YzAtNTIzMy02NzU1LWFmMDYtMzIxMWU3ZWM5ZmU4IiwiY3JlYXRlZCI6IjIwMjItMDMtMDFUMTc6NTE6NTMuMDY5WiIsInVwZGF0ZWQiOiIyMDIyLTAzLTAxVDE3OjUxOjUzLjA2OVoiLCJ2ZW5kb3JzIjp7ImRpc2FibGVkIjpbImdvb2dsZSIsImM6cm9ja3lvdSIsImM6cHVib2NlYW4tYjZCSk10c2UiLCJjOnJ0YXJnZXQtR2VmTVZ5aUMiLCJjOnNjaGlic3RlZC1NUVBYYXF5aCIsImM6Z3JlZW5ob3VzZS1RS2JHQmtzNCIsImM6cmVhbHplaXRnLWI2S0NreHlWIiwiYzpsZW1vbWVkaWEtemJZaHAyUWMiLCJjOnlvcm1lZGlhcy1xbkJXaFF5UyIsImM6c2Fub21hIiwiYzpyYWR2ZXJ0aXMtU0pwYTI1SDgiLCJjOnF3ZXJ0aXplLXpkbmdFMmh4IiwiYzpyZXZsaWZ0ZXItY1JwTW5wNXgiLCJjOnJlc2VhcmNoLW5vdyIsImM6d2hlbmV2ZXJtLThWWWh3YjJQIiwiYzphZG1vdGlvbiIsImM6dGhpcmRwcmVzZS1Tc0t3bUhWSyIsImM6aW50b3dvd2luLXFhenQ1dEdpIiwiYzpkaWRvbWkiLCJjOmpxdWVyeSIsImM6YWItdGFzdHkiLCJjOm1vYmlmeSIsImM6bGJjZnJhbmNlIiwiYzpwb3dlcmxpbmstQTNMZURNRjQiXX0sInB1cnBvc2VzIjp7ImRpc2FibGVkIjpbImV4cGVyaWVuY2V1dGlsaXNhdGV1ciIsIm1lc3VyZWF1ZGllbmNlIiwicGVyc29ubmFsaXNhdGlvbm1hcmtldGluZyIsInBlcnNvbm5hbGlzYXRpb25jb250ZW51IiwicHJpeCJdfSwidmVuZG9yc19saSI6eyJkaXNhYmxlZCI6WyJnb29nbGUiXX0sInZlcnNpb24iOjIsImFjIjoiQUFBQS5BQUFBIn0=; euconsent-v2=CPVJdQAPVJdQAAHABBENCECgAAAAAAAAAAAAAAAAAABigAMAAQRLGAAYAAgiWQAAwABBEsAA.YAAAAAAAAAAA; include_in_experiment=false; __Secure-Install=63d0df27-b270-4d3c-ab84-32b22ecaf979; ry_ry-l3b0nco_so_realytics=eyJpZCI6InJ5XzVCOUI1NkMzLTQxQTEtNDMzNS1CMTlGLTg3QTMyN0FFQUEzNSIsImNpZCI6bnVsbCwib3JpZ2luIjp0cnVlLCJyZWYiOm51bGwsImNvbnQiOm51bGwsIm5zIjpmYWxzZX0%3D; utag_main=v_id:017f469c0416001d25e29b616ddc02078001907000838$_sn:4$_ss:0$_st:1646560693018$_pn:4%3Bexp-session$ses_id:1646558883046%3Bexp-session; __Secure-Login=' + cookieSecureLogin + '; __Secure-Login-Lax=' + cookieSecureLoginLax + '; datadome='

    return new Promise(async (resolve, reject) =>
        axios
            .get('https://auth.leboncoin.fr/api/authorizer/v2/authorize?client_id=lbc-front-web&redirect_uri=https://www.leboncoin.fr/nextoauth2callback&response_type=code&scope=*+offline&state=' + stateId,
                {
                    maxRedirects: 0,
                    headers: {
                        'authority': 'auth.leboncoin.fr',
                        "sec-ch-ua": '"Chromium";v="92", " Not A;Brand";v="99", "Google Chrome";v="92"',
                        'sec-ch-ua-mobile': '?0',
                        'upgrade-insecure-requests': '1',
                        'user-agent': userAgent,
                        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                        'sec-fetch-site': 'same-origin',
                        'sec-fetch-mode': 'navigate',
                        'sec-fetch-user': '?1',
                        'sec-fetch-dest': 'document',
                        'referer': 'https://auth.leboncoin.fr/suggest-phone-number/?client_id=lbc-front-web&login_status=SUGGEST_PHONE_NUMBER&redirect_uri=https%3A%2F%2Fauth.leboncoin.fr%2Fapi%2Fauthorizer%2Fv2%2Fauthorize%3Fclient_id%3Dlbc-front-web%26redirect_uri%3Dhttps%253A%252F%252Fwww.leboncoin.fr%252Fnextoauth2callback%26response_type%3Dcode%26scope%3D%252A%2Boffline%26state%3D' + stateId,
                        'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8,fr;q=0.7',
                        'cookie': cookiesWithoutDatadome + await getFreshDatadomeCookie(),
                    }
                })
            .then(async function (response) {
                console.log('apiAuthorizeRequest: counter of redirections: ', response.request._redirectable._redirectCount)

                const dom = await new JSDOM(await response.data)
                await console.error('dom: ', dom)
                const htmlJsElement = await dom.window.document.querySelector('#__NEXT_DATA__')
                const code = await JSON.parse(await htmlJsElement.text).query.code

                await console.error('then code: ', code)

                await resolve([code, cookiesWithoutDatadome])
            })
            .catch(async function (error) {
                const urlParams = new URLSearchParams(error.response.headers.location)
                const code = await urlParams.get('https://www.leboncoin.fr/nextoauth2callback?code')

                console.error('catch1 code: ', code)

                if (code === undefined || code == null) {
                    reject()
                }

                console.log('catch apiAuthorizeRequest => get previsionalToken from location header')

                resolve([code, cookiesWithoutDatadome])
            })
            .catch(function (error) {
                console.log('apiAuthorizeRequest error:', error)
                reject()
            })
    )
}

function tokenRequest(stateId, temporaryToken, userAgent) {
    const content = "code=" + temporaryToken + "&grant_type=authorization_code&redirect_uri=https%3A%2F%2Fwww.leboncoin.fr%2Fnextoauth2callback&client_id=lbc-front-web"
    const referer = 'https://www.leboncoin.fr/nextoauth2callback?code=' + temporaryToken + '&scope=lbc.auth.email.part.change%20lbcgrp.auth.twofactor.me.%2A%20lbcgrp.auth.twofactor.sms.me.activate%20lbc.escrowaccount.maintenance.read%20beta.lbc.auth.twofactor.me.%2A%20lbc.%2A.me.%2A%20offline%20lbcgrp.auth.session.me.read%20lbclegacy.users%20lbclegacy.part%20lbcgrp.auth.session.me.display%20lbcgrp.auth.session.me.delete%20lbc.%2A.%2A.me.%2A&state=' + stateId

    return new Promise((resolve, reject) =>
        axios
            .post('https://auth.leboncoin.fr/api/authorizer/v1/lbc/token',
                content,
                {
                    headers: {
                        'authority': 'auth.leboncoin.fr',
                        //"sec-ch-ua": '"Chromium";v="92", " Not A;Brand";v="99", "Google Chrome";v="92"',
                        'accept': 'application/json, application/x-www-form-urlencoded',
                        //'sec-ch-ua-mobile': '?0',
                        'user-agent': userAgent,
                        'content-length': content.length,
                        'content-type': 'application/x-www-form-urlencoded',
                        'origin': 'https://www.leboncoin.fr',
                        'sec-fetch-site': 'same-site',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-dest': 'empty',
                        'sec-gpc': 1,
                        'referer': referer,
                        'accept-language': 'fr-FR,fr;q=0.9',
                        'accept-encoding': 'gzip, deflate, br'
                    }
                })
            .then(function (response) {
                const token = response.data.access_token
                resolve({token, referer})
            })
            .catch(function (error) {
                console.log("tokenRequest error: ", error.response.status)
                reject()
            })
    )
}

async function personalDataRequest(token, userAgent, referer, cookiesWithoutDatadome) {
    console.log('referer: ', referer)
    return new Promise(async (resolve, reject) =>
        axios
            .get('https://api.leboncoin.fr/api/accounts/v1/accounts/me/personaldata',
                {
                    headers: {
                        'authority': 'api.leboncoin.fr',
                        'authorization': 'Bearer ' + token,
                        'user-agent': userAgent,
                        'content-type': 'application/json',
                        'accept': '*/*',
                        'sec-gpc': 1,
                        'origin': 'https://www.leboncoin.fr',
                        'sec-fetch-site': 'same-site',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-dest': 'empty',
                        'referer': referer,
                        'accept-language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
                        'accept-encoding': 'gzip, deflate, br',
                        'cookie': cookiesWithoutDatadome + await getFreshDatadomeCookie(),
                    }
                })
            .then(function (response) {
                const accountId = response.data.storeId

                //let cookieDatadome4 = ''
                /*
                                response.headers['set-cookie'].forEach((cookies) => {
                                    const cookiesObject =
                                        Object.fromEntries(cookies.split('; ').map(c => {
                                            const [key, ...v] = c.split('=')
                                            return [key, v.join('=')]
                                        }))

                                    if (cookiesObject.datadome) {
                                        cookieDatadome4 = cookiesObject.datadome
                                    }

                                })
                                 */

                resolve({accountId, cookies})
            })
            .catch(function (error) {
                console.log("personalDataRequest error: ", error.response.status)
                reject()
            })
    )
}

module.exports = {
    getToken: main
}
