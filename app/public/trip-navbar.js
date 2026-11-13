function loadTripNavigation(activePage) {
  let tripId = new URLSearchParams(window.location.search).get("tripId");

  fetch("/trip-navbar.html")
    .then((response) => {
      return response.text();
    })
    .then((html) => {
      let documentCopy = new DOMParser().parseFromString(html, "text/html");

      let header = documentCopy.querySelector(".trip-page-header");

      let navigation = documentCopy.querySelector(".trip-navigation");

      document.getElementById("trip-header").appendChild(header);

      document.getElementById("trip-header").appendChild(navigation);

      document.getElementById("overview-link").href =
        "/trip.html?tripId=" + tripId;

      document.getElementById("travel-link").href =
        "/travel.html?tripId=" + tripId;

      if (activePage == "overview") {
        document
          .getElementById("overview-link")
          .classList.add("active-trip-link");
      }

      if (activePage == "travel") {
        document
          .getElementById("travel-link")
          .classList.add("active-trip-link");
      }

      return fetch("/api/trips/" + tripId);
    })
    .then((response) => {
      return response.json();
    })
    .then((body) => {
      document.getElementById("trip-name").textContent = body.trip_name;

      document.getElementById("trip-destination").textContent =
        body.destination;

      let startDate = body.start_date.substring(0, 10);

      let endDate = body.end_date.substring(0, 10);

      document.getElementById("trip-dates").textContent =
        startDate + " to " + endDate;
    })
    .catch((error) => {
      console.log(error);
    });
}
