let username = document.getElementById("username");
let password = document.getElementById("password");
let button = document.getElementById("submit");

button.addEventListener("click", () => {
    fetch(`/login?username=${username.value}&password=${password.value}`).then((response) => {
        return response.json();
    }).then((body) => {
        console.log(body.message);
        document.getElementById("message").textContent = body.message;
    }).catch((error) => {
        console.log(error);
    });
})