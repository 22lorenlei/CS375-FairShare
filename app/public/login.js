let email = document.getElementById("email");
let password = document.getElementById("password");
let form = document.getElementById("login-form");

form.addEventListener("submit", (event) => {
    event.preventDefault();

    fetch(`/login?email=${encodeURIComponent(email.value)}&password=${encodeURIComponent(password.value)}`).then((response) => {
        return response.json();
    }).then((body) => {
        document.getElementById("message").textContent = body.message;
        if (body.loggedIn) {
            window.location.href = "/trips.html";
        }
    }).catch((error) => {
        console.log(error);
    });
})