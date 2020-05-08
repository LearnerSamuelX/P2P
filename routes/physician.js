const express = require("express")
const router = express.Router()

router.get('/',(req,res)=>{
    res.render('physician/login')
})


router.post('/loggedin',(req,res)=>{

    res.render('physician/loggedin') 
    /*res.render('physician/loggedin',{
        names in view engine: name of data column created in database
    })*/
})

module.exports=router