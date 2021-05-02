const ghostCursor = require("ghost-cursor")
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const captcha = require('../utils/captcha')
const randomUseragent = require('random-useragent')
puppeteer.use(StealthPlugin())

const timeout = (prom, time) =>
    Promise.race([prom, new Promise((_r, rej) => setTimeout(rej, time))])

var cursor = null

async function main(username, password) {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-features=site-per-process'],
        headless: true,
        defaultViewport: {width: 1100, height: 768},
    })

    var page = await browser.newPage()
    cursor = await ghostCursor.createCursor(page)
    await ghostCursor.installMouseHelper(page)
    await page.setRequestInterception(true)
    await page.setUserAgent(randomUseragent.getRandom(function (ua) {
        return parseFloat(ua.browserVersion) >= 20;
    }));


    let cookie = ''

    const token = timeout(
        new Promise((resolve) =>
            page.on('request', async (request) => {
                let auth = await request.headers()['authorization']
                if (
                    process.env.lbc_token_endpoint_regex == await request.url() &&
                    auth != null
                ) {
                    cookie = (await page.cookies()).map((cookie) => { return `${cookie.name}=${cookie.value}`; }).join('; ')
                    await resolve(auth)
                }
                request.continue()
            }),
        ),
        55000, //
    )

    const accountId = new Promise((resolve) =>
        page.on('response', async (response) => {
            let request = response.request()
            let storeId = null

            if (
                process.env.lbc_token_endpoint_regex == request.url() &&
                request.method() == 'GET'
            ) {
                let responseJson = await response.json()
                storeId = await responseJson.storeId
                resolve(storeId)
            }
        }),
    )

    await page.goto(process.env.lbc_login_url, {waitUntil: 'domcontentloaded'})
    await page.waitForTimeout(4 * 1000)

    await captcha.resolveCaptcha(page, cursor)

    await page.waitForSelector('#didomi-notice-disagree-button', {timeout: 6000})
    await cursor.click('#didomi-notice-disagree-button')

    await page.waitForSelector('button[data-qa-id="profilarea-login"]', {timeout: 4000})
    await cursor.click('button[data-qa-id="profilarea-login"]')

    await page.waitForTimeout(2 * 1000)

    await completeForm(page, username, password)

    await page.waitForTimeout(2 * 1000)

    console.log("token: ", token)
    console.log("cookie: ", cookie)
    console.log("accountId: ", accountId)
    
    return Promise.all([token, cookie, accountId])
        .then((values) => {
            console.log('Token + accountId promises OK')
            browser.close()
            return {token: values[0], cookie: cookie, accountId: values[1]}
        })
        .catch((reason) => {
            console.log('AUTH PROMISES ERROR')
            browser.close()
            return 404
        })
}


async function completeForm(page, username, password) {
    console.log("inCompleteForm")
    let emailInput = await page.waitForSelector('input[type="email"]')
    await cursor.click('input[type="email"]')
    await emailInput.type(username, {delay: Math.floor(Math.random() * (250 - 100 + 1) + 100)})

    let passwordInput = await page.waitForSelector('input[type="password"]')
    await cursor.click('input[type="password"]')
    await page.waitForTimeout(Math.floor(Math.random() * (250 - 100 + 1) + 100))
    await passwordInput.type(password, {delay: Math.floor(Math.random() * (250 - 100 + 1) + 100)})

    const submitButton = await page.waitForSelector('[type=submit]')
    await cursor.move(submitButton)
    console.log("Submit form click")
    await cursor.click(submitButton)
}



module.exports = {
    getToken: main
}
