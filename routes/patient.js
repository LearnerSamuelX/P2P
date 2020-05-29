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

class Record {
  constructor(fn, ln, patient_id,record_id) {
    this.firstname = fn
    this.lastname = ln
    this.patient_id = patient_id
    this.record_id = record_id
    this.login_status = false
  }
}

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

        const patient = new Patient(patient_info.patient_firstname,patient_info.patient_lastname,patient_info.patient_id)
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
            res.render('patient/loggein')
          }
        })
      }
    }
  })
})


//loggin route
router.post('/loggedin',(req,res)=>{

})



module.exports=router
