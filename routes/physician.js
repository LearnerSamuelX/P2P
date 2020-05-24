const express = require("express")
const nodemailer = require('nodemailer');
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
//implement some OOP design here

function Doctor(fn,ln,id){
    this.login_status = 0
    this.firstname=fn
    this.lastname=ln
    this.doc_id = id
}

function Patient(fn,ln,id,birthYear){
    this.login_status = 0
    this.firstname = fn
    this.lastname = ln
    this.age = new Date().getFullYear()-birthYear
    this.patient_id = id
}

let doctor = ""
let patient = ""
let log_info =""
// let patient_cursor = ''
// let patient_record_id = ''

// let year = new Date().getFullYear()


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

                doctor = new Doctor(first_name,last_name,user_name)
                doctor.login_status = 1

                res.render('physician/loggedin',{
                            docid:doctor.doc_id,
                            firstname:doctor.firstname,
                            lastname:doctor.lastname
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
            
            doctor = new Doctor (doc_info.firstname,doc_info.lastname,doc_info.doc_id)

            res.render('physician/loggedin',{
                docid:doctor.doc_id,
                firstname:doctor.firstname.toUpperCase(),
                lastname:doctor.lastname.toUpperCase()
            })
        }
    })
})
/* COMPLETED */

//patientlist table
//a 'get' request, being directed to the page where a new patient can be created

router.get('/loggedin/200/new_patient',(req,res)=>{
    const copiedtext = 'SELECT * FROM doc_pat_list WHERE username = $1'
    const copiedvalue = [doctor.doc_id]

    if (doctor==""){
        res.send("Please log into your account.")
    }else{
        
        pool.query('INSERT INTO doc_pat_list (username) VALUES($1)',[doctor.doc_id],(err)=>{
            if(err){
                console.log(err)
            }
        })

        pool.query(copiedtext,copiedvalue,(err,results)=>{
            if(err){
                console.log(err)
            }else{
                res.render('physician/newpatient',{doc_id:doctor.doc_id})
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

                    patient = new Patient(patientfirstname,patientlastname,patientid_1,patientage)
                    res.render("physician/patmenu",{
                        patientfirstname:patient.firstname,
                        patientlastname:patient.lastname,
                        patientage:patient.age
                    })
                }
            })
        }
    })
})

//direct to patient search page when searching for existing patients
router.get('/loggedin/200/patient_search',(req,res)=>{
    const username=doctor.doc_id
    const dbcommand = 'SELECT * FROM pat_info'
    if(doctor===""){
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


/*  */
router.get('/loggedin/200/patient_search/patients_ii',(req,res)=>{
    res.render('physician/patmenu',{
        patientlastname:patient.lastname,
        patientfirstname:patient.firstname,
        patientage:patient.age
    })
})

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
                patient = new Patient (
                    pat_info.patient_firstname,
                    pat_info.patient_lastname,
                    pat_info.patient_id,
                    pat_info.patient_age
                )
                // console.log(patient_cursor)
                res.render('physician/patmenu',{
                    patientlastname:patient.lastname,
                    patientfirstname:patient.firstname,
                    patientage:patient.age
                })
            }
        }
    })
})

//routes to creating or updating diagnosis (urologist)

router.get('/loggedin/200/patient_search/patients_ii/new_record',(req,res)=>{
    if(doctor===""||patient===""){
        res.send("Please log into your account.")
    }else{

        let record_id = new Date()
        const a = record_id.getFullYear().toString()
        const b = record_id.getMonth().toString()
        const c = record_id.getDate().toString()
        const d = record_id.getHours().toString()
        const e = record_id.getMinutes().toString()
        const id_serie = a.concat(b).concat(c).concat(d).concat(e)

        // console.log(id_serie)
        res.render('physician/newrecord',{
            record_id:id_serie
        })
    }
})

router.post('/loggedin/200/patient_search/diagnosiscreated',(req,res)=>{
    //insert data into dia_info table
    const {file_id,record_category,psa_index,urine_freq,urine_blood,fam_line,dia_summary}=req.body
    const dbcommand = 
    "INSERT INTO dia_info (record_id,category,psa,frequency,urine_blood,fam_history,symptom_summary,patient_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)" 
    const dbvalue = [file_id,record_category.toUpperCase(),psa_index,urine_freq,urine_blood,fam_line,dia_summary,patient.patient_id]
    pool.query(dbcommand,dbvalue,(err,results)=>{
        if(err){
            console.log(err)
        }else{
            // console.log(results)

            //create a Date object with date and time
            let timer = new Date()
            let reference_hour = timer.getHours()  //returns number type (0-23). Make 8:00 am the starting point
            let reference_day = timer.getDate()
            let scheduler = '* * * * * *' 
            // '* 8,14,20 * * * *' three times a day
            // '* 10,21 * * * *' two times a day
            
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'samxiezx1115@gmail.com',
                    pass: 'Gogo11!5'
                  }
            })

            let mailOptions = {
                from: 'samxiezx1115@gmail.com',
                to: 'samxiezx1115@hotmail.com',
                subject: `Physicians2Patients` ,
                text: `A copy of the initial diagnosis has been sent to your account.\br Use your patient id number:${patient.patient_id}to register for online services.`
              };

            transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                  console.log(error);
                } else {
                  console.log('Email sent: ' + info.response);
                }
              });

            res.render("physician/success")
        }
    })
})

//existing record, so we call it history
router.get('/loggedin/200/patient_search/patients_ii/history',(req,res)=>{
    const dbcommand = 'SELECT * FROM dia_info WHERE patient_id = $1'
    const dbvalue = [patient.patient_id]
    pool.query(dbcommand,dbvalue,(err,results)=>{
        if(err){
            console.log(err)
        }else{
            const record = results.rows
            if(patient.patient_id===""||doctor.doc_id===""){
                res.send("Please log into the system")
            }else{
                if(record.length===0){
                    res.send('No record saved on file for this patient')
                }else{
                    console.log(results.rows)
                    res.render('physician/extrecord',{
                        record:record
                    })
                }
            }
        }
    })
})

router.get('/loggedin/200/patient_search/patients_ii/update/:record_id',(req,res)=>{
    const record_id = req.params.record_id
    const dbcommand = 'SELECT * FROM dia_info WHERE record_id = $1 AND patient_id=$2'
    const dbvalue = [record_id,patient.patient_id]
    pool.query(dbcommand,dbvalue,(err,results)=>{
        if(err){
            console.log(err)
        }else{
            const record = results.rows[0]
            if(record===undefined){
                res.send("Please log into the system")
            }else{
                console.log(record)
                res.render('physician/update/update',{
                    date:record.record_id,
                    category:record.category,
                    psa_index:record.psa,
                    urine_freq:record.frequency,
                    urine_blood:record.urine_blood,
                    family_history:record.fam_history,
                    other_info:record.symptom_summary
                })
            }
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