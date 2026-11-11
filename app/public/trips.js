
let allTrips = [];
let selectedTab = "active";

let openButton = document.getElementById("openModal");
let closeButton = document.getElementById("closeModal");
let tripModal = document.getElementById("tripModal");
let tripForm = document.getElementById("tripForm");
let tripsDiv = document.getElementById("trips");

let activeTab = document.getElementById("activeTab");
let pastTab = document.getElementById("pastTab");

let createMessage = document.getElementById("createMessage");

let membersModal = document.getElementById("membersModal");
let closeMembersButton = document.getElementById("closeMembersModal");
let membersForm = document.getElementById("membersForm");
let membersMessage = document.getElementById("membersMessage");

let addEventModal = document.getElementById("addEventModal");
let closeAddEventModal = document.getElementById("closeAddEventModal");
let addEventModalForm = document.getElementById("addEventForm");

let editEventModal = document.getElementById("editEventModal");
let closeEditEventModal = document.getElementById("closeEditEventModal");
let editEventModalTable = document.getElementById("editEventModalTable");

let selectedTripId = null;

// Load navbar from separate HTML file
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
            tripsDiv.textContent = error.message;
            button.disabled = false;
        });
    });
})
.catch(function (error) {
    console.log(error);
});


// Load trips for the signed-in user.
fetch("/auth/me")
.then(function (response) {
    checkSession(response);
    if (!response.ok) throw new Error("Could not load account");
    openButton.disabled = false;
    loadTrips();
})
.catch(function (error) {
    tripsDiv.textContent = error.message;
});

function checkSession(response) {
    if (response.status === 401) {
        window.location.replace("/login.html");
        throw new Error("Please log in again");
    }
}

// Open create trip modal
openButton.addEventListener("click", function () {
    tripModal.style.display = "flex";
    createMessage.textContent = "";
});


// Close create trip modal
closeButton.addEventListener("click", function () {
    tripModal.style.display = "none";
});

// Close create trip modal
window.addEventListener("click", function (event) {
    if (event.target === tripModal) {
        tripModal.style.display = "none";
    }

    if (event.target === membersModal) {
        membersModal.style.display = "none";
    }
});

// Close Add Members modal with X button
closeMembersButton.addEventListener("click", function () {
    membersModal.style.display = "none";
});

// Close Add Event modal with X button
closeAddEventModal.addEventListener("click", function () {
    addEventModal.style.display = "none";
});

// Close Edit Event modal with X button
closeEditEventModal.addEventListener("click", function() {
    editEventModal.style.display = "none"; 
});

// Create a new trip
tripForm.addEventListener("submit", function (event) {
    event.preventDefault();

    let name = document.getElementById("tripName").value.trim();
    let destination = document.getElementById("destination").value.trim();
    let startDate = document.getElementById("startDate").value;
    let endDate = document.getElementById("endDate").value;
    let budget = Number(document.getElementById("budget").value);
    let membersText = document.getElementById("members").value;

    if (endDate < startDate) {
        createMessage.textContent = "End date must be after start date";
        return;
    }

    let members = membersText.split(",")
        .map(function (username) {
            return username.trim();
        })
        .filter(function (username) {
            return username !== "";
        });

    let createButton = document.getElementById("createTrip");
    createButton.disabled = true;

    fetch("/trips", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: name,
            destination: destination,
            startDate: startDate,
            endDate: endDate,
            budget: budget,
            members: members
        })
    })
    .then(function (response) {
        checkSession(response);
        if (!response.ok) {
            return response.json().then(function (data) {
                throw new Error(data.error || "Could not create trip");
            });
        }
        return response.json();
    })
    .then(function () {
        tripForm.reset();
        tripModal.style.display = "none";
        loadTrips();
    })
    .catch(function (error) {
        createMessage.textContent = error.message;
    })
    .finally(function () {
        createButton.disabled = false;
    });
});

addEventModalForm.addEventListener("submit", function(event) {
	event.preventDefault();

	let tripId = selectedTripId;
	let eventName = document.getElementById("eventName").value;
	let eventCategory = document.getElementById("eventCategory").value;
	let eventTotalPrice = document.getElementById("eventTotalPrice").value;
	let eventStartDate = document.getElementById("eventStartDate").value;
	let eventEndDate = document.getElementById("eventEndDate").value;
	let eventLocation = document.getElementById("eventLocation").value;

	let addEventFeedback = document.getElementById("addEventFeedback");

	if (eventEndDate < eventStartDate) {
		addEventFeedback.textContent = "End date must be equal or after start date";		
		return;
	}

	let createButton = document.getElementById("createTrip");
	createButton.disabled = true;

	console.log(tripId, eventName, eventCategory, eventTotalPrice, eventStartDate, eventEndDate, eventLocation);

	fetch("/addEvent", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			tripId: tripId,
			eventName: eventName,
			eventCategory: eventCategory,
			eventTotalPrice: eventTotalPrice,
			eventStartDate: eventStartDate,
			eventEndDate: eventEndDate,
			eventLocation: eventLocation
		}),
	}).then(function (response) {
		checkSession(response);
		if (!response.ok) {
			return response.json().then(function (data) {
				throw new Error(data.error || "Could not create trip");
			});
		}
		return response.json();
	}).then(function () {
		addEventModalForm.reset();
		addEventModal.style.display = "none";
		loadTrips();
	}).catch(function (error) {
		addEventFeedback.textContent = error.message;
	}).finally(function () {
		createButton.disabled = false;
	});
});


// Load trips from database
function loadTrips() {
    fetch("/trips")
    .then(function (response) {
        checkSession(response);
        if (!response.ok) {
            throw new Error("Could not load trips");
        }
        return response.json();
    })
    .then(function (data) {
        allTrips = data.rows;
        displayTrips();
    })
    .catch(function (error) {
        console.log(error);
        tripsDiv.textContent = "Could not load trips";
    });
}

function loadEvents() {
	let route = "/loadEvents?tripId=" + selectedTripId;
	fetch(route)
	.then(function (response) {
		checkSession(response);
		if (!response.ok) {
			throw new Error("Could not load events");
		}
		return response.json();
	}).then(function (data) {
		let contents = data.result;
		console.log(contents);	
		editEventModalTable.textContent = "";
		for (let content of contents) {
			let tr = document.createElement("tr");
			tr.classList.add('event-table');
			for (let [key, value] of Object.entries(content)) {
				let td = document.createElement("td");
				td.textContent = value;
				td.classList.add('event-table');
				tr.append(td);
			}
			editEventModalTable.append(tr);
		}
	}).catch(function (error) {
		console.log(error);
	});
}


// Format a date without timezone changes
function formatDate(dateString) {
    if (!dateString) {
        return "Not set";
    }

    let parts = dateString.substring(0, 10).split("-");
    let date = new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
    );

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}


// Display active or past trips
function displayTrips() {
    tripsDiv.replaceChildren();

    let today = new Date();
    let todayString =
        today.getFullYear() + "-" +
        String(today.getMonth() + 1).padStart(2, "0") + "-" +
        String(today.getDate()).padStart(2, "0");

    let visibleTrips = allTrips.filter(function (trip) {
        let isPast = trip.end_date && trip.end_date < todayString;

        if (selectedTab === "past") {
            return isPast;
        }

        return !isPast;
    });

    if (visibleTrips.length === 0) {
        let message = document.createElement("p");
        message.className = "empty-message";
        message.textContent = "No trips to display";
        tripsDiv.appendChild(message);
        return;
    }

    for (let i = 0; i < visibleTrips.length; i++) {
        let trip = visibleTrips[i];

        let card = document.createElement("div");
        card.className = "trip-card";

        let details = document.createElement("div");
        details.className = "trip-details";

        let title = document.createElement("h3");
        title.textContent = trip.name;

        let dates = document.createElement("p");
        dates.textContent = formatDate(trip.start_date) + " - " + formatDate(trip.end_date);

        let members = document.createElement("p");
        members.textContent = trip.member_count + (trip.member_count === 1 ? " member" : " members");

        let buttons = document.createElement("div");
        buttons.className = "trip-buttons";

	let addEventButton = document.createElement("button");
	addEventButton.className = "view-button";
	addEventButton.textContent = "Add Event";

        let viewButton = document.createElement("button");
        viewButton.className = "view-button";
        viewButton.textContent = "View Trip";

        let addMembersButton = document.createElement("button");
        addMembersButton.className = "view-button";
        addMembersButton.textContent = "Add Members";

	let editEventButton = document.createElement("button");
	editEventButton.className = "view-button";
	editEventButton.textContent = "Edit Events";

        addMembersButton.addEventListener("click", function () {
            selectedTripId = trip.id;
            membersMessage.textContent = "";
            membersForm.reset();
            membersModal.style.display = "flex";
        });

	addEventButton.addEventListener("click", function () {
	    selectedTripId = trip.id; 
	    addEventModalForm.reset();
	    addEventModal.style.display = "flex";
	});

	editEventButton.addEventListener("click", function () {
	    selectedTripId = trip.id;
	    loadEvents(); 
	    editEventModal.style.display = "flex";	
	});

        buttons.appendChild(viewButton);
        buttons.appendChild(addMembersButton);
	buttons.appendChild(addEventButton);
	buttons.appendChild(editEventButton);

        details.appendChild(title);
        details.appendChild(dates);
        details.appendChild(members);

        card.appendChild(details);
        card.appendChild(buttons);

        tripsDiv.appendChild(card);
    }
}

// Switch between active and past trips
activeTab.addEventListener("click", function () {
    selectedTab = "active";
    activeTab.classList.add("active-tab");
    pastTab.classList.remove("active-tab");
    displayTrips();
});

pastTab.addEventListener("click", function () {
    selectedTab = "past";
    pastTab.classList.add("active-tab");
    activeTab.classList.remove("active-tab");
    displayTrips();
});

 // Add a member to an existing trip
membersForm.addEventListener("submit", function (event) {
    event.preventDefault();

    let username = document.getElementById("memberUsername").value.trim();

    if (username === "") {
        membersMessage.textContent = "Please enter a username";
        return;
    }

    let addButton = document.getElementById("addMember");
    addButton.disabled = true;

    fetch("/trips/" + selectedTripId + "/members", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username
        })
    })
    .then(function (response) {
        checkSession(response);
        if (!response.ok) {
            return response.json().then(function (data) {
                throw new Error(data.error || "Could not add member");
            });
        }

        return response.json();
    })
    .then(function () {
        membersModal.style.display = "none";
        membersForm.reset();
        loadTrips();

        // Show success message
        document.getElementById("successText").textContent = username + " added successfully.";
        document.getElementById("successMessage").style.display = "flex";
        setTimeout(function () {
            document.getElementById("successMessage").style.display = "none";
        }, 3000);
    })
    .catch(function (error) {
        membersMessage.textContent = error.message;
    })
    .finally(function () {
        addButton.disabled = false;
    });
});

// Close success message
document.getElementById("closeSuccess").addEventListener("click", function () {
    document.getElementById("successMessage").style.display = "none";
});
