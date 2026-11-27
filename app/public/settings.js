let email = document.getElementById("email");
let username = document.getElementById("username");
let currentPassword = document.getElementById("current-password");
let newPassword = document.getElementById("new-password");
let confirmPassword = document.getElementById("confirm-password");
let messageDisplay = document.getElementById("message-display");
let passwordMessage = document.getElementById("password-message");
let friendMessage = document.getElementById("friend-message");
let friendsInput = document.getElementById("friends-input");

let usernameForm = document.getElementById("username-form");
let passwordForm = document.getElementById("password-form");
let friendsForm = document.getElementById("add-friends-form");

let accountButton = document.getElementById("account-info");
let accountDropdown = document.getElementById("account-dropdown");
let usernameButton = document.getElementById("btn-username");
let passwordButton = document.getElementById("btn-password");
let paymentButton = document.getElementById("payment-preferences");
let notificationButton = document.getElementById("notification-settings");
let friendsButton = document.getElementById("friends");
let mailButton = document.getElementById("mail");

let usernamePanel = document.getElementById("show-username");
let passwordPanel = document.getElementById("show-password");
let paymentPanel = document.getElementById("show-payment-preferences");
let notificationPanel = document.getElementById("show-notification-settings");
let friendsPanel = document.getElementById("show-friends")
let mailPanel = document.getElementById("show-mail");

let friendsTable = document.getElementById("current-friends-table");
let friendsTableMessage = document.getElementById("friends-table-message");
let incomingFriendsTable = document.getElementById("incoming-friends-table");
let incomingFriendsTableMessage = document.getElementById("incoming-friends-table-message");

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
    mailPanel.classList.add("hidden");
});
passwordButton.addEventListener("click", () => { 
    passwordPanel.classList.toggle("hidden"); 
    usernamePanel.classList.add("hidden");
    paymentPanel.classList.add("hidden");
    notificationPanel.classList.add("hidden");
    friendsPanel.classList.add("hidden"); 
    mailPanel.classList.add("hidden");
});
paymentButton.addEventListener("click", () => { 
    paymentPanel.classList.toggle("hidden"); 
    usernamePanel.classList.add("hidden");
    passwordPanel.classList.add("hidden");
    notificationPanel.classList.add("hidden");
    friendsPanel.classList.add("hidden"); 
    mailPanel.classList.add("hidden");
});
notificationButton.addEventListener("click", () => { 
    notificationPanel.classList.toggle("hidden"); 
    usernamePanel.classList.add("hidden");
    passwordPanel.classList.add("hidden");
    paymentPanel.classList.add("hidden");
    friendsPanel.classList.add("hidden"); 
    mailPanel.classList.add("hidden");
});
friendsButton.addEventListener("click", () => { 
    friendsPanel.classList.toggle("hidden"); 
    usernamePanel.classList.add("hidden");
    passwordPanel.classList.add("hidden");
    paymentPanel.classList.add("hidden");
    notificationPanel.classList.add("hidden"); 
    mailPanel.classList.add("hidden");
});
mailButton.addEventListener("click", () => { 
    mailPanel.classList.toggle("hidden");
    usernamePanel.classList.add("hidden");
    passwordPanel.classList.add("hidden");
    paymentPanel.classList.add("hidden");
    notificationPanel.classList.add("hidden"); 
    friendsPanel.classList.add("hidden"); 
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

friendsForm.addEventListener("submit", (event) => {		
	friendMessage.innerText = "";

	event.preventDefault();	

	let friendEmail = friendsInput.value;
	console.log(friendEmail);

	fetch("/account/addFriends", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			friendInput: friendEmail
		})
	}).then((response) => {
		return response.json();
	}).then((body) => {
		if (body.status === 200) {
			friendMessage.innerText = body.message;
			friendMessage.style.color = "green";
		} else {
			friendMessage.innerText = body.message;
			friendMessage.style.color = "red";
		}
	});
});

friendsButton.addEventListener("click", (event) => {
	friendsTable.innerHTML = "";
	friendsTableMessage.innerText = "";

	fetch("/account/getFriends", {
		method: "GET",
		headers: {
			"Accept": "application/json"
		},
	}).then((response) => {
		return response.json();
	}).then((body) => {
		if (body.message === "Success") {
			console.log("yoyo");
			let contents = body.contents;
			console.log(contents);
			for (let content of contents) {
				let tr = document.createElement("tr");
				let nameTd = document.createElement("td");
				nameTd.textContent = content["username"];
				tr.append(nameTd);
				friendsTable.append(tr);
			}
		} else {
			friendsTableMessage.innerText = body.message;
			friendsTableMessage.style.color = "red";
		}
	});
});

mailButton.addEventListener("click", (event) => {
	incomingFriendsTable.innerHTML = "";
	incomingFriendsTableMessage.innerHTML = "";

	fetch("/account/getFriendRequests", {
		method: "GET",
		headers: {
			"Accept": "application/json"
		},
	}).then((response) => {
		return response.json();
	}).then((body) => {
		if (body.message === "Success") {
			console.log(body.message);
			console.log(body);
			console.log(body.contents);
			let contents = body.contents;
			for (let content of contents) {
				let tr = document.createElement("tr");
				let nameTd = document.createElement("td");
				let emailTd = document.createElement("td");
				let acceptTd = document.createElement("td");
				let declineTd = document.createElement("td");
				nameTd.textContent = value["username"];
				emailTd.textContent = value["email"];
				
				let acceptButton = document.createElement("button");
				let declineButton = document.createElement("button");

				acceptButton.textContent = "Accept";
				declineButton.textContent = "Decline";
				acceptButton.classList.add("accept-friend-button");
				declineButton.classList.add("decline-friend-button");
				acceptButton.dataset.id = value["id"];
				declineButton.dataset.id = value["id"];
				acceptTd.append(acceptButton);
				declineTd.append(declineButton);

				tr.append(nameTd);
				tr.append(emailTd);
				tr.append(acceptTd);
				tr.append(declineTd);
				incomingFriendsTable.append(tr);
			}
		} else {
			incomingFriendsTableMessage.innerText = body.message;
			incomingFriendsTableMessage.style.color = "red";
		}
	});
});

incomingFriendsTable.addEventListener("click", (event) => {

	let acceptButton = event.target.closest(".accept-friend-button");
	let declineButton = event.target.closest(".decline-friend-button");

	if (acceptButton) {
		let id = acceptButton.dataset.id;
		let row = acceptButton.closest("tr");
		acceptFriendRequest(id, row);
	} else if (declineButton) {
		let id = declineButton.dataset.id;
		let row = declineButton.closest("tr");
		declineFriendRequest(id, row);
	}
});

function acceptFriendRequest(id, row) {
	incomingFriendsTableMessage.innerHTML = "";

	fetch("/account/acceptFriendRequest", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			id: id
		})
	}).then((response) => {
		return response.json();
	}).then((body) => {
		if (body.status === 200) {
			row.remove();
		} else {
			incomingFriendsTableMessage.innerText = body.message;
			incomingFriendsTableMessage.style.color = "red";
		}
	});
};

function declineFriendRequest(id, row) {
	incomingFriendsTableMessage.innerHTML = "";

	fetch("/account/declineFriendRequest", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			id: id
		})
	}).then((response) => {
		return response.json();
	}).then((body) => {
		if (body.status === 200) {
			row.remove();
		} else {
			incomingFriendsTableMessage.innerText = body.message;
			incomingFriendsTableMessage.style.color = "red";
		}
	});
};
