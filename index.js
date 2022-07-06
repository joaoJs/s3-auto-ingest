const express = require('express')
const bodyParser = require('body-parser')
const { parse } = require('csv-parse/sync')
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const AWS = require('aws-sdk')
const snsInstance = new AWS.SNS();

const app = express()

require('dotenv').config()

const port = process.env.PORT || 3001

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }))

// parse application/json
app.use(bodyParser.json({ limit: '50mb' }))

app.use(function(req, res, next) {
    if (req.headers['x-amz-sns-message-type']) {
        req.headers['content-type'] = 'application/json;charset=UTF-8';
    }
    next();
});


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

    return new Promise(((resolve, reject) =>{
        if(!isConfirmSubscription(headers)){
            return resolve('No SubscriptionConfirmation in sns headers')
        }

        snsInstance.confirmSubscription({
            TopicArn: headers['x-amz-sns-topic-arn'],
            Token : body.Token
        }, (err, res)=>{
            console.log(err);
            if(err){
                return reject(err)
            }
            console.log('confirmation successfull')
            return resolve(res.SubscriptionArn);
        });
    }))

}

app.post('/file', async (req, res) => {
    // console.log(req)
    // consoe.log(req)
    let body = ''

    req.on('data', (chunk) => {
        body += chunk.toString()
    })

    console.log(body)
    await confirmSubscription(req.headers, req.body)
})

const startServer = () => {

    app.listen(port, () => {
        console.log(`Example app listening at http://localhost:${port}`)
    })
}

startServer()