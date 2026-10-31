// First version of the trip itinerary calendar
// Events are examples until we have an events page and database
let currentDate = new Date(2026, 9, 30);

let events = [
    { name: "Flight to Chicago", date: "2026-10-29", time: "9:00 AM" },
    { name: "Hotel Check-in", date: "2026-10-30", time: "3:00 PM" },
    { name: "Dinner", date: "2026-10-30", time: "7:00 PM" },
    { name: "Museum", date: "2026-11-01", time: "1:00 PM" }
];

// Format a date like 2026-10-30 so it matches our example events
function dateText(year, month, day) {
    let m = String(month + 1).padStart(2, "0");
    let d = String(day).padStart(2, "0");
    return year + "-" + m + "-" + d;
}

// Eventually this will go to the team's create event page
function addEvent(date) {
    alert("Event creation page not ready yet. Date: " + date);
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
                // Leave empty cells before and after this month's dates
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
                    if (events[i].date === date) {
                        let event = document.createElement("div");
                        event.className = "event";
                        event.textContent = events[i].time + " " + events[i].name;
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
