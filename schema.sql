-- https://devhints.io/mysql
CREATE TABLE IF NOT EXISTS artists (
    artist_id INT NOT NULL AUTO_INCREMENT,
    artist_name VARCHAR(255) NOT NULL,

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
    -- seatmap_img VARCHAR(255),
--     availability_img VARCHAR(255),

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
    
INSERT
INTO venues (venue_name, city)
VALUES 
	("O2 Arena", "London"),
	("Corn Exchange", "Cambridge"),
	("Utilita Arena", "Birmingham");


SET @renaissance_id = (SELECT tour_id FROM tours WHERE tour_name="Renaissance World Tour");
SET @o2_id = (SELECT venue_id FROM venues WHERE venue_name="O2 Arena");
SET @cam_id = (SELECT venue_id FROM venues WHERE venue_name="Corn Exchange");
SET @brum_id = (SELECT venue_id FROM venues WHERE venue_name="Stadium of Light");

INSERT
INTO dates (tour_id, date, venue_id)
VALUES
    (@renaissance_id, "2023-05-29", @o2_id),
    (@renaissance_id, "2023-05-30", @o2_id),
    (@renaissance_id, "2023-06-01", @o2_id),
    (@renaissance_id, "2023-06-03", @o2_id),
    (@renaissance_id, "2023-06-04", @o2_id),
    (@renaissance_id, "2023-05-23", @cam_id),
    (@renaissance_id, "2023-05-18", @brum_id);
    
INSERT 
INTO seats (date_id, section, block, row_name, seat_number, onsale, available, price, general_admission)
VALUES
	(@renaissance_id, 100, "A1", "A", 1, true, true, 100.00, false),
	(@renaissance_id, 100, "A1", "A", 2, true, true, 100.00, false),
	(@renaissance_id, 100, "A1", "A", 3, true, true, 100.00, false),
	(@renaissance_id, 100, "A1", "A", 6, true, true, 100.00, false),
	(@renaissance_id, 100, "A1", "A", 7, true, true, 100.00, false),
	(@renaissance_id, 100, "A1", "A", 8, true, true, 100.00, false),
	(@renaissance_id, 100, "A1", "A", 9, true, true, 100.00, false),
    (@renaissance_id, 100, "A1", "A", 1, true, true, 100.00, false),
	(@renaissance_id, 100, "A1", "A", 2, true, true, 100.00, false),
	(@renaissance_id, 100, "A1", "A", 3, true, true, 100.00, false),
	(@renaissance_id, 100, "A1", "A", 6, true, true, 100.00, false),
	(@renaissance_id, 100, "A1", "A", 7, true, true, 100.00, false),
	(@renaissance_id, 100, "A1", "A", 8, true, true, 100.00, false),
	(@renaissance_id, 100, "A1", "A", 9, true, true, 100.00, false);
    
INSERT INTO artists (artist_name) VALUES("Sabrina Carpenter");
INSERT INTO tours (artist_id, tour_name, image_name) VALUES(LAST_INSERT_ID(), "Emails I Can't Send Tour", "sab");
SET @emails_tour_id = last_insert_id();

INSERT INTO venues (venue_name, city) VALUES ("O2 Apollo", "Manchester");
SET @o2_mcr_id = last_insert_id();

INSERT INTO venues (venue_name, city) VALUES ("Eventim Apollo", "London");
SET @eventim_apollo_id = last_insert_id();

INSERT INTO venues (venue_name, city) VALUES ("O2 Academy", "Birmingham");
SET @o2_brum_id = last_insert_id();

INSERT INTO dates (tour_id, venue_id, date)
VALUES
	(@emails_tour_id, @o2_mcr_id, "2023-06-14"),
	(@emails_tour_id, @o2_brum_id, "2023-06-18"),
	(@emails_tour_id, @o2_id, "2023-06-19");
    
SET @mcr_date_id = (SELECT date_id FROM dates WHERE tour_id = @emails_tour_id AND date = "2023-06-14");
SELECT @mcr_date_id;

-- INSERT INTO purchase_slots (tour_id, start, end)
-- VALUES
-- 	(@emails_tour_id, "2023-05-23 09:00:00", "2023-05-15 15:00:00"),
-- 	(@emails_tour_id, "2023-05-25 12:00:00", "2023-05-25 18:00:00"),
-- 	(@emails_tour_id, "2023-05-27 17:00:00", "2023-05-27 22:00:00");
--     
-- -- SELECT * FROM purchase_slots WHERE tour_id = @emails_tour_id LIMIT 1;
-- -- SELECT * FROM purchase_slots WHERE tour_id = @emails_tour_id LIMIT 1;
-- -- SELECT * FROM purchase_slots WHERE tour_id = 2 LIMIT 2, 1;
--    
-- SET @emails_slot_1 = (SELECT slot_id FROM purchase_slots WHERE tour_id = @emails_tour_id LIMIT 1);
-- SET @emails_slot_2 = (SELECT slot_id FROM purchase_slots WHERE tour_id = @emails_tour_id LIMIT 1, 1);
-- SET @emails_slot_3 = (SELECT slot_id FROM purchase_slots WHERE tour_id = @emails_tour_id LIMIT 2, 1);

INSERT INTO seats (date_id, section, block, general_admission, slot_id, onsale, available, price)
VALUES
	(@mcr_date_id, "Stalls Standing", "Stalls Standing", true, @slot_id, false, true, 33.33),
	(@mcr_date_id, "Stalls Standing", "Stalls Standing", true, @slot_id, false, true, 33.33),
	(@mcr_date_id, "Stalls Standing", "Stalls Standing", true, @slot_id, false, true, 33.33),
	(@mcr_date_id, "Stalls Standing", "Stalls Standing", true, @slot_id, false, true, 33.33),
	(@mcr_date_id, "Stalls Standing", "Stalls Standing", true, @slot_id, false, true, 33.33),
	(@mcr_date_id, "Stalls Standing", "Stalls Standing", true, @slot_id, false, true, 33.33);
    
-- neither of these need seats, corinne needs slots
-- need two dates though
INSERT INTO artists(artist_name) 
VALUES
	("Corinne Bailey Rae"), -- not on sale yet
	("Labrinth"); -- sold out

SET @corinne_id = (SELECT artist_id FROM artists WHERE artist_name = "Corinne Bailey Rae");
SET @labrinth_id = (SELECT artist_id FROM artists WHERE artist_name = "Labrinth");

INSERT INTO tours (artist_id, tour_name, image_name) 
VALUES
	(@corinne_id, "Self Titled Tour", "rae"),
	(@labrinth_id, "Imagination and the Misfit Kid Tour", "lab");
    
SET @corinne_tour_id = (SELECT tour_id FROM tours WHERE artist_id = @corinne_id);
SET @labrinth_tour_id = (SELECT tour_id FROM tours WHERE artist_id = @labrinth_id);
SET @any_venue_id = (SELECT venue_id FROM venues LIMIT 1);

INSERT INTO dates (tour_id, venue_id, date)
VALUES
	(@corinne_tour_id, @any_venue_id, "2023-08-08"), 
	(@corinne_tour_id, @any_venue_id, "2023-09-09"), 
	(@labrinth_tour_id, @any_venue_id, "2024-02-15"), 
	(@labrinth_tour_id, @any_venue_id, "2024-03-04");
    
INSERT INTO purchase_slots (tour_id, start, end)
VALUES
	(@corinne_tour_id, "2023-07-19 09:00:00", "2023-07-19 15:00:00"),
	(@corinne_tour_id, "2023-07-21 19:30:00", "2023-07-21 23:59:00"),
	(@corinne_tour_id, "2023-07-22 14:00:00", "2023-07-22 19:00:00");
    
INSERT INTO seats (date_id, onsale, price) VALUES((SELECT date_id FROM dates WHERE tour_id = @corinne_tour_id LIMIT 1), false, 50.00);
    

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
