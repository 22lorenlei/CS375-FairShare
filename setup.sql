CREATE TABLE trips (
  id SERIAL PRIMARY KEY,
  trip_name VARCHAR(100),
  destination VARCHAR(100),
  start_date DATE,
  end_date DATE
);

INSERT INTO trips
(trip_name, destination, start_date, end_date)
VALUES
('Miami Trip', 'Miami, Florida', '2027-06-10', '2027-06-15');