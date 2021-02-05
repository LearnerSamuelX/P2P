const express = require("express");
const nodemailer = require('nodemailer');
let router = express.Router();
const crypto = require('crypto');
const crypto_salt = 'salt_rotation';
const session = require('express-session');
const {v4: uuidv4} = require("uuid"); 

const Pool = require('pg').Pool;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost', //will be changed for deployement 
    database: 'p2p',
    password: 'SAMEDWARDS',  //salt rotation
    port: 5432,
  })

async function session_validation(req,res,next){
    // console.log(`Inside the middleware function. ${req.sessionID}`);
    let validation_text = 'SELECT * FROM doc_reg WHERE session_id=$1';
    let session_id = req.sessionID;
    try{
        let result_found = await pool.query(validation_text,[session_id]);
        let user_found = result_found.rows[0];
        if(user_found===undefined){
            res.send('Session Expired, please relogin first.');
        }
        // console.log(user_found);
        req.user_found = user_found;
        next();
    }catch(error){
        console.log(error);
        req.user_found = 'error'
        res.send('Error at session_validation.')
    }
}

async function pagination_validation(req,res,next){
    console.log(`Inside the pagination_validation function. ${req.sessionID}`);
    let doc_id = [req.user_found.username];
    let found_doc_pat_list = 'SELECT * FROM doc_pat_list WHERE username = $1';
    try{
        let result_found = await pool.query(found_doc_pat_list,doc_id);
        let patients_list  =result_found.rows;
        req.patients_list = patients_list;
        next();
    }catch(error){
        console.log(error);
        res.send('Error at pagination_validation.');
    }
}

let doctor = ""
let patient = ""

async function patient_unique_check (req,res,next){
    //pass the patient_id into the function
    let dbsearch_text = 'SELECT * FROM pat_info WHERE patient_id = $1';
    let dbsearch_value = [req.body.patientid_1];
    let result_found = await pool.query(dbsearch_text,dbsearch_value);
    let patient_found = result_found.rows[0];
    if(patient_found!==undefined){
        res.render("physician/patmenu",{
            patientfirstname:patient_found.patient_firstname,
            patientlastname:patient_found.patient_lastname,
            patientage:patient_found.birth_date
        })
    }else{
        next();
    }
}


router.use(session({
    genid: function(req) {
        return uuidv4() // use UUIDs for session IDs
      },
    name:'authorized_doctor',
    //store: the default setting is storing the session id into memory
    secret: 'dr.hartman', //rotate the secret that is used to generate session ID
    resave: false, 
    saveUninitialized: true,
    cookie: {
        maxAge: 1000*60*60,  //an hour 
    },
}))

router.get('/',async (req,res)=>{
    let session_id = req.sessionID;
    let validation_text = 'SELECT * FROM doc_reg WHERE session_id=$1';
    let result_found = await pool.query (validation_text,[session_id]);
    const doc_info = result_found.rows[0];
    if(doc_info!==undefined){
        res.render('physician/loggedin',{
            docid:doc_info.username,
            firstname:doc_info.firstname.toUpperCase(),
            lastname:doc_info.lastname.toUpperCase()
        });
    }else{
        res.render('physician/login');
    }
})

//for creating an account for doctor
router.post('/accountcreated',async (req,res)=>{
    const {user_name, password_1, first_name,last_name,user_email}=req.body
    const dbsearch_text='SELECT * FROM doc_reg WHERE username = $1'
    const dbsearch_value=[user_name]
    const session_id = req.sessionID
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
                let hashed_password = crypto.pbkdf2Sync(password_1, crypto_salt, 1000, 64, 'sha512').toString(`hex`);
                pool.query('INSERT INTO doc_reg (username,password,firstname,lastname,email,session_id) VALUES ($1,$2,$3,$4,$5,$6)'
                ,[user_name,hashed_password,first_name,last_name,user_email,session_id],(error, results_2)=>{
                    if (error){
                        console.log(error)
                        req.send('Error!')
                    }else{
                        //Username: Roma_Number_1
                        //Password: juvenumber1
                        res.render('physician/loggedin',{
                            docid:user_name,
                            firstname:first_name.toUpperCase(),
                            lastname:last_name.toUpperCase()
                        })
                    }
                })
            }
        }
    })
})

//table doc_reg
//the login search feature, change it to 'POST' request
router.post('/loggedin',async(req,res)=>{
    const {user_name_login,password_login} = req.body
    //convert password to hashed_version
    let hashed_password = crypto.pbkdf2Sync(password_login, crypto_salt, 1000, 64, 'sha512').toString(`hex`);
    const dbsearch_text = 'SELECT * FROM doc_reg WHERE username=$1 AND password=$2';
    const dbsearch_value= [user_name_login,hashed_password];
    pool.query(dbsearch_text,dbsearch_value,(err,results)=>{
        if (err){
            console.log(err);
        }
        const doc_info = results.rows[0];
        if(doc_info===undefined){
            res.send("You have not registered yet. Please create an account first");
        }else{
            
            let session_id = req.sessionID;
            // console.log(session_id)
            //update session_id in the database
            const dbsession_update = 'UPDATE doc_reg SET session_id=$1 WHERE username=$2'
            const dbsession_value = [session_id,doc_info.username]
            try{
                pool.query(dbsession_update,dbsession_value);
                res.render('physician/loggedin',{
                    docid:doc_info.username,
                    firstname:doc_info.firstname.toUpperCase(),
                    lastname:doc_info.lastname.toUpperCase()
                });
            }catch(error){
                console.log(error)
                res.send('Error occurs at Login.');
            }
        }
    })
})

router.use(session_validation);
router.get('/loggedin/200/new_patient', async (req,res)=>{
    res.render('physician/newpatient',{doc_id:req.user_found.username})
})
/* COMPLETED */


/* you can use a validation middleware in here */
router.post('/loggedin/200/new_patient/patient_info',patient_unique_check,async (req,res)=>{
    let doc_id = req.user_found.username;
    const {patient_firstname, patient_lastname, patientid_1,patient_email,patient_birthday,}=req.body;

    const dbcreate_text = "INSERT INTO pat_info (patient_firstname, patient_lastname,patient_id,doc_id,patient_email,birth_date) VALUES ($1, $2, $3, $4, $5, $6)";
    const dbcreate_value=[patient_firstname, patient_lastname, patientid_1,doc_id,patient_email,patient_birthday];

    const dbcreate_text_2 = "INSERT INTO doc_pat_list (username,patient_id) VALUES ($1, $2)";
    const dbcreate_value_2 = [doc_id, patientid_1]

    try{
        
        await pool.query(dbcreate_text,dbcreate_value); //INSERT data into the database
        await pool.query(dbcreate_text_2,dbcreate_value_2);

        res.render("physician/patmenu",{
            patientfirstname:patient_firstname,
            patientlastname:patient_lastname,
            patientage:patient_birthday
        })
    }catch(error){
        console.log('Error occurred.')
        res.send('Error occured at patient info entry.')
    }
})

//direct to patient search page when searching for existing patients
router.get('/loggedin/200/patient_search',session_validation,async (req,res)=>{
    let doc_id = req.user_found.username;
    let doc_lastname = req.user_found.lastname;
    const dbsearch_text = 'SELECT * FROM doc_pat_list WHERE username = $1'
    const dbsearch_value = [doc_id]
    try{
        let result_found =  await pool.query(dbsearch_text,dbsearch_value);
        // console.log(result_found.rows);
        let patients_list = result_found.rows;
        
        /* 
        13 patients in total, 5 per page, 3 pages needed, 

        13%4 = 1

        first do this: (13-(13%5)) 
        if (%4===0) --> no need to add a page
        else if (%4!==0) --> add a page
        */

        let pages = (patients_list.length-patients_list.length%5)/5
        let list_to_be_displayed = patients_list.slice(0*5,0*5+5);
        if(patients_list.length%5!==0){
            pages = pages+1
        }


        res.render('physician/extpatient',{
            doc_id:doc_lastname,
            list_tobe_displayed:list_to_be_displayed,
            page_num:pages
        })

    }catch(error){
        console.log(error);
        res.send('Error occured at searching for existing patients.')
    }
    
})

//Pagination
router.get('/loggedin/200/anchor/:page',pagination_validation,async (req,res)=>{

    let page_num  = req.params.page;
    let doc_lastname = req.user_found.lastname;
    /* 
        Page 0, 0-4,   from k*5 to k*5+5
        Page 1, 5-9,    from k*5 to k*5+5
        Page 2, 10-14    from k*5 to k*5+5
    */
    console.log('You are on page: '+page_num);
    let list_to_be_displayed = req.patients_list.slice(page_num*5,page_num*5+5);
    let patients_list = req.patients_list;

    let pages = (patients_list.length-patients_list.length%5)/5

    if(patients_list.length%5!==0){
        pages = pages+1
    }

    res.render('physician/extpatient',{
        doc_id:doc_lastname,
        list_tobe_displayed:list_to_be_displayed,
        page_num:pages,
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
            
            const pat_info = results.rows[0]
            if(pat_info===undefined){
                res.send("This patient is not in the database.")
            }else{
                res.render('physician/patmenu',{
                    patientlastname:pat_info.lastname,
                    patientfirstname:pat_info.firstname,
                })
            }
        }
    })
})

//routes to creating or updating diagnosis (urologist)

router.get('/loggedin/200/patient_search/patients_ii/new_record/',(req,res)=>{

    let record_id = new Date()
    let a = record_id.getFullYear().toString()
    let b = record_id.getMonth().toString()
    let c = record_id.getDate().toString()
    let d = record_id.getHours().toString()
    let e = record_id.getMinutes().toString()
    let id_serie = a.concat(b).concat(c).concat(d).concat(e)

    console.log(req.user_found.lastname);

    res.render('physician/newrecord',{
            record_id:id_serie
    })
})

router.post('/loggedin/200/patient_search/diagnosiscreated',(req,res)=>{
    //insert data into dia_info table
    const {record_category,psa_index,urine_freq,urine_blood,fam_line,dia_summary}=req.body
    const dbcommand = 
    "INSERT INTO dia_info (record_id,category,psa,frequency,urine_blood,fam_history,symptom_summary,patient_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)" 
    const dbvalue = [id_serie,record_category.toUpperCase(),psa_index,urine_freq,urine_blood,fam_line,dia_summary,patient.patient_id]
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
                    // console.log(results.rows)
                    res.render('physician/extrecord',{
                        record:record
                    })
                }
            }
        }
    })
})

router.get('/loggedin/200/patient_search/patients_ii/update/:record_id',async (req,res)=>{
    id_serie = req.params.record_id

    //extract info from post_info database
    const dbcommand_2 = 'SELECT * FROM post_info WHERE record_id = $1'
    const dbvalue_2 = [id_serie]
    const convo_result = await pool.query(dbcommand_2,dbvalue_2)
    
    const msg_display = convo_result.rows
    console.log(msg_display)

    const dbcommand = 'SELECT * FROM dia_info WHERE record_id = $1 AND patient_id=$2'
    const dbvalue = [id_serie,patient.patient_id]
    const results = await pool.query(dbcommand,dbvalue)
    const record = results.rows[0]
    if(record===undefined){
        res.send("Please log into the system")
    }else{
        // console.log(record) 
        res.render('physician/update/update',{
            record_id:record.record_id,
            category:record.category,
            psa_index:record.psa,
            urine_freq:record.frequency,
            urine_blood:record.urine_blood,
            family_history:record.fam_history,
            other_info:record.symptom_summary,
            messages:msg_display
        })
    }
})

router.post('/loggedin/existing_records/messageUpdated',async(req,res)=>{
    const record_content = req.body.record_update

    let year = new Date().getFullYear().toString()
    let month = (new Date().getMonth()+1).toString()
    let day = new Date().getDate().toString()
    let hour = new Date().getHours().toString()
    let minute = new Date().getMinutes().toString()
    let date = year.concat('/').concat(month).concat('/').concat(day).concat(' ').concat(hour).concat(':').concat(minute)

    const dbcommand = 'INSERT INTO post_info (date, msg_content, record_id, doc_id) VALUES ($1,$2,$3,$4)'
    const dbvalue = [date,record_content,id_serie,doctor.doc_id]

    try{
        const results = await pool.query(dbcommand,dbvalue)
        // console.log(results.rows)
        res.render('physician/success_1')
    }catch(err){
        console.log(err)
    }
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
});

module.exports = router;