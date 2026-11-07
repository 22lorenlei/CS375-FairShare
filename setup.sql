CREATE DATABASE project;
\c project 

-- Purely for testing
DROP TABLE IF EXISTS userResponsibility;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS userTrips;
DROP TABLE IF EXISTS friends;
DROP TABLE IF EXISTS trips;

CREATE TABLE userResponsibility (
	trip_name VARCHAR(100),
	cost_name VARCHAR(100),
	category VARCHAR(100),
	username VARCHAR(100),
	price_responsible FLOAT,
	price_paid FLOAT,

	PRIMARY KEY (trip_name, cost_name, category, username)
);
CREATE TABLE events (
	trip_name VARCHAR(100),
	cost_name VARCHAR(100),
	category VARCHAR(100),
	total_price FLOAT,
	start_date DATE, -- DATE is like 11-22-3333. Postgres can take this format
	end_date DATE,
	location VARCHAR(100),

	PRIMARY KEY (trip_name, cost_name, category)
);
CREATE TABLE trips (
	trip_name VARCHAR(100),
	start_date DATE,
	end_date DATE,
	initial_budget FLOAT,

	PRIMARY KEY (trip_name)
);
CREATE TABLE userTrips (
	trip_name VARCHAR(100),
	username VARCHAR(100),
	owner BOOLEAN,

	PRIMARY KEY (trip_name, username)
);

-- dummy table for friend circle
CREATE TABLE friends (
	friend1 VARCHAR(100),
	following VARCHAR(100), -- Direction matters here, friend 1 could follow friend 2, but not the other way around
	friend2 VARCHAR(100),

	PRIMARY KEY (friend1, following, friend2)
);

INSERT INTO friends(friend1, following, friend2) VALUES('Apple', 'follows', 'Orange');
INSERT INTO friends(friend1, following, friend2) VALUES('Apple', 'follows', 'Mango');
