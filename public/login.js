function registerValidation(){
    const user_name = document.getElementById('user_name').value
    const user_email = document.getElementById('user_email').value
    const first_name = document.getElementById('first_name').value
    const last_name = document.getElementById('last_name').value
    const password_1 = document.getElementById('password_1').value
    const password_2 = document.getElementById('password_2').value

    //we will leave the creating password part later, because it is such a pain in the ass

    if (user_name==="" || user_email==="" || first_name==="" || last_name===""|| password_1===""|| password_2===""){
        alert("Information Missing for Required Entries")
        console.log("1 Worked!")
        return false
    }

    else if (password_1!==password_2){
        alert("Please make sure the passwords matched")
        return false
    }
}

function loginValidation (){
    const user_name = document.getElementById('user_name_login').value
    const password = document.getElementById('password_login').value

    if (user_name===""|| password===""){
        console.log("2 Worked!")
        alert("Login Information Missing")
        return false
    }
}