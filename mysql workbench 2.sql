-- https://devhints.io/mysql
CREATE TABLE IF NOT EXISTS artists (
    artist_id INT NOT NULL AUTO_INCREMENT,
    artist_name VARCHAR(255) NOT NULL,
    -- bio TEXT,

    PRIMARY KEY (artist_id)
);

CREATE TABLE IF NOT EXISTS tours (
    tour_id INT NOT NULL AUTO_INCREMENT,
    artist_id INT NOT NULL,
    tour_name VARCHAR(255) NOT NULL,

    PRIMARY KEY (tour_id),
    FOREIGN KEY (artist_id) REFERENCES artists(artist_id)
);

CREATE TABLE IF NOT EXISTS venues (
    venue_id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,

    PRIMARY KEY (venue_id)
);

CREATE TABLE IF NOT EXISTS dates (
    date_id INT NOT NULL AUTO_INCREMENT,
    tour_id INT NOT NULL,
    date_time DATETIME NOT NULL,
    venue_id INT NOT NULL,

    PRIMARY KEY (date_id),
    FOREIGN KEY (tour_id) REFERENCES tours(tour_id),
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id)
);

CREATE TABLE IF NOT EXISTS purchase_slots (
    slot_id INT NOT NULL AUTO_INCREMENT,
    tour_id INT NOT NULL,
    start DATETIME,
    end DATETIME,

    PRIMARY KEY (slot_id),
    FOREIGN KEY (tour_id) REFERENCES tours(tour_id)
);

CREATE TABLE IF NOT EXISTS seats (
    seat_id INT NOT NULL AUTO_INCREMENT,
    date_id INT NOT NULL,
    venue_id INT NOT NULL,
    section VARCHAR(255),
    block VARCHAR(255),
    row_name VARCHAR(255),
    seat_number INT,
    slot_id INT,
    onsale BOOLEAN,
    available BOOLEAN,
    price DECIMAL(4, 2),

    PRIMARY KEY (seat_id),
    FOREIGN KEY (date_id) REFERENCES dates(date_id),
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id),
    FOREIGN KEY (slot_id) REFERENCES purchase_slots(slot_id)
);

CREATE TABLE IF NOT EXISTS customers (
    customer_id INT NOT NULL AUTO_INCREMENT,
    stripe_id VARCHAR(255), -- use to store IDs from Stripe payments
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255),

    PRIMARY KEY (customer_id)
);

CREATE TABLE IF NOT EXISTS sold_tickets (
    ticket_id INT NOT NULL AUTO_INCREMENT,
    customer_id INT NOT NULL,
    seat_id INT NOT NULL,
    purchased_at TIMESTAMP NOT NULL DEFAULT now(),
    -- do I want to store more details of the concert here or is that unecessary (can get via seat_id)

    PRIMARY KEY (ticket_id),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (seat_id) REFERENCES seats(seat_id)
);


INSERT INTO artists (artist_name) VALUES("Beyonce");
INSERT INTO tours (artist_id, tour_name) VALUES(LAST_INSERT_ID(), "Renaissance World Tour");

show tables;

SELECT * FROM artists INNER JOIN tours ON tours.artist_id = artists.artist_id;

INSERT 
INTO venues (name, city) 
VALUES
    ("Tottenham Hotspur Stadium", "London"),
    ("Principality Stadium", "Cardiff"),
    ("Stadium of Light", "Sunderland"),
    ("BT Murrayfield Stadium", "Edinburgh");

SET @tottenham_id = (SELECT venue_id FROM venues WHERE name="Tottenham Hotspur Stadium");
SET @renaissance_id = (SELECT tour_id FROM tours WHERE tour_name="Renaissance World Tour");

-- SELECT @tottenham_id

INSERT
INTO dates (tour_id, date, venue_id)
VALUES
    (@renaissance_id, "2023-05-29", @tottenham_id),
    (@renaissance_id, "2023-05-30", @tottenham_id),
    (@renaissance_id, "2023-06-01", @tottenham_id),
    (@renaissance_id, "2023-06-03", @tottenham_id),
    (@renaissance_id, "2023-06-04", @tottenham_id);
    
    
SELECT `date`, venue_name, city, artist_name, tour_name FROM dates 
    INNER JOIN venues ON dates.venue_id = venues.venue_id
    INNER JOIN tours ON dates.tour_id = tours.tour_id
    INNER JOIN artists ON tours.artist_id = artists.artist_id;
    
    
SELECT tour_id, artist_name, tour_name
FROM tours
INNER JOIN artists ON tours.artist_id = artists.artist_id;

SELECT *
FROM tours
INNER JOIN artists ON tours.artist_id = artists.artist_id
WHERE tour_id = 1;


SELECT * 
FROM dates 
INNER JOIN venues ON dates.venue_id = venues.venue_id
WHERE tour_id = 1;

SELECT *
FROM dates
WHERE tour_id = 1 AND venue_id = 1;

SELECT *
FROM venues
WHERE venue_id = 1
LIMIT 1;


DROP TABLE seats;

CREATE TABLE IF NOT EXISTS seats (
    seat_id INT NOT NULL AUTO_INCREMENT,
    date_id INT NOT NULL,
    section VARCHAR(255),
    block VARCHAR(255),
    general_admission BOOLEAN,
    row_name VARCHAR(255),
    seat_number INT,
    slot_id INT,
    onsale BOOLEAN,
    available BOOLEAN,
    price DECIMAL(4, 2),

    PRIMARY KEY (seat_id),
    FOREIGN KEY (date_id) REFERENCES dates(date_id),
    FOREIGN KEY (slot_id) REFERENCES purchase_slots(slot_id)
);

ALTER TABLE seats
ADD general_admission BOOLEAN;

ALTER TABLE seats
DROP FOREIGN KEY fk_venue_id;


-- INSERT 
-- INTO seats (date_id, 

SELECT date(date), date_id from dates;

SELECT *, date(date)
FROM dates 
INNER JOIN venues ON dates.venue_id = venues.venue_id
WHERE date_id = 1;

SELECT COUNT(onsale) FROM seats INNER JOIN dates ON dates.date_id = seats.date_id WHERE tour_id = 1;
SELECT COUNT(onsale) FROM seats INNER JOIN dates ON dates.date_id = seats.date_id WHERE tour_id = 1 AND onsale = true;

SELECT * FROM seats INNER JOIN dates ON dates.date_id = seats.date_id WHERE tour_id = 1;

SELECT * FROM purchase_slots WHERE tour_id = 2;

SELECT tour_id, artist_name, tour_name
FROM tours
INNER JOIN artists ON tours.artist_id = artists.artist_id;


SELECT * 
FROM purchase_slots
WHERE tour_id = 2
ORDER BY start ASC;


-- https://stackoverflow.com/a/28717925

SELECT *
FROM tours 
	INNER JOIN artists ON tours.artist_id = artists.artist_id
    INNER JOIN dates ON tours.tour_id = dates.tour_id
    INNER JOIN venues ON dates.venue_id = venues.venue_id
WHERE tour_name LIKE "%Sab%"
OR artist_name LIKE "%Sab%"
OR venue_name LIKE "%Sab%"
OR city LIKE "%Sab%";

CREATE TABLE temp 
	(
		tour_id INT, 
		tour_name VARCHAR(255),
		artist_id INT,
        artist_name VARCHAR(255),
        date_id INT,
        date DATE,
        venue_id INT
    );

-- INSERT INTO temp (tour_id, artist_id, tour_name, artist_name, date)
-- https://stackoverflow.com/a/10986929
-- https://stackoverflow.com/a/276949  
-- https://stackoverflow.com/a/8631273
SELECT tours.tour_id, tour_name, artists.artist_id, artist_name, SUBSTRING_INDEX(GROUP_CONCAT(date ORDER BY date ASC SEPARATOR ','), ",", 1) AS first_date
FROM tours
INNER JOIN artists ON tours.artist_id = artists.artist_id
INNER JOIN dates ON tours.tour_id = dates.tour_id
GROUP BY tour_id
ORDER BY first_date DESC;

SELECT DISTINCT tours.tour_id, artist_name, tour_name
FROM temp;

INNER JOIN artists ON tours.artist_id = artists.artist_id
INNER JOIN dates ON tours.tour_id = dates.tour_id
ORDER BY date ASC;


SELECT *
FROM  
WHERE 'foo' in ();


TRUNCATE TABLE users;

SELECT EXISTS(SELECT * FROM users WHERE email = 103948);

-- using this to get info for ticket product
-- if I add fee info to tour, can join this in/pull these columns as well
SELECT seat_id, seats.date_id, date, section, block, row_name, seat_number, general_admission, available, price, tours.tour_id, tour_name, artists.artist_id, artist_name, venues.venue_id, venue_name, city
FROM seats
INNER JOIN dates ON seats.date_id = dates.date_id
INNER JOIN tours ON dates.tour_id = tours.tour_id
INNER JOIN artists ON tours.artist_id = artists.artist_id
INNER JOIN venues ON dates.venue_id = venues.venue_id;


SELECT (waiting_lists) FROM users WHERE user_id = 1;

SELECT * FROM users WHERE waiting_lists REGEXP '\"date_id\":2';

SELECT order_id, orders.date_id, date, orders.tour_id, tour_name, artist_name, orders.venue_id, venue_name, city, stripe_session_id, on_waiting_list, seat_ids
FROM orders 
INNER JOIN tours ON orders.tour_id = tours.tour_id
INNER JOIN artists ON tours.artist_id = artists.artist_id
INNER JOIN venues ON orders.venue_id = venues.venue_id
INNER JOIN dates ON orders.date_id = dates.date_id
WHERE user_id = 1;

UPDATE orders
SET on_waiting_list = true
WHERE order_id = 5;


SELECT * FROM users WHERE waiting_list REGEXP '\"{0,1}date_id\"{0,1}:\"{0,1}1\"{0,1}';

SELECT date, artist_name, tour_name, venue_name, city
FROM dates
INNER JOIN venues on dates.venue_id = venues.venue_id
INNER JOIN tours ON dates.tour_id = tours.tour_id
INNER JOIN artists ON tours.artist_id = artists.artist_id
WHERE date_id = 1;

INSERT INTO seats (date_id, price, slot_id, section, block, row_name, seat, onsale, available) VALUES (2, 0, 2, 'test', 'test', 'test', 5, false, true), (2, 0, 2, 'test', 'test', 'test', 6, false, true), (2, 0, 2, 'test', 'test', 'test', 7, false, true), (2, 0, 2, 'test', 'test', 'test', 8, false, true), (2, 0, 2, 'test', 'test', 'test', 9, false, true), (2, 0, 2, 'test', 'test', 'test', 10, false, true)

INSERT INTO queues (tour_id) VALUES(2);

SELECT EXISTS(SELECT * FROM queues WHERE tour_id = 1) as "exists";

UPDATE queues SET headcount = headcount - 1 WHERE tour_id = 1;

INSERT INTO purchase_slots (tour_id, start, end)
VALUES
	(2, "2023-05-15 00:00:00", "2023-05-15 22:00:00"),
	(2, "2023-05-23 9:00:00", "2023-05-05 15:00:00"),
	(2, "2023-05-30 20:00:00", "2023-05-30 9:00:00");
    
INSERT INTO slot_registrations (user_id, slot_id) VALUES(1, 2);
DELETE FROM slot_registrations WHERE slot_id = 2 AND user_id = 1;

SELECT * FROM slot_registrations
INNER JOIN purchase_slots ON slot_registrations.slot_id = purchase_slots.slot_id
WHERE user_id = 1
AND tour_id = 2;
