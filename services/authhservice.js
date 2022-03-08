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
    /*
    const stateId = await uuidv4()
    const freshDatadomeCookie = await getFreshDatadomeCookie()
    let {cookieSecureInstall, cookieDatadome} = await installRequest(stateId, await freshDatadomeCookie)
    let {cookieSecureLogin, cookieSecureLoginLax, cookieDatadome2} = await loginRequest(username, password, stateId, cookieSecureInstall, cookieDatadome)
    const temporaryToken = await apiAuthorizeRequest(stateId, cookieSecureLogin, cookieSecureLoginLax, cookieSecureInstall, cookieDatadome2)

    const {token, cookieDatadome3} = await tokenRequest(stateId, temporaryToken)
    const {accountId, cookieDatadome4, cookies} = await personalDataRequest(cookieSecureInstall, cookieDatadome3, token)
*/

    const stateId = await uuidv4()
    const userAgent = randomUseragent.getRandom(function (ua) {
        return parseFloat(ua.browserVersion) >= 20;
    })

    let {
        cookieSecureLogin,
        cookieSecureLoginLax
    } = await loginRequest(username, password, stateId, userAgent)

    const temporaryToken = await apiAuthorizeRequest(stateId, cookieSecureLogin, cookieSecureLoginLax, userAgent)

    const definitiveTokenResponse = await tokenRequest(stateId, temporaryToken, userAgent)

    console.log('definitiveTokenResponse: ', definitiveTokenResponse)


//    console.log(await personalDataRequest(freshDatadomeCookie2, token))

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
    return new Promise((resolve) =>
        axios
            .get('http://f51340b.online-server.cloud/cookie')
            .then(function (response) {
                console.log("datadome cookie from Paul: ", response.data.datadome)
                resolve(response.data.datadome)
            })
            .catch(function (e) {
                if (e.response) {
                    console.log('getFreshDatadomeCookie error HTTP STATUS: ', e.response.status)
                }
                throw e
            })
    )
}

function installRequest(stateId, freshDatadomeCookie) {
    return new Promise((resolve) =>
        axios
            .post('https://auth.leboncoin.fr/api/authenticator/v1/install', {},
                {
                    headers: {
                        'authority': 'auth.leboncoin.fr',
                        'content-length': '0',
                        "sec-ch-ua": '"Chromium";v="92", " Not A;Brand";v="99", "Google Chrome";v="92"',
                        'sec-ch-ua-mobile': '?0',
                        'user-agent': randomUseragent.getRandom(function (ua) {
                            return parseFloat(ua.browserVersion) >= 20;
                        }),
                        'accept': '*/*',
                        'origin': 'https://auth.leboncoin.fr',
                        'sec-fetch-site': 'same-origin',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-dest': 'empty',
                        'referer': 'https://auth.leboncoin.fr/login/?client_id=lbc-front-web&error=login_required&error_debug=session+token+is+not+found+or+expired&error_description=you+should+login+first%2C+the+__Secure-login+cookie+is+not+found.&error_hint=you+should+login+first%2C+you+can+follow+this+url+https%3A%2F%2Fauth.leboncoin.fr%2Flogin%2F%3Fclient_id%3Dlbc-front-web%26from_to%3Dhttps%253A%252F%252Fwww.leboncoin.fr%252F%26redirect_uri%3Dhttps%253A%252F%252Fauth.leboncoin.fr%252Fapi%252Fauthorizer%252Fv2%252Fauthorize%253Fclient_id%253Dlbc-front-web%2526redirect_uri%253Dhttps%25253A%25252F%25252Fwww.leboncoin.fr%25252Fnextoauth2callback%2526response_type%253Dcode%2526scope%253D%25252A%252Boffline%2526state%253D' + stateId + '+to+retrieve+__Secure-login+cookie&from_to=https%3A%2F%2Fwww.leboncoin.fr%2F&redirect_uri=https%3A%2F%2Fauth.leboncoin.fr%2Fapi%2Fauthorizer%2Fv2%2Fauthorize%3Fclient_id%3Dlbc-front-web%26redirect_uri%3Dhttps%253A%252F%252Fwww.leboncoin.fr%252Fnextoauth2callback%26response_type%3Dcode%26scope%3D%252A%2Boffline%26state%3D' + stateId,
                        'accept-language': 'en-GB,en;q=0.9',
                        'cookie': '__Secure-InstanceId=9e6209e5-ffaa-4e0a-8637-1d5067fd6ccc; ry_ry-l3b0nco_realytics=eyJpZCI6InJ5XzhGNzFDM0JDLTJBNTMtNDgxNy05ODNDLTVBMjcyRURGNzYwNiIsImNpZCI6bnVsbCwiZXhwIjoxNjYyMzkyNjM4NzA1LCJjcyI6bnVsbH0%3D; ry_ry-l3b0nco_so_realytics=eyJpZCI6InJ5XzhGNzFDM0JDLTJBNTMtNDgxNy05ODNDLTVBMjcyRURGNzYwNiIsImNpZCI6bnVsbCwib3JpZ2luIjp0cnVlLCJyZWYiOm51bGwsImNvbnQiOm51bGwsIm5zIjpmYWxzZX0%3D; didomi_token=eyJ1c2VyX2lkIjoiMTdiYjZhMTYtYTNlMy02OThlLTlkZjItOTgxYjE4NWM0OWY1IiwiY3JlYXRlZCI6IjIwMjEtMDktMDVUMTU6NDY6NTguMzAxWiIsInVwZGF0ZWQiOiIyMDIxLTA5LTA1VDE1OjQ2OjU4LjMwMVoiLCJ2ZW5kb3JzIjp7ImRpc2FibGVkIjpbImFtYXpvbiIsInNhbGVzZm9yY2UiLCJnb29nbGUiLCJjOm5leHQtcGVyZm9ybWFuY2UiLCJjOmNvbGxlY3RpdmUtaGhTWXRSVm4iLCJjOnJvY2t5b3UiLCJjOnB1Ym9jZWFuLWI2QkpNdHNlIiwiYzpydGFyZ2V0LUdlZk1WeWlDIiwiYzpzY2hpYnN0ZWQtTVFQWGFxeWgiLCJjOmdyZWVuaG91c2UtUUtiR0JrczQiLCJjOnJlYWx6ZWl0Zy1iNktDa3h5ViIsImM6dmlkZW8tbWVkaWEtZ3JvdXAiLCJjOnN3aXRjaC1jb25jZXB0cyIsImM6bHVjaWRob2xkLXlmdGJXVGY3IiwiYzpsZW1vbWVkaWEtemJZaHAyUWMiLCJjOnlvcm1lZGlhcy1xbkJXaFF5UyIsImM6c2Fub21hIiwiYzpyYWR2ZXJ0aXMtU0pwYTI1SDgiLCJjOnF3ZXJ0aXplLXpkbmdFMmh4IiwiYzp2ZG9waWEiLCJjOnJldmxpZnRlci1jUnBNbnA1eCIsImM6cmVzZWFyY2gtbm93IiwiYzp3aGVuZXZlcm0tOFZZaHdiMlAiLCJjOmFkbW90aW9uIiwiYzp3b29iaSIsImM6c2hvcHN0eWxlLWZXSksyTGlQIiwiYzp0aGlyZHByZXNlLVNzS3dtSFZLIiwiYzpiMmJtZWRpYS1wUVRGZ3lXayIsImM6cHVyY2giLCJjOmxpZmVzdHJlZXQtbWVkaWEiLCJjOnN5bmMtbjc0WFFwcmciLCJjOmludG93b3dpbi1xYXp0NXRHaSIsImM6ZGlkb21pIiwiYzpyYWRpdW1vbmUiLCJjOmFkb3Rtb2IiLCJjOmFiLXRhc3R5IiwiYzpncmFwZXNob3QiLCJjOmFkbW9iIiwiYzphZGFnaW8iLCJjOmxiY2ZyYW5jZSJdfSwicHVycG9zZXMiOnsiZGlzYWJsZWQiOlsicGVyc29ubmFsaXNhdGlvbmNvbnRlbnUiLCJwZXJzb25uYWxpc2F0aW9ubWFya2V0aW5nIiwicHJpeCIsIm1lc3VyZWF1ZGllbmNlIiwiZXhwZXJpZW5jZXV0aWxpc2F0ZXVyIl19LCJ2ZW5kb3JzX2xpIjp7ImRpc2FibGVkIjpbImdvb2dsZSJdfSwidmVyc2lvbiI6MiwiYWMiOiJBQUFBLkFBQUEifQ==; euconsent-v2=CPMEQB3PMEQB3AHABBENBpCgAAAAAAAAAAAAAAAAAABigAMAAQQXGAAYAAgguQAAwABBBcAA.YAAAAAAAAAAA; include_in_experiment=false; utag_main=v_id:017bb6a1689700032a4ce033dcfc03079001907100838$_sn:1$_ss:0$_pn:2%3Bexp-session$_st:1630858618550$ses_id:1630856636567%3Bexp-session; datadome=' + freshDatadomeCookie,
                    }
                })
            .then(function (response) {
                let cookieSecureInstall = ''
                let cookieDatadome = ''

                response.headers['set-cookie'].forEach((cookies) => {
                    const cookiesObject =
                        Object.fromEntries(cookies.split('; ').map(c => {
                            const [key, ...v] = c.split('=')
                            return [key, v.join('=')]
                        }))

                    if (cookiesObject['__Secure-Install']) {
                        cookieSecureInstall = cookiesObject['__Secure-Install']
                    }

                    if (cookiesObject.datadome) {
                        cookieDatadome = cookiesObject.datadome
                    }
                })

                resolve({cookieSecureInstall, cookieDatadome})
            })
            .catch(function (e) {
                if (e.response) {
                    console.log('installRequest error HTTP STATUS: ', e.response.status)
                }
                throw e
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
                let cookieDatadome2 = ''

                console.log('counter of redirections: ', response.request._redirectable._redirectCount)

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

function apiAuthorizeRequest(stateId, cookieSecureLogin, cookieSecureLoginLax, userAgent) {
    return new Promise(async (resolve) =>
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
                        'cookie': '__Secure-InstanceId=e9d0652a-2815-4f24-af08-d41842a9f7f0; ry_ry-l3b0nco_realytics=eyJpZCI6InJ5XzVCOUI1NkMzLTQxQTEtNDMzNS1CMTlGLTg3QTMyN0FFQUEzNSIsImNpZCI6bnVsbCwiZXhwIjoxNjc3NjkzMTA3MDAzLCJjcyI6bnVsbH0%3D; didomi_token=eyJ1c2VyX2lkIjoiMTdmNDY5YzAtNTIzMy02NzU1LWFmMDYtMzIxMWU3ZWM5ZmU4IiwiY3JlYXRlZCI6IjIwMjItMDMtMDFUMTc6NTE6NTMuMDY5WiIsInVwZGF0ZWQiOiIyMDIyLTAzLTAxVDE3OjUxOjUzLjA2OVoiLCJ2ZW5kb3JzIjp7ImRpc2FibGVkIjpbImdvb2dsZSIsImM6cm9ja3lvdSIsImM6cHVib2NlYW4tYjZCSk10c2UiLCJjOnJ0YXJnZXQtR2VmTVZ5aUMiLCJjOnNjaGlic3RlZC1NUVBYYXF5aCIsImM6Z3JlZW5ob3VzZS1RS2JHQmtzNCIsImM6cmVhbHplaXRnLWI2S0NreHlWIiwiYzpsZW1vbWVkaWEtemJZaHAyUWMiLCJjOnlvcm1lZGlhcy1xbkJXaFF5UyIsImM6c2Fub21hIiwiYzpyYWR2ZXJ0aXMtU0pwYTI1SDgiLCJjOnF3ZXJ0aXplLXpkbmdFMmh4IiwiYzpyZXZsaWZ0ZXItY1JwTW5wNXgiLCJjOnJlc2VhcmNoLW5vdyIsImM6d2hlbmV2ZXJtLThWWWh3YjJQIiwiYzphZG1vdGlvbiIsImM6dGhpcmRwcmVzZS1Tc0t3bUhWSyIsImM6aW50b3dvd2luLXFhenQ1dEdpIiwiYzpkaWRvbWkiLCJjOmpxdWVyeSIsImM6YWItdGFzdHkiLCJjOm1vYmlmeSIsImM6bGJjZnJhbmNlIiwiYzpwb3dlcmxpbmstQTNMZURNRjQiXX0sInB1cnBvc2VzIjp7ImRpc2FibGVkIjpbImV4cGVyaWVuY2V1dGlsaXNhdGV1ciIsIm1lc3VyZWF1ZGllbmNlIiwicGVyc29ubmFsaXNhdGlvbm1hcmtldGluZyIsInBlcnNvbm5hbGlzYXRpb25jb250ZW51IiwicHJpeCJdfSwidmVuZG9yc19saSI6eyJkaXNhYmxlZCI6WyJnb29nbGUiXX0sInZlcnNpb24iOjIsImFjIjoiQUFBQS5BQUFBIn0=; euconsent-v2=CPVJdQAPVJdQAAHABBENCECgAAAAAAAAAAAAAAAAAABigAMAAQRLGAAYAAgiWQAAwABBEsAA.YAAAAAAAAAAA; include_in_experiment=false; __Secure-Install=63d0df27-b270-4d3c-ab84-32b22ecaf979; ry_ry-l3b0nco_so_realytics=eyJpZCI6InJ5XzVCOUI1NkMzLTQxQTEtNDMzNS1CMTlGLTg3QTMyN0FFQUEzNSIsImNpZCI6bnVsbCwib3JpZ2luIjp0cnVlLCJyZWYiOm51bGwsImNvbnQiOm51bGwsIm5zIjpmYWxzZX0%3D; utag_main=v_id:017f469c0416001d25e29b616ddc02078001907000838$_sn:4$_ss:0$_st:1646560693018$_pn:4%3Bexp-session$ses_id:1646558883046%3Bexp-session; __Secure-Login=' + cookieSecureLogin + '; __Secure-Login-Lax=' + cookieSecureLoginLax + '; datadome=' + await getFreshDatadomeCookie(),
                    }
                })
            .then(function (response) {
                console.log('counter of redirections: ', response.request._redirectable._redirectCount)
                console.log('apiAuthorizeRequest status code: ', response.status)
                console.log('apiAuthorizeRequest response headers: ', response.headers)

                const dom = new JSDOM(response.data)
                const htmlJsElement = dom.window.document.querySelector('#__NEXT_DATA__')
                resolve(JSON.parse(htmlJsElement.text).query.code)
            })
            .catch(function (error) {
                console.log('catch apiAuthorizeRequest => get previsionalToken from location header')
                const urlParams = new URLSearchParams(error.response.headers.location)
                resolve(urlParams.get('https://www.leboncoin.fr/nextoauth2callback?code'))
            })
    )
}

function tokenRequest(stateId, temporaryToken, userAgent) {
    const content = "code=" + temporaryToken + "&grant_type=authorization_code&redirect_uri=https%3A%2F%2Fwww.leboncoin.fr%2Fnextoauth2callback&client_id=lbc-front-web"
    console.log('content.length: ',  content.length)
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
                        'referer': 'https://www.leboncoin.fr/nextoauth2callback?code=' + temporaryToken + '&scope=lbc.auth.email.part.change%20lbcgrp.auth.twofactor.me.%2A%20lbcgrp.auth.twofactor.sms.me.activate%20lbc.escrowaccount.maintenance.read%20beta.lbc.auth.twofactor.me.%2A%20lbc.%2A.me.%2A%20offline%20lbcgrp.auth.session.me.read%20lbclegacy.users%20lbclegacy.part%20lbcgrp.auth.session.me.display%20lbcgrp.auth.session.me.delete%20lbc.%2A.%2A.me.%2A&state=' + stateId,
                        'accept-language': 'fr-FR,fr;q=0.9',
                        'accept-encoding': 'gzip, deflate, br'
                    }
                })
            .then(function (response) {
                /*
                let cookieDatadome3 = ''

                response.headers['set-cookie'].forEach((cookies) => {
                    const cookiesObject =
                        Object.fromEntries(cookies.split('; ').map(c => {
                            const [key, ...v] = c.split('=')
                            return [key, v.join('=')]
                        }))

                    if (cookiesObject.datadome) {
                        cookieDatadome3 = cookiesObject.datadome
                    }
                })
                */
                const token = response.data.access_token
                resolve({token})
                //resolve(response.data.access_token)
            })
            .catch(function (error) {
                console.log("tokenRequest error: ", error.response.status)
                reject()
            })
    )
}

function personalDataRequest(cookieSecureInstall, cookieDatadome2, token) {
    const cookies = 'xtvrn=$562498$; xtant562498=1; ry_ry-l3b0nco_realytics=eyJpZCI6InJ5Xzc0MTRDN0NGLUQ3NUMtNDdFRi1COTI2LTVBQTVGRjJDMjc3OCIsImNpZCI6bnVsbCwiZXhwIjoxNjQwNzk4NjkxMTIxLCJjcyI6bnVsbH0%3D; __Secure-Install=' + cookieSecureInstall + ' ; _pulse2data=03acba8b-5ed7-4a57-9473-cf06787c97ee%2Cv%2C12341713%2C1613298323977%2CeyJpc3N1ZWRBdCI6IjIwMjAtMTItMjlUMTc6MjQ6NTFaIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjIifQ..euv7qmUTx_kIy3wJaCGZ2A.cCB87vFyr0Ls2scr6VqmfFoia76_yscB9t3fsuQ9Lgc9QzxKKtNLYMAdQjOA6Y0Umk64UW5uiy5roynBi5iVCUp-AsQtGmB855uU8VPkIobWGKzkvZ90KY8tjkwItrhG-NicpBLv3mLCgqL-_MZk0xFd2GQzxP6dGQvZPm9eqPL-EXdKAjF0g0yxo8Ayw0iNUv-njsOsJ4-bzbM5GnycsTuH7aeVoA2c2e_ysEI5VnA.yNGKjpXyeCDFfURmOZH2tg%2C%2C0%2Ctrue%2C%2CeyJraWQiOiIyIiwiYWxnIjoiSFMyNTYifQ..LYRxLFiJVqRLo22_HVaUbtlKtvLgstsNaWSLo04i2xU; xtan562498=part-12341713; __Secure-InstanceId=aa6b2344-f341-415d-8dc1-b8eb73897970; didomi_token=eyJ1c2VyX2lkIjoiMTc2YWY4N2UtZTAyYS02MjExLTkwOTMtZWZlZWM1MzYxNmZlIiwiY3JlYXRlZCI6IjIwMjEtMDQtMTFUMTI6MTY6NDMuMjM5WiIsInVwZGF0ZWQiOiIyMDIxLTA0LTExVDEyOjE2OjQzLjIzOVoiLCJ2ZXJzaW9uIjoyLCJ2ZW5kb3JzIjp7ImVuYWJsZWQiOlsiYW1hem9uIiwic2FsZXNmb3JjZSIsImdvb2dsZSIsImM6bmV4dC1wZXJmb3JtYW5jZSIsImM6Y29sbGVjdGl2ZS1oaFNZdFJWbiIsImM6cm9ja3lvdSIsImM6cHVib2NlYW4tYjZCSk10c2UiLCJjOnJ0YXJnZXQtR2VmTVZ5aUMiLCJjOnNjaGlic3RlZC1NUVBYYXF5aCIsImM6Z3JlZW5ob3VzZS1RS2JHQmtzNCIsImM6cmVhbHplaXRnLWI2S0NreHlWIiwiYzp2aWRlby1tZWRpYS1ncm91cCIsImM6c3dpdGNoLWNvbmNlcHRzIiwiYzpsdWNpZGhvbGQteWZ0YldUZjciLCJjOmxlbW9tZWRpYS16YllocDJRYyIsImM6eW9ybWVkaWFzLXFuQldoUXlTIiwiYzpzYW5vbWEiLCJjOnJhZHZlcnRpcy1TSnBhMjVIOCIsImM6cXdlcnRpemUtemRuZ0UyaHgiLCJjOnZkb3BpYSIsImM6cmV2bGlmdGVyLWNScE1ucDV4IiwiYzpyZXNlYXJjaC1ub3ciLCJjOndoZW5ldmVybS04Vllod2IyUCIsImM6YWRtb3Rpb24iLCJjOndvb2JpIiwiYzpzaG9wc3R5bGUtZldKSzJMaVAiLCJjOnRoaXJkcHJlc2UtU3NLd21IVksiLCJjOmIyYm1lZGlhLXBRVEZneVdrIiwiYzpwdXJjaCIsImM6bGlmZXN0cmVldC1tZWRpYSIsImM6c3luYy1uNzRYUXByZyIsImM6aW50b3dvd2luLXFhenQ1dEdpIiwiYzpkaWRvbWkiLCJjOnJhZGl1bW9uZSIsImM6YWRvdG1vYiIsImM6YWItdGFzdHkiLCJjOmdyYXBlc2hvdCIsImM6YWRtb2IiLCJjOmFkYWdpbyIsImM6bGJjZnJhbmNlIl19LCJ2ZW5kb3JzX2xpIjp7ImVuYWJsZWQiOlsiZ29vZ2xlIl19LCJhYyI6IkRFMkF3QUVJQWZvQmhRRHhBSG1BU1NBa3NDSklIRUFPckFpREJGS0NLZ0VtNEp2QVRrQXRyQmJlQzR3RnlRTGxnWURBd2lCaWFBQUEuREUyQXdBRUlBZm9CaFFEeEFIbUFTU0Frc0NKSUhFQU9yQWlEQkZLQ0tnRW00SnZBVGtBdHJCYmVDNHdGeVFMbGdZREF3aUJpYUFBQSIsInB1cnBvc2VzIjp7ImVuYWJsZWQiOlsicGVyc29ubmFsaXNhdGlvbmNvbnRlbnUiLCJwZXJzb25uYWxpc2F0aW9ubWFya2V0aW5nIiwicHJpeCIsIm1lc3VyZWF1ZGllbmNlIiwiZXhwZXJpZW5jZXV0aWxpc2F0ZXVyIl19fQ==; euconsent-v2=CPEfRawPEfRawAHABBENBUCgAP_AAHLAAAAAG7tf_X_fb2vj-_599_t0eY1f9_63v6wzjheNs-8NyZ_X_L4Xo2M6vB36pq4KmR4Eu3LBAQdlHOHcTQmQ4IkVqTPsbk2Mr7NKJ7LEilMbe2dYGH9_n8XTuZKY70_8___z_3-__v__7rbgCAAAAAAAIAgc6ASYal8AAmJY4Ek0aVQogQhWEhUAoAKKEYWiawgJHBTsrgI9QQIAEJqAjAiBBiCjFgEAAgEASERACAHggEQBEAgABACpAQgAIkAAWAFgYBAAKAaFABFAEIEhBEYFRymBARItFBPIGAAQAAAAAAAAAAAAAAAgBigXIABwAEgANAAeABSADAAMgAigBSAFQALAAYgA1gB8AH8AQgBDACYAFoALkAXgBfgDCAMQAZgA2gB4AD1AH8AggBCwCNAI4ASYAlQBMwCfAKAAUgAqABWgCygFuAXEAygDLgGaAZ0A0wDVAGwANoAcEA4gDkAHMAOyAd4B4QDzAPSAfIB9AD8AH_AQUBBoCEgIUARAAjABHICSgJMASuAloCXAEwAJvATwBPgCggFFAKQAUsAqIBV4CugK-AWaAtAC0gFzgLsAu4BeQC-AF-AMCAYQAxUBnAGdANAAacA1oBtADeAHCgOaA5wB1QDsgHbAO-AeIA9YB7YD9AP2Af8BAgCBwEGAISAQuAh8BEoCLAEcQI6AjsBHoCQQEhgJFASiAlSBLwEvwJhAmIBM0CbAJtATuAn8BQoCiAFFAKMgUcBSACmYFNgU4Ap8BUQCpIFWgVeArMBW0CxALFgWOBZMCywLMAWcAtEBasC1wLYAW4AuCBcYFyQLmAugBdcC7QLugXmBesC9wL7AYEAwqBhoGHwMUAxUBjUDHgMgAZEAyUBlcDMAMxAZpAzgDOYGeAZ9A0EDQgGigNPga0BrcDXQNeAbAA2QBtQDbQG4ANygboBusDfQN-gcIBw0DiQOKAccA5IBykDmAOZAc8A6eB1oHYAO4Ad2A72B4QHhgPQgemB6gD1hgLUAA4ACQAHgAUgAwADIAIoAUgBUACwAGIANQAfwBCAEMAJgAUwAuABegDCAMQAZgA2wB_AIKARoBHgCTAEqAJmAT4BQACkAFQAK0AWUAtwC4AGPAMoAywBnQDTANUAbQA4IBxAHIAOYAdkA7wDwgHmAekA-gD8AH_AQkBCgCIAESAIwARwAkoBKwCWgEwAJvATwBPgCggFFAKQAUsAqIBVwCtwFdAV8AsQBZgC5wF2AXcAvIBfAC_AGEAMVAZwBnQDQQGmAacA1oBtADeAHCgOaA5wB1QDsgHbAO-AeIA9YB7QD5AH7AQIAgcBCQCFwEPgIlARYAjiBHQEdgI9ASCAkMBIoCTgEogJUgS8BL8CYQJiATNAmwCbQE4gJ3AT-AoUBRACigFGQKOApABTMCmwKcgU8BT4CogFSQKtAq8BWYCtgFiQLHAsmBZYFmALOAWiAtWBa4FsQLbAtwBcAC44FzAXQAuuBdoF3QLyAvSBe4F8AL7AYEAwoBhoDD4GKAYqAxoBjwDIAGRAMlAZWAzEBmkDOAM5gZ4Bn0DQQNCAaKA0-BrQGugNgAbJA2oDbAG4QN0A3WBvoG_QOEA4YBxIDjgHJAOUgcwBzIDngHTwOtA7AB3ADuwHewPCA8MB6ED0wPUAesQBwAABgAOABIACwAGgAPAAoABaADIANAAdABEACQAFQALAAXAAxAB_AEEAQ4AmACaAFMAKoAVwAuQBeAF-AMIAxABmADQAG0AN4AeoA_gECAIuARoBHgCRAEmAJWAT4BQACkAFQAKoAVsAsQCygFuAXIAvgBhADEgGUAZcAzQDOgGmAaoA2ABtQDfAOAAcQA5IBzAHOAOyAd4B4QDzAPQAe0A-QD8AH-AQWAhICFAEQAIpARgBGQCOAElAJSASsAlwBMICbgJwATwAnwBQQChgFFgKQApIBSwCngFRAKuAVkArcBXQFfALEAWaAtAC0gFzgLsAu4BeQC-AF-AMAAYQAxQBmYDOAM6AaCA0wDTgGrANaAbQA3gBwgDmwHUAdUA64B2QDtgHfAPEAeiA9QD1gHtgPyA_gCAAECAIHAQnAhcCGAEPgIhgRKBEwCLIEcAR3Aj0CPoEggSKAk4BKICVAErgJagS8BL8CYQJiATMAmmBNgE2gJxATuAn-BQgFCgKIgUYBSECkgKTgUyBTkCngKfAVEAqSBVoFXgKzAVtAr4Cv4FiAWLAscCyYFlgWYAs4BaIC0wFqwLXAtwBbwC4IFxgXJAucC6IF1gXcAvIBekC9gL9gYCBgYDCoGGAYeAxKBigGKgMaAY8AyABkQDJQGTgMrAZaAzEBmkDNwM_gaCBoUDRANFAaPA0kDSwGngNTgaqBq0DWgNdga-BsIDZIG1gbYA24BuEDdAN1gbyBvUDfQN-gcABwMDhAOGAcSA4wBxwDkoHMAczA54DnwHRwOlA6eB1IHVQOsA7AB2oDuAHdwO9A74B4MDwwPEAePA8kDyoHnAejA9MD1AHrAAAA.f_gADlgAAAAA; srt=eyJhbGciOiJSUzI1NiIsImtpZCI6IjA2MGMwYTgyLTk0YzktNTQ0Ny1iYjFjLWFkMGI1YzhkNGU5NSIsInR5cCI6IkpXVCJ9.eyJjbGllbnRfaWQiOiJsYmMtZnJvbnQtd2ViIiwiaWF0IjoxNjE4MTk1MjgzLCJpZCI6IjExMGEzNTllLWM2MTAtNDM1Ni05OTBlLWIxZGQwZmRhZjhiNyIsImp0aSI6ImZkNGEzZGIyLTFiMTYtNGFlZS1hN2I0LTFiNTc5NGIzNDcxMSIsInJlcXVlc3RfaWQiOiIyMTc0ZTRkMi03YTBiLTRmOTAtYTAyMi0xNDYzOTdiNDZjYTUiLCJzZXNzaW9uX2lkIjoiZDU5YzEzMjgtYWJiYi00MTIxLWIzYmItYWRhMDE2MzU5OTQ3Iiwic3ViIjoibGJjO2QxNmMwNzQxLWFlYWMtNDFkMi1iMTQ0LTA0M2VhNWVjOWFlYTsxMjM0MTcxMyJ9.i0XRF6ezkkrbjnvk-rtP3wKVcs33tPDVQ-BStxU9q5YHlP8NHw-fcJ9W49QRO4yACLL9J3COhtIzlAY6fa-vVgZdu-tMeI3ubZE6DiM1x8efCjfIMZm5GXelgyAcAibZZpUB3pZhTsV3a6WfVlu1mHbAY_K7bNcc6iqgdXDVv9bgJFjgZ1f84-1iIzCgMxu-kXZn10MaHkQj8GqcYcMxYLZoRAZUhP8j5hBIW7B0x-1gVH6MqfbIB8I1SXBWxO19tVJIMvKFKoR34--phQCzFtXr4r8rs_uI9bY3TTeQIZoiZmsl2FqpAawtvGyQuJ39zC-1DgsVkeG9Fsg3q3wZn-NhuUxL2IlI98guqORB7AJLQV9aUeh9CLIH-bmKfnR5CuHFULyE3BsloI4AH8r5027oFoc-OtWnnVU8dlZnOfITepeqRVKHw5uTUq-XuxTCpllkJFxLVH4UCrVrKIpkHv7O1EyuhmtahW6BDeSnpe6koUqWGfzaI5vJcFxS81uwBbTpvFUL32ZBj2WrsQo1BJh7CWliggXrBONeE2eOvUTdEazabnhU6cVJ05ihx-OOVx_ql9mcGMiUFY2GFbalccQkRRCDLi2-zj5vLJ_uJBz9tbu91dyK7em7gBwjXMxhtGTq0rgeQ-BXlLUgOB6ENQYUV-nnpO_sPncSy8a3tos; _gcl_au=1.1.1746181226.1630408170; include_in_experiment=true; utag_main=v_id:0176af87ed0e001fee6708b8dbaa03077001906f00838$_sn:11$_ss:0$_st:1630755838591$_pn:2%3Bexp-session$ses_id:1630754037660%3Bexp-session; ry_ry-l3b0nco_so_realytics=eyJpZCI6InJ5Xzc0MTRDN0NGLUQ3NUMtNDdFRi1COTI2LTVBQTVGRjJDMjc3OCIsImNpZCI6bnVsbCwib3JpZ2luIjpmYWxzZSwicmVmIjpudWxsLCJjb250IjpudWxsLCJucyI6ZmFsc2V9; cto_bundle=9_Azt19rVzRIV0JmVWpic2FqWWQ0aVRFR0ZIdWxtZ0VqNG9XMklZS3FtJTJCUGtNZjhPOW5zQXllMlVRTEc3Y3ZoVWRpcGVRWlBLMFNHOWJyUExXdzFPZFZCczQlMkZxT1JSV0hJWnFGaE8lMkJpa1I0dU9OcDI1WE80RUNDYXlRc0klMkY5REtwUE4yTFlvRnNQTGp2TWdnZkE0UG5zR1hMaFVISzB0UWwwZmhBNnF4M1Z6cnJvdW9YZGk5TjJFdXAlMkJ4VnpCb3dkNTJO; datadome=' + cookieDatadome2

    return new Promise((resolve) =>
        axios
            .get('https://api.leboncoin.fr/api/accounts/v1/accounts/me/personaldata',
                {
                    headers: {
                        'authority': 'api.leboncoin.fr',
                        'authorization': 'Bearer ' + token,
                        'user-agent': randomUseragent.getRandom(function (ua) {
                            return parseFloat(ua.browserVersion) >= 20;
                        }),
                        'content-type': 'application/json',
                        'accept': '*/*',
                        'sec-gpc': '1',
                        'origin': 'https://www.leboncoin.fr',
                        'sec-fetch-site': 'same-site',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-dest': 'empty',
                        'referer': 'https://leboncoin.fr/',
                        'accept-language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
                        'cookie': cookies,
                    }
                })
            .then(function (response) {
                const accountId = response.data.storeId
                let cookieDatadome4 = ''

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

                resolve({accountId, cookieDatadome4, cookies})
            })
            .catch(function (error) {
                console.log('personalDataRequest error: ', error.response.status)
            })
    )
}

module.exports = {
    getToken: main
}
