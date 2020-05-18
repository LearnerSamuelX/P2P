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

//some global variables to prevent passing information such as pKey of datatables in URL
let log_info = ''
let patient_cursor = ''
let patient_record_id = ''


router.get('/',(req,res)=>{
    res.render('physician/login')
})

//table: doc_reg
//for creating an account for doctor
router.post('/accountcreated',(req,res)=>{
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

                log_info=user_name

                res.render('physician/loggedin',{
                            docid:user_name,
                            firstname:first_name,
                            lastname:last_name
                    })
                })
            }
        }
    })
})

//table doc_reg
//the login search feature, change it to 'POST' request
router.post('/loggedin',(req,res)=>{
    const {user_name_login,password_login} = req.body
    const dbsearch_text = 'SELECT * FROM doc_reg WHERE username=$1 AND pw=$2'
    const dbsearch_value= [user_name_login,password_login]
    pool.query(dbsearch_text,dbsearch_value,(err,results)=>{
        if (err){
            console.log(err)
        }
        const doc_info = results.rows[0]
        if(doc_info===undefined){
            res.send("You have not registered yet")
        }else{

            log_info=doc_info.username

            res.render('physician/loggedin',{
                docid:doc_info.username,
                firstname:doc_info.firstname.toUpperCase(),
                lastname:doc_info.lastname.toUpperCase()
            })
        }
    })
})
/* COMPLETED */

//patientlist table
//a 'get' request, being directed to the page where a new patient can be created

router.get('/loggedin/200/new_patient',(req,res)=>{
    const docid = log_info
    const copiedtext = 'SELECT * FROM doc_pat_list WHERE username = $1'
    const copiedvalue = [docid]

    if (docid==""){
        res.send("Please log into your account.")
    }else{
        
        pool.query('INSERT INTO doc_pat_list (username) VALUES($1)',[docid],(err)=>{
            if(err){
                console.log(err)
            }
        })

        pool.query(copiedtext,copiedvalue,(err,results)=>{
            if(err){
                console.log(err)
            }else{
                res.render('physician/newpatient',{doc_id:docid})
            }
        })
    }
})
/* COMPLETED */

router.post('/loggedin/200/new_patient/patient_info',(req,res)=>{
    const doc_id = log_info //working
    const {patientfirstname, patientlastname, patientage, patientid_1}=req.body
    const dbcreate_text=
    "INSERT INTO pat_info (patient_firstname, patient_lastname, patient_age, patient_id) VALUES ($1, $2, $3, $4)"
    const dbcreate_value=[patientfirstname, patientlastname, patientage, patientid_1]
    pool.query(dbcreate_text,dbcreate_value,(err,results)=>{
        if(err){
            console.log(err)
        }else{
            console.log(doc_id)
            pool.query("UPDATE pat_info SET doc_id = $1 WHERE patient_id = $2",[doc_id,dbcreate_value[3]],(err,results)=>{
                if(err){
                    console.log(err)
                }else{
                    console.log(results)
                    res.render("physician/patmenu",{
                        patientfirstname:patientfirstname,
                        patientlastname:patientlastname})
                }
            })
        }
    })
})

//direct to patient search page when searching for existing patients
router.get('/loggedin/200/patient_search',(req,res)=>{
    const username=log_info
    const dbcommand = 'SELECT * FROM pat_info'
    if(username==""){
        res.send("Please log into your account, thank you! ")
    }else{

        pool.query(dbcommand,(err,results)=>{
            if(err){
                console.log(err)
            }else{
                // console.log(results.rows) //will be shown once getting into extpatient page
                res.render('physician/extpatient',{
                    doc_id:username
                })
            }
        })
    }
})
/* COMPLETED */

router.post('/loggedin/200/patient_search/patients_ii',(req,res)=>{
    const {patient_lastname,patient_firstname,patient_id}=req.body
    const dbcommand = 'SELECT * FROM pat_info WHERE patient_id=$1 OR patient_firstname=$2 OR patient_lastname=$3'
    const dbvalue = [patient_id,patient_firstname,patient_lastname]
    pool.query(dbcommand, dbvalue,(err,results)=>{
        if(err){
            console.log(err)
        }else{
            // console.log(results.rows)
            const pat_info = results.rows[0]
            if(pat_info===undefined){
                res.send("This patient is not in the database")
            }else{
                patient_cursor = pat_info.patient_id
                // console.log(patient_cursor)
                let age = new Date().getFullYear()
                res.render('physician/patmenu',{
                    patientlastname:pat_info.patient_lastname,
                    patientfirstname:pat_info.patient_firstname,
                    patientage:age-pat_info.patient_age
                })
            }
        }
    })
})

//routes to creating or updating diagnosis (urologist)

router.get('/loggedin/200/patient_search/patients_ii/new_record',(req,res)=>{
    // if(log_info===""||patient_cursor===""){
    //     res.send("Please log into your account.")
    // }else{
        let record_id = new Date()
        const a = record_id.getFullYear().toString()
        const b = record_id.getMonth().toString()
        const c = record_id.getDate().toString()
        const d = record_id.getHours().toString()
        const id_serie = a.concat(b).concat(c).concat(d)

        console.log(id_serie)
        res.render('physician/newrecord',{
            record_id:id_serie
        })
    // }
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