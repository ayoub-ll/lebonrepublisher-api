const Jimp = require('jimp')
const pixelmatch = require('pixelmatch')
const {cv} = require('opencv-wasm')
const randomUseragent = require('random-useragent')

function captchaNeedSlide(frame) {
    return new Promise((resolve) => {
        frame.waitForSelector('.geetest_fullpage_click', {timeout: 5000})
            .then((result) => {
                console.log(".geetest_fullpage_click DETECTED")
                console.log("geeTestFullPageClick style: ", result.style)
                console.log("geeTestFullPageClick style display: ", result.style.display)
                resolve(result.style.display === 'none')
                return result.style.display === 'none'
            })
            .catch(() => {
                console.log(".geetest_fullpage_click NOT DETECTED")
                resolve(false)
                return false
            })
    })
}

async function resolveCaptcha(page, cursor) {
    console.log("inResolveCatpcha")

    while (!(await page.$('#didomi-notice-disagree-button'))) {
        await page.waitForTimeout(3500)

        const elementHandle = await page.$('iframe')
        const frame = await elementHandle.contentFrame()
        const cptchEn = await frame.$('[aria-label="Click to verify"]')
        const cptchFr = await frame.$('[aria-label="Cliquer pour vérifier"]')

        if (await frame && (await cptchEn || await cptchFr)) {

            // Mouve mouse
            await cursor.moveTo({
                x: Math.floor(Math.random() * (750 - 15 + 1) + 15),
                y: Math.floor(Math.random() * (800 - 25 + 1) + 25)
            })
            console.log("after mouse move")

            /* CAPTCHA DETECTED ZONE */
            if (await isThereCaptcha(await page)) {
                await console.log('CAPTCHA DETECTED')

                const elementHandle = await page.$('iframe')
                const frame = await elementHandle.contentFrame()

                await clickVerifyButton(frame, cursor, false)
                await captcha(page, frame, cursor)
                await page.waitForTimeout(4000)


                while (await isCaptchaFailed(await page)) {
                    await console.log("IN isCaptchaFailed WHILE")
                    await page.waitForTimeout(
                        Math.floor(Math.random() * (2100 - 1000 + 1) + 1000),
                    )
                    if (!await captchaNeedSlide(frame)) {
                        await clickVerifyButton(frame, cursor, true)
                    }

                    await captcha(page, frame, cursor)
                }

                await console.log("AFTER isCaptchaFailed WHILE")
            } else {
                await console.log("NO CAPTCHA DETECTED")
            }
            break;
        }

        await page.setUserAgent(randomUseragent.getRandom(function (ua) {
            return parseFloat(ua.browserVersion) >= 20;
        }))
        await page.reload({waitUntil: ["networkidle0", "domcontentloaded"]})
    }


}

async function isThereCaptcha(page) {
    const elementHandle = await page.$('iframe')

    if (await elementHandle !== null) {
        const frame = await elementHandle.contentFrame()
        const cptchEn = await frame.$('[aria-label="Click to verify"]')
        const cptchFr = await frame.$('[aria-label="Cliquer pour vérifier"]')

        return !!(await cptchEn || await cptchFr);
    } else {
        await console.log("elementHandle null in 'isThereCaptcha' method")
    }
}

async function captcha(page, frame, cursor) {
    const images = await getCaptchaImages(await frame)
    await console.log('getCaptchaImages ok')
    const diffImage = await getDiffImage(images)
    const center = await getPuzzlePieceSlotCenterPosition(diffImage)
    await console.log('slidePuzzlePiece variables passed: ', !page, !frame, !center, !cursor)

    await slidePuzzlePiece(page, frame, center, cursor)
}

function isCaptchaFailed(page) {
    page.waitForTimeout(5000)
    return new Promise((resolve) => {
        page.waitForSelector('input[type="email"]', {timeout: 8000})
            .then(() => {
                console.log("NO CAPTCHA FAIL DETECTED")
                resolve(false)
                return false
            })
            .catch(() => {
                page.waitForSelector('#didomi-notice-disagree-button', {timeout: 30000})
                    .then(() => {
                        console.log("NO CAPTCHA FAIL DETECTED")
                        resolve(false)
                        return false
                    })
                    .catch((e) => {
                        console.log("CAPTCHA FAIL DETECTED: ", e)
                        //page.screenshot({path: `captchaFail.png`})
                        resolve(true)
                        return true
                    })
            })
    })
}

async function clickVerifyButton(frame, cursor, fail) {
    console.log('clickVerifyButton')

    if (fail) {
        const geeTestResetTipContent = await frame.waitForSelector('.geetest_reset_tip_content')
        await cursor.click(geeTestResetTipContent)
    } else {
        const clickToverify = await frame.waitForSelector('[aria-label="Click to verify"]') ?? await frame.waitForSelector('[aria-label="Cliquer pour vérifier"]')
        console.log("'Click to verify' selector waited")
        await cursor.move(clickToverify)
        await cursor.click(clickToverify)
    }

    await frame.waitForTimeout(1000)
}

async function getCaptchaImages(frame) {
    await console.log('getCaptchaImages')
    await console.log('geeTest_canvas_img existance: ', !frame.waitForSelector('.geetest_canvas_img canvas'))

    await frame.waitForSelector('.geetest_canvas_img canvas', {timeout: 5000})
        .catch((e) => {
            console.log(".geetest_canvas_img NOT DETECTED")
            throw e
        })

    if (!frame) {
        console.error('[ERROR] frame null in getCaptchaImages')
        throw '[ERROR] frame null in getCaptchaImages'
    }

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
    const buffers = await images.map((img) => new Buffer(img, 'base64'))
    await console.log('buffers length: ', await buffers.length)
    // And read each buffer into a Jimp image.
    return {
        captcha: await Jimp.read(await buffers[0]),
        puzzle: await Jimp.read(await buffers[1]),
        original: await Jimp.read(await buffers[2]),
    }
}

function getDiffImage(images) {
    console.log('getDiffImage')
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
    /*
    cv.cvtColor(dst, dst, cv.COLOR_GRAY2BGR)
    const red = new cv.Scalar(255, 0, 0)
    cv.drawContours(dst, contours, 0, red)
    cv.circle(dst, new cv.Point(cx, cy), 3, red)
    new Jimp({
        width: dst.cols,
        height: dst.rows,
        data: Buffer.from(dst.data),
    }).write('./contours.png')
     */
    return {
        x: cx,
        y: cy,
    }
}

async function slidePuzzlePiece(page, frame, center, cursor) {
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
    const images = await getCaptchaImages(await frame)
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
    resolveCaptcha, resolveCaptcha
}
