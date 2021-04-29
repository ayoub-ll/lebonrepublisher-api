const axios = require('axios')
const randomUseragent = require('random-useragent')

function main(token, adsIds, cookie) {
    return new Promise((resolve) => {
        getPersonalData(token, cookie)
            .then((response) => {
                let personalData = {
                    email: response.data.personalData.email,
                    phone: response.data.personalData.phones.main.number
                }

                getAllAds(token, cookie)
                    .then((response) => {
                        const adsFiltered = filterAdsByIds(response.data.ads, adsIds)
                        const adsReady = constructAd(adsFiltered, personalData)

                        deleteAds(token, cookie, adsIds)

                        adsReady.forEach((ad) => {
                            republishAds(token, cookie, ad)
                                .then(() => {
                                    resolve()
                                    console.log("republish OK")
                                })
                                .catch(() => {
                                    throw 500
                                })
                        })
                    })
                    .catch(() => {
                        throw 500
                    })
            })
            .catch(() => {
                throw 500
            })
    })
}

/**
 * Filter ads array by Ids
 */
function filterAdsByIds(allAds, adsIds) {
    const result = []

    allAds.forEach((element) => {
        if (adsIds.includes(element.list_id)) {
            result.push(element)
        }
    })

    console.log('filterAdsByIds OK')
    return result
}

/**
 * Re-construct/mapping Ad to be able to republish endpoint
 */
function constructAd(ads, personalData) {
    const result = []

    ads.forEach((ad) => {

        const imagesArray = []
        ad.images.urls.forEach((imageUrl) => {
            imagesArray.push({
                name: imageUrl.substring(imageUrl.lastIndexOf('/') + 1),
                url: imageUrl.split(/[?#]/)[0]
            })
        })

        result.push({
            images: imagesArray,
            attributes: {},
            email: personalData.email, // api lbc via https://api.leboncoin.fr/api/accounts/v1/accounts/me/personaldata
            phone: personalData.phone, // TODO: (à caler par rapport au bool has_phone)
            category_id: ad.category_id,
            ad_type: ad.ad_type, // api lbc https://api.leboncoin.fr/api/dashboard/v1/search
            location: {
                address: ad.location.address, // api lbc https://api.leboncoin.fr/api/dashboard/v1/search
                district: "", // absent partout mais à priori ""
                city: ad.location.city,
                label: ad.location.city,
                lat: ad.location.lat,
                lng: ad.location.lng,
                zipcode: ad.location.zipcode,
                geo_source: ad.location.source,
                geo_provider: ad.location.provider,
                region: ad.location.region_id,
                region_label: ad.location.region_name,
                department: ad.location.department_id,
                dpt_label: ad.location.department_name,
                country: ad.location.country_id
            },
            pricing_id: "b1ba354c1fea2f946b70f63422494ea2", // à priori tout le temps "b1ba354c1fea2f946b70f63422494ea2" (récupéré api LBC: https://api.leboncoin.fr/api/options/v1/pricing/classifieds/deposit/description à la création d'une annonce, au niveau categorie)
            subject: ad.subject,
            body: ad.body,
            price: ad.price[0],
            phone_hidden: ad.has_phone, // (has_phone) api lbc https://api.leboncoin.fr/api/dashboard/v1/search
            no_salesmen: ad.owner.no_salesmen
        })
    })

    return result
}

function getPersonalData(token, cookie) {
    return new Promise((resolve) => {
        axios.get('https://api.leboncoin.fr/api/accounts/v1/accounts/me/personaldata', {
            headers: {
                'accept': '*/*',
                'accept-language': 'en-GB,en;q=0.9',
                'authorization': token,
                'authority': 'api.leboncoin.fr',
                'content-type': 'application/json',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site',
                'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="90", "Google Chrome";v="90"',
                'sec-ch-ua-mobile': '?0',
                'cookie': cookie,
                'origin': 'https://www.leboncoin.fr',
                'referer': 'https://www.leboncoin.fr/compte/part/mes-annonces',
                'user-agent': randomUseragent.getRandom(function (ua) {
                    return parseFloat(ua.browserVersion) >= 20;
                })
            },
        })
            .then(function (response) {
                console.log("getPersonalData OK")
                resolve(response)
            })
            .catch(function (error) {
                console.log("getPersonalData ERROR: ", error)
                return null
            })
    })
}

/**
 * Republish ad by token and adComplete
 */
function republishAds(token, cookie, ad) {
    return new Promise((resolve) =>
        axios
            .post('https://api.leboncoin.fr/api/adsubmit/v1/classifieds', ad,
                {
                    headers: {
                        'content-type': 'application/json',
                        'authority': 'api.leboncoin.fr',
                        'accept': '/',
                        'authorization': token,
                        'user-agent': randomUseragent.getRandom(function (ua) {
                            return parseFloat(ua.browserVersion) >= 20;
                        }),
                        'sec-gpc': 1,
                        'origin': 'https://www.leboncoin.fr',
                        'sec-fetch-site': 'same-site',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-dest': 'empty',
                        'referer': 'https://www.leboncoin.fr/',
                        'accept-language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
                        'cookie': cookie,
                    }
                })
            .then(function (response) {
                resolve()
                console.log("re-Publish Ad response: ", response)
            })
            .catch(function (error) {
                console.log("re-Publish ad ERROR: ", error)
            })
    )
}

/**
 * Curl API LBC /search
 * Fetch all ads by token
 */
function getAllAds(token, cookie) {
    return new Promise((resolve) => {
        axios
            .post('https://api.leboncoin.fr/api/dashboard/v1/search', {
                    context: "default",
                    filters: {},
                    include_inactive: true,
                    limit: 30,
                    offset: 0,
                    pivot: null,
                    sort_by: "date",
                    sort_order: "desc",
                },
                {
                    headers: {
                        'accept': '*/*',
                        'accept-language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
                        'content-type': 'application/json',
                        'content-length': 130,
                        'cookie': cookie,
                        'authorization': token,
                        'user-agent': randomUseragent.getRandom(function (ua) {
                            return parseFloat(ua.browserVersion) >= 20;
                        }),
                        'origin': 'https://www.leboncoin.fr',
                        'sec-fetch-site': 'same-site',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-dest': 'empty',
                        'sec-gpc': 1,
                        'referer': 'https://www.leboncoin.fr/',
                    },
                }
            )
            .then((response) => {
                resolve(response)
                console.log("GetAllAds OK")
            })
            .catch((error) => {
                console.log("error fetch ads from LBC endpoint: v1/search: ", error)
            })
    })
}


function deleteAds(token, cookie, adsIds) {
    axios.delete('https://api.leboncoin.fr/api/pintad/v1/public/manual/delete/ads', {
        headers: {
            "authority": "api.leboncoin.fr",
            "authorization": token,
            "api_key": "ba0c2dad52b3ec",
            'user-agent': randomUseragent.getRandom(function (ua) {
                return parseFloat(ua.browserVersion) >= 20;
            }),
            "accept": "*/*",
            "content-type": "application/json",
            "origin": "https://www.leboncoin.fr",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "sec-gpc": "1",
            "referer": "https://www.leboncoin.fr/",
            "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
            "cookie": cookie
        },
        data: {
            "list_ids": adsIds
        }
    })
        .then(function (response) {
            console.log("deleteAds OK: ", response)
        })
        .catch(function (error) {
            console.log("deleteAds ERROR: ", error)
        })
}

module.exports = {
    republishAds: main,
}
