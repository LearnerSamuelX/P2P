const express = require("express")
const router = express.Router()
const Pool = require('pg').Pool
const pool = new Pool({
    user: 'postgre',
    host: 'localhost',
    database: 'p2p',
    password: 'Gogo11!5',
    port: 5432,
  })

router.get('/',(req,res)=>{
    res.render('physician/login')
})

//table: doc_reg, 
router.post('/loggedin',(req,res)=>{
    const {user_name,password_1}=req.body
    pool.query('INSERT INTO doc_reg (username,pw) VALUES ($1,$2)',[user_name,password_1],(err, results)=>{
        if (err){
            console.log(err)
        }
        res.render('physician/loggedin',{username:user_name})
    })
})

module.exports=router