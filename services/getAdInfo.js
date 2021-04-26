const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const randomUseragent = require('random-useragent');
const ghostCursor = require("ghost-cursor")
const captcha = require('../utils/captcha')
puppeteer.use(StealthPlugin())

async function main(adUrl) {
    const browser = await puppeteer.launch({
        args: ['--disable-features=site-per-process'],
        headless: false,
        defaultViewport: {width: 1100, height: 768},
    })

    var page = await browser.newPage()
    const cursor = await ghostCursor.createCursor(page)
    await ghostCursor.installMouseHelper(page)

    await page.setUserAgent(randomUseragent.getRandom(function (ua) {
        return parseFloat(ua.browserVersion) >= 20;
    }))
    await page.goto(adUrl, {waitUntil: 'domcontentloaded'})
    await page.waitForTimeout(3 * 1000)

    await captcha.resolveCaptcha(page, cursor)

    console.log("after getAdInfo while")

    await page.waitForTimeout(3000)
    const disagreeButton = await page.waitForSelector('#didomi-notice-disagree-button')
    await cursor.click(disagreeButton)


    const body = await (await (await page.$('._1fFkI')).getProperty('textContent')).jsonValue();

    console.log("body: ", body)

    var ret = {
        body: await body
    }

    await browser.close()
    return new Promise((resolve) =>
        resolve(ret)
    )
}

module.exports = {
    getAdInfo: main,
}
