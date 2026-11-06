
const express = require("express");
const pg = require("pg");
const path = require("path");

const app = express();

const port = 3000;
const hostname = "localhost";

const env = require("../env.json");
const pool = new pg.Pool(env);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


// Select or create user for local development
app.post("/users/select", (req, res) => {
    let username = req.body.username;

    if (typeof username !== "string" ||
        username.trim().length === 0 ||
        username.length > 50) {
        res.status(400).json({ error: "Invalid username" });
        return;
    }

    let sql = `
        INSERT INTO users (username)
        VALUES ($1)
        ON CONFLICT (username)
        DO UPDATE SET username = EXCLUDED.username
        RETURNING id, username
    `;

    pool.query(sql, [username.trim()])
    .then(function (result) {
        res.status(200).json(result.rows[0]);
    })
    .catch(function (error) {
        console.log(error);
        res.status(500).json({ error: "Database error" });
    });
});

// Create a new trip
app.post("/trips", async (req, res) => {
    let name = req.body.name;
    let destination = req.body.destination;
    let startDate = req.body.startDate;
    let endDate = req.body.endDate;
    let budget = req.body.budget;
    let members = req.body.members;
    let userId = req.body.userId;

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
app.get("/trips", (req, res) => {
    let userId = Number(req.query.userId);

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
app.post("/trips/:id/members", async (req, res) => {
    let tripId = Number(req.params.id);
    let username = req.body.username;
    let userId = req.body.userId;

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

app.listen(port, hostname, () => {
    console.log(`Listening at http://${hostname}:${port}`);
});
