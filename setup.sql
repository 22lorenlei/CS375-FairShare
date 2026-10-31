
CREATE DATABASE fairshare;
\c fairshare

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE travel_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(id)
);

CREATE TABLE group_members (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES travel_groups(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    UNIQUE(group_id, user_id)
);
