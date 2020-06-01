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

class Patient {
  constructor(fn, ln, patient_id) {
    this.firstname = fn
    this.lastname = ln
    this.patient_id = patient_id
    this.login_status = false
  }
}
let patient = ''
let record = ''
let date = ''

//open this when you have a record OPEN when update

class Doctor {
  constructor(fn, ln, doc_id) {
    this.firstname = fn
    this.lastname = ln
    this.doc_id = doc_id
  }
}

router.get('/',(req,res)=>{
    res.render('patient/login')
})

//creating an account
router.post('/accountcreated',(req,res)=>{
  const user_id = req.body.user_id
  const password = req.body.password_1
  let dbcommand = 'SELECT * FROM pat_info WHERE patient_id = $1'
  let dbvalue = [user_id]
  pool.query(dbcommand,dbvalue,(err,results)=>{
    if (err){
      res.send('Not Working')
    }
    else if(results.rows[0].password!== null){
      res.send('This account has already been registered')
    }
    else{
      const patient_info = results.rows[0]
      if(patient_info===undefined){
        res.send("Your file is not in the system")
      }else{
        console.log('User found and the account is being created')

        patient = new Patient(patient_info.patient_firstname,patient_info.patient_lastname,patient_info.patient_id)
        patient.login_status = true

        dbcommand = 'UPDATE pat_info SET password = $1 WHERE patient_id = $2'
        dbvalue = [password,user_id]
        pool.query(dbcommand,dbvalue,(err,results)=>{
          if(err){
            res.redirect('/')
            console.log(err)
          }else{
            console.log('account created!')
            // res.send('Success!')
            // res.json(patient)
            res.render('patient/loggedin')
          }
        })
      }
    }
  })
})


//loggin route
router.post('/loggedin',(req,res)=>{
  const user_id = req.body.user_id_2
  let dbcommand = 'SELECT * FROM pat_info WHERE patient_id = $1'
  let dbvalue = [user_id]
  let patient_info 
  pool.query(dbcommand,dbvalue,(err,results)=>{
    if(err){
      console.log(err)
    }else{
      patient_info = results.rows[0]
      patient = new Patient(patient_info.patient_firstname,patient_info.patient_lastname,patient_info.patient_id)
      patient.login_status = true
      // res.json(patient)
      res.render('patient/loggedin',{
        firstname:patient.firstname,
        lastname:patient.lastname
      })
    }
  })
})

router.get('/loggedin',async(req,res)=>{
  if(patient===''){
    res.send('Please log into the system')
  }else{
    res.render('patient/loggedin',{
      firstname:patient.firstname,
      lastname:patient.lastname
    })
    // try{
    //   const dbcommand = 'SELECT * FROM pat_info WHERE patient_id = $1'
    //   const dbvalue = [patient.patient_id]
    //   const results = await pool.query(dbcommand,dbvalue)
    //   res.render()
    // }
  }
})


router.get('/loggedin/existing_records',(req,res)=>{
  //pass patient.patient_id in here
  const user_id = patient.patient_id
  const dbcommand = 'SELECT * FROM dia_info WHERE patient_id = $1'
  const dbvalue = [user_id]
  pool.query(dbcommand,dbvalue,(err,results)=>{
    if(err){
      console.log(err)
    }else{
      const records=results.rows
      // res.json(records)
      res.render('patient/extrecord',{
        record:records
      })
    }
  })
})

router.get('/loggedin/existing_records/:record_id',(req,res)=>{
  const record_id = req.params.record_id
  const dbcommand = 'SELECT * FROM dia_info WHERE record_id = $1'
  const dbvalue = [record_id]
  pool.query(dbcommand,dbvalue,(err,results)=>{
    if(err){
      console.log(err)
    }else{
      record= results.rows[0]
      //maybe send an email to doctor once the send button is clicked
      res.render('patient/update',{
        date:record.record_id,
        category:record.category,
        psa_index:record.psa,
        urine_freq:record.frequency,
        urine_blood:record.urine_blood,
        family_history:record.fam_history,
        other_info:record.symptom_summary
        
      })
    }
  })
})

//post diagnosis message update
router.post('/loggedin/existing_records/messageUpdated', async (req,res)=>{
  const record_content = req.body.record_update

  let month = (new Date().getMonth()+1).toString()
  let day = new Date().getDate().toString()
  let hour = new Date().getHours().toString()
  let minute = new Date().getMinutes().toString()
  let date = month.concat('/').concat(day).concat('/').concat(hour).concat('/').concat(minute)

  const dbcommand = 'INSERT INTO post_info (date, msg_content, record_id, patient_id) VALUES ($1,$2,$3,$4)'
  const dbvalue = [date,record_content,record.record_id,patient.patient_id]
  
  try{
    const results = await pool.query(dbcommand,dbvalue)
    // console.log(results.rows)
    res.render('patient/success')
  }catch(err){
    console.log(err)
  }
})


module.exports=router
