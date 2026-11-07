CREATE DATABASE project;
\c project 

-- Purely for testing
DROP TABLE IF EXISTS userResponsibility;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS userEvents;
DROP TABLE IF EXISTS friends;

CREATE TABLE userResponsibility (
	event_name VARCHAR(100),
	cost_name VARCHAR(100),
	category VARCHAR(100),
	username VARCHAR(100),
	price_responsible FLOAT,
	price_paid FLOAT,

	PRIMARY KEY (event_name, cost_name, category, username)
);
CREATE TABLE events (
	event_name VARCHAR(100),
	cost_name VARCHAR(100),
	category VARCHAR(100),
	total_price FLOAT,
	start_date DATE, -- DATE is like 11-22-3333. Postgres can take this format
	end_date DATE,
	destination VARCHAR(100),
	initial_budget FLOAT,

	PRIMARY KEY (event_name, cost_name, category)
);
CREATE TABLE userEvents (
	event_name VARCHAR(100),
	username VARCHAR(100),
	owner BOOLEAN,

	PRIMARY KEY (event_name, username)
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
