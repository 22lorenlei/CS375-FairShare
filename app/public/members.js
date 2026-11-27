let membersTable = document.getElementById("membersTable"); 
let tripId = Number(new URLSearchParams(window.location.search).get("tripId"));
let inviteMembersButton = document.getElementById("inviteMembersButton");

console.log("Getting this trip id:", tripId);

function checkResponse(response, message) {                                     
    if (response.status === 401) {
        window.location.replace("/login.html");
        throw new Error("Please log in first");
    }                                                                           if (!response.ok) {
        return response.json().catch(function () { return {}; }).then(function (data) {
            throw new Error(data.error || data.message || message);
        });
    }
    return response.json();
}

function loadNavbar() {
    fetch("/navbar.html")
    .then(function (response) {
        if (!response.ok) throw new Error("Could not load navigation");
        return response.text();
    })
    .then(function (html) {
        let copy = new DOMParser().parseFromString(html, "text/html");
        let navbar = copy.querySelector("nav");
        document.getElementById("navbar").appendChild(navbar);
        document.getElementById("logout").addEventListener("click", function () {
            let button = this;
            button.disabled = true;
            fetch("/logout", { method: "POST" })
            .then(function (response) {
                if (!response.ok) throw new Error("Could not log out");
                window.location.replace("/login.html");
            })
            .catch(function () {
                button.disabled = false;
                showMessage("Could not log out. Please try again.", "error");
            });
        });
    })
    .catch(function (error) { console.log(error); });
}

function populateMembersTable() {
	console.log(tripId);
	fetch("/populateMembers", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			tripId: tripId
		}),
	}).then(function (response) { 
		return checkResponse(response, "Could not populate table");
	}).then(function (data) {
		console.log(data.contents);
		contents = data.contents;
		membersTable.textContent = "";
		for (let content of contents) {
			console.log(content);
			let tr = document.createElement("tr");
			let tdName = document.createElement("td");
			tdName.textContent = content.username;
			tr.append(tdName);
			membersTable.append(tr);
		}
	}).catch(function (error) {
		console.log(error);
	});
}

loadNavbar();
populateMembersTable();

