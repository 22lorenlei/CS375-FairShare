
const express = require("express");
const pg = require("pg");
const path = require("path");
const bcrypt = require("bcrypt");

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

app.get("/login", (req, res) => {
    let email = req.query.email;
    let password = req.query.password;

    pool.query(`SELECT * FROM users WHERE email = $1`, [email]).then((result) => {
        if (result.rows.length === 0) {
            res.status(200).send({ message: "Account doesn't exist" });
        } else {
            // grabs user info
            let user = result.rows[0];

            // compare inputted password with stored hashed password
            bcrypt.compare(password, user.password).then((isMatch) => {
                if (isMatch) {
                    res.status(200).json({ message: "Logged in!" });
                } else {
                    res.status(400).json({ message: "Incorrect password!" });
                }
            });
        }

    }).catch((error) => {
        res.status(400).send(error);
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
            console.log(error)
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


app.listen(port, hostname, () => {
    console.log(`Listening at http://${hostname}:${port}`);
});
