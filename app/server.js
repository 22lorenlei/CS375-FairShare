let axios = require("axios");
let express = require("express");
let pg = require("pg");

let app = express();

let port = 3000;
let hostname = "localhost";

let env = require("../env.json");

let Pool = pg.Pool;
let pool = new Pool(env);

pool.connect().then(() => {
  console.log("Connected to database");
});

app.use(express.json());
app.use(express.static("public"));

function formatDate(date) {
  if (typeof date === "string") {
    return date.substring(0, 10);
  }

  return date.toISOString().substring(0, 10);
}

app.get("/api/trips/:tripId", (req, res) => {
  let tripId = req.params.tripId;

  pool
    .query(
      `SELECT id, trip_name, destination, start_date, end_date
    FROM trips
    WHERE id = $1`,
      [tripId],
    )
    .then((result) => {
      if (result.rows.length === 0) {
        res.status(404);
        res.json({
          error: "Trip not found",
        });
        return;
      }

      res.json(result.rows[0]);
    })
    .catch((error) => {
      console.log(error);

      res.status(500);
      res.json({
        error: "Database error",
      });
    });
});

app.get("/api/trips/:tripId/flights", (req, res) => {
  let tripId = req.params.tripId;
  let origin = req.query.origin;
  let travelers = Number(req.query.travelers);

  if (!origin || travelers < 1) {
    res.status(400);
    res.json({
      error: "Invalid flight search",
    });
    return;
  }

  let trip;

  pool
    .query(
      `SELECT id, trip_name, destination, start_date, end_date
    FROM trips
    WHERE id = $1`,
      [tripId],
    )
    .then((result) => {
      if (result.rows.length === 0) {
        res.status(404);
        res.json({
          error: "Trip not found",
        });
        return;
      }

      trip = result.rows[0];

      let destinationName = trip.destination.split(",")[0].trim();

      return axios({
        method: "get",
        url: "https://api.duffel.com/places/suggestions",
        headers: {
          Accept: "application/json",
          "Duffel-Version": "v2",
          Authorization: "Bearer " + env["duffel_token"],
        },
        params: {
          query: destinationName,
        },
      });
    })
    .then((response) => {
      if (!response) {
        return;
      }

      let places = response.data.data;

      console.log(places);

      if (places.length === 0) {
        res.status(404);
        res.json({
          error: "Destination airport not found",
        });
        return;
      }

      let destination = places[0].iata_code;

      for (let i = 0; i < places.length; i++) {
        if (places[i].type === "city") {
          destination = places[i].iata_code;
          break;
        }
      }

      let passengers = [];

      for (let i = 0; i < travelers; i++) {
        passengers.push({
          type: "adult",
        });
      }

      let startDate = formatDate(trip.start_date);
      let endDate = formatDate(trip.end_date);

      let slices = [
        {
          origin: origin.toUpperCase(),
          destination: destination,
          departure_date: startDate,
        },
      ];

      if (startDate !== endDate) {
        slices.push({
          origin: destination,
          destination: origin.toUpperCase(),
          departure_date: endDate,
        });
      }

      return axios({
        method: "post",
        url: "https://api.duffel.com/air/offer_requests",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Duffel-Version": "v2",
          Authorization: "Bearer " + env["duffel_token"],
        },
        data: {
          data: {
            cabin_class: "economy",
            slices: slices,
            passengers: passengers,
          },
        },
      });
    })
    .then((response) => {
      if (!response) {
        return;
      }

      let offers = response.data.data.offers;

      res.json({
        offers: offers,
      });
    })
    .catch((error) => {
      if (error.response) {
        console.log(error.response.data);
      } else {
        console.log(error);
      }

      res.status(500);
      res.json({
        error: "Unable to search flights",
      });
    });
});

app.listen(port, hostname, () => {
  console.log(`Listening at: http://${hostname}:${port}`);
});