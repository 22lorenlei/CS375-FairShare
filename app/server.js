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

app.listen(port, hostname, () => {
  console.log(`Listening at: http://${hostname}:${port}`);
});