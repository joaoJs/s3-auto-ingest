const express = require('express')
const bodyParser = require('body-parser')
const { parse } = require('csv-parse/sync')

const app = express()

require('dotenv').config()

const port = process.env.PORT || 3001

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }))

// parse application/json
app.use(bodyParser.json())

app.get('/', (req, res) => {
    res.send({ "data": "hello world" })
})

app.post('/file', async (req, res) => {
    const json = parse(req.body.bufferStr, {
        delimiter: ',',
        from: 2,
        trim: true,
        columns: true
    })

    console.log(json)

    res.send(json)
})

const startServer = () => {

    app.listen(port, () => {
        console.log(`Example app listening at http://localhost:${port}`)
    })
}

startServer()