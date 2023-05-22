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
    ticket_limit INT NOT NULL DEFAULT 4,
    image_name VARCHAR(255),

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
    section VARCHAR(255),
    block VARCHAR(255),
    general_admission BOOLEAN,
    row_name VARCHAR(255),
    seat_number INT,
    slot_id INT,
    onsale BOOLEAN,
    available BOOLEAN,
    price DECIMAL(7, 2),
    status VARCHAR(255) DEFAULT "available",
    
    PRIMARY KEY (seat_id),
    FOREIGN KEY (date_id) REFERENCES dates(date_id),
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
INSERT INTO tours (artist_id, tour_name, image_name) VALUES(LAST_INSERT_ID(), "Renaissance World Tour", "bey");
-- SET @renaissance_id = last_insert_id();

INSERT 
INTO venues (venue_name, city) 
VALUES
    ("Tottenham Hotspur Stadium", "London"),
    ("Principality Stadium", "Cardiff"),
    ("Stadium of Light", "Sunderland"),
    ("BT Murrayfield Stadium", "Edinburgh");

SET @renaissance_id = (SELECT tour_id FROM tours WHERE tour_name="Renaissance World Tour");
SET @tottenham_id = (SELECT venue_id FROM venues WHERE venue_name="Tottenham Hotspur Stadium");
SET @sunderland_id = (SELECT venue_id FROM venues WHERE venue_name="Stadium of Light");

INSERT
INTO dates (tour_id, date, venue_id)
VALUES
    (@renaissance_id, "2023-05-29", @tottenham_id),
    (@renaissance_id, "2023-05-30", @tottenham_id),
    (@renaissance_id, "2023-06-01", @tottenham_id),
    (@renaissance_id, "2023-06-03", @tottenham_id),
    (@renaissance_id, "2023-06-04", @tottenham_id),
    (@renaissance_id, "2023-05-23", @sunderland_id);
    
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
INSERT INTO tours (artist_id, tour_name, image_name) VALUES(LAST_INSERT_ID(), "Emails I Can't Send Tour", "sab");
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
	(@emails_tour_id, "2023-05-15 00:00:00", "2023-05-15 22:00:00"),
	(@emails_tour_id, "2023-05-23 9:00:00", "2023-05-05 15:00:00"),
	(@emails_tour_id, "2023-05-30 20:00:00", "2023-05-30 9:00:00");
    
SET @slot_id = last_insert_id();

INSERT INTO seats (date_id, section, block, general_admission, slot_id, onsale, available, price)
VALUES
	(@mcr_date_id, "Stalls Standing", "Stalls Standing", true, @slot_id, false, true, 33.33),
	(@mcr_date_id, "Stalls Standing", "Stalls Standing", true, @slot_id, false, true, 33.33),
	(@mcr_date_id, "Stalls Standing", "Stalls Standing", true, @slot_id, false, true, 33.33),
	(@mcr_date_id, "Stalls Standing", "Stalls Standing", true, @slot_id, false, true, 33.33),
	(@mcr_date_id, "Stalls Standing", "Stalls Standing", true, @slot_id, false, true, 33.33),
	(@mcr_date_id, "Stalls Standing", "Stalls Standing", true, @slot_id, false, true, 33.33);
    

CREATE TABLE IF NOT EXISTS users (
    customer_id INT NOT NULL AUTO_INCREMENT,
    stripe_id VARCHAR(255), -- use to store IDs from Stripe payments
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255),
    password VARCHAR(255),
    waiting_lists VARCHAR(255),

    PRIMARY KEY (customer_id),
    UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS queue_test (
	test VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS queues (
	queue_id INT NOT NULL AUTO_INCREMENT,
	tour_id INT UNIQUE,
    queue TEXT, -- square bracket wrapped, comma separated array of user ids that are currently in queue
    capacity INT DEFAULT 1, -- number allowed on page at once, default is 1
    headcount INT DEFAULT 0, -- number of people on page. if less than capacity, can let next person in queue onto the page
    
    PRIMARY KEY (queue_id),
    FOREIGN KEY (tour_id) REFERENCES tours(tour_id)
);

CREATE TABLE IF NOT EXISTS orders (
	order_id INT NOT NULL AUTO_INCREMENT,
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT,
	date_id INT,
    seat_ids VARCHAR(255),
    tour_id INT,
    venue_id INT,
 --   status VARCHAR(255), -- set pending from success page, use webhook to set complete
	stripe_session_id VARCHAR(255),
    stripe_metadata TEXT,
--    on_waiting_list BOOLEAN DEFAULT false, 
    price_paid DECIMAL(7, 2),
    refunded BOOLEAN DEFAULT false,
    stripe_refund_id VARCHAR(255),
    
    PRIMARY KEY (order_id),    
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (tour_id) REFERENCES tours(tour_id),
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id),
    FOREIGN KEY (date_id) REFERENCES dates(date_id)
);

CREATE TABLE IF NOT EXISTS slot_registrations (
	slot_reg_id INT NOT NULL AUTO_INCREMENT,
	slot_id INT NOT NULL,
    user_id INT NOT NULL,
    
    PRIMARY KEY (slot_reg_id), -- only here so I can alter data in mysql workbench
    FOREIGN KEY (slot_id) REFERENCES purchase_slots(slot_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS waiting_list (
	wl_id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    date_id INT NOT NULL,
    qty INT NOT NULL,
    
    PRIMARY KEY (wl_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (date_id) REFERENCES dates(date_id)
);
