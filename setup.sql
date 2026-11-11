
CREATE DATABASE fairshare;
\c fairshare

DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS travel_groups CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS user_responsibility CASCADE;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255)
);

CREATE TABLE travel_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    destination VARCHAR(200),
    start_date DATE,
    end_date DATE,
    starting_budget NUMERIC(10,2) DEFAULT 0,
    created_by INTEGER NOT NULL REFERENCES users(id)
);

CREATE TABLE group_members (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES travel_groups(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    UNIQUE(group_id, user_id)
);

CREATE TABLE events (
	id SERIAL PRIMARY KEY,
    travel_groups_id INTEGER NOT NULL REFERENCES travel_groups(id),
	event_name VARCHAR(100),
	category VARCHAR(100),
	total_price FLOAT,
	start_date DATE,
	end_date DATE,
	location VARCHAR(100)
);

CREATE TABLE user_responsibility (
	id SERIAL PRIMARY KEY,
	travel_groups_id INTEGER NOT NULL REFERENCES travel_groups(id),
	trip_name VARCHAR(100),
	cost_name VARCHAR(100),
	category VARCHAR(100),
	username VARCHAR(100),
	price_responsible FLOAT,
	price_paid FLOAT
);

-- Retain the original standalone trip schema for existing data.
CREATE TABLE trips (
  id SERIAL PRIMARY KEY,
  trip_name VARCHAR(100),
  destination VARCHAR(100),
  start_date DATE,
  end_date DATE
);
