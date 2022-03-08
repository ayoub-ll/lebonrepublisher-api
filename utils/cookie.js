const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const axios = require("axios");
puppeteer.use(StealthPlugin())

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

module.exports = {
    getFreshDatadomeCookie: getFreshDatadomeCookie
}