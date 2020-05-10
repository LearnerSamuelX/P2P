const express = require("express")
const router = express.Router()

const Pool = require('pg').Pool
const pool = new Pool({
    user: 'postgres',
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
    const {user_name, user_email, first_name, last_name, pw_1}=req.body
    pool.query('INSERT INTO doc_reg (username,pw,firstname,lastname,email) VALUES ($1,$2,$3,$4,$5,$6)'
    ,[user_name,user_email, first_name, last_name, pw_1],(err, results)=>{
        if (err){
            console.log(err)
        }
        res.render('physician/loggedin',{username:user_name})
    })
})

//table: doc_reg
//search the table first to ensure the user has already registered
//unique key is username
router.get('/loggedin/:search',(req,res)=>{

    const username = req.params.search
    const dbun = 'SELECT * FROM doc_reg WHERE username = $1'
    const value = [username]
    
    pool.query(dbun,value,(err,results)=>{
        if(err){
            console.log(err)
        }
        else{
            const doc_info = results.rows[0] // doc_info would be 'undefined' if the user is not created
            if (doc_info===undefined){
                res.send("No Such Username Found in Database. ")
            }
            else{
                res.render('physician/loggedin',{firstname:doc_info.firstname, lastname:doc_info.lastname}) //the 2 usernames here are different
            }
        }
    })
})

module.exports=router