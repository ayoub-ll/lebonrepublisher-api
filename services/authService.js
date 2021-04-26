const ghostCursor = require("ghost-cursor")
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const randomUseragent = require('random-useragent')
const captcha = require('../utils/captcha')
puppeteer.use(StealthPlugin())

const Jimp = require('jimp')
const pixelmatch = require('pixelmatch')
const {cv} = require('opencv-wasm')

const timeout = (prom, time) =>
    Promise.race([prom, new Promise((_r, rej) => setTimeout(rej, time))])

var cursor = null

async function main(username, password) {
    const browser = await puppeteer.launch({
        args: ['--disable-features=site-per-process'],
        headless: false,
        defaultViewport: {width: 1100, height: 768},
    })

    var page = await browser.newPage()
    cursor = await ghostCursor.createCursor(page)
    await ghostCursor.installMouseHelper(page)
    await page.setRequestInterception(true)
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36');

    const token = timeout(
        new Promise((resolve) =>
            page.on('request', (request) => {
                let auth = request.headers()['authorization']
                if (
                    process.env.lbc_token_endpoint_regex == request.url() &&
                    auth != null
                ) {
                    resolve(auth)
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

    //await captcha.resolveCaptcha(page, cursor)

    while (!(await page.$('#didomi-notice-disagree-button'))) {
        await page.waitForTimeout(2000)

        const elementHandle = await page.$('iframe')
        const frame = await elementHandle.contentFrame()
        const cptchEn = await frame.$('[aria-label="Click to verify"]')
        const cptchFr = await frame.$('[aria-label="Cliquer pour vérifier"]')

        if (await frame && (await cptchEn || await cptchFr)) {
            await captcha.resolveCaptcha(page, cursor)
            break;
        }

        await page.setUserAgent(randomUseragent.getRandom(function (ua) {
            return parseFloat(ua.browserVersion) >= 20;
        }))
        await page.reload({waitUntil: ["networkidle0", "domcontentloaded"]})
    }

    await page.waitForSelector('#didomi-notice-disagree-button', {timeout: 4000})
    await cursor.click('#didomi-notice-disagree-button')

    await page.waitForSelector('button[data-qa-id="profilarea-login"]', {timeout: 4000})
    await cursor.click('button[data-qa-id="profilarea-login"]')

    await page.waitForTimeout(3 * 1000)
    await captcha.resolveCaptcha(page, cursor)

    await completeForm(page, username, password)

    return Promise.all([token, accountId])
        .then((values) => {
            console.log('Token + accountId promises OK')
            browser.close()
            return {token: values[0], accountId: values[1]}
        })
        .catch((reason) => {
            console.log('AUTH PROMISES ERROR: ', reason)
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
