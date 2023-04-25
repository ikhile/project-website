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
    venue_name VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,

    PRIMARY KEY (venue_id)
);

CREATE TABLE IF NOT EXISTS dates (
    date_id INT NOT NULL AUTO_INCREMENT,
    tour_id INT NOT NULL,
    date DATE NOT NULL,
    venue_id INT NOT NULL,

    PRIMARY KEY (date_id),
    FOREIGN KEY (tour_id) REFERENCES tours(tour_id),
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id)
);

CREATE TABLE IF NOT EXISTS purchase_slots (
    purchase_slot_id INT NOT NULL AUTO_INCREMENT,
    tour_id INT NOT NULL,
    start DATETIME,
    end DATETIME,

    PRIMARY KEY (purchase_slot_id),
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
    purchase_slot_id INT,
    onsale BOOLEAN,
    available BOOLEAN,
    price DECIMAL(4, 2),

    PRIMARY KEY (seat_id),
    FOREIGN KEY (date_id) REFERENCES dates(date_id),
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id),
    FOREIGN KEY (purchase_slot_id) REFERENCES purchase_slots(purchase_slot_id)
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

INSERT 
INTO venues (venue_name, city) 
VALUES
    ("Tottenham Hotspur Stadium", "London"),
    ("Principality Stadium", "Cardiff"),
    ("Stadium of Light", "Sunderland"),
    ("BT Murrayfield Stadium", "Edinburgh");

SET @tottenham_id = (SELECT venue_id FROM venues WHERE venue_name="Tottenham Hotspur Stadium");
SET @renaissance_id = (SELECT tour_id FROM tours WHERE tour_name="Renaissance World Tour");

INSERT
INTO dates (tour_id, date, venue_id)
VALUES
    (@renaissance_id, "2023-05-29", @tottenham_id),
    (@renaissance_id, "2023-05-30", @tottenham_id),
    (@renaissance_id, "2023-06-01", @tottenham_id),
    (@renaissance_id, "2023-06-03", @tottenham_id),
    (@renaissance_id, "2023-06-04", @tottenham_id);
    
show databases
