let tripId = 1;

let tripName = document.getElementById("trip-name");
let tripDestination = document.getElementById("trip-destination");
let tripDates = document.getElementById("trip-dates");

let origin = document.getElementById("origin");
let travelers = document.getElementById("travelers");

let searchButton = document.getElementById("search-flights");

let message = document.getElementById("message");
let flightResults = document.getElementById("flight-results");

fetch("/api/trips/" + tripId)
  .then((response) => {
    return response.json();
  })
  .then((body) => {
    tripName.textContent = body.trip_name;
    tripDestination.textContent = body.destination;

    let startDate = body.start_date.substring(0, 10);
    let endDate = body.end_date.substring(0, 10);

    tripDates.textContent = startDate + " to " + endDate;
  })
  .catch((error) => {
    console.log(error);
  });

searchButton.addEventListener("click", () => {
  message.textContent = "";
  flightResults.textContent = "";

  let originValue = origin.value;
  let travelerValue = travelers.value;

  let url =
    "/api/trips/" +
    tripId +
    "/flights?origin=" +
    originValue +
    "&travelers=" +
    travelerValue;

  fetch(url)
    .then((response) => {
      return response.json();
    })
    .then((body) => {
      if (body.error) {
        message.textContent = body.error;
      } else if (body.flights.length == 0) {
        message.textContent = "No flights found";
      } else {
        for (let i = 0; i < body.flights.length; i++) {
          let flight = body.flights[i];

          let flightDiv = document.createElement("div");

          let airline = document.createElement("h3");
          airline.textContent = flight.airline;

          let price = document.createElement("p");
          price.textContent = "$" + flight.price + " " + flight.currency;

          flightDiv.append(airline);
          flightDiv.append(price);

          if (flight.outbound != null) {
            let outbound = document.createElement("p");

            outbound.textContent =
              "Outbound: " +
              flight.outbound.origin +
              " to " +
              flight.outbound.destination +
              " - " +
              flight.outbound.departing_at;

            flightDiv.append(outbound);
          }

          if (flight.returning != null) {
            let returning = document.createElement("p");

            returning.textContent =
              "Return: " +
              flight.returning.origin +
              " to " +
              flight.returning.destination +
              " - " +
              flight.returning.departing_at;

            flightDiv.append(returning);
          }

          flightResults.append(flightDiv);
        }
      }
    })
    .catch((error) => {
      console.log(error);
    });
});
