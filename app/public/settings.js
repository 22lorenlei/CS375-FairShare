let email = document.getElementById("email");
let username = document.getElementById("username");
let currentPassword = document.getElementById("current-password");
let newPassword = document.getElementById("new-password");
let confirmPassword = document.getElementById("confirm-password");
let messageDisplay = document.getElementById("message-display");
let passwordMessage = document.getElementById("password-message");

let usernameForm = document.getElementById("username-form");
let passwordForm = document.getElementById("password-form");

let accountButton = document.getElementById("account-info");
let accountDropdown = document.getElementById("account-dropdown");
let usernameButton = document.getElementById("btn-username");
let passwordButton = document.getElementById("btn-password");
let paymentButton = document.getElementById("payment-preferences");
let notificationButton = document.getElementById("notification-settings");
let friendsButton = document.getElementById("friends");

let usernamePanel = document.getElementById("show-username");
let passwordPanel = document.getElementById("show-password");
let paymentPanel = document.getElementById("show-payment-preferences");
let notificationPanel = document.getElementById("show-notification-settings");
let friendsPanel = document.getElementById("show-friends")

fetch("/navbar.html")
.then(function (response) {
    if (!response.ok) {
        throw new Error("Could not load navbar");
    }
    return response.text();
})
.then(function (html) {
    let documentCopy = new DOMParser().parseFromString(html, "text/html");
    let navbar = documentCopy.querySelector("nav");

    document.getElementById("navbar").appendChild(navbar);
    document.getElementById("logout").addEventListener("click", function () {
        let button = this;
        button.disabled = true;
        fetch("/logout", { method: "POST" })
        .then(function (response) {
            if (!response.ok) throw new Error("Could not log out. Please try again.");
            window.location.replace("/login.html");
        })
        .catch(function (error) {
            messageDisplay.textContent = error.message;
            button.disabled = false;
        });
    });
})
.catch(function (error) {
    console.log(error);
});

accountButton.addEventListener("click", () => { accountDropdown.classList.toggle("hidden"); });
usernameButton.addEventListener("click", () => { 
    usernamePanel.classList.toggle("hidden"); 
    passwordPanel.classList.add("hidden");
    paymentPanel.classList.add("hidden");
    notificationPanel.classList.add("hidden");
    friendsPanel.classList.add("hidden");
});
passwordButton.addEventListener("click", () => { 
    passwordPanel.classList.toggle("hidden"); 
    usernamePanel.classList.add("hidden");
    paymentPanel.classList.add("hidden");
    notificationPanel.classList.add("hidden");
    friendsPanel.classList.add("hidden"); 
});
paymentButton.addEventListener("click", () => { 
    paymentPanel.classList.toggle("hidden"); 
    usernamePanel.classList.add("hidden");
    passwordPanel.classList.add("hidden");
    notificationPanel.classList.add("hidden");
    friendsPanel.classList.add("hidden"); 
});
notificationButton.addEventListener("click", () => { 
    notificationPanel.classList.toggle("hidden"); 
    usernamePanel.classList.add("hidden");
    passwordPanel.classList.add("hidden");
    paymentPanel.classList.add("hidden");
    friendsPanel.classList.add("hidden"); 
});
friendsButton.addEventListener("click", () => { 
    friendsPanel.classList.toggle("hidden"); 
    usernamePanel.classList.add("hidden");
    passwordPanel.classList.add("hidden");
    paymentPanel.classList.add("hidden");
    notificationPanel.classList.add("hidden"); 
});

usernameForm.addEventListener("submit", (event) => {
    event.preventDefault();
    messageDisplay.innerText = "";

    fetch("/account/username", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            username: username.value,
        })
    }).then((response) => {
       response.json().then((body) => {
            console.log(body)

            if (response.status === 200) {
                messageDisplay.innerText = body.message;
                messageDisplay.style.color = "green"; 
            } else {
                messageDisplay.innerText = body.message;
                messageDisplay.style.color = "red";
            }
            
        });
    });

});

passwordForm.addEventListener("submit", (event) => {
    passwordMessage.innerText = "";

    event.preventDefault();

    if (newPassword.value !== confirmPassword.value) {
        passwordMessage.innerText = "Passwords don't match!"
        passwordMessage.style.color = "red";
        return;
    };

    
    fetch("/account/password", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            currentPassword: currentPassword.value,
            newPassword: newPassword.value,
        })
    }).then((response) => {
       response.json().then((body) => {
            console.log(body)

            if (response.status === 200) {
                passwordMessage.innerText = body.message;
                passwordMessage.style.color = "green"; 
            } else {
                passwordMessage.innerText = body.message;
                passwordMessage.style.color = "red";
            }
            
        });
    });
    
});
