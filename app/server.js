const pg = require("pg");
const express = require("express");
const app = express();

const port = 3000;
const hostname = "localhost";

const env = require("../env.json");
const Pool = pg.Pool;
const pool = new Pool(env);
pool.connect().then(function () {
  console.log(`Connected to database ${env.database}`);
});

app.use(express.static("public"));

// Probably don't need to write temp values to db
// Store it in a temp list and then write it when you create trip
// for now, just replace all "DUMMY" values with the trip name...
// unless this is a temp draft capability, not likely

app.use(express.json());

app.post("/addGroupMember", async (req, res) => {
	let tripName = req.body.tripName;
	let username = req.body.username;
	let isOwner = req.body.isOwner;
	
	// insert new member first
	let insertCommand = 'INSERT INTO userTrips(trip_name, username, owner) VALUES($1, $2, $3) RETURNING *';
	let insertValues = [tripName, username, isOwner];

	try {
		await pool.query(insertCommand, insertValues);
	} catch (error) {
		console.log("DB Error:", error);
	}

	// then we will read from db to repopulate
	let selectCommand = 'SELECT * FROM userTrips WHERE trip_name=($1)';
	let selectValues = [tripName];

	try {
		let selectResult = await pool.query(selectCommand, selectValues);
		res.status(200).json(selectResult);
	} catch (error) {
		console.log("DB Error:", error);
		res.status(500).send();
	}
});

app.post("/deleteGroupMember", async (req, res) => {
	let username = req.body.username;
	let tripName = req.body.tripName;

	console.log(tripName, username);
	
	let deleteCommand = 'DELETE FROM userTrips WHERE (trip_name=($1) AND username=($2))';
	let deleteValues = [tripName, username];

	try {
		await pool.query(deleteCommand, deleteValues);
	} catch (error) {
		console.log("DB Error:", error);
	}
		
	let selectCommand = 'SELECT * FROM userTrips WHERE trip_name=($1)';
	let selectValues = [tripName];
	try {
		let selectResult = await pool.query(selectCommand, selectValues);
		res.status(200).json(selectResult);
	} catch (error) {
		console.log("DB Error:", error);
		res.status(500).send();
	}
});

app.post("/createTrip", async (req, res) => {
	let tripName = req.body.tripName;
        let startDate = req.body.startDate;
        let endDate = req.body.endDate;
        let initialBudget = req.body.initialBudget;

	let insertCommand = 'INSERT INTO trips(trip_name, start_date, end_date, initial_budget) VALUES($1, $2, $3, $4) RETURNING *';
	let insertValues = [tripName, startDate, endDate, initialBudget];

	try {
		await pool.query(insertCommand, insertValues);
	} catch (error) {
		console.log("DB Error:", error);
	}

	let updateCommand = 'UPDATE trips SET trip_name=($1) WHERE trip_name=($2)';
	let updateValues = [tripName, "DUMMY"];

	try {
		await pool.query(updateCommand, updateValues);
		res.status(200).json({"status": "OK"});
	} catch (error) {
		console.log("DB Error:", error)
		res.status(500).json({"status": "ERROR"});
	}
});

app.post("/addEvent", async (req, res) => {
	let costName = req.body.costName;
	let category = req.body.category;
	let eventStartDate = req.body.eventStartDate;
	let eventEndDate = req.body.eventEndDate;
	let totalCost = req.body.totalCost;
	let locationName = req.body.locationName;
	let tripName = req.body.tripName;

	let insertCommand = `INSERT INTO events(trip_name, cost_name, category, total_price, start_date, end_date, location)
			     VALUES($1, $2, $3, $4, $5, $6, $7)`;
	let insertValues = [tripName, costName, category, totalCost, eventStartDate, eventEndDate, locationName];

	try {
		await pool.query(insertCommand, insertValues);
	} catch (error) {
		console.log("DB Error:", error);
	}

	let selectCommand = 'SELECT * FROM events WHERE trip_name=($1)';
	let selectValues = [tripName];
	console.log("SEELCT VALUES:", selectValues);
	try {
		let result = await pool.query(selectCommand, selectValues);
		// Maybe have a json {status: ok, result: result}
		console.log("OK FINE");
		res.status(200).json({
			"status": "OK",
		 	"result": result	
		});
	} catch (error) {
		console.log("WELP BIG ERROR:", error.message);
		res.status(500).json({"status": error});
	}
});

app.listen(port, hostname, () => {
	console.log(`Listening at http://${hostname}:${port}`);
});
