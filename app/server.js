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

app.use(express.json());

app.post("/addGroupMember", async (req, res) => {
	let eventName = req.body.eventName;
	let username = req.body.username;
	let isOwner = req.body.isOwner;
	
	// insert new member first
	let insertCommand = 'INSERT INTO userEvents(event_name, username, owner) VALUES($1, $2, $3) RETURNING *';
	let insertValues = [eventName, username, isOwner];

	try {
		await pool.query(insertCommand, insertValues);
	} catch (error) {
		console.log("DB Error:", error);
	}

	// then we will read from db to repopulate
	let selectCommand = 'SELECT * FROM userEvents WHERE event_name=($1)';
	let selectValues = [eventName];

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
	let eventName = req.body.eventName;

	console.log(eventName, username);
	
	let deleteCommand = 'DELETE FROM userEvents WHERE (event_name=($1) AND username=($2))';
	let deleteValues = [eventName, username];

	try {
		await pool.query(deleteCommand, deleteValues);
	} catch (error) {
		console.log("DB Error:", error);
	}
		
	let selectCommand = 'SELECT * FROM userEvents WHERE event_name=($1)';
	let selectValues = [eventName];
	try {
		let selectResult = await pool.query(selectCommand, selectValues);
		res.status(200).json(selectResult);
	} catch (error) {
		console.log("DB Error:", error);
		res.status(500).send();
	}
});



app.listen(port, hostname, () => {
	console.log(`Listening at http://${hostname}:${port}`);
});
