let email = document.getElementById("email");
let password = document.getElementById("password");
let form = document.getElementById("login-form");

form.addEventListener("submit", (event) => {
    event.preventDefault();

    fetch(`/login?email=${email.value}&password=${password.value}`).then((response) => {
        return response.json();
    }).then((body) => {
        document.getElementById("message").textContent = body.message;

        
        /* DIRECTS TO HOME PAGE AFTER LOG IN
        if (body.message === "Logged in!") {
            window.location.href = "/";
        }
        */

    }).catch((error) => {
        console.log(error);
    });
})