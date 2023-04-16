-- https://devhints.io/mysql
CREATE TABLE IF NOT EXISTS tours (
    tour_id INT NOT NULL AUTO_INCREMENT,
    artist INT NOT NULL,
    tour_name VARCHAR(255) NOT NULL,

    PRIMARY KEY (tour_id),
    FOREIGN KEY (artist) REFERENCES artists(artist_id)
);

CREATE TABLE IF NOT EXISTS artists (
    artist_id INT NOT NULL AUTO_INCREMENT,
    artist_name VARCHAR(255) NOT NULL,
    bio TEXT,

    PRIMARY KEY (artist_id)
)

CREATE TABLE IF NOT EXISTS dates (
    date_id INT NOT NULL AUTO_INCREMENT,
    tour INT NOT NULL,
    date DATE NOT NULL,
    -- could also do date DATETIME to allow for HH:MM time
    -- city VARCHAR(255) NOT NULL, -- might just stick to getting venue, which contains city, by key
    venue_id INT NOT NULL,

    PRIMARY KEY (date_id),
    FOREIGN KEY (tour) REFERENCES tours(tour_id),
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id)
)

CREATE TABLE IF NOT EXISTS venues (
    venue_id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,

    PRIMARY KEY (venue_id),
)

CREATE TABLE IF NOT EXISTS seats (
    seat_id INT NOT NULL AUTO_INCREMENT,
    date_id INT NOT NULL,
    venue_id INT NOT NULL,
    section VARCHAR(255),
    block VARCHAR(255),
    row_name VARCHAR(255),
    seat_number INT,
    purchase_slot INT,
    onsale BOOLEAN,
    available BOOLEAN,
    price DECIMAL(4, 2)

    PRIMARY KEY (seat_id)
    FOREIGN KEY (date_id) REFERENCES dates(date_id),
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id)
    FOREIGN KEY (purchase_slot) REFERENCES purchase_slots(slot_id)
)

CREATE TABLE IF NOT EXISTS purchase_slots (
    slot_id INT NOT NULL AUTO_INCREMENT,
    tour_id INT NOT NULL,
    start DATETIME,
    end DATETIME,

    PRIMARY KEY (slot_id),
    FOREIGN KEY (tour_id) REFERENCES tours(tour_id)
)

CREATE TABLE IF NOT EXISTS customers (
    customer_id INT NOT NULL AUTO_INCREMENT,
    stripe_id VARCHAR(255), -- use to store IDs from Stripe payments
    first_name VARCHAR(255),
    last_name VARCHAR(255),

    PRIMARY KEY (customer_id),
)

CREATE TABLE IF NOT EXISTS sold_tickets (
    ticket_id INT NOT NULL AUTO_INCREMENT,
    customer_id INT NOT NULL,
    seat_id INT NOT NULL,
    purchased_at TIMESTAMP NOT NULL DEFAULT now(),
    -- do I want to store more details of the concert here or is that unecessary (can get via seat_id)

    PRIMARY KEY (ticket_id),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (seat_id) REFERENCES seats(seat_id)
)

