const ghostCursor = require("ghost-cursor")
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const captcha = require('../utils/captcha')
const randomUseragent = require('random-useragent')
require( 'console-stamp' )( console )
puppeteer.use(StealthPlugin())

const timeout = (prom, time) =>
    Promise.race([prom, new Promise((_r, rej) => setTimeout(rej, time))])

var cursor = null

var browser = null

async function main(username, password) {
    browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-features=site-per-process', '--proxy-server=proxy.crawlera.com:8011', '--ignore-certificate-errors'],
        headless: false,
        defaultViewport: {width: 1100, height: 768},
        ignoreHTTPSErrors: true,
        acceptInsecureCerts: true,
    })

    var page = await browser.newPage()

    await page.setDefaultNavigationTimeout(0);

    await page.authenticate({
        username: '4c5a6b523a7343e1b12b652754bc76d4',
        password: ''
    });

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
                    await auth != null &&
                    await page.cookies != null &&
                    await page.cookies !== undefined
                ) {
                    const cookies = await page.cookies()

                    cookie = await cookies.map((cookie) => {
                        if (cookie != null && cookie.name != null && cookie.value != null) {
                            return `${cookie.name}=${cookie.value}`
                        }
                    }).join('; ')

                    resolve(auth)
                }
                await request.continue()
            }),
        ).catch((e) => {
            console.error('[ERROR] Error in token promise in authService.js: ', e)
            browser.close()
        }),
        360000, //
    )
        .catch((e) => {
            console.error('[ERROR] token timeout 90sec in authService.js L.45')
            browser.close()
            throw e
        })

    const accountId = new Promise((resolve) =>
        page.on('response', async (response) => {
            let request = await response.request()

            if (
                process.env.lbc_token_endpoint_regex === request.url() &&
                request.method() === 'GET' &&
                !response.headers()['set-cookie']
            ) {
                try {
                    let responseJson = await response.json()
                    resolve(responseJson.storeId)
                } catch (e) {
                    await console.error("[ERROR] responseJson body error: ", e)
                }
            }
        }),
    )

    await page.goto(process.env.lbc_login_url, {waitUntil: 'domcontentloaded'})
    await page.waitForTimeout(8 * 1000)

    await captcha.resolveCaptcha(await page, await cursor)
    await console.log("AuthService: after captcha resolve + page refresh")
    await page.waitForTimeout(6 * 1000)

    await page.waitForSelector('#didomi-notice-disagree-button', {timeout: 7500})
        .catch((error) => {
            console.log("[ERROR]: #didomi-notice-disagree-button not found")
            browser.close()
            throw error
        })

    await cursor.click('#didomi-notice-disagree-button')
    await console.log("after didomi click")

    await page.waitForTimeout(4 * 1000)

    await page.waitForSelector('button[data-qa-id="profilarea-login"]', {timeout: 10000})
        .catch((error) => {
            console.warn("[WARNING]: button[data-qa-id=\"profilarea-login\"] exceded 10000")
            captcha.resolveCaptcha(page, cursor)
            console.log("AuthService: after new captcha resolve + page refresh")
            page.waitForSelector('button[data-qa-id="profilarea-login"]', {timeout: 10000})
                .catch((e) => {
                    console.error('[ERROR] button[data-qa-id="profilarea-login"] not found (10000 sec timeout)')
                    browser.close()
                    throw e
                })
        })

    await cursor.click('button[data-qa-id="profilarea-login"]')

    await page.waitForTimeout(6 * 1000)

    await completeForm(page, username, password)

    await page.waitForTimeout(3 * 1000)

    //await submitDoubleAuthWindow(page)

    await page.waitForTimeout(2 * 1000)

    return Promise.all([
        token,
        accountId
    ])
        .then((values) => {
            console.log('Token + accountId promises OK, values: ', values)
            browser.close()
            return {token: values[0], cookie: cookie, accountId: values[1]}
        })
        .catch((reason) => {
            console.log('AUTH PROMISES ERROR: ', reason)
            browser.close()
            throw reason
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
    let emailInput = await page.waitForSelector('input[type="email"]', {timeout: 30000})
        .catch((error) => {
            page.screenshot({path: `input-email-not-found.png`})
            console.log("[ERROR]: input[type=\"email\"] timeout/not found: ", error)
            browser.close()
            throw error
        })

    await cursor.click('input[type="email"]')
    await emailInput.type(await username, {delay: Math.floor(Math.random() * (250 - 100 + 1) + 100)})

    let passwordInput = await page.waitForSelector('input[type="password"]', {timeout: 30000})
        .catch((error) => {
            console.log("[ERROR]: input[type=\"password\"] timeout/not found: ", error)
            browser.close()
            throw error
        })

    await cursor.click('input[type="password"]')
    await page.waitForTimeout(Math.floor(Math.random() * (250 - 100 + 1) + 100))
    await passwordInput.type(password, {delay: Math.floor(Math.random() * (250 - 100 + 1) + 100)})

    const submitButton = await page.waitForSelector('[type="submit"]', {timeout: 2000})
        .catch((error) => {
            console.log("[ERROR]: [type=submit] not found")
            browser.close()
            throw error
        })

    await cursor.move(await submitButton)
    await console.log("Submit form click")
    await cursor.click(await submitButton)
}


module.exports = {
    getToken: main
}
