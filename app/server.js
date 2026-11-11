
const express = require("express");
const pg = require("pg");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");
const crypto = require("crypto");

const app = express();

const port = 3000;
const hostname = "localhost";

const env = require("../env.json");
const pool = new pg.Pool(env);

app.use(express.json());
// Remember the logged-in user on the server.
app.use(session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax", maxAge: 24 * 60 * 60 * 1000 }
}));

function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ error: "Please log in" });
    }
    res.set("Cache-Control", "no-store");
    next();
}

app.get("/", (req, res) => {
    res.redirect(req.session.user ? "/trips.html" : "/login.html");
});

app.get("/trips.html", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (!req.session.user) return res.redirect("/login.html");
    next();
});
app.use(express.static(path.join(__dirname, "public")));

app.post("/logout", (req, res) => {
    req.session.destroy((error) => {
        if (error) return res.status(500).json({ error: "Could not log out" });
        res.clearCookie("connect.sid");
        res.json({ message: "Logged out" });
    });
});

app.get("/auth/me", requireLogin, (req, res) => {
    res.json(req.session.user);
});

app.get("/login", (req, res) => {
    let email = req.query.email;
    let password = req.query.password;
    res.set("Cache-Control", "no-store");

    pool.query(`SELECT * FROM users WHERE email = $1`, [email]).then((result) => {
        if (result.rows.length === 0) {
            res.status(200).send({ message: "Account doesn't exist" });
        } else {
            // grabs user info
            let user = result.rows[0];

            // compare inputted password with stored hashed password
            return bcrypt.compare(password, user.password).then((isMatch) => {
                if (isMatch) {
                    // Remember the user before opening My Trips.
                    req.session.regenerate((error) => {
                        if (error) return res.status(500).json({ message: "Could not log in" });
                        req.session.user = { id: user.id, username: user.username };
                        req.session.save((error) => {
                            if (error) return res.status(500).json({ message: "Could not log in" });
                            res.status(200).json({ message: "Logged in!", loggedIn: true });
                        });
                    });
                } else {
                    res.status(400).json({ message: "Incorrect password!" });
                }
            });
        }

    }).catch((error) => {
        res.status(400).json({ message: "Could not log in" });
    });

});

app.post("/register", (req, res) => {

    const { email, username, password } = req.body;

    // Front end already covers these, this if statement is for curl requests.
    if (typeof email !== "string" || typeof username !== "string" || typeof password !== "string" || username.length < 3 || username.length > 50 || username.includes(" ") || email.length < 5 || email.length > 100 || email.includes(" ") || !email.includes("@") || !email.includes(".") || password.length < 8 || password.length > 64) {
        return res.status(400).json({
            message: "Invalid Input"
        });
    }


    bcrypt.hash(password, 10).then((hashedPassword) =>  {
        pool.query(
        `INSERT INTO users(username, email, password)
            VALUES($1, $2, $3)
            RETURNING *`,
        [username, email, hashedPassword]
        ).then((result) => {
            return res.status(200).json({
                message: "Account Successfully Created!"
            });
        }).catch((error) => {
            console.log(error);
	    console.log(username, email, password);
            if (error.detail?.includes('email')) {
            return res.status(400).json({
                message: "Account with this email already exists!"
                })
            }
            else if (error.detail?.includes('username')) {
                return res.status(400).json({
                message: "Account with this username already exists!"
                })
            }
            else {
                return res.status(400).json({
                message: "Database side error!"
            })
            }
        });
    });
});


// Create a new trip
app.post("/trips", requireLogin, async (req, res) => {
    let name = req.body.name;
    let destination = req.body.destination;
    let startDate = req.body.startDate;
    let endDate = req.body.endDate;
    let budget = req.body.budget;
    let members = req.body.members;
    let userId = req.session.user.id;

    if (typeof name !== "string" ||
        name.trim() === "" ||
        name.length > 100 ||
        typeof destination !== "string" ||
        destination.trim() === "" ||
        destination.length > 200 ||
        !Number.isInteger(userId) ||
        userId < 1 ||
        !Number.isFinite(budget) ||
        budget < 0 ||
        budget > 99999999.99 ||
        !Array.isArray(members) ||
        members.some(function (username) {
            return typeof username !== "string" || username.trim() === "" || username.length > 50;
        })) {
        res.status(400).json({ error: "Invalid trip information" });
        return;
    }

    // Check that both dates are valid
    function validDate(value) {
        if (typeof value !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return false;
        }

        let date = new Date(value + "T00:00:00Z");
        return !isNaN(date.getTime()) && date.toISOString().substring(0, 10) === value;
    }

    if (!validDate(startDate) ||
        !validDate(endDate) ||
        endDate < startDate) {
        res.status(400).json({ error: "Invalid trip dates" });
        return;
    }

    let client;

    try {
        client = await pool.connect();
        await client.query("BEGIN");

        // Check that the creator exists
        let creator = await client.query(
            "SELECT id FROM users WHERE id = $1",
            [userId]
        );

        if (creator.rows.length === 0) {
            await client.query("ROLLBACK");
            res.status(404).json({ error: "User not found" });
            return;
        }

        // Find all selected group members
        let memberIds = [userId];

        for (let i = 0; i < members.length; i++) {
            let username = members[i].trim();

            let result = await client.query(
                "SELECT id FROM users WHERE username = $1",
                [username]
            );

            if (result.rows.length === 0) {
                await client.query("ROLLBACK");
                res.status(400).json({
                    error: "User not found: " + username
                });
                return;
            }

            let memberId = result.rows[0].id;

            if (!memberIds.includes(memberId)) {
                memberIds.push(memberId);
            }
        }

        // Create the trip
        let tripResult = await client.query(
            `INSERT INTO travel_groups
             (name, destination, start_date, end_date,
              starting_budget, created_by)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id`,
            [
                name.trim(),
                destination.trim(),
                startDate,
                endDate,
                budget,
                userId
            ]
        );

        let tripId = tripResult.rows[0].id;

        // Add the creator and selected members
        for (let i = 0; i < memberIds.length; i++) {
            await client.query(
                `INSERT INTO group_members (group_id, user_id)
                 VALUES ($1, $2)`,
                [tripId, memberIds[i]]
            );
        }

        await client.query("COMMIT");

        res.status(200).json({ tripId: tripId });

    } catch (error) {
        if (client) {
            await client.query("ROLLBACK");
        }

        console.log(error);
        res.status(500).json({ error: "Could not create trip" });

    } finally {
        if (client) {
            client.release();
        }
    }
});

// Get trips for a user
app.get("/trips", requireLogin, (req, res) => {
    let userId = req.session.user.id;

    if (!Number.isInteger(userId) || userId < 1) {
        res.status(400).json({ error: "Invalid user" });
        return;
    }

    let sql = `
        SELECT
            travel_groups.id,
            travel_groups.name,
            travel_groups.destination,
            TO_CHAR(travel_groups.start_date, 'YYYY-MM-DD') AS start_date,
            TO_CHAR(travel_groups.end_date, 'YYYY-MM-DD') AS end_date,
            travel_groups.starting_budget,
            COUNT(group_members.user_id)::INTEGER AS member_count
        FROM travel_groups
        JOIN group_members
            ON travel_groups.id = group_members.group_id
        WHERE travel_groups.id IN (
            SELECT group_id
            FROM group_members
            WHERE user_id = $1
        )
        GROUP BY travel_groups.id
        ORDER BY travel_groups.start_date NULLS LAST,
                 travel_groups.id
    `;

    pool.query(sql, [userId])
    .then(function (result) {
        res.status(200).json({ rows: result.rows });
    })
    .catch(function (error) {
        console.log(error);
        res.status(500).json({ error: "Could not load trips" });
    });
});

// Add a member to an existing trip
app.post("/trips/:id/members", requireLogin, async (req, res) => {
    let tripId = Number(req.params.id);
    let username = req.body.username;
    let userId = req.session.user.id;

    if (!Number.isInteger(tripId) || tripId < 1 ||
        !Number.isInteger(userId) || userId < 1 ||
        typeof username !== "string" ||
        username.trim() === "" ||
        username.length > 50) {
        res.status(400).json({ error: "Invalid information" });
        return;
    }

    try {
        // Check if the current user created the trip
        let trip = await pool.query(
            "SELECT id FROM travel_groups WHERE id = $1 AND created_by = $2",
            [tripId, userId]
        );

        if (trip.rows.length === 0) {
            res.status(403).json({
                error: "Only the trip creator can add members"
            });
            return;
        }

        // Find the user by username
        let user = await pool.query(
            "SELECT id FROM users WHERE username = $1",
            [username.trim()]
        );

        if (user.rows.length === 0) {
            res.status(404).json({
                error: "User not found"
            });
            return;
        }

        let memberId = user.rows[0].id;

        // Add the user to the trip
        let result = await pool.query(
            `INSERT INTO group_members (group_id, user_id)
             VALUES ($1, $2)
             ON CONFLICT (group_id, user_id) DO NOTHING
             RETURNING user_id`,
            [tripId, memberId]
        );

        if (result.rows.length === 0) {
            res.status(409).json({
                error: "User is already a member of this trip"
            });
            return;
        }

        res.status(200).json({
            message: "Member added successfully"
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: "Could not add member"
        });
    }
});

app.post("/addEvent", requireLogin, async (req, res) => {
    let userId = req.session.user.id;

    if (!Number.isInteger(userId) || userId < 1) {
        res.status(400).json({ error: "Invalid user" });
        return;
    }

    let tripId = req.body.tripId;
    let eventName = req.body.eventName;
    let eventCategory = req.body.eventCategory;
    let eventTotalPrice = req.body.eventTotalPrice;
    let eventStartDate = req.body.eventStartDate;
    let eventEndDate = req.body.eventEndDate;
    let eventLocation = req.body.eventLocation;

    console.log(tripId, eventName, eventCategory, eventTotalPrice, eventStartDate, eventEndDate, eventLocation);

    // First we have to make the relevant DB for events, that goes in setup.sql
	// Then we will have to do an insert, maybe validation and error handling
	//

    let sql = `
    	INSERT INTO events(travel_groups_id, event_name, category, total_price, start_date, end_date, location) 
	VALUES($1, $2, $3, $4, $5, $6, $7)
	`;

    let values = [tripId, eventName, eventCategory, eventTotalPrice, 
	    eventStartDate, eventEndDate, eventLocation];

    try {
	await pool.query(sql, values);
	res.status(200).json({
		message: "Event added successfully"
	});
    } catch (error) {
	console.log(error);
	res.status(400).json({
		message: "Database problem"
	});
    }
});

app.get("/loadEvents", requireLogin, async (req, res) => {
	let userId = req.session.user.id;
	let tripId = req.query.tripId;
	if (!Number.isInteger(userId) || userId < 1) {
		res.status(400).json({ error: "Invalid user" });
		return;
	}
	
	let sql = `SELECT 
			id,
		   	event_name, 
			category, 
			total_price, 
			TO_CHAR(start_date, 'YYYY-MM-DD') as start_date,
			TO_CHAR(end_date, 'YYYY-MM-DD') as end_date,
			location
		   FROM events WHERE travel_groups_id=($1)`;
	let values = [tripId];

	try {
		let result = await pool.query(sql, values);
		res.status(200).json({
			message: "Events loaded successfully",
			result: result.rows
		});
	} catch (error) {
		console.log(error);
		res.status(400).json({
			message: "Database problem"
		});
	}
});

app.post("/deleteEvent", requireLogin, async (req, res) => {
	let userId = req.session.user.id;
	if (!Number.isInteger(userId) || userId < 1) {
		res.status(400).json({ error: "Invalid user" });
		return;
	}

	let tripId = req.body.tripId;
	let eventId = req.body.eventId;

	let sql = `DELETE FROM events WHERE (id=($1) AND tripId=($2))`;
	let values = [eventId, tripId];

	try {
		await pool.query(sql, values);
		res.status(200).json({
			message: "Event deleted successfully"
		});
	} catch (error) {
		console.log(error);
		res.status(400).json({
			message: "Database problem"
		});
	}
});

app.listen(port, hostname, () => {
    console.log(`Listening at http://${hostname}:${port}`);
});
