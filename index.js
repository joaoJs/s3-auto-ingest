const express = require('express')
const bodyParser = require('body-parser')
// const { parse } = require('csv-parse/sync')

// const MAX_FILE_SIZE = 15 * 1024 * 1024
// const multer = require('multer');
// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage, limits: { fieldSize: MAX_FILE_SIZE } })

const app = express()

require('dotenv').config()

const port = process.env.PORT || 3001

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.get('/', (req, res) => {
    res.send({ "data": "hello world" })
})

app.post('/file', async (req, res) => {
    console.log(req.body)
    res.send(req.body)
})

const startServer = () => {

    app.listen(port, () => {
        console.log(`Example app listening at http://localhost:${port}`)
    })
}

startServer()