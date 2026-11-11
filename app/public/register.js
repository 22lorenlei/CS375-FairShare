let email = document.getElementById("email");
let username = document.getElementById("username");
let password = document.getElementById("password");
let passwordConfirm = document.getElementById("password-confirmation");
let form = document.getElementById("register-form");
let passwordNotConfirmed = document.getElementById("password-confirmation-error");
let accountCreated = document.getElementById("account-created")


form.addEventListener("submit", (event) => {
    passwordNotConfirmed.innerText = "";
    accountCreated.innerText = "";

    event.preventDefault();
    if (password.value !== passwordConfirm.value) {
        passwordNotConfirmed.innerText = "Passwords don't match!";
        return;
    }

    fetch("/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email: email.value,
            username: username.value,
            password: password.value,
        })
    }).then((response) => {
       response.json().then((body) => {
            

            if (response.status === 200) {
                accountCreated.innerText = body.message;
                accountCreated.style.color = "green"; 
            } else {
                accountCreated.innerText = body.message;
                accountCreated.style.color = "red";
            }
            
        });
    });

});