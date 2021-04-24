const ghostCursor = require("ghost-cursor")
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
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
        defaultViewport: null,
    })

    var page = await browser.newPage()
    cursor = await ghostCursor.createCursor(page)
    await ghostCursor.installMouseHelper(page)
    await page.setRequestInterception(true)

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

    await completeCaptcha(page)

    await page.waitForSelector('#didomi-notice-disagree-button', {timeout: 4000})
    await cursor.click('#didomi-notice-disagree-button')

    await completeCaptcha(page)

    await page.waitForSelector('button[data-qa-id="profilarea-login"]', {timeout: 4000})
    await cursor.click('button[data-qa-id="profilarea-login"]')

    await page.waitForTimeout(3 * 1000)
    await completeCaptcha(page)

    await completeForm(page, username, password)

    await completeCaptcha(page)

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

async function completeCaptcha(page) {
    console.log("inCompleteCaptcha")
    const elementHandle = await page.$('iframe')

    /* CAPTCHA DETECTED ZONE */
    if (elementHandle !== null) {
        const frame = await elementHandle.contentFrame()
        const cptchEn = await frame.$('[aria-label="Click to verify"]')
        const cptchFr = await frame.$('[aria-label="Cliquer pour vérifier"]')

        // Mouve mouse
        await cursor.moveTo({x: Math.floor(Math.random() * (750 - 15 + 1) + 15), y: Math.floor(Math.random() * (800 - 25 + 1) + 25)})

        /* CAPTCHA DETECTED ZONE */
        if ((await cptchFr) !== null || (await cptchEn) !== null) {
            await console.log('CAPTCHA DETECTED')
            await clickVerifyButton(frame, false)
            await captcha(page, frame)
            await page.waitForTimeout(4000)

            while (await isCaptchaFailed(page)) {
                console.log("IN WHILE")
                await page.waitForTimeout(
                    Math.floor(Math.random() * (2100 - 1000 + 1) + 1000),
                )
                await clickVerifyButton(frame, true)
                await captcha(page, frame)
            }
            console.log("AFTER WHILE")
        }
    }
}

function isCaptchaFailed(page) {
    return page.waitForSelector('input[type="email"]', {timeout: 3500})
        .then(() => {
            console.log("NO CAPTCHA FAIL DETECTED")
            return false
        })
        .catch(() => {
            console.log("CAPTCHA FAIL DETECTED")
            return true
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
    await cursor.click(submitButton)
}

async function captcha(page, frame) {
    const images = await getCaptchaImages(frame)
    console.log('getCaptchaImages ok')
    const diffImage = await getDiffImage(images)
    const center = await getPuzzlePieceSlotCenterPosition(diffImage)

    await slidePuzzlePiece(page, frame, center)
}

async function clickVerifyButton(frame, fail) {
    console.log('clickVerifyButton')

    if (fail) {
        const geeTestResetTipContent = await frame.waitForSelector('.geetest_reset_tip_content')
        await cursor.click(geeTestResetTipContent)
    } else {
        const clickToverify = await frame.waitForSelector('[aria-label="Click to verify"]')
        console.log("'Click to verify' selector waited")
        await cursor.move(clickToverify)
        await cursor.click(clickToverify)
    }

    await frame.waitForTimeout(1000)
}

async function getCaptchaImages(frame) {
    console.log('getCaptchaImages')
    console.log('geeTest_canvas_img existance: ', !frame.waitForSelector('.geetest_canvas_img canvas'))

    await frame.waitForSelector('.geetest_canvas_img canvas')

    const images = await frame.$$eval(
        '.geetest_canvas_img canvas',
        (canvases) => {
            return canvases.map((canvas) => {
                // This will get the base64 image data from the
                // html canvas. The replace function simply strip
                // the "data:image" prefix.
                return canvas.toDataURL().replace(/^data:image\/png;base64,/, '')
            })
        },
    )

    // For each base64 string create a Javascript buffer.
    const buffers = images.map((img) => new Buffer(img, 'base64'))
    console.log('buffers length: ', buffers.length)
    // And read each buffer into a Jimp image.
    return {
        captcha: await Jimp.read(buffers[0]),
        puzzle: await Jimp.read(buffers[1]),
        original: await Jimp.read(buffers[2]),
    }
}

async function getDiffImage(images) {
    await console.log('getDiffImage')
    const {width, height} = images.original.bitmap

    // Use the pixelmatch package to create an image diff
    const diffImage = new Jimp(width, height)
    pixelmatch(
        images.original.bitmap.data,
        images.captcha.bitmap.data,
        diffImage.bitmap.data,
        width,
        height,
        {includeAA: true, threshold: 0.2},
    )

    // Use opencv to make the diff result more clear
    const src = cv.matFromImageData(diffImage.bitmap)
    const dst = new cv.Mat()
    const kernel = cv.Mat.ones(5, 5, cv.CV_8UC1)
    const anchor = new cv.Point(-1, -1)
    cv.threshold(src, dst, 127, 255, cv.THRESH_BINARY)
    cv.erode(dst, dst, kernel, anchor, 1)
    cv.dilate(dst, dst, kernel, anchor, 1)

    return new Jimp({
        width: dst.cols,
        height: dst.rows,
        data: Buffer.from(dst.data),
    })
}

async function getPuzzlePieceSlotCenterPosition(diffImage) {
    await console.log('getPuzzlePieceSlotCenterPosition')
    const src = cv.matFromImageData(diffImage.bitmap)
    const dst = new cv.Mat()

    cv.cvtColor(src, src, cv.COLOR_BGR2GRAY)
    cv.threshold(src, dst, 150, 255, cv.THRESH_BINARY_INV)

    // This will find the contours of the image.
    const contours = new cv.MatVector()
    const hierarchy = new cv.Mat()
    cv.findContours(
        dst,
        contours,
        hierarchy,
        cv.RETR_EXTERNAL,
        cv.CHAIN_APPROX_SIMPLE,
    )

    // Next, extract the center position from these contours.
    const contour = contours.get(0)
    const moment = cv.moments(contour)
    const cx = Math.floor(moment.m10 / moment.m00)
    const cy = Math.floor(moment.m01 / moment.m00)

    // Just for fun, let's draw the contours and center on a new image.
    cv.cvtColor(dst, dst, cv.COLOR_GRAY2BGR)
    const red = new cv.Scalar(255, 0, 0)
    cv.drawContours(dst, contours, 0, red)
    cv.circle(dst, new cv.Point(cx, cy), 3, red)
    new Jimp({
        width: dst.cols,
        height: dst.rows,
        data: Buffer.from(dst.data),
    }).write('./contours.png')

    return {
        x: cx,
        y: cy,
    }
}

async function slidePuzzlePiece(page, frame, center) {
    console.log("slidePuzzlePiece")

    const sliderHandle = await frame.$('.geetest_slider_button')
    const handle = await sliderHandle.boundingBox()

    let handleX = handle.x + handle.width / 2
    let handleY = handle.y + handle.height / 2

    await cursor.moveTo({x: handleX, y: handleY})
    await page.mouse.down()

    let destX = handleX + center.x
    let destY = handle.y + handle.height / 3

    await cursor.moveTo({x: destX, y: handleY})
    await page.waitForTimeout(100)

    // find the location of my puzzle piece.
    const puzzlePos = await findMyPuzzlePiecePosition(page, frame)
    destX = destX + center.x - puzzlePos.x
    destY = handle.y + handle.height / 2

    await cursor.moveTo({x: destX, y: destY})
    await page.mouse.up()
}

async function findMyPuzzlePiecePosition(page, frame) {
    // Must call the getCaptchaImages again, because we have changed the
    // slider position (and therefore the image)
    const images = await getCaptchaImages(frame)
    const srcPuzzleImage = images.puzzle
    const srcPuzzle = cv.matFromImageData(srcPuzzleImage.bitmap)
    const dstPuzzle = new cv.Mat()

    cv.cvtColor(srcPuzzle, srcPuzzle, cv.COLOR_BGR2GRAY)
    cv.threshold(srcPuzzle, dstPuzzle, 127, 255, cv.THRESH_BINARY)

    const kernel = cv.Mat.ones(5, 5, cv.CV_8UC1)
    const anchor = new cv.Point(-1, -1)
    cv.dilate(dstPuzzle, dstPuzzle, kernel, anchor, 1)
    cv.erode(dstPuzzle, dstPuzzle, kernel, anchor, 1)

    const contours = new cv.MatVector()
    const hierarchy = new cv.Mat()
    cv.findContours(
        dstPuzzle,
        contours,
        hierarchy,
        cv.RETR_EXTERNAL,
        cv.CHAIN_APPROX_SIMPLE,
    )

    const contour = contours.get(0)
    const moment = cv.moments(contour)

    return {
        x: Math.floor(moment.m10 / moment.m00),
        y: Math.floor(moment.m01 / moment.m00),
    }
}

module.exports = {
    getToken: main,
}
