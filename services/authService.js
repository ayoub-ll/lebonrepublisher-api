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
    cursor = await ghostCursor.createCursor(await page)
    await ghostCursor.installMouseHelper(await page)
    await page.setRequestInterception(true)
    await page.setUserAgent(await randomUseragent.getRandom(function (ua) {
        return parseFloat(ua.browserVersion) >= 20;
    }));


    let cookie = ''

    const token = timeout(
        new Promise((resolve) =>
            page.on('request', async (request) => {
                let auth = await request.headers()['authorization']
                if (
                    await process.env.lbc_token_endpoint_regex === request.url() &&
                    await auth != null
                ) {
                    cookie = await (await page.cookies()).map((cookie) => {
                        return `${cookie.name}=${cookie.value}`;
                    }).join('; ')
                    resolve(auth)
                }
                await request.continue()
            }),
        ),
        90000, //
    ).catch((e) => {
        console.error('[ERROR] token timeout 90sec in authService.js L.45')
        throw e
    })

    const accountId = new Promise((resolve) =>
        page.on('response', (response) => {
            let request = response.request()
            let storeId = null

            if (
                process.env.lbc_token_endpoint_regex === request.url() &&
                request.method() === 'GET'
            ) {
                let responseJson = response.json()
                storeId = responseJson.storeId
                resolve(storeId)
            }
        }),
    )

    await page.goto(process.env.lbc_login_url, {waitUntil: 'domcontentloaded'})
    await page.waitForTimeout(4 * 1000)

    await captcha.resolveCaptcha(await page, await cursor)
    await console.log("AuthService: after captcha resolve + page refresh")
    await page.waitForTimeout(6 * 1000)

    await page.waitForSelector('#didomi-notice-disagree-button', {timeout: 7500})
        .catch((error) => {
            console.log("[ERROR]: #didomi-notice-disagree-button not found")
            throw error
        })

    await cursor.click('#didomi-notice-disagree-button')
    await console.log("after didomi click")

    await page.waitForTimeout(2 * 1000)

    await page.waitForSelector('button[data-qa-id="profilarea-login"]', {timeout: 10000})
        .catch((error) => {
            console.warn("[WARNING]: button[data-qa-id=\"profilarea-login\"] exceded 10000")
            captcha.resolveCaptcha(page, cursor)
            console.log("AuthService: after new captcha resolve + page refresh")
            page.waitForSelector('button[data-qa-id="profilarea-login"]', {timeout: 10000})
                .catch((error) => {
                    console.error('[ERROR] button[data-qa-id="profilarea-login"] not found (10000 sec timeout)')
                })
        })

    await cursor.click('button[data-qa-id="profilarea-login"]')

    await page.waitForTimeout(2 * 1000)

    await completeForm(page, username, password)

    await page.waitForTimeout(2 * 1000)

    await submitDoubleAuthWindow(page)

    await page.waitForTimeout(2 * 1000)

    /*
    console.log("token: ", token)
    console.log("cookie: ", cookie)
    console.log("accountId: ", accountId)
    */

    return Promise.all([await token, await cookie, await accountId])
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

async function submitDoubleAuthWindow(page) {
    const plusTardButton = await page.$x("//a[contains(., 'Plus tard')]")

    if (await plusTardButton != null) {
        //await console.log("plusTardButton not equals null: ", plusTardButton[0])
        await cursor.click(await plusTardButton[0])
        await console.log("plusTardButton after click")
    }
}

async function completeForm(page, username, password) {
    await console.log("inCompleteForm")
    let emailInput = await page.waitForSelector('input[type="email"]', {timeout: 4000})
        .catch((error) => {
            console.log("[ERROR]: input[type=\"email\"] timeout/not found")
            throw error
        })

    await cursor.click('input[type="email"]')
    await emailInput.type(await username, {delay: Math.floor(Math.random() * (250 - 100 + 1) + 100)})

    let passwordInput = await page.waitForSelector('input[type="password"]', {timeout: 4000})
        .catch((error) => {
            console.log("[ERROR]: input[type=\"password\"] timeout/not found")
            throw error
        })

    await cursor.click('input[type="password"]')
    await page.waitForTimeout(Math.floor(Math.random() * (250 - 100 + 1) + 100))
    await passwordInput.type(password, {delay: Math.floor(Math.random() * (250 - 100 + 1) + 100)})

    const submitButton = await page.waitForSelector('[type="submit"]', {timeout: 2000})
        .catch((error) => {
            console.log("[ERROR]: [type=submit] not found")
            throw error
        })

    await cursor.move(await submitButton)
    await console.log("Submit form click")
    await cursor.click(await submitButton)
}


module.exports = {
    getToken: main
}
