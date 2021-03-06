const express = require('express')
const bodyParser = require('body-parser')
const exp_layout = require('express-ejs-layouts')
const app = express()
const port = 3000

//using pool for connection, not connect
const mainRouter = require('./routes/main');
const docRouter = require('./routes/physician'); //to physician.js
const patRouter = require('./routes/patient'); //to patient.js

const http = require('http').Server(app);
const io = require('socket.io')(http);

io.on('connection', (socket) => {
  //.on before .emit to initiate a complete EventEmitter 
  socket.on('entry', (name)=>{
    console.log(name+ ' is on the line.')
  });
});

//dotenv installed

//for POST request
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true})) 

app.use(express.static('public'));
app.use(exp_layout)
app.set('view engine', 'ejs');
app.set('views',__dirname + '/views');
app.set('layout','layouts/layout');

app.use('/', mainRouter);
app.use('/physician',docRouter);
app.use('/patient',patRouter);

http.listen(port, () => {
    console.log(`App running on port ${port}.`)
});

