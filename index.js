const express = require('express')
const bodyParser = require('body-parser')
const AWS = require('aws-sdk')
const snsInstance = new AWS.SNS();

const app = express()

require('dotenv').config()

const port = process.env.PORT || 3001

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }))

// parse application/json
app.use(bodyParser.json({ limit: '50mb' }))

// app.use((req, res, next) => {
//     req.headers['content-type'] = req.headers['content-type'] || 'application/json';
//     next();
// });

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

function isConfirmSubscription(headers) {
    return headers['x-amz-sns-message-type'] === 'SubscriptionConfirmation'
}

function confirmSubscription(
    headers,
    body,
) {

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
    // console.log(JSON.stringify(req.body))

    await confirmSubscription(req.headers, req.body)

    // get uploaded file from s3 using sns notification message 
    const { Message } = req.body
    console.log(Message.Records)

    const s3 = Message.Records[0]

    const s3Instance = new AWS.S3()
    const s3Params = {
        Bucket: s3.bucket.name,
        Key: s3.object.key
    }

    s3Instance.getObject(s3Params, (err, res) => {
        if (err === null) {
            console.log(res)
            res.send(res);
         } else {
            res.status(500).send(err);
         }
    })

})

const startServer = () => {

    app.listen(port, () => {
        console.log(`Example app listening at http://localhost:${port}`)
    })
}

startServer()