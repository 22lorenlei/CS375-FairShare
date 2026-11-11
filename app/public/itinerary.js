// Month view for the FairShare trip itinerary
// Event information will come from the team's server
let currentDate = new Date();
let events = [];

// The trip ID is passed in the URL, for example itinerary.html?tripId=2
let params = new URLSearchParams(window.location.search);
let tripId = Number(params.get("tripId"));

function dateText(year, month, day) {
    let m = String(month + 1).padStart(2, "0");
    let d = String(day).padStart(2, "0");
    return year + "-" + m + "-" + d;
}

// This button will open the add event page once it is connected
function addEvent(date) {
    alert("Add event page is not connected yet.\nTrip: " + tripId + "\nDate: " + date);
}

function showCalendar() {
    let year = currentDate.getFullYear();
    let month = currentDate.getMonth();
    let firstDay = new Date(year, month, 1).getDay();
    let daysInMonth = new Date(year, month + 1, 0).getDate();

    document.getElementById("monthTitle").textContent = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    let table = document.getElementById("calendar");
    table.innerHTML = "";

    let headings = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    let headerRow = document.createElement("tr");
    for (let i = 0; i < 7; i++) {
        let heading = document.createElement("th");
        heading.textContent = headings[i];
        headerRow.appendChild(heading);
    }
    table.appendChild(headerRow);

    let day = 1;
    while (day <= daysInMonth) {
        let row = document.createElement("tr");
        for (let col = 0; col < 7; col++) {
            let cell = document.createElement("td");
            if ((day === 1 && col < firstDay) || day > daysInMonth) {
                // Empty cells before and after the month's dates
            } else {
                let date = dateText(year, month, day);
                let number = document.createElement("span");
                number.textContent = day;
                cell.appendChild(number);

                let plus = document.createElement("button");
                plus.textContent = "+";
                plus.className = "addButton";
                plus.addEventListener("click", function () {
                    addEvent(date);
                });
                cell.appendChild(plus);

                for (let i = 0; i < events.length; i++) {
                    // An event may last more than one day
                    let start = events[i].start_date;
                    let end = events[i].end_date || start;
                    if (start && date >= start && date <= end) {
                        let event = document.createElement("div");
                        event.className = "event";
                        event.textContent = events[i].event_name;
                        cell.appendChild(event);
                    }
                }
                day++;
            }
            row.appendChild(cell);
        }
        table.appendChild(row);
    }
}

// Get the selected trip from the team's /trips route
function loadTrip() {
    fetch("/trips")
    .then(function (response) {
        if (response.status === 401) {
            window.location.href = "login.html";
            throw new Error("Please log in first");
        }
        if (!response.ok) throw new Error("Could not load trips");
        return response.json();
    })
    .then(function (data) {
        let trip = null;
        for (let i = 0; i < data.rows.length; i++) {
            if (Number(data.rows[i].id) === tripId) {
                trip = data.rows[i];
                break;
            }
        }
        if (trip === null) throw new Error("Trip not found in your trips");

        document.getElementById("tripName").textContent = trip.name;
        if (trip.start_date) {
            // Show the month the trip starts in
            let parts = trip.start_date.split("-");
            currentDate = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
            showCalendar();
        }
        return fetch("/loadEvents?tripId=" + tripId);
    })
    .then(function (response) {
        if (response.status === 401) {
            window.location.href = "login.html";
            throw new Error("Please log in first");
        }
        if (!response.ok) throw new Error("Could not load events");
        return response.json();
    })
    .then(function (data) {
        events = data.result;
        showCalendar();
        document.getElementById("message").textContent =
            events.length === 0 ? "No events have been added to this trip yet" : "";
    })
    .catch(function (error) {
        document.getElementById("message").textContent = error.message;
    });
}

document.getElementById("previous").addEventListener("click", function () {
    currentDate.setDate(1);
    currentDate.setMonth(currentDate.getMonth() - 1);
    showCalendar();
});

document.getElementById("next").addEventListener("click", function () {
    currentDate.setDate(1);
    currentDate.setMonth(currentDate.getMonth() + 1);
    showCalendar();
});

document.getElementById("today").addEventListener("click", function () {
    currentDate = new Date();
    showCalendar();
});

showCalendar();
if (!Number.isInteger(tripId) || tripId < 1) {
    document.getElementById("tripName").textContent = "No trip selected";
    document.getElementById("message").textContent =
        "Open the calendar with a trip ID, for example itinerary.html?tripId=1";
} else {
    loadTrip();
}
