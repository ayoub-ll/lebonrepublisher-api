const axios = require('axios')
const randomUseragent = require('random-useragent')

function main(token, adsIds, cookie) {
    return new Promise((resolve) => {
        getPersonalData(token, cookie).then((response) => {
            let personalData = {
                email: response.data.personalData.email,
                phone: response.data.personalData.phones.main.number
            }

            getAllAds(token, cookie).then((response) => {
                const adsFiltered = filterAdsByIds(response.data.ads, adsIds)
                const adsReady = constructAd(adsFiltered, personalData)

                console.log("adsReady: ", adsReady)
            })
        })




        /*

                deleteAds(token, adsIds)

                adsReady.forEach((ad) => {
                    republishAds(token, ad).then(() => {
                        console.log("republish OK")
                    })
                })
                */
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
function republishAds(token, ad) {
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
                        'cookie': '__Secure-InstanceId=b435ada8-0d6d-49c8-b4a2-b4b0cd2bc0c6; tooltipExpiredAds=true; tooltipStatsAds=true; auto_promo_mars_2021=1; AMCV_C8D912835936C98A0A495D98@AdobeOrg=MCMID|09862883183941386231636978989261649919; nlid=78b0db76|e923d5a; cookieFrame=2; euconsent=BOXo8CsOXo8CsAAAACFRBr-AAAAht7_______9______9uz_Gv_v_f__33e8__9v_l_7_-___u_-33d4-_1vX99yfm1-7ftr3tp_86ues2_Xur_959__njE; consent_allpurpose=cDE9MTtwMj0xO3AzPTE7cDQ9MTtwNT0x; cookieBanner=1; didomi_token=eyJ1c2VyX2lkIjoiMTc3ZmNkZWItYTIyYS02NzRjLWE4MTktMGIwZTk3ODY3YTAyIiwiY3JlYXRlZCI6IjIwMjEtMDQtMDJUMTM6Mzg6MDMuNTg1WiIsInVwZGF0ZWQiOiIyMDIxLTA0LTAyVDEzOjM4OjAzLjU4NVoiLCJ2ZW5kb3JzIjp7ImVuYWJsZWQiOlsiYW1hem9uIiwic2FsZXNmb3JjZSIsImdvb2dsZSIsImM6bmV4dC1wZXJmb3JtYW5jZSIsImM6Y29sbGVjdGl2ZS1oaFNZdFJWbiIsImM6cm9ja3lvdSIsImM6cHVib2NlYW4tYjZCSk10c2UiLCJjOnJ0YXJnZXQtR2VmTVZ5aUMiLCJjOnNjaGlic3RlZC1NUVBYYXF5aCIsImM6Z3JlZW5ob3VzZS1RS2JHQmtzNCIsImM6cmVhbHplaXRnLWI2S0NreHlWIiwiYzp2aWRlby1tZWRpYS1ncm91cCIsImM6c3dpdGNoLWNvbmNlcHRzIiwiYzpsdWNpZGhvbGQteWZ0YldUZjciLCJjOmxlbW9tZWRpYS16YllocDJRYyIsImM6eW9ybWVkaWFzLXFuQldoUXlTIiwiYzpzYW5vbWEiLCJjOnJhZHZlcnRpcy1TSnBhMjVIOCIsImM6cXdlcnRpemUtemRuZ0UyaHgiLCJjOnZkb3BpYSIsImM6cmV2bGlmdGVyLWNScE1ucDV4IiwiYzpyZXNlYXJjaC1ub3ciLCJjOndoZW5ldmVybS04Vllod2IyUCIsImM6YWRtb3Rpb24iLCJjOndvb2JpIiwiYzpzaG9wc3R5bGUtZldKSzJMaVAiLCJjOnRoaXJkcHJlc2UtU3NLd21IVksiLCJjOmIyYm1lZGlhLXBRVEZneVdrIiwiYzpwdXJjaCIsImM6bGlmZXN0cmVldC1tZWRpYSIsImM6c3luYy1uNzRYUXByZyIsImM6aW50b3dvd2luLXFhenQ1dEdpIiwiYzpkaWRvbWkiLCJjOnJhZGl1bW9uZSIsImM6YWRvdG1vYiIsImM6YWItdGFzdHkiLCJjOmdyYXBlc2hvdCIsImM6YWRtb2IiLCJjOmFkYWdpbyIsImM6bGJjZnJhbmNlIl19LCJ2ZW5kb3JzX2xpIjp7ImVuYWJsZWQiOlsiZ29vZ2xlIl19LCJ2ZXJzaW9uIjoyLCJhYyI6IkRFMkF3QUVJQWZvQmhRRHhBSG1BU1NBa3NDSklIRUFPckFpREJGS0NLZ0VtNEp2QVRrQXRyQmJlQzR3RnlRTGxnWURBd2lCaWFBQUEuREUyQXdBRUlBZm9CaFFEeEFIbUFTU0Frc0NKSUhFQU9yQWlEQkZLQ0tnRW00SnZBVGtBdHJCYmVDNHdGeVFMbGdZREF3aUJpYUFBQSIsInB1cnBvc2VzIjp7ImVuYWJsZWQiOlsicGVyc29ubmFsaXNhdGlvbmNvbnRlbnUiLCJwZXJzb25uYWxpc2F0aW9ubWFya2V0aW5nIiwicHJpeCIsIm1lc3VyZWF1ZGllbmNlIiwiZXhwZXJpZW5jZXV0aWxpc2F0ZXVyIl19fQ==; euconsent-v2=CPEBy5UPEBy5UAHABBENBTCgAP_AAHLAAAAAG7tf_X_fb2vj-_599_t0eY1f9_63v6wzjheNs-8NyZ_X_L4Xo2M6vB36pq4KmR4Eu3LBAQdlHOHcTQmQ4IkVqTPsbk2Mr7NKJ7LEilMbe2dYGH9_n8XTuZKY70_8___z_3-__v__7rbgCAAAAAAAIAgc6ASYal8AAmJY4Ek0aVQogQhXEhUAoAKKEYWiawgJHBTsrgI9QQIAEBqAjAiBBiCjFgEAAAEASERACAHggEQBEAgABACpAQgAIkAAWAFgYBAAKAaFABFAEIEhBEYFRymBARItFBPIGAAQAAAAAAAAAAAAAAAgBigXAABwAEgANAAeABSADAAMgAigBSAFQALAAYgA1gB8AH8AQgBDACYAFoALkAXgBfgDCAMQAZgA2gB4AD1AH8AggBCgCKgEaARwAkwBKgCZgE-AUAApABUACtAFlALcAuIBlAGXAM0AzoBpgGqANgAbQA4IBxAHIAOYAdkA7wDwgHmAekA-QD6AH4AP-AgoCDQEJAQoAiABGACOQElASYAlcBLQEuAJgATeAngCfAFBAKKAUgApYBUQCrwFdAV8As0BaAFpALnAXYBdwC8gF8AL8AYEAwgBioDOAM6AaAA04BrQDaAG8AOFAc0BzgDqgHZAO2Ad8A8QB6wD2wH6AfsA_4CBAEDgIMAQkAhcBD4CJQEWAI4gR0BHYCPQEggJDASKAlEBKkCXgJfgTCBMQCZoE2ATaAncBP4ChQFEAKKAUZAo4CkAFMwKbApwBT4CogFSQKtAq8BWYCtoFiAWLAscCyYFlgWYAs4BaIC1YFrgWwAtwBcEC4wLkgXMBdAC64F2gXdAvMC9YF7gX2AwIBhUDDQMPgYoBioDGoGPAZAAyIBkoDK4GYAZiAzSBnAGcwM8Az6BoIGhANFAafA1oDW4Guga8A2QBtQDbQG4ANygboBusDfQN-gcIBw0DiQOKAccA5IBykDmAOZAc8A6eB1oHYAO4Ad2A72B4QHhgPQgemB6gwFmAAcABIADwAKQAYABkAEUAKQAqABYADEAGoAP4AhACGAEwAKYAXAAvQBhAGIAMwAbYA_gEFAI0AjwBJgCVAEzAJ8AoABSACoAFaALKAW4BcADHgGUAZYAzoBpgGqANoAcEA4gDkAHMAOyAd4B4QDzAPSAfQB-AD_gISAhQBEACJAEYAI4ASUAlYBLQCYAE3gJ4AnwBQQCigFIAKWAVEAq4BW4CugK-AWIAswBc4C7ALuAXkAvgBfgDCAGKgM4AzoBoIDTANOAa0A2gBvADhQHNAc4A6oB2QDtgHfAPEAesA9oB8gD9gIEAQOAhIBC4CHwESgIsARxAjoCOwEegJBASGAkUBJwCUQEqQJeAl-BMIExAJmgTYBNoCcQE7gJ_AUKAogBRQCjIFHAUgApmBTYFOQKeAp8BUQCpIFWgVeArMBWwCxIFjgWTAssCzAFnALRAWrAtcC2IFtgW4AuABccC5gLoAXXAu0C7oF5AXpAvcC-AF9gMCAYUAw0Bh8DFAMVAY0Ax4BkADIgGSgMrAZiAzSBnAGcwM8Az6BoIGhANFAafA1oDXQGyQNqA2wBuEDdAN1gb6Bv0DhAOGAcSA44ByQDlIHMAcyA54B08DrQOwAdwA7sB3sDwgPDAehA9MD1CAOAAAMABwAJAAWAA0AB4AFAALQAZABoADoAIgASAAqABYAC4AGIAP4AggCHAEwATQApgBVACuAFyALwAvwBhAGIAMwAaAA2gBvAD1AH8AgQBFwCNAI8ASIAkwBKwCfAKAAUgAqABVACtgFiAWUAtwC5AF8AMIAYkAygDLgGaAZ0A0wDVAGwANqAb4BwADiAHJAOYA5wB2QDvAPCAeYB6AD2gHyAfgA_wCCwEJAQoAiABFICMAIyARwAkoBKQCVgEuAJhATcBOACeAE-AKCAUMAosBSAFJAKWAU8AqIBVwCsgFbgK6Ar4BYgCzQFoAWkAucBdgF3ALyAXwAvwBgADCAGKAMzAZwBnQDQQGmAacA1YBrQDaAG8AOEAc2A6gDqgHXAOyAdsA74B4gD0QHqAesA9sB-QH8AQAAgQBA4CE4ELgQwAh8BEMCJQImARZAjgCO4EegR9AkECRQEnAJRASoAlcBLUCXgJfgTCBMQCZgE0wJsAm0BOICdwE_wKEAoUBRECjAKQgUkBScCmQKcgU8BT4CogFSQKtAq8BWYCtoFfAV_AsQCxYFjgWTAssCzAFnALRAWmAtWBa4FuALeAXBAuMC5IFzgXRAusC7gF5AL0gXsBfsDAQMDAYVAwwDDwGJQMUAxUBjQDHgGQAMiAZKAycBlYDLQGYgM0gZuBn8DQQNCgaIBooDR4GkgaWA08BqcDVQNWga0BroDXwGwgNkgbWBtgDbgG4QN0A3WBvIG9QN9A36BwAHAwOEA4YBxIDjAHHAOSgcwBzMDngOfAdHA6UDp4HUgdVA6wDsAHagO4Ad3A70DvgHgwPDA8QB48DyQPKgecB6MD0wPUAAA.f_gADlgAAAAA; include_in_experiment=true; newad_params_reco_accepted=1; adview_clickmeter=lbc-user-recommendations:model-20210421T000000-try-3:model_api-1.6.0:api-2.4.4:api_id-1.0__homepage__3__sdrn:leboncoin:recommendation:d42e4a68b204f6991ee25fc8e662b349; luat=eyJhbGciOiJSUzI1NiIsImtpZCI6IjA2MGMwYTgyLTk0YzktNTQ0Ny1iYjFjLWFkMGI1YzhkNGU5NSIsInR5cCI6IkpXVCJ9.eyJjbGllbnRfaWQiOiJsYmMtZnJvbnQtd2ViIiwiZXhwIjoxNjE5NDg0NzMxLCJpYXQiOjE2MTk0ODExMzEsImlkIjoiMmJlMzExNmQtNTk4MC00NTU1LWI5M2EtYmY1OWRlMWZlZjM0IiwiaW5zdGFsbF9pZCI6IjQyMzI5ZDkwLWFkYmYtNGY1Ny05NTExLTM4MTIyZDY3MWZhMyIsImp0aSI6ImRkNjU0NmQwLWZjZmItNGYxOS05MjFhLWJmYWY1ZWY1ODVjZiIsInJlZnVzZWRfc2NvcGVzIjpudWxsLCJyZXF1ZXN0X2lkIjoiYWNiMjg3MjYtZTUxMS00YjI4LWE3MTktMTUzYWU4MzZhMGE0Iiwic2NvcGVzIjpbImxiY2xlZ2FjeS5wYXJ0IiwibGJjLmF1dGguZW1haWwucGFydC5jaGFuZ2UiLCJsYmMuKi4qLm1lLioiLCJsYmNncnAuYXV0aC5zZXNzaW9uLm1lLmRpc3BsYXkiLCJsYmMuKi5tZS4qIiwibGJjLmVzY3Jvd2FjY291bnQubWFpbnRlbmFuY2UucmVhZCIsImxiY2dycC5hdXRoLnNlc3Npb24ubWUucmVhZCIsImxiY2xlZ2FjeS51c2VycyIsImxiY2dycC5hdXRoLnNlc3Npb24ubWUuZGVsZXRlIiwiYmV0YS5sYmMuYXV0aC50d29mYWN0b3IubWUuKiIsIm9mZmxpbmUiLCJsYmNncnAuYXV0aC50d29mYWN0b3Iuc21zLm1lLmFjdGl2YXRlIiwibGJjZ3JwLmF1dGgudHdvZmFjdG9yLm1lLioiXSwic2Vzc2lvbl9pZCI6IjZlYWM3YzZlLTZkNDUtNGE4Ny1iMGY1LWNkM2YzY2E3MTAxNCIsInN1YiI6ImxiYztkMTZjMDc0MS1hZWFjLTQxZDItYjE0NC0wNDNlYTVlYzlhZWE7MTIzNDE3MTMifQ.QkMfhFcBBcYifunmOctS3-8wJgS-rC4AW5oBKJq24dh_deeJGSuSycvHh_541W00KhpZiqSNOHb9nmRrVh-HQPLhpX_o0_0u16BJ5c95eWpwiKfDNfpqIAj9pO2GOateQKhFYLrpeqdUnceeixAJev185mVjCGEP0n_uMFrhEeA85wE4AbmL_g3YQ_L7MRbr-fX_tL1laUg6pxJqx7y3l5Sw-gux40EsC1XRnCmwO_jG6OCGpIgaWKDM_Nt-ep4UgNjOHoXCllxZd8P_b6-m2ZFFnmpZsY_ItvL5mzlRGGaPCjG-zj4SNBlrBkZXvWC3aXOxp2rvLX9CwEAQhEcm3HPBdKwFWCD5sdJ3Oolx22YQzYMteFivwdE2USK7y3pduZ4lxz6cN8MkGWjY_Z5V1gA31zKGXl32AsBBfbnvWhfx2vx_6zW6z8Vgu8lCF0114Ay8nKtC7azylJDtPiGqrD4kGvOYFE9a7oQFLQf2wpbSyoevitMiInu6Dvo2_p2ZCA-K2Y7Ka2nNdUNXtdgyJwDmRAKdoZfq2GuSZ5QAnDLzM68go_g0ZZziYEdeojvxP2SkDu19bL1MZSC0IHRQcZIR1ttIfZ2ORRe8f6tuDrT7XDQdVrsHE_F4Cfn7OvbQiAnv5Fsnn8Nmp81tcuS1A6IbPR2gcTDg3p15W7a1cq8; srt=eyJhbGciOiJSUzI1NiIsImtpZCI6IjA2MGMwYTgyLTk0YzktNTQ0Ny1iYjFjLWFkMGI1YzhkNGU5NSIsInR5cCI6IkpXVCJ9.eyJjbGllbnRfaWQiOiJsYmMtZnJvbnQtd2ViIiwiaWF0IjoxNjE5NDgxMTMxLCJpZCI6ImY5NmNhNjMyLTZlYjEtNDZjOS1hNTFkLWQyOGVlYzQxYTk1NiIsImp0aSI6IjFkNTZkOTA5LWM3MzctNGVhZi1hNjgwLWVjMTRhNDE4YmI5MiIsInJlcXVlc3RfaWQiOiJhY2IyODcyNi1lNTExLTRiMjgtYTcxOS0xNTNhZTgzNmEwYTQiLCJzZXNzaW9uX2lkIjoiNmVhYzdjNmUtNmQ0NS00YTg3LWIwZjUtY2QzZjNjYTcxMDE0Iiwic3ViIjoibGJjO2QxNmMwNzQxLWFlYWMtNDFkMi1iMTQ0LTA0M2VhNWVjOWFlYTsxMjM0MTcxMyJ9.REFnA6ITS-UEJhnaYTfAfxMRo3ceqZk6vUT5OHrQzKOEGYWfNqwrxP6fZYEHrbDLaThv5MX3n6YVjIRIY42HbcoU7bOFUVj0J-f5rh82qaeGpxyKJfJWmzKoLSj_e9ZkQhBaoWlMDvaiq2XXx4a-H3Is1WrGZ2coRogYRWTs2f6oK1zb1JVS3JSeLkpMKQv7weeSelPq7mdI_3zQBSAEi0OBX_anvhYcNuPdObcHt8IHG8B0LFtSsFH2J6AJdVyzReiiwtyd5iIJQMCRjp8oK1VBSYKNtjpwVGxbMz0n2SZ2iwZ9ZNSV4ZDPhdsgOk8Xvoglw7UIdLtwaKPhEmpcPyolgVriFAc-PXMGWREYrmG8Vq-zGzMNxrk2SHEQlDhS3fwtFvvB1LA__ueJspoyEEfEd59MyeLCk0L2sx6c_L02nmnLR0H4coRBQt5zpxGghIMPzJioh7ffGnLCJZMMJLpGDKfw2XfdLbJOpzsQzqLwgSootCWnZhi2i-7SbH2Wlcw5iJw5q440OGwsInpSfZgUR3xWg7vZ1WSX-Xp8vKKh11ZQYzlbAYwfAPt3IwoFsvp0Pk69tyozBmiFFGsaQsm6vP52GBMYU1pKBUZ5fJklHYYHmwlSCuV01tsgaLQW-rsDfFesOZTCawzMOzvex5qgIhp5aF3ZKzFVOz-AOrw; datadome=XydBx_J2371Ovw2b58rcKdX7VHl49TqHuAngb7JQxN-hdLOH4svurU~CL5odOXUkzB4JnsrN18EDS~P0Vdc7vJBxhqQ0up3SgUlbsyE23K',
                    }
                })
            .then(function (response) {
                resolve()
                console.log("Publish ad ok")
                console.log("Publish Ad response: ", response)
            })
            .catch(function (error) {
                console.log("Publish ad ERROR: ", error)
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


function deleteAds(token, adsIds) {
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
            "cookie": "__Secure-InstanceId=b435ada8-0d6d-49c8-b4a2-b4b0cd2bc0c6; tooltipExpiredAds=true; tooltipStatsAds=true; auto_promo_mars_2021=1; AMCV_C8D912835936C98A0A495D98@AdobeOrg=MCMID|09862883183941386231636978989261649919; nlid=78b0db76|e923d5a; cookieFrame=2; euconsent=BOXo8CsOXo8CsAAAACFRBr-AAAAht7_______9______9uz_Gv_v_f__33e8__9v_l_7_-___u_-33d4-_1vX99yfm1-7ftr3tp_86ues2_Xur_959__njE; consent_allpurpose=cDE9MTtwMj0xO3AzPTE7cDQ9MTtwNT0x; cookieBanner=1; didomi_token=eyJ1c2VyX2lkIjoiMTc3ZmNkZWItYTIyYS02NzRjLWE4MTktMGIwZTk3ODY3YTAyIiwiY3JlYXRlZCI6IjIwMjEtMDQtMDJUMTM6Mzg6MDMuNTg1WiIsInVwZGF0ZWQiOiIyMDIxLTA0LTAyVDEzOjM4OjAzLjU4NVoiLCJ2ZW5kb3JzIjp7ImVuYWJsZWQiOlsiYW1hem9uIiwic2FsZXNmb3JjZSIsImdvb2dsZSIsImM6bmV4dC1wZXJmb3JtYW5jZSIsImM6Y29sbGVjdGl2ZS1oaFNZdFJWbiIsImM6cm9ja3lvdSIsImM6cHVib2NlYW4tYjZCSk10c2UiLCJjOnJ0YXJnZXQtR2VmTVZ5aUMiLCJjOnNjaGlic3RlZC1NUVBYYXF5aCIsImM6Z3JlZW5ob3VzZS1RS2JHQmtzNCIsImM6cmVhbHplaXRnLWI2S0NreHlWIiwiYzp2aWRlby1tZWRpYS1ncm91cCIsImM6c3dpdGNoLWNvbmNlcHRzIiwiYzpsdWNpZGhvbGQteWZ0YldUZjciLCJjOmxlbW9tZWRpYS16YllocDJRYyIsImM6eW9ybWVkaWFzLXFuQldoUXlTIiwiYzpzYW5vbWEiLCJjOnJhZHZlcnRpcy1TSnBhMjVIOCIsImM6cXdlcnRpemUtemRuZ0UyaHgiLCJjOnZkb3BpYSIsImM6cmV2bGlmdGVyLWNScE1ucDV4IiwiYzpyZXNlYXJjaC1ub3ciLCJjOndoZW5ldmVybS04Vllod2IyUCIsImM6YWRtb3Rpb24iLCJjOndvb2JpIiwiYzpzaG9wc3R5bGUtZldKSzJMaVAiLCJjOnRoaXJkcHJlc2UtU3NLd21IVksiLCJjOmIyYm1lZGlhLXBRVEZneVdrIiwiYzpwdXJjaCIsImM6bGlmZXN0cmVldC1tZWRpYSIsImM6c3luYy1uNzRYUXByZyIsImM6aW50b3dvd2luLXFhenQ1dEdpIiwiYzpkaWRvbWkiLCJjOnJhZGl1bW9uZSIsImM6YWRvdG1vYiIsImM6YWItdGFzdHkiLCJjOmdyYXBlc2hvdCIsImM6YWRtb2IiLCJjOmFkYWdpbyIsImM6bGJjZnJhbmNlIl19LCJ2ZW5kb3JzX2xpIjp7ImVuYWJsZWQiOlsiZ29vZ2xlIl19LCJ2ZXJzaW9uIjoyLCJhYyI6IkRFMkF3QUVJQWZvQmhRRHhBSG1BU1NBa3NDSklIRUFPckFpREJGS0NLZ0VtNEp2QVRrQXRyQmJlQzR3RnlRTGxnWURBd2lCaWFBQUEuREUyQXdBRUlBZm9CaFFEeEFIbUFTU0Frc0NKSUhFQU9yQWlEQkZLQ0tnRW00SnZBVGtBdHJCYmVDNHdGeVFMbGdZREF3aUJpYUFBQSIsInB1cnBvc2VzIjp7ImVuYWJsZWQiOlsicGVyc29ubmFsaXNhdGlvbmNvbnRlbnUiLCJwZXJzb25uYWxpc2F0aW9ubWFya2V0aW5nIiwicHJpeCIsIm1lc3VyZWF1ZGllbmNlIiwiZXhwZXJpZW5jZXV0aWxpc2F0ZXVyIl19fQ==; euconsent-v2=CPEBy5UPEBy5UAHABBENBTCgAP_AAHLAAAAAG7tf_X_fb2vj-_599_t0eY1f9_63v6wzjheNs-8NyZ_X_L4Xo2M6vB36pq4KmR4Eu3LBAQdlHOHcTQmQ4IkVqTPsbk2Mr7NKJ7LEilMbe2dYGH9_n8XTuZKY70_8___z_3-__v__7rbgCAAAAAAAIAgc6ASYal8AAmJY4Ek0aVQogQhXEhUAoAKKEYWiawgJHBTsrgI9QQIAEBqAjAiBBiCjFgEAAAEASERACAHggEQBEAgABACpAQgAIkAAWAFgYBAAKAaFABFAEIEhBEYFRymBARItFBPIGAAQAAAAAAAAAAAAAAAgBigXAABwAEgANAAeABSADAAMgAigBSAFQALAAYgA1gB8AH8AQgBDACYAFoALkAXgBfgDCAMQAZgA2gB4AD1AH8AggBCgCKgEaARwAkwBKgCZgE-AUAApABUACtAFlALcAuIBlAGXAM0AzoBpgGqANgAbQA4IBxAHIAOYAdkA7wDwgHmAekA-QD6AH4AP-AgoCDQEJAQoAiABGACOQElASYAlcBLQEuAJgATeAngCfAFBAKKAUgApYBUQCrwFdAV8As0BaAFpALnAXYBdwC8gF8AL8AYEAwgBioDOAM6AaAA04BrQDaAG8AOFAc0BzgDqgHZAO2Ad8A8QB6wD2wH6AfsA_4CBAEDgIMAQkAhcBD4CJQEWAI4gR0BHYCPQEggJDASKAlEBKkCXgJfgTCBMQCZoE2ATaAncBP4ChQFEAKKAUZAo4CkAFMwKbApwBT4CogFSQKtAq8BWYCtoFiAWLAscCyYFlgWYAs4BaIC1YFrgWwAtwBcEC4wLkgXMBdAC64F2gXdAvMC9YF7gX2AwIBhUDDQMPgYoBioDGoGPAZAAyIBkoDK4GYAZiAzSBnAGcwM8Az6BoIGhANFAafA1oDW4Guga8A2QBtQDbQG4ANygboBusDfQN-gcIBw0DiQOKAccA5IBykDmAOZAc8A6eB1oHYAO4Ad2A72B4QHhgPQgemB6gwFmAAcABIADwAKQAYABkAEUAKQAqABYADEAGoAP4AhACGAEwAKYAXAAvQBhAGIAMwAbYA_gEFAI0AjwBJgCVAEzAJ8AoABSACoAFaALKAW4BcADHgGUAZYAzoBpgGqANoAcEA4gDkAHMAOyAd4B4QDzAPSAfQB-AD_gISAhQBEACJAEYAI4ASUAlYBLQCYAE3gJ4AnwBQQCigFIAKWAVEAq4BW4CugK-AWIAswBc4C7ALuAXkAvgBfgDCAGKgM4AzoBoIDTANOAa0A2gBvADhQHNAc4A6oB2QDtgHfAPEAesA9oB8gD9gIEAQOAhIBC4CHwESgIsARxAjoCOwEegJBASGAkUBJwCUQEqQJeAl-BMIExAJmgTYBNoCcQE7gJ_AUKAogBRQCjIFHAUgApmBTYFOQKeAp8BUQCpIFWgVeArMBWwCxIFjgWTAssCzAFnALRAWrAtcC2IFtgW4AuABccC5gLoAXXAu0C7oF5AXpAvcC-AF9gMCAYUAw0Bh8DFAMVAY0Ax4BkADIgGSgMrAZiAzSBnAGcwM8Az6BoIGhANFAafA1oDXQGyQNqA2wBuEDdAN1gb6Bv0DhAOGAcSA44ByQDlIHMAcyA54B08DrQOwAdwA7sB3sDwgPDAehA9MD1CAOAAAMABwAJAAWAA0AB4AFAALQAZABoADoAIgASAAqABYAC4AGIAP4AggCHAEwATQApgBVACuAFyALwAvwBhAGIAMwAaAA2gBvAD1AH8AgQBFwCNAI8ASIAkwBKwCfAKAAUgAqABVACtgFiAWUAtwC5AF8AMIAYkAygDLgGaAZ0A0wDVAGwANqAb4BwADiAHJAOYA5wB2QDvAPCAeYB6AD2gHyAfgA_wCCwEJAQoAiABFICMAIyARwAkoBKQCVgEuAJhATcBOACeAE-AKCAUMAosBSAFJAKWAU8AqIBVwCsgFbgK6Ar4BYgCzQFoAWkAucBdgF3ALyAXwAvwBgADCAGKAMzAZwBnQDQQGmAacA1YBrQDaAG8AOEAc2A6gDqgHXAOyAdsA74B4gD0QHqAesA9sB-QH8AQAAgQBA4CE4ELgQwAh8BEMCJQImARZAjgCO4EegR9AkECRQEnAJRASoAlcBLUCXgJfgTCBMQCZgE0wJsAm0BOICdwE_wKEAoUBRECjAKQgUkBScCmQKcgU8BT4CogFSQKtAq8BWYCtoFfAV_AsQCxYFjgWTAssCzAFnALRAWmAtWBa4FuALeAXBAuMC5IFzgXRAusC7gF5AL0gXsBfsDAQMDAYVAwwDDwGJQMUAxUBjQDHgGQAMiAZKAycBlYDLQGYgM0gZuBn8DQQNCgaIBooDR4GkgaWA08BqcDVQNWga0BroDXwGwgNkgbWBtgDbgG4QN0A3WBvIG9QN9A36BwAHAwOEA4YBxIDjAHHAOSgcwBzMDngOfAdHA6UDp4HUgdVA6wDsAHagO4Ad3A70DvgHgwPDA8QB48DyQPKgecB6MD0wPUAAA.f_gADlgAAAAA; include_in_experiment=true; newad_params_reco_accepted=1; adview_clickmeter=lbc-user-recommendations:model-20210421T000000-try-3:model_api-1.6.0:api-2.4.4:api_id-1.0__homepage__3__sdrn:leboncoin:recommendation:d42e4a68b204f6991ee25fc8e662b349; luat=eyJhbGciOiJSUzI1NiIsImtpZCI6IjA2MGMwYTgyLTk0YzktNTQ0Ny1iYjFjLWFkMGI1YzhkNGU5NSIsInR5cCI6IkpXVCJ9.eyJjbGllbnRfaWQiOiJsYmMtZnJvbnQtd2ViIiwiZXhwIjoxNjE5NDg0NzMxLCJpYXQiOjE2MTk0ODExMzEsImlkIjoiMmJlMzExNmQtNTk4MC00NTU1LWI5M2EtYmY1OWRlMWZlZjM0IiwiaW5zdGFsbF9pZCI6IjQyMzI5ZDkwLWFkYmYtNGY1Ny05NTExLTM4MTIyZDY3MWZhMyIsImp0aSI6ImRkNjU0NmQwLWZjZmItNGYxOS05MjFhLWJmYWY1ZWY1ODVjZiIsInJlZnVzZWRfc2NvcGVzIjpudWxsLCJyZXF1ZXN0X2lkIjoiYWNiMjg3MjYtZTUxMS00YjI4LWE3MTktMTUzYWU4MzZhMGE0Iiwic2NvcGVzIjpbImxiY2xlZ2FjeS5wYXJ0IiwibGJjLmF1dGguZW1haWwucGFydC5jaGFuZ2UiLCJsYmMuKi4qLm1lLioiLCJsYmNncnAuYXV0aC5zZXNzaW9uLm1lLmRpc3BsYXkiLCJsYmMuKi5tZS4qIiwibGJjLmVzY3Jvd2FjY291bnQubWFpbnRlbmFuY2UucmVhZCIsImxiY2dycC5hdXRoLnNlc3Npb24ubWUucmVhZCIsImxiY2xlZ2FjeS51c2VycyIsImxiY2dycC5hdXRoLnNlc3Npb24ubWUuZGVsZXRlIiwiYmV0YS5sYmMuYXV0aC50d29mYWN0b3IubWUuKiIsIm9mZmxpbmUiLCJsYmNncnAuYXV0aC50d29mYWN0b3Iuc21zLm1lLmFjdGl2YXRlIiwibGJjZ3JwLmF1dGgudHdvZmFjdG9yLm1lLioiXSwic2Vzc2lvbl9pZCI6IjZlYWM3YzZlLTZkNDUtNGE4Ny1iMGY1LWNkM2YzY2E3MTAxNCIsInN1YiI6ImxiYztkMTZjMDc0MS1hZWFjLTQxZDItYjE0NC0wNDNlYTVlYzlhZWE7MTIzNDE3MTMifQ.QkMfhFcBBcYifunmOctS3-8wJgS-rC4AW5oBKJq24dh_deeJGSuSycvHh_541W00KhpZiqSNOHb9nmRrVh-HQPLhpX_o0_0u16BJ5c95eWpwiKfDNfpqIAj9pO2GOateQKhFYLrpeqdUnceeixAJev185mVjCGEP0n_uMFrhEeA85wE4AbmL_g3YQ_L7MRbr-fX_tL1laUg6pxJqx7y3l5Sw-gux40EsC1XRnCmwO_jG6OCGpIgaWKDM_Nt-ep4UgNjOHoXCllxZd8P_b6-m2ZFFnmpZsY_ItvL5mzlRGGaPCjG-zj4SNBlrBkZXvWC3aXOxp2rvLX9CwEAQhEcm3HPBdKwFWCD5sdJ3Oolx22YQzYMteFivwdE2USK7y3pduZ4lxz6cN8MkGWjY_Z5V1gA31zKGXl32AsBBfbnvWhfx2vx_6zW6z8Vgu8lCF0114Ay8nKtC7azylJDtPiGqrD4kGvOYFE9a7oQFLQf2wpbSyoevitMiInu6Dvo2_p2ZCA-K2Y7Ka2nNdUNXtdgyJwDmRAKdoZfq2GuSZ5QAnDLzM68go_g0ZZziYEdeojvxP2SkDu19bL1MZSC0IHRQcZIR1ttIfZ2ORRe8f6tuDrT7XDQdVrsHE_F4Cfn7OvbQiAnv5Fsnn8Nmp81tcuS1A6IbPR2gcTDg3p15W7a1cq8; srt=eyJhbGciOiJSUzI1NiIsImtpZCI6IjA2MGMwYTgyLTk0YzktNTQ0Ny1iYjFjLWFkMGI1YzhkNGU5NSIsInR5cCI6IkpXVCJ9.eyJjbGllbnRfaWQiOiJsYmMtZnJvbnQtd2ViIiwiaWF0IjoxNjE5NDgxMTMxLCJpZCI6ImY5NmNhNjMyLTZlYjEtNDZjOS1hNTFkLWQyOGVlYzQxYTk1NiIsImp0aSI6IjFkNTZkOTA5LWM3MzctNGVhZi1hNjgwLWVjMTRhNDE4YmI5MiIsInJlcXVlc3RfaWQiOiJhY2IyODcyNi1lNTExLTRiMjgtYTcxOS0xNTNhZTgzNmEwYTQiLCJzZXNzaW9uX2lkIjoiNmVhYzdjNmUtNmQ0NS00YTg3LWIwZjUtY2QzZjNjYTcxMDE0Iiwic3ViIjoibGJjO2QxNmMwNzQxLWFlYWMtNDFkMi1iMTQ0LTA0M2VhNWVjOWFlYTsxMjM0MTcxMyJ9.REFnA6ITS-UEJhnaYTfAfxMRo3ceqZk6vUT5OHrQzKOEGYWfNqwrxP6fZYEHrbDLaThv5MX3n6YVjIRIY42HbcoU7bOFUVj0J-f5rh82qaeGpxyKJfJWmzKoLSj_e9ZkQhBaoWlMDvaiq2XXx4a-H3Is1WrGZ2coRogYRWTs2f6oK1zb1JVS3JSeLkpMKQv7weeSelPq7mdI_3zQBSAEi0OBX_anvhYcNuPdObcHt8IHG8B0LFtSsFH2J6AJdVyzReiiwtyd5iIJQMCRjp8oK1VBSYKNtjpwVGxbMz0n2SZ2iwZ9ZNSV4ZDPhdsgOk8Xvoglw7UIdLtwaKPhEmpcPyolgVriFAc-PXMGWREYrmG8Vq-zGzMNxrk2SHEQlDhS3fwtFvvB1LA__ueJspoyEEfEd59MyeLCk0L2sx6c_L02nmnLR0H4coRBQt5zpxGghIMPzJioh7ffGnLCJZMMJLpGDKfw2XfdLbJOpzsQzqLwgSootCWnZhi2i-7SbH2Wlcw5iJw5q440OGwsInpSfZgUR3xWg7vZ1WSX-Xp8vKKh11ZQYzlbAYwfAPt3IwoFsvp0Pk69tyozBmiFFGsaQsm6vP52GBMYU1pKBUZ5fJklHYYHmwlSCuV01tsgaLQW-rsDfFesOZTCawzMOzvex5qgIhp5aF3ZKzFVOz-AOrw; datadome=XydBx_J2371Ovw2b58rcKdX7VHl49TqHuAngb7JQxN-hdLOH4svurU~CL5odOXUkzB4JnsrN18EDS~P0Vdc7vJBxhqQ0up3SgUlbsyE23K"
        },
        data: {
            "list_ads": adsIds
        }
    })
        .then(function (response) {
            console.log("deleteAds OK")
        })
        .catch(function (error) {
            console.log("deleteAds ERROR: ", error)
        })
}

module.exports = {
    republishAds: main,
}
