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

app.get("/api/trips/:tripId", (req, res) => {
  let tripId = req.params.tripId;

  pool.query(
    `SELECT id, trip_name, destination, start_date, end_date
    FROM trips
    WHERE id = $1`,
    [tripId]
  )
  .then((result) => {
    if (result.rows.length === 0) {
      res.status(404);
      res.json({
        error: "Trip not found"
      });
      return;
    }

    res.json(result.rows[0]);
  })
  .catch((error) => {
    console.log(error);

    res.status(500);
    res.json({
      error: "Database error"
    });
  });
});

app.use(express.json());
app.use(express.static("public"));

app.listen(port, hostname, () => {
  console.log(`Listening at: http://${hostname}:${port}`);
});