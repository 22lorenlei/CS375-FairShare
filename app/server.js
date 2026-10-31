
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
        res.status(400).end();
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
        res.status(500).end();
    });
});


// Create travel group
app.post("/groups", async (req, res) => {
    let name = req.body.name;
    let userId = req.body.userId;

    if (typeof name !== "string" ||
        name.trim().length === 0 ||
        name.length > 100 ||
        !Number.isInteger(userId) || userId < 1) {
        res.status(400).end();
        return;
    }

    let client;

    try {
        client = await pool.connect();
        await client.query("BEGIN");

        let result = await client.query(
            `INSERT INTO travel_groups (name, created_by)
             VALUES ($1, $2) RETURNING id`,
            [name.trim(), userId]
        );

        let groupId = result.rows[0].id;

        await client.query(
            `INSERT INTO group_members (group_id, user_id)
             VALUES ($1, $2)`,
            [groupId, userId]
        );

        await client.query("COMMIT");

        res.status(200).json({ groupId: groupId });

    } catch (error) {
        if (client) {
            await client.query("ROLLBACK");
        }

        console.log(error);
        res.status(500).end();

    } finally {
        if (client) {
            client.release();
        }
    }
});


// Get user's groups
app.get("/groups", (req, res) => {
    let userId = Number(req.query.userId);

    if (!Number.isInteger(userId) || userId < 1) {
        res.status(400).end();
        return;
    }

    let sql = `
        SELECT travel_groups.id,
               travel_groups.name,
               travel_groups.created_by
        FROM travel_groups
        JOIN group_members
        ON travel_groups.id = group_members.group_id
        WHERE group_members.user_id = $1
        ORDER BY travel_groups.id
    `;

    pool.query(sql, [userId])
    .then(function (result) {
        res.status(200).json({ rows: result.rows });
    })
    .catch(function (error) {
        console.log(error);
        res.status(500).end();
    });
});


app.listen(port, hostname, () => {
    console.log(`Listening at http://${hostname}:${port}`);
});
