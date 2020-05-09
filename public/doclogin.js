function formValidation(){
    const password_1 = document.getElementById('password_1').value
    const password_2 = document.getElementById('password_2').value

    if (password_1 !== password_2 ) {
        console.log('password dont match')
        return false
    }
}