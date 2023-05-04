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
    section VARCHAR(255),
    block VARCHAR(255),
    general_admission BOOLEAN,
    row_name VARCHAR(255),
    seat_number INT,
    purchase_slot_id INT,
    onsale BOOLEAN,
    available BOOLEAN,
    price DECIMAL(7, 2),
    
    PRIMARY KEY (seat_id),
    FOREIGN KEY (date_id) REFERENCES dates(date_id),
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
-- SET @renaissance_id = last_insert_id();

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
    
INSERT 
INTO seats (date_id, section, block, row_name, seat_number, onsale, available, price, general_admission)
VALUES
	(1, 100, "A1", "A", 1, true, true, 100.00, false),
	(1, 100, "A1", "A", 2, true, true, 100.00, false),
	(1, 100, "A1", "A", 3, true, true, 100.00, false),
	(1, 100, "A1", "A", 6, true, true, 100.00, false),
	(1, 100, "A1", "A", 7, true, true, 100.00, false),
	(1, 100, "A1", "A", 8, true, true, 100.00, false),
	(1, 100, "A1", "A", 9, true, true, 100.00, false);
    
INSERT INTO artists (artist_name) VALUES("Sabrina Carpenter");
INSERT INTO tours (artist_id, tour_name) VALUES(LAST_INSERT_ID(), "Emails I Can't Send Tour");
SET @emails_tour_id = last_insert_id();

INSERT INTO venues (venue_name, city) VALUES ("O2 Apollo", "Manchester");
SET @o2_mcr_id = last_insert_id();

INSERT INTO venues (venue_name, city) VALUES ("Eventim Apollo", "London");
SET @eventim_apollo_id = last_insert_id();

SELECT @o2_mcr_id;

INSERT INTO dates (tour_id, venue_id, date)
VALUES
	(@emails_tour_id, @o2_mcr_id, "2023-06-14"),
	(@emails_tour_id, @eventim_apollo_id, "2023-06-19");
    
SET @mcr_date_id = (SELECT date_id FROM dates WHERE tour_id = @emails_tour_id AND date = "2023-06-14");
SELECT @mcr_date_id;

INSERT INTO purchase_slots (tour_id, start, end)
VALUES
	(@emails_tour_id, "2023-05-05 10:00:00", "2023-05-05 22:00:00");
    
SET @slot_id = last_insert_id();

INSERT INTO seats (date_id, section, block, general_admission, purchase_slot_id, onsale, available, price)
VALUES
	(@mcr_date_id, "Stalls Standing", "Stalls Standing", true, @slot_id, false, true, 33.33),
	(@mcr_date_id, "Stalls Standing", "Stalls Standing", true, @slot_id, false, true, 33.33),
	(@mcr_date_id, "Stalls Standing", "Stalls Standing", true, @slot_id, false, true, 33.33),
	(@mcr_date_id, "Stalls Standing", "Stalls Standing", true, @slot_id, false, true, 33.33),
	(@mcr_date_id, "Stalls Standing", "Stalls Standing", true, @slot_id, false, true, 33.33),
	(@mcr_date_id, "Stalls Standing", "Stalls Standing", true, @slot_id, false, true, 33.33);
    

