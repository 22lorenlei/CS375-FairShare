let tripId = new URLSearchParams(window.location.search).get("tripId");

let startingBudget = document.getElementById("starting-budget");

let totalSpent = document.getElementById("total-spent");

let remainingBudget = document.getElementById("remaining-budget");

let memberCount = document.getElementById("member-count");

let eventList = document.getElementById("overview-event-list");

let categoryBreakdown = document.getElementById("category-breakdown");

// Load top navbar
fetch("/navbar.html")
  .then((response) => {
    return response.text();
  })
  .then((html) => {
    let documentCopy = new DOMParser().parseFromString(html, "text/html");

    let navbar = documentCopy.querySelector("nav");

    document.getElementById("navbar").appendChild(navbar);

    document.getElementById("logout").addEventListener("click", () => {
      fetch("/logout", {
        method: "POST",
      }).then(() => {
        window.location.href = "/login.html";
      });
    });
  })
  .catch((error) => {
    console.log(error);
  });

// Load trip navigation
loadTripNavigation("overview");

// Load overview information
fetch("/api/trips/" + tripId + "/overview")
  .then((response) => {
    return response.json();
  })
  .then((body) => {
    if (body.error) {
      eventList.textContent = body.error;

      return;
    }

    startingBudget.textContent =
      "$" + Number(body.trip.starting_budget).toFixed(2);

    totalSpent.textContent = "$" + Number(body.total_spent).toFixed(2);

    remainingBudget.textContent =
      "$" + Number(body.remaining_budget).toFixed(2);

    memberCount.textContent = body.trip.member_count;

    displayEvents(body.events);

    displayCategories(body.events);
  })
  .catch((error) => {
    console.log(error);
  });

function displayEvents(events) {
  eventList.textContent = "";

  if (events.length == 0) {
    let message = document.createElement("p");

    message.textContent = "No plans have been added yet.";

    eventList.append(message);

    return;
  }

  for (let i = 0; i < events.length; i++) {
    let event = events[i];

    let eventDiv = document.createElement("div");

    eventDiv.className = "overview-event";

    let dateSection = document.createElement("div");

    dateSection.className = "event-date-section";

    let eventDate = document.createElement("p");

    eventDate.className = "overview-event-date";

    eventDate.textContent = formatShortDate(event.start_date);

    dateSection.append(eventDate);

    let details = document.createElement("div");

    details.className = "overview-event-details";

    let eventName = document.createElement("h3");

    eventName.textContent = event.event_name;

    let eventInfo = document.createElement("p");

    eventInfo.textContent = event.category;

    if (event.location != null) {
      eventInfo.textContent += " • " + event.location;
    }

    details.append(eventName);
    details.append(eventInfo);

    let priceSection = document.createElement("div");

    priceSection.className = "overview-event-price";

    let eventPrice = document.createElement("p");

    if (event.total_price != null) {
      eventPrice.textContent = "$" + Number(event.total_price).toFixed(2);
    } else {
      eventPrice.textContent = "N/A";
    }

    priceSection.append(eventPrice);

    eventDiv.append(dateSection);
    eventDiv.append(details);
    eventDiv.append(priceSection);

    eventList.append(eventDiv);
  }
}

function displayCategories(events) {
  categoryBreakdown.textContent = "";

  let categories = {};

  for (let i = 0; i < events.length; i++) {
    let category = events[i].category;

    let price = events[i].total_price;

    if (category == null) {
      category = "Other";
    }

    if (categories[category] == null) {
      categories[category] = 0;
    }

    if (price != null) {
      categories[category] += Number(price);
    }
  }

  let categoryNames = Object.keys(categories);

  if (categoryNames.length == 0) {
    let message = document.createElement("p");

    message.textContent = "No costs to display.";

    categoryBreakdown.append(message);

    return;
  }

  for (let i = 0; i < categoryNames.length; i++) {
    let category = categoryNames[i];

    let row = document.createElement("div");

    row.className = "category-row";

    let name = document.createElement("p");

    name.textContent = category;

    let price = document.createElement("p");

    price.textContent = "$" + categories[category].toFixed(2);

    row.append(name);
    row.append(price);

    categoryBreakdown.append(row);
  }
}

function formatShortDate(dateString) {
  if (dateString == null) {
    return "";
  }

  let parts = dateString.substring(0, 10).split("-");

  let date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
