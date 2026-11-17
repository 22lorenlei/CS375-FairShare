// LOREN TO DO:
// Add delete and edit functionality. HTML has been done already
// Reeipt page

// FairShare itinerary - month view for a single trip.
// Uses the same /trips, /loadEvents and /addEvent routes as the My Trips page.
let currentDate = new Date();
let events = [];
let selectedTrip = null;
let tripId = Number(new URLSearchParams(window.location.search).get("tripId"));

let editButton = document.getElementById("editEventButton");
let cancelEditButton = document.getElementById("cancelEditButton");
let detailsModal = document.getElementById("detailsModal");
let deleteEventButton = document.getElementById("deleteEventButton");
let saveChangesButton = document.getElementById("saveChangesButton");

function dateText(year, month, day) {
    return year + "-" + String(month + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
}

function formatDate(value) {
    if (!value) return "Not set";
    let parts = value.substring(0, 10).split("-");
    let date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function showMessage(text, type) {
    let message = document.getElementById("message");
    message.textContent = text;
    message.className = "itinerary-message" + (type ? " " + type : "");
}

function checkResponse(response, message) {
    if (response.status === 401) {
        window.location.replace("/login.html");
        throw new Error("Please log in first");
    }
    if (!response.ok) {
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

// Refresh events after adding one; each event may cover several dates.
function loadEvents() {
    return fetch("/loadEvents?tripId=" + encodeURIComponent(tripId))
    .then(function (response) { return checkResponse(response, "Could not load events"); })
    .then(function (data) {
        events = Array.isArray(data.result) ? data.result : [];
        events.sort(function (a, b) {
            let startA = a.start_date || "";
            let startB = b.start_date || "";
            return startA.localeCompare(startB);
        });
        document.getElementById("eventCount").textContent = events.length;
        document.getElementById("eventCountLabel").textContent = events.length === 1 ? "event planned" : "events planned";
        showCalendar();
    });
}

function loadTrip() {
    fetch("/trips")
    .then(function (response) { return checkResponse(response, "Could not load trips"); })
    .then(function (data) {
        let trips = Array.isArray(data.rows) ? data.rows : [];
        selectedTrip = trips.find(function (item) { return Number(item.id) === tripId; });
        if (!selectedTrip) throw new Error("This trip was not found in your trips.");

        document.getElementById("tripName").textContent = selectedTrip.name + " Itinerary";
        let details = [];
        if (selectedTrip.destination) details.push(selectedTrip.destination);
        if (selectedTrip.start_date && selectedTrip.end_date) {
            details.push(formatDate(selectedTrip.start_date) + " - " + formatDate(selectedTrip.end_date));
        }
        document.getElementById("tripDetails").textContent = details.join("  •  ");

        // Start on the month the trip begins, not necessarily the current month.
        if (selectedTrip.start_date) {
            let parts = selectedTrip.start_date.substring(0, 10).split("-");
            currentDate = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
        }
        showMessage("");
        showCalendar();
        return loadEvents();
    })
    .catch(function (error) {
        showMessage(error.message, "error");
    });
}

function showEventDetails(item) {
    document.getElementById("detailsTitle").textContent = item.event_name || "Event";
    document.getElementById("detailCategory").textContent = item.category || "Not set";
    let start = formatDate(item.start_date);
    let end = formatDate(item.end_date || item.start_date);
    document.getElementById("detailDates").textContent = start === end ? start : start + " - " + end;
    document.getElementById("detailLocation").textContent = item.location || "Not set";
    let price = Number(item.total_price);
    document.getElementById("detailPrice").textContent = item.total_price == null || !Number.isFinite(price)
        ? "Not set" : price.toLocaleString("en-US", { style: "currency", currency: "USD" });
    document.getElementById("detailsModal").style.display = "flex";
    document.getElementById("closeDetailsModal").focus();
	detailsModal.dataset.eventId = item.id;
    	document.getElementById("editEventName").value = item.event_name || "Event";
	document.getElementById("editCategory").value = item.category || "Not set";
	document.getElementById("editStartDate").value = item.start_date;
	document.getElementById("editEndDate").value = item.end_date || "item.start_date";
	document.getElementById("editPrice").value = item.total_price;
	document.getElementById("editEventLocation").value = item.location || "Not set";
}

function addEvent(date) {
    if (!selectedTrip) return;
    document.getElementById("eventForm").reset();
    document.getElementById("eventFormMessage").textContent = "";
    document.getElementById("eventStartDate").value = date;
    document.getElementById("eventEndDate").value = date;
    document.getElementById("eventEndDate").min = date;
    document.getElementById("eventModal").style.display = "flex";
    document.getElementById("eventName").focus();
}

function showCalendar() {
    let year = currentDate.getFullYear();
    let month = currentDate.getMonth();
    let firstDay = new Date(year, month, 1).getDay();
    let daysInMonth = new Date(year, month + 1, 0).getDate();
    let today = new Date();
    let todayString = dateText(today.getFullYear(), today.getMonth(), today.getDate());
    let body = document.getElementById("calendarBody");

    document.getElementById("monthTitle").textContent = currentDate.toLocaleDateString("en-US", {
        month: "long", year: "numeric"
    });
    body.replaceChildren();

    // Always show full Sunday-to-Saturday weeks.
    let weekCount = Math.ceil((firstDay + daysInMonth) / 7);
    for (let week = 0; week < weekCount; week++) {
        let row = document.createElement("tr");
        for (let weekday = 0; weekday < 7; weekday++) {
            let day = week * 7 + weekday - firstDay + 1;
            let cell = document.createElement("td");
            if (day < 1 || day > daysInMonth) {
                cell.className = "outside-month";
            } else {
                let date = dateText(year, month, day);
                if (date === todayString) cell.className = "today-date";

                let top = document.createElement("div");
                top.className = "day-top";
                let number = document.createElement("span");
                number.className = "day-number";
                number.textContent = day;
                top.appendChild(number);

                // Users add events from individual days (no separate top Add Event button).
                if (selectedTrip) {
                    let plus = document.createElement("button");
                    plus.type = "button";
                    plus.className = "addButton";
                    plus.textContent = "+";
                    plus.setAttribute("aria-label", "Add event for " + formatDate(date));
                    plus.addEventListener("click", function () { addEvent(date); });
                    top.appendChild(plus);
                }
                cell.appendChild(top);

                let dayEvents = events.filter(function (item) {
                    let start = item.start_date;
                    let end = item.end_date || start;
                    return start && date >= start && date <= end;
                });
                for (let i = 0; i < dayEvents.length; i++) {
                    let item = dayEvents[i];
                    let button = document.createElement("button");
                    button.type = "button";
                    button.className = "event";
                    button.textContent = item.event_name || "Untitled event";
                    button.title = button.textContent;
                    if (i >= 3) button.hidden = true;
                    button.addEventListener("click", function () { showEventDetails(item); });
                    cell.appendChild(button);
                }
                if (dayEvents.length > 3) {
                    let more = document.createElement("button");
                    more.type = "button";
                    more.className = "more-events";
                    more.textContent = "+" + (dayEvents.length - 3) + " more";
                    more.addEventListener("click", function () {
                        cell.querySelectorAll(".event[hidden]").forEach(function (button) {
                            button.hidden = false;
                        });
                        more.remove();
                    });
                    cell.appendChild(more);
                }
            }
            row.appendChild(cell);
        }
        body.appendChild(row);
    }
}

// Submit the same event fields used by the existing Add Event form.
document.getElementById("eventForm").addEventListener("submit", function (event) {
    event.preventDefault();
    if (!selectedTrip) return;

    let start = document.getElementById("eventStartDate").value;
    let end = document.getElementById("eventEndDate").value;
    let feedback = document.getElementById("eventFormMessage");
    if (end < start) {
        feedback.textContent = "End date must be on or after the start date.";
        return;
    }

    let button = document.getElementById("saveEvent");
    button.disabled = true;
    feedback.textContent = "";
    fetch("/addEvent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            tripId: tripId,
            eventName: document.getElementById("eventName").value.trim(),
            eventCategory: document.getElementById("eventCategory").value.trim(),
            eventTotalPrice: Number(document.getElementById("eventTotalPrice").value),
            eventStartDate: start,
            eventEndDate: end,
            eventLocation: document.getElementById("eventLocation").value.trim()
        })
    })
    .then(function (response) { return checkResponse(response, "Could not add event"); })
    .then(function () {
        document.getElementById("eventModal").style.display = "none";
        showMessage("Event added successfully.", "success");
        return loadEvents().catch(function () {
            showMessage("Event saved, but the calendar could not refresh. Reload the page to see it.", "error");
        });
    })
    .catch(function (error) { feedback.textContent = error.message; })
    .finally(function () { button.disabled = false; });
});

document.getElementById("eventStartDate").addEventListener("change", function () {
    let endDate = document.getElementById("eventEndDate");
    endDate.min = this.value;
    if (endDate.value < this.value) endDate.value = this.value;
});

function closeModal(id) { document.getElementById(id).style.display = "none"; }
document.getElementById("closeEventModal").addEventListener("click", function () { closeModal("eventModal"); });

document.getElementById("closeDetailsModal").addEventListener("click", function () { 
	closeModal("detailsModal"); 
	detailsModal.classList.remove('editing');
});

window.addEventListener("click", function (event) {
    if (event.target.id === "eventModal" || event.target.id === "detailsModal") closeModal(event.target.id);
});
window.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeModal("eventModal");
        closeModal("detailsModal");
    }
});

document.getElementById("previous").addEventListener("click", function () {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    showCalendar();
});
document.getElementById("next").addEventListener("click", function () {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    showCalendar();
});
document.getElementById("today").addEventListener("click", function () {
    currentDate = new Date();
    showCalendar();
});

editButton.addEventListener("click", function (e) {
	e.preventDefault();
	detailsModal.classList.add("editing");    
});

cancelEditButton.addEventListener("click", function (e) {
	e.preventDefault();
	detailsModal.classList.remove("editing");
});

deleteEventButton.addEventListener("click", function () {
	let eventId = detailsModal.dataset.eventId;

	fetch("/deleteEvent", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			eventId: eventId,
			tripId: tripId
		}),
	}).then(function (response) {
		return checkResponse(response, "Could not delete event"); 
	}).then(function (data) {
		closeModal("detailsModal"); 
		detailsModal.classList.remove("editing");
		loadEvents();
	}).catch(function (error) {
		console.log(error);
	});
});

saveChangesButton.addEventListener("click", function () {
	let eventId = detailsModal.dataset.eventId;
	let eventName = document.getElementById("editEventName").value;
	let eventCategory = document.getElementById("editCategory").value;
	let startDate = document.getElementById("editStartDate").value;
	let endDate = document.getElementById("editEndDate").value;
	let eventLocation = document.getElementById("editEventLocation").value;
	let price = document.getElementById("editPrice").value;

	fetch("/editEvent", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			tripId: tripId,
			eventId: eventId,
			eventName: eventName,
			eventCategory: eventCategory,
			startDate: startDate,
			endDate: endDate,
			eventLocation: eventLocation,
			price: price
		}),
	}).then(function (response) {
		return checkResponse(response, "Could not edit event");
	}).then(function (data) {
		closeModal("detailsModal");
		detailsModal.classList.remove("editing");
		loadEvents();
	}).catch(function (error) {
		console.log(error);
	});
});

loadNavbar();
showCalendar();
if (!Number.isInteger(tripId) || tripId < 1) {
    document.getElementById("tripDetails").textContent = "No trip selected";
    showMessage("Open an itinerary from My Trips to select a trip.", "error");
} else {
    loadTrip();
}
