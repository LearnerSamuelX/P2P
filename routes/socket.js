const express = require('express');
const router = express.Router();

const app = express();
const server = require('http').Server(app);
const io = app.get("socketio");


io.sockets.on('connect', socket => {
    console.log('Socket route connected.')
 });

router.get('/',(req,res)=>{

    console.log('socket route is working.')
    res.status(200).send('Socket Page')
})
    
module.exports = router;