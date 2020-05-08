const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 3000
// const routes = require('./routes/query')

//PostGreSQL setup
const Pool = require('pg').Pool
//using pool for connection, not connect
const pool = new Pool({
  user: 'postgre',
  host: 'localhost',
  database: 'p2p',
  password: 'Gogo11!5',
  port: 5432,
})
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
