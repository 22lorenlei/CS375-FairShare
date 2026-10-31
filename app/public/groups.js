
let currentUser = null;

let selectButton = document.getElementById("selectUser");
let createButton = document.getElementById("createGroup");

let groupsDiv = document.getElementById("groups");

let userMessage = document.getElementById("userMessage");
let createMessage = document.getElementById("createMessage");

createButton.disabled = true;


// Select or create a user
selectButton.addEventListener("click", function () {
    let username = document.getElementById("currentUsername").value.trim();

    fetch("/users/select", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username: username })
    })
    .then(function (response) {
        if (!response.ok) {
            throw new Error("Invalid username");
        }
        return response.json();
    })
    .then(function (data) {
        currentUser = data.id;
        userMessage.textContent = "Current user: " + data.username;

        createButton.disabled = false;
        createMessage.textContent = "";

        loadGroups();
    })
    .catch(function (error) {
        console.log(error);
        userMessage.textContent = "Could not select user";
    });
});


// Create a group
createButton.addEventListener("click", function () {
    let name = document.getElementById("groupName").value.trim();

    if (name === "") {
        createMessage.textContent = "Please enter a group name";
        return;
    }

    fetch("/groups", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: name,
            userId: currentUser
        })
    })
    .then(function (response) {
        if (response.status === 200) {
            createMessage.textContent = "Group created!";
            document.getElementById("groupName").value = "";
            loadGroups();
        } else {
            createMessage.textContent = "Could not create group";
        }
    })
    .catch(function (error) {
        console.log(error);
        createMessage.textContent = "Something went wrong";
    });
});


// Display user's groups
function loadGroups() {
    fetch("/groups?userId=" + currentUser)
    .then(function (response) {
        if (!response.ok) {
            throw new Error("Could not load groups");
        }
        return response.json();
    })
    .then(function (data) {
        groupsDiv.replaceChildren();

        for (let i = 0; i < data.rows.length; i++) {
            let group = data.rows[i];

            let paragraph = document.createElement("p");
            paragraph.textContent = group.name;

            groupsDiv.appendChild(paragraph);
        }
    })
    .catch(function (error) {
        console.log(error);
    });
}
