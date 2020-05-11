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
    const {user_name, password_1, first_name, last_name,user_email}=req.body
    const dbsearch_text='SELECT * FROM doc_reg WHERE username = $1'
    const dbsearch_value=[user_name]
    //ensure the input for user_name is unique as it is the primary key for the table
    pool.query(dbsearch_text,dbsearch_value,(err,results)=>{
        if (err){
            console.log(err)
        }else{
            const unique_check = results.rows[0]
            //when not equal to undefined, it means the username has been taken
            if (unique_check!==undefined){
                res.send("Username Taken, Pick Another One")
            }
            else{
                pool.query('INSERT INTO doc_reg (username,pw,firstname,lastname,email) VALUES ($1,$2,$3,$4,$5)'
                ,[user_name,password_1,first_name,last_name,user_email],(err, results)=>{
                    if (err){
                        console.log(err)
                    }
                    res.render('physician/loggedin',{
                            firstname:first_name,
                            lastname:last_name
                            })
                        })
                }
        }
    })
})

//table doc_reg
//the login search feature
router.get('/loggedin',(req,res)=>{
    const searchedun = req.query.user_name_login
    const searchedpw = req.query.password_login

    const dbsearch_text = 'SELECT * FROM doc_reg WHERE username=$1 AND pw=$2'
    const dbsearch_value= [searchedun,searchedpw]
    pool.query(dbsearch_text,dbsearch_value,(err,results)=>{
        if (err){
            console.log(err)
        }
        const unique_check = results.rows[0]
        if(unique_check===undefined){
            res.send("You have not registered yet")
        }else{
            res.render('physician/loggedin',{
                firstname:unique_check.firstname,
                lastname:unique_check.lastname
            })
        }
    })
})

//table: doc_reg
//search the table first to ensure the user has already registered (testing)
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