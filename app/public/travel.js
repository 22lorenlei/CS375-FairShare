let tripId = new URLSearchParams(window.location.search).get("tripId") || 1;

let tripName = document.getElementById("trip-name");
let tripDestination = document.getElementById("trip-destination");
let tripDates = document.getElementById("trip-dates");
let tripMembers = document.getElementById("trip-members");

let origin = document.getElementById("origin");

let searchButton = document.getElementById("search-flights");

let message = document.getElementById("message");
let flightResults = document.getElementById("flight-results");

let searchHotelsButton = document.getElementById("search-hotels");

let hotelMessage = document.getElementById("hotel-message");
let hotelResults = document.getElementById("hotel-results");

let searchActivitiesButton = document.getElementById("search-activities");

let activityMessage = document.getElementById("activity-message");
let activityResults = document.getElementById("activity-results");

let tripStartDate = "";
let tripEndDate = "";
let tripMemberCount = 1;

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

// Load trip information
fetch("/api/trips/" + tripId)
  .then((response) => {
    return response.json();
  })
  .then((body) => {
    tripName.textContent = body.trip_name;
    tripDestination.textContent = body.destination;

    tripStartDate = body.start_date.substring(0, 10);
    tripEndDate = body.end_date.substring(0, 10);

    tripMemberCount = body.member_count;
    tripDates.textContent = tripStartDate + " to " + tripEndDate;
    if (tripMemberCount == 1) {
      tripMembers.textContent = tripMemberCount + " traveler";
    } else {
      tripMembers.textContent = tripMemberCount + " travelers";
    }
  })
  .catch((error) => {
    console.log(error);
  });

// Search flights
searchButton.addEventListener("click", () => {
  message.textContent = "";
  flightResults.textContent = "";

  let originValue = origin.value;

  let url =
    "/api/trips/" +
    tripId +
    "/flights?origin=" +
    originValue +
    "&travelers=" +
    tripMemberCount;

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

          let addButton = document.createElement("button");
          addButton.textContent = "Add to Trip";
          addButton.className = "add-trip-button";

          addButton.addEventListener("click", () => {
            let startDate = flight.outbound.departing_at.substring(0, 10);
            let endDate = startDate;

            if (flight.returning != null) {
              endDate = flight.returning.arriving_at.substring(0, 10);
            }

            let location =
              flight.outbound.origin + " to " + flight.outbound.destination;

            fetch("/addEvent", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                tripId: Number(tripId),
                eventName:
                  flight.airline +
                  " " +
                  flight.outbound.origin +
                  " to " +
                  flight.outbound.destination,
                eventCategory: "Flight",
                eventTotalPrice: Number(flight.price),
                eventStartDate: startDate,
                eventEndDate: endDate,
                eventLocation: location,
              }),
            })
              .then((response) => {
                return response.json();
              })
              .then((body) => {
                if (body.message == "Event added successfully") {
                  addButton.textContent = "Added";
                  addButton.disabled = true;
                } else {
                  console.log(body);
                }
              })
              .catch((error) => {
                console.log(error);
              });
          });

          flightDiv.append(addButton);

          flightResults.append(flightDiv);
        }
      }
    })
    .catch((error) => {
      console.log(error);
    });
});

// Search hotels
searchHotelsButton.addEventListener("click", () => {
  hotelMessage.textContent = "";
  hotelResults.textContent = "";

  let url = "/api/trips/" + tripId + "/hotels?guests=" + tripMemberCount;

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

          hotelDiv.append(name);

          if (hotel.hotel_class != null) {
            let hotelClass = document.createElement("p");

            hotelClass.textContent = "Hotel Class: " + hotel.hotel_class;

            hotelDiv.append(hotelClass);
          }

          if (hotel.rating != null) {
            let rating = document.createElement("p");

            rating.textContent = "Rating: " + hotel.rating;

            if (hotel.reviews != null) {
              rating.textContent += " (" + hotel.reviews + " reviews)";
            }

            hotelDiv.append(rating);
          }

          if (hotel.nightly_price != null) {
            let nightlyPrice = document.createElement("p");

            nightlyPrice.textContent = "Nightly Price: " + hotel.nightly_price;

            hotelDiv.append(nightlyPrice);
          }

          if (hotel.total_price != null) {
            let totalPrice = document.createElement("p");

            totalPrice.textContent = "Total: " + hotel.total_price;

            hotelDiv.append(totalPrice);
          }

          if (hotel.check_in_time != null) {
            let checkIn = document.createElement("p");

            checkIn.textContent = "Check In: " + hotel.check_in_time;

            hotelDiv.append(checkIn);
          }

          if (hotel.check_out_time != null) {
            let checkOut = document.createElement("p");

            checkOut.textContent = "Check Out: " + hotel.check_out_time;

            hotelDiv.append(checkOut);
          }

          let addButton = document.createElement("button");
          addButton.textContent = "Add to Trip";
          addButton.className = "add-trip-button";

          addButton.addEventListener("click", () => {
            let totalPrice = 0;

            if (hotel.total_price != null) {
              totalPrice = Number(
                hotel.total_price.replace("$", "").replace(",", ""),
              );
            }

            fetch("/addEvent", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                tripId: Number(tripId),
                eventName: hotel.name,
                eventCategory: "Hotel",
                eventTotalPrice: totalPrice,
                eventStartDate: tripStartDate,
                eventEndDate: tripEndDate,
                eventLocation: tripDestination.textContent,
              }),
            })
              .then((response) => {
                return response.json();
              })
              .then((body) => {
                if (body.message == "Event added successfully") {
                  addButton.textContent = "Added";
                  addButton.disabled = true;
                } else {
                  console.log(body);
                }
              })
              .catch((error) => {
                console.log(error);
              });
          });

          hotelDiv.append(addButton);

          hotelResults.append(hotelDiv);
        }
      }
    })
    .catch((error) => {
      console.log(error);
    });
});

// Search activities
searchActivitiesButton.addEventListener("click", () => {
  activityMessage.textContent = "";
  activityResults.textContent = "";

  let url = "/api/trips/" + tripId + "/activities";

  fetch(url)
    .then((response) => {
      return response.json();
    })
    .then((body) => {
      if (body.error) {
        activityMessage.textContent = body.error;
      } else if (body.activities.length == 0) {
        activityMessage.textContent = "No activities found";
      } else {
        for (let i = 0; i < body.activities.length; i++) {
          let activity = body.activities[i];

          let activityDiv = document.createElement("div");

          let title = document.createElement("h3");
          title.textContent = activity.title;

          activityDiv.append(title);

          if (activity.date != null) {
            let date = document.createElement("p");
            date.textContent = "Date: " + activity.date;

            activityDiv.append(date);
          }

          if (activity.time != null) {
            let time = document.createElement("p");
            time.textContent = "Time: " + activity.time;

            activityDiv.append(time);
          }

          if (activity.venue != null) {
            let venue = document.createElement("p");
            venue.textContent = "Venue: " + activity.venue;

            activityDiv.append(venue);
          }

          if (activity.address != null) {
            let address = document.createElement("p");
            address.textContent = "Location: " + activity.address;

            activityDiv.append(address);
          }

          let price = document.createElement("p");

          if (activity.price != null) {
            price.textContent = "Price: " + activity.price;
          } else {
            price.textContent = "Price: Not available";
          }

          activityDiv.append(price);

          let addButton = document.createElement("button");
          addButton.textContent = "Add to Trip";
          addButton.className = "add-trip-button";

          addButton.addEventListener("click", () => {
            let activityPrice = null;

            if (activity.price != null) {
              let priceText = String(activity.price);

              priceText = priceText.replace("$", "");
              priceText = priceText.replace(",", "");

              activityPrice = Number(priceText);

              if (isNaN(activityPrice)) {
                activityPrice = null;
              }
            }

            let activityLocation = tripDestination.textContent;

            if (activity.venue != null) {
              activityLocation = activity.venue;
            }

            if (activity.address != null) {
              activityLocation = activity.address;
            }

            fetch("/addEvent", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                tripId: Number(tripId),
                eventName: activity.title,
                eventCategory: "Excursion",
                eventTotalPrice: activityPrice,
                eventStartDate: tripStartDate,
                eventEndDate: tripStartDate,
                eventLocation: activityLocation,
              }),
            })
              .then((response) => {
                return response.json();
              })
              .then((body) => {
                console.log(body);

                if (body.message == "Event added successfully") {
                  addButton.textContent = "Added";
                  addButton.disabled = true;
                } else {
                  console.log(body);
                }
              })
              .catch((error) => {
                console.log(error);
              });
          });

          activityDiv.append(addButton);

          activityResults.append(activityDiv);
        }
      }
    })
    .catch((error) => {
      console.log(error);
    });
});
