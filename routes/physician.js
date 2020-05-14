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

let buffer_var='N/A';

//table: doc_reg
//for creating an account for doctor
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
        const doc_info = results.rows[0]
        if(doc_info===undefined){
            res.send("You have not registered yet")
        }else{
            res.render('physician/loggedin',{
                docid:doc_info.username,
                firstname:doc_info.firstname.toUpperCase(),
                lastname:doc_info.lastname.toUpperCase()
            })
        }
    })
})

//patientlist table
//a GET request, being directed to the page where a new patient can be created
//now, the challenge is how to pass phyisician's username into this page
router.get('/loggedin/200/:docid',(req,res)=>{
    const docid = req.params.docid
    //select the variables you added in the pat_info_list from the pat_info_list database
    const copiedtext = 'SELECT * FROM doc_pat_list WHERE username = $1'
    const copiedvalue = [docid]

    pool.query('INSERT INTO doc_pat_list (username) VALUES($1)',[docid],(err)=>{
        if(err){
            console.log(err)
        }
    })

    pool.query(copiedtext,copiedvalue,(err,results)=>{
        if(err){
            console.log(err)
        }else{
            // console.log(results.rows[0])
            res.render('physician/newpatient',{doc_id:docid})
        }
    })
})

router.post('/loggedin/200/:docid/new_record',(req,res)=>{
    const doc_id = req.params.docid //working
    const {patientfirstname, patientlastname, patientage, patientid_1}=req.body
    const dbcreate_text=
    "INSERT INTO pat_info (patient_firstname, patient_lastname, patient_age, patient_id) VALUES ($1, $2, $3, $4)"
    const dbcreate_value=[patientfirstname, patientlastname, patientage, patientid_1]

    pool.query("UPDATE doc_pat_list SET patient_id=$1 WHERE username = $2",[dbcreate_value[3],doc_id],(err,results)=>{
        if (err){
            console.log(err)
        }
        console.log('doc_pat_list updated')
    })

    pool.query(dbcreate_text,dbcreate_value,(err,results)=>{
        if(err){
            console.log(err)
        }else{
            console.log(doc_id)
            res.send("Inserted into pat_info")
            //create the patient_list database first
        }
    })
})


//(TESTING)
//table: doc_reg
//search the table first to ensure the user has already registered
//unique key is username
router.get('/loggedin_search/:search',(req,res)=>{

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
                res.render('physician/loggedin',{firstname:doc_info.firstname, lastname:doc_info.lastname, docid:doc_info.username}) //the 2 usernames here are different
            }
        }
    })
})

module.exports=router