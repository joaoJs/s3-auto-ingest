const express = require('express')
const bodyParser = require('body-parser')
const { parse } = require('csv-parse/sync')
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express()

require('dotenv').config()

const port = process.env.PORT || 3001

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }))

// parse application/json
app.use(bodyParser.json({ limit: '50mb' }))

app.get('/', (req, res) => {
    res.send({ "data": "hello world" })
})

app.post('/file', async (req, res) => {
    let body = ''

    req.on('data', (chunk) => {
        body += chunk.toString()
    })

    req.on('end', async () => {
        let payload = JSON.parse(body)

        if (payload.Type === 'SubscriptionConfirmation') {
            const promise = new Promise( async (resolve, reject) => {
                const url = payload.SubscribeURL

                const response = await fetch(url)
                if (response.statusCode == 200) {
                    console.log('Yess! We have accepted the confirmation from AWS')
                    return resolve()
                } else {
                    return reject()
                }
            })

            promise.then(() => {
                res.end("ok")
            })
        }
    })
})

const startServer = () => {

    app.listen(port, () => {
        console.log(`Example app listening at http://localhost:${port}`)
    })
}

startServer()