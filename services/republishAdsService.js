const axios = require('axios')
const randomUseragent = require('random-useragent');

function republishAds(token, ads) {
    /*
    ads.forEach(ad =>
        new Promise((resolve) =>
        axios

        )
    )
     */
    const ad = ads[0]

    return new Promise((resolve) =>
        axios
            .post('https://api.leboncoin.fr/api/adsubmit/v1/classifieds', {
                    images: [
                        {
                            name: ad.images.name, // api lbc https://api.leboncoin.fr/api/dashboard/v1/search
                            url: ad.images.name // api lbc https://api.leboncoin.fr/api/dashboard/v1/search
                        }
                    ],
                    attributes: {},
                    email: ad.email, // api lbc via https://api.leboncoin.fr/api/accounts/v1/accounts/me/personaldata
                    phone: ad.phone, // api lbc via https://api.leboncoin.fr/api/accounts/v1/accounts/me/personaldata (à caler par rapport au bool has_phone)
                    category_id: ad.category_id, // api lbc https://api.leboncoin.fr/api/dashboard/v1/search
                    ad_type: ad.ad_type, // api lbc https://api.leboncoin.fr/api/dashboard/v1/search
                    location: {
                        address: ad.location.address, // api lbc https://api.leboncoin.fr/api/dashboard/v1/search
                        district: ad.location.district, // absent partout mais à priori ""
                        city: ad.location.city, // api lbc https://api.leboncoin.fr/api/dashboard/v1/search
                        label: ad.location.label, // api lbc https://api.leboncoin.fr/api/dashboard/v1/search
                        lat: ad.location.lat, // api lbc https://api.leboncoin.fr/api/dashboard/v1/search
                        lng: ad.location.lng, // api lbc https://api.leboncoin.fr/api/dashboard/v1/search
                        zipcode: ad.location.zipcode, // api lbc https://api.leboncoin.fr/api/dashboard/v1/search
                        geo_source: ad.location.geo_source, // à priori "city"
                        geo_provider: ad.location.geo_provider, // à priori "here"
                        region: ad.location.region, // api lbc https://api.leboncoin.fr/api/dashboard/v1/search
                        region_label: ad.location.region_label, // api lbc https://api.leboncoin.fr/api/dashboard/v1/search
                        department: ad.location.department, // api lbc api lbc https://api.leboncoin.fr/api/dashboard/v1/search
                        dpt_label: ad.location.dpt_label, // api lbc https://api.leboncoin.fr/api/dashboard/v1/search
                        country: ad.location.country // api lbc https://api.leboncoin.fr/api/dashboard/v1/search
                    },
                    pricing_id: ad.pricing_id, // à priori tout le temps "b1ba354c1fea2f946b70f63422494ea2" (récupéré api LBC: https://api.leboncoin.fr/api/options/v1/pricing/classifieds/deposit/description à la création d'une annonce, au niveau categorie)
                    subject: ad.subject, // api lbc https://api.leboncoin.fr/api/dashboard/v1/search
                    body: ad.body, // api lbc https://api.leboncoin.fr/api/dashboard/v1/search
                    price: ad.price, // api lbc https://api.leboncoin.fr/api/dashboard/v1/search
                    phone_hidden: ad.phone_hidden, // (has_phone) api lbc https://api.leboncoin.fr/api/dashboard/v1/search
                    no_salesmen: true // api lbc https://api.leboncoin.fr/api/dashboard/v1/search
                },
                {
                    headers: {
                        'content-type': 'application/json',
                        'authority': 'api.leboncoin.fr',
                        'accept': '/',
                        'authorization': token,
                        'user-agent': randomUseragent.getRandom(),
                        'sec-gpc': 1,
                        'origin': 'https://www.leboncoin.fr',
                        'sec-fetch-site': 'same-site',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-dest': 'empty',
                        'referer': 'https://www.leboncoin.fr/',
                        'accept-language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
                        //'cookie': ' __Secure-InstanceId=b435ada8-0d6d-49c8-b4a2-b4b0cd2bc0c6; didomi_token=eyJ1c2VyX2lkIjoiMTc3ZmNkZWItYTIyYS02NzRjLWE4MTktMGIwZTk3ODY3YTAyIiwiY3JlYXRlZCI6IjIwMjEtMDMtMDRUMTA6NTM6MTMuMzAwWiIsInVwZGF0ZWQiOiIyMDIxLTAzLTA0VDEwOjUzOjEzLjMwMFoiLCJ2ZW5kb3JzIjp7ImVuYWJsZWQiOlsiYW1hem9uIiwic2FsZXNmb3JjZSIsImdvb2dsZSIsImM6bmV4dC1wZXJmb3JtYW5jZSIsImM6Y29sbGVjdGl2ZS1oaFNZdFJWbiIsImM6cm9ja3lvdSIsImM6cHVib2NlYW4tYjZCSk10c2UiLCJjOnJ0YXJnZXQtR2VmTVZ5aUMiLCJjOnNjaGlic3RlZC1NUVBYYXF5aCIsImM6Z3JlZW5ob3VzZS1RS2JHQmtzNCIsImM6cmVhbHplaXRnLWI2S0NreHlWIiwiYzp2aWRlby1tZWRpYS1ncm91cCIsImM6c3dpdGNoLWNvbmNlcHRzIiwiYzpsdWNpZGhvbGQteWZ0YldUZjciLCJjOmxlbW9tZWRpYS16YllocDJRYyIsImM6eW9ybWVkaWFzLXFuQldoUXlTIiwiYzpzYW5vbWEiLCJjOnJhZHZlcnRpcy1TSnBhMjVIOCIsImM6cXdlcnRpemUtemRuZ0UyaHgiLCJjOnZkb3BpYSIsImM6cmV2bGlmdGVyLWNScE1ucDV4IiwiYzpyZXNlYXJjaC1ub3ciLCJjOndoZW5ldmVybS04Vllod2IyUCIsImM6YWRtb3Rpb24iLCJjOndvb2JpIiwiYzpzaG9wc3R5bGUtZldKSzJMaVAiLCJjOnRoaXJkcHJlc2UtU3NLd21IVksiLCJjOmIyYm1lZGlhLXBRVEZneVdrIiwiYzpwdXJjaCIsImM6bGlmZXN0cmVldC1tZWRpYSIsImM6c3luYy1uNzRYUXByZyIsImM6aW50b3dvd2luLXFhenQ1dEdpIiwiYzpkaWRvbWkiLCJjOnJhZGl1bW9uZSIsImM6YWRvdG1vYiIsImM6YWItdGFzdHkiLCJjOmdyYXBlc2hvdCIsImM6YWRtb2IiLCJjOmFkYWdpbyJdfSwidmVuZG9yc19saSI6eyJlbmFibGVkIjpbImdvb2dsZSJdfSwidmVyc2lvbiI6MiwiYWMiOiJERTJBb0FFSUFmb0JoUUR4QUhtQVNTQWtzRGlBSFZnUkJnaWxCRlFDVGNFM2dKeUFXMWd1TUJnTURDSUdKb0FBLkRFMkFvQUVJQWZvQmhRRHhBSG1BU1NBa3NEaUFIVmdSQmdpbEJGUUNUY0UzZ0p5QVcxZ3VNQmdNRENJR0pvQUEifQ==; euconsent-v2=CPCh1j9PCh1j9AHABBENBPCgAP_AAH_AAAAAG7tf_X_fb2vj-_5999t0eY1f9_63v6wzjheNs-8NyZ_X_L4Xo2M6vB36pq4KmR4Eu3LBAQdlHOHcTQmQwIkVqTPsbk2Mr7NKJ7LEilMbe2dYGH9_n8XTuZKY70_s___z_3-__v__7rbgCAAAAAAAIAgZ8ASYal8BAmJY4Ek0aVQogQhXEhUAoAKKEYWiawgJHBTsrgI9QQIAEBqAjAiBBiCjFgEAAAEASURACAHAgEQBEAgABACpAQgAIkAQWAFgYBAAKAaFgBFAEIEhBkcFRymBARItFBPIGAAQAAAA.f_gAD_gAAAAA; tooltipExpiredAds=true; tooltipStatsAds=true; auto_promo_mars_2021=1; AMCV_C8D912835936C98A0A495D98%40AdobeOrg=MCMID%7C09862883183941386231636978989261649919; nlid=78b0db76|e923d5a; cookieFrame=2; euconsent=BOXo8CsOXo8CsAAAACFRBr-AAAAht7_______9______9uz_Gv_v_f__33e8__9v_l_7_-___u_-33d4-_1vX99yfm1-7ftr3tp_86ues2_Xur_959__njE; consent_allpurpose=cDE9MTtwMj0xO3AzPTE7cDQ9MTtwNT0x; cookieBanner=1; adview_clickmeter=search__listing__0__2d8b91f0-90dc-11eb-a93e-ca380c4708cb; luat=eyJhbGciOiJSUzI1NiIsImtpZCI6IjA2MGMwYTgyLTk0YzktNTQ0Ny1iYjFjLWFkMGI1YzhkNGU5NSIsInR5cCI6IkpXVCJ9.eyJjbGllbnRfaWQiOiJsYmMtZnJvbnQtd2ViIiwiZXhwIjoxNjE3MjI3ODk5LCJpYXQiOjE2MTcyMjQyOTgsImlkIjoiNzI0MmRlNWQtNDE0OC00ODMxLTgzMTctOThlOTEwMWRiZjY3IiwiaW5zdGFsbF9pZCI6IjQyMzI5ZDkwLWFkYmYtNGY1Ny05NTExLTM4MTIyZDY3MWZhMyIsImp0aSI6ImZmMTAzZmFiLWU1YjAtNDRjYi1hMTFlLTE4OGI1YWZhYjRiMyIsInJlZnVzZWRfc2NvcGVzIjpbImxiYy5hdXRoLmVtYWlsLm1lLmNoYW5nZSJdLCJyZXF1ZXN0X2lkIjoiZTE0N2QwNjMtZDA2MC00MTdjLTkxZDEtMjQ5MDk0MGI1NTQxIiwic2NvcGVzIjpbImxiY2dycC5hdXRoLnNlc3Npb24ubWUuZGVsZXRlIiwiYmV0YS5sYmMuYXV0aC50d29mYWN0b3IubWUuKiIsImxiYy4qLm1lLioiLCJvZmZsaW5lIiwibGJjLmVzY3Jvd2FjY291bnQubWFpbnRlbmFuY2UucmVhZCIsImxiYy4qLioubWUuKiIsImxiY2dycC5hdXRoLnR3b2ZhY3Rvci5tZS4qIiwibGJjZ3JwLmF1dGgudHdvZmFjdG9yLnNtcy5tZS5hY3RpdmF0ZSIsImxiY2xlZ2FjeS5wcm8iLCJsYmNncnAuYXV0aC5zZXNzaW9uLm1lLnJlYWQiXSwic2Vzc2lvbl9pZCI6IjdmMmQwODAwLWEzZDYtNGQyMy1iMmY2LWYxYzY2NGQ0OTE3NiIsInN1YiI6ImxiYztlOGZiMTlmYy00MTk0LTQ0NDgtOGRjMy1hNzkwZjRiMzJjM2M7NTYyNjM5MDgifQ.sPGt9wrYbm6436QjSdoH2aFmkw-Y3qIvmj2xjd4UKIDNli2gcuoiiQnP2T8n4a9hoeVCZiPPmmxcygt8-0cILDX_uLmV3Thr1SojfIImV1kBq-OUK8JQ2abA4Rtl9ZTygh6hj1tPnDh6M3BrwvsT9DhXGLWOiNxaNE_-mFErWc9-aaIb_9W97mEUCnuTqCh72YmydLqHEIAzw4vYtK42UB36o7Qbz947xxKiOe6yaLlxrgTROVjgNB0DJouc8MtmHFJQ_PdMylro74OUNsOZSViZYIjbQFx9D3FhAA5Xq6i4qbKCwIX3kvJC2CizdK_3I9meC8r6lX1S2-l7okQA1dzoLJfMQzZ8Ook6Umzl8E6Khpf7x2as-dvk9h3VP0kIkTnvs7yKJN5r0jQ01Kmy3dI0eiefRHt8OqhUNqyCEI7hHyLx9eLmbMO0EudhXt8OUqbmlR-HOsfJ0MxzANQrm5t0C1BlQ85qF8FWTkKQ1o1TilKkPfD0xdL7xYy5vFulCuMPfXa2dHSJCGcHUI6Qj85uDOmIfjhT4-KT6m2j9YxcLbVhsGGG3cBgXVVWfSUloxdR65_dd8CyURCS9LJUjZQeb2KUhlm0te0nbWjyPm-iy0IrXyL-g0hXXTkL3te4yJgMdsi1aQN5guUvDnbEyVMzojCkGaA5eLSVK6yL1nc; srt=eyJhbGciOiJSUzI1NiIsImtpZCI6IjA2MGMwYTgyLTk0YzktNTQ0Ny1iYjFjLWFkMGI1YzhkNGU5NSIsInR5cCI6IkpXVCJ9.eyJjbGllbnRfaWQiOiJsYmMtZnJvbnQtd2ViIiwiaWF0IjoxNjE3MjI0Mjk4LCJpZCI6IjczMjZiNDI1LTBkNjYtNGE0Zi1hY2UzLThhNjllMjVlZWIxNyIsImp0aSI6IjdkYTQ2ZDQ0LTdhOGEtNGMxMS1iNWNjLWEyYzk2YjdkMDUwNiIsInJlcXVlc3RfaWQiOiJlMTQ3ZDA2My1kMDYwLTQxN2MtOTFkMS0yNDkwOTQwYjU1NDEiLCJzZXNzaW9uX2lkIjoiN2YyZDA4MDAtYTNkNi00ZDIzLWIyZjYtZjFjNjY0ZDQ5MTc2Iiwic3ViIjoibGJjO2U4ZmIxOWZjLTQxOTQtNDQ0OC04ZGMzLWE3OTBmNGIzMmMzYzs1NjI2MzkwOCJ9.zWFxelPF75yEJZ_lbMducL7a6-ZuqTdPnPqF3VTB27kWodxxdwXou34SL9SlNEP1mQ7XIT62t7DArsbf4fEbRWCq1wZFZVVLKdmIB26HNtrgJSbrOBDkUFDqQfDedtGq8hAHMjKkRuP6gLKCUNdWi8QGYZVQUr8rr_TT5dvFxUzjh2HdmlaXU_LawT3N2YZVdYapN7bMDRi7OFMvndq1shCXLPKNr0Avz1kWZgw95mP2uwj27SX9QuFPLMfsikNy1C6yr_OZQawyrU3vlc1OqNy--NX6iKA7E_ik-vFjIsStOVlQaEPL_jWO4vokd8yGFZF10iY1Wr8Ad588Y1E3Lpeis5R4SAyF_C1EYBcYy4viJqC-vefwNDUJHlA4x4W4rfLJqJj0nKJM4GJQng5RvyH1RceXLjBA00MvKy879q7-JC7KHTN_2w7_JX7nz07NM0MkNC5X-hS8doeJnCWi0mzcw3ONt3hJNCa3WfMIKAtwxTGfZWXQS6UxCyYTom5FjbKaF33rLp7DVILO84zxIXNrh_mLj_4oFDLzrUEp9oDdmgfvS5Ao2FoKn2HfIpaUEl8RH6R3wDbzWqpdEsE3pSJ5ZUukKD5aPKJxQZGxXyJh58fGHOf1xHb7quOUVLOQyfegdbgPiJJLfqx1CFCtBj-uigMKZlD9vLW81lhIWXQ; datadome=ZKZAnO2-NdtCg-8p563ThF9U9qe9RgcQ0n-9dFu6qmKG0LYJJ09mL_6LTDvmXqkM8WjhNFMts18EC-I-l.3A76mXLNnCGs6Zrrejrmb.7U',
                    }
                })
            .then(function (response) {
                resolve(response.data.Ads)
            })
            .catch(function (error) {
                console.log(error)
            })
    )
}

module.exports = {
    republishAds: republishAds,
}
