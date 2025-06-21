DROP DATABASE IF EXISTS DogWalkService;
CREATE DATABASE DogWalkService;
USE DogWalkService;
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('owner', 'walker') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Dogs (
    dog_id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    size ENUM('small', 'medium', 'large') NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES Users(user_id)
);

CREATE TABLE WalkRequests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    dog_id INT NOT NULL,
    requested_time DATETIME NOT NULL,
    duration_minutes INT NOT NULL,
    location VARCHAR(255) NOT NULL,
    status ENUM('open', 'accepted', 'completed', 'cancelled') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dog_id) REFERENCES Dogs(dog_id)
);

CREATE TABLE WalkApplications (
    application_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    walker_id INT NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    FOREIGN KEY (request_id) REFERENCES WalkRequests(request_id),
    FOREIGN KEY (walker_id) REFERENCES Users(user_id),
    CONSTRAINT unique_application UNIQUE (request_id, walker_id)
);

CREATE TABLE WalkRatings (
    rating_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    walker_id INT NOT NULL,
    owner_id INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comments TEXT,
    rated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES WalkRequests(request_id),
    FOREIGN KEY (walker_id) REFERENCES Users(user_id),
    FOREIGN KEY (owner_id) REFERENCES Users(user_id),
    CONSTRAINT unique_rating_per_walk UNIQUE (request_id)
);
DELIMITER $$

CREATE TRIGGER trg_one_accept_per_request
BEFORE UPDATE ON WalkApplications
FOR EACH ROW
BEGIN
    IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN

        IF EXISTS (
            SELECT 1 FROM WalkApplications
            WHERE request_id = NEW.request_id
            AND status = 'accepted'
            AND application_id != NEW.application_id
        ) THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Each dog-walking request can only accept one dog walker application';
        END IF;


        UPDATE WalkRequests
        SET status = 'accepted'
        WHERE request_id = NEW.request_id;
    END IF;
END$$

CREATE TRIGGER trg_reject_other_applications
AFTER UPDATE ON WalkApplications
FOR EACH ROW
BEGIN
    IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
        UPDATE WalkApplications
        SET status = 'rejected'
        WHERE request_id = NEW.request_id
        AND application_id != NEW.application_id
        AND status = 'pending';
    END IF;
END$$

CREATE TRIGGER trg_rating_after_completion
BEFORE INSERT ON WalkRatings
FOR EACH ROW
BEGIN
    DECLARE request_status VARCHAR(20);

    SELECT status INTO request_status
    FROM WalkRequests
    WHERE request_id = NEW.request_id;

    IF request_status != 'completed' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Scoring can only be done after the dog walk is completed';
    END IF;
END$$

CREATE TRIGGER trg_owner_only_dog_creation
BEFORE INSERT ON Dogs
FOR EACH ROW
BEGIN
    DECLARE user_role VARCHAR(10);

    SELECT role INTO user_role
    FROM Users
    WHERE user_id = NEW.owner_id;

    IF user_role != 'owner' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Only pet owners can create pet files';
    END IF;
END$$