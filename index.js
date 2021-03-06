const express = require('express')
const bodyParser = require('body-parser')
const AWS = require('aws-sdk')
const { parse } = require('csv-parse/sync');
const snsInstance = new AWS.SNS()

const app = express()

require('dotenv').config()

const port = process.env.PORT || 3001

AWS.config.update({
    accessKeyId: process.env.AWS_KEY_ID,
    secretAccessKey: process.env.AWS_KEY,
})

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }))

// parse application/json
app.use(bodyParser.json({ limit: '50mb' }))

app.use(
    express.json({
        type: [
            'application/json',
            'text/plain', // AWS sends this content-type for its messages/notifications
        ],
    })
)

app.get('/', (req, res) => {
    res.send({ "data": "hello world" })
})

const isConfirmSubscription = (headers) => {
    return headers['x-amz-sns-message-type'] === 'SubscriptionConfirmation'
}

const confirmSubscription = (headers, body) => {

    return new Promise(((resolve, reject) => {
        if (!isConfirmSubscription(headers)) {
            return resolve('No SubscriptionConfirmation in sns headers')
        }

        snsInstance.confirmSubscription({
            TopicArn: headers['x-amz-sns-topic-arn'],
            Token: body.Token
        }, (err, res) => {
            console.log(err);
            if (err) {
                return reject(err)
            }
            console.log('confirmation successfull')
            return resolve(res.SubscriptionArn);
        });
    }))

}

app.post('/file', async (req, res) => {

    // confirm subscription to sns topic 
    await confirmSubscription(req.headers, req.body)

    // get uploaded file from s3 using sns notification message 
    const { s3 } = JSON.parse(req.body.Message)['Records'][0]

    const s3Instance = new AWS.S3()
    const s3Params = {
        Bucket: s3.bucket.name,
        Key: s3.object.key
    }

    s3Instance.getObject(s3Params, (err, response) => {
        if (err === null) {
            // parse csv from response and insert json into mongodb
            const { Body } = response
            const json = parse(Body.toString(), {
                delimiter: ',',
                from: 2,
                trim: true,
                columns: true
            })
            let jsonRes = await fetch('https://s3-mongodb-poc.herokuapp.com/file', { method: 'POST', body: JSON.stringify(json), headers: { 'Content-Type': 'application/json' } })
            jsonRes = await jsonRes.json()
            console.log(jsonRes)
            res.send(jsonRes)
        } else {
            console.log(err)
            res.send(err)
        }
    })

})

const startServer = () => {

    app.listen(port, () => {
        console.log(`Example app listening at http://localhost:${port}`)
    })
}

startServer()