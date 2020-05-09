const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 3000

//using pool for connection, not connect

const mainRouter = require('./routes/main')
const docRouter = require('./routes/physician') //to physician.js

//dotenv installed

//for POST request
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true,})) 
app.use(express.static('public'));

app.set('view engine', 'ejs');
app.set('views',__dirname + '/views')
app.set('layout','layouts/layout')

app.use('/', mainRouter)
app.use('/physician',docRouter)

app.listen(port, () => {
    console.log(`App running on port ${port}.`)
  })
