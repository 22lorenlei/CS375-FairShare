CREATE TABLE trips (
  id SERIAL PRIMARY KEY,
  trip_name VARCHAR(100),
  destination VARCHAR(100),
  start_date DATE,
  end_date DATE
);