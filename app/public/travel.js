let tripId = 1;

let tripName = document.getElementById("trip-name");
let tripDestination = document.getElementById("trip-destination");
let tripDates = document.getElementById("trip-dates");

let origin = document.getElementById("origin");
let travelers = document.getElementById("travelers");

let searchButton = document.getElementById("search-flights");

let message = document.getElementById("message");
let flightResults = document.getElementById("flight-results");

let guests = document.getElementById("guests");
let searchHotelsButton = document.getElementById("search-hotels");

let hotelMessage = document.getElementById("hotel-message");
let hotelResults = document.getElementById("hotel-results");

function formatTime(dateTime) {
  let time = dateTime.substring(11, 16);

  let hour = Number(time.substring(0, 2));
  let minute = time.substring(3, 5);

  let ending = "AM";

  if (hour >= 12) {
    ending = "PM";
  }

  if (hour > 12) {
    hour = hour - 12;
  }

  if (hour == 0) {
    hour = 12;
  }

  return hour + ":" + minute + " " + ending;
}

function formatDuration(duration) {
  let value = duration.substring(2);

  value = value.replace("H", "h ");
  value = value.replace("M", "m");

  return value;
}

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
            let outboundTitle = document.createElement("h4");
            outboundTitle.textContent = "Outbound";

            let outboundRoute = document.createElement("p");
            outboundRoute.textContent =
              flight.outbound.origin + " to " + flight.outbound.destination;

            let outboundTimes = document.createElement("p");
            outboundTimes.textContent =
              "Depart: " +
              formatTime(flight.outbound.departing_at) +
              " | Arrive: " +
              formatTime(flight.outbound.arriving_at);

            let outboundInfo = document.createElement("p");

            if (flight.outbound.stops == 0) {
              outboundInfo.textContent =
                formatDuration(flight.outbound.duration) + " | Nonstop";
            } else {
              outboundInfo.textContent =
                formatDuration(flight.outbound.duration) +
                " | " +
                flight.outbound.stops +
                " stop(s)";
            }

            flightDiv.append(outboundTitle);
            flightDiv.append(outboundRoute);
            flightDiv.append(outboundTimes);
            flightDiv.append(outboundInfo);
          }

          if (flight.returning != null) {
            let returnTitle = document.createElement("h4");
            returnTitle.textContent = "Return";

            let returnRoute = document.createElement("p");
            returnRoute.textContent =
              flight.returning.origin + " to " + flight.returning.destination;

            let returnTimes = document.createElement("p");
            returnTimes.textContent =
              "Depart: " +
              formatTime(flight.returning.departing_at) +
              " | Arrive: " +
              formatTime(flight.returning.arriving_at);

            let returnInfo = document.createElement("p");

            if (flight.returning.stops == 0) {
              returnInfo.textContent =
                formatDuration(flight.returning.duration) + " | Nonstop";
            } else {
              returnInfo.textContent =
                formatDuration(flight.returning.duration) +
                " | " +
                flight.returning.stops +
                " stop(s)";
            }

            flightDiv.append(returnTitle);
            flightDiv.append(returnRoute);
            flightDiv.append(returnTimes);
            flightDiv.append(returnInfo);
          }

          flightResults.append(flightDiv);
        }
      }
    })
    .catch((error) => {
      console.log(error);
    });
});

searchHotelsButton.addEventListener("click", () => {
  hotelMessage.textContent = "";
  hotelResults.textContent = "";

  let guestValue = guests.value;

  let url = "/api/trips/" + tripId + "/hotels?guests=" + guestValue;

  fetch(url)
    .then((response) => {
      return response.json();
    })
    .then((body) => {
      if (body.error) {
        hotelMessage.textContent = body.error;
      } else if (body.hotels.length == 0) {
        hotelMessage.textContent = "No hotels found";
      } else {
        for (let i = 0; i < body.hotels.length; i++) {
          let hotel = body.hotels[i];

          let hotelDiv = document.createElement("div");

          let name = document.createElement("h3");
          name.textContent = hotel.name;

          let platform = document.createElement("p");
          platform.textContent = "Platform: " + hotel.platform;

          hotelDiv.append(name);
          hotelDiv.append(platform);

          if (hotel.city != null) {
            let city = document.createElement("p");
            city.textContent = "Location: " + hotel.city;

            hotelDiv.append(city);
          }

          if (hotel.guest_rating != null) {
            let rating = document.createElement("p");
            rating.textContent =
              "Rating: " + hotel.guest_rating + " / " + hotel.rating_scale;

            hotelDiv.append(rating);
          }

          if (hotel.nightly_price != null) {
            let nightlyPrice = document.createElement("p");

            nightlyPrice.textContent =
              "Nightly Price: $" + hotel.nightly_price + " " + hotel.currency;

            hotelDiv.append(nightlyPrice);
          }

          if (hotel.total_price != null) {
            let totalPrice = document.createElement("p");

            totalPrice.textContent =
              "Total: $" + hotel.total_price + " " + hotel.currency;

            hotelDiv.append(totalPrice);
          }

          if (hotel.nights != null) {
            let nights = document.createElement("p");

            nights.textContent = "Nights: " + hotel.nights;

            hotelDiv.append(nights);
          }

          hotelResults.append(hotelDiv);
        }
      }
    })
    .catch((error) => {
      console.log(error);
    });
});
