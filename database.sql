CREATE DATABASE railway_booking;
USE railway_booking;

-- Create users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create train_categories table
CREATE TABLE train_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    base_price_multiplier DECIMAL(3,2) DEFAULT 1.00
);

-- Create trains table
CREATE TABLE trains (
    id INT AUTO_INCREMENT PRIMARY KEY,
    train_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category_id INT,
    from_station VARCHAR(100) NOT NULL,
    to_station VARCHAR(100) NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    duration VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES train_categories(id)
);

-- Create train_classes table
CREATE TABLE train_classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    price_multiplier DECIMAL(3,2) DEFAULT 1.00
);

-- Create train_seats table
CREATE TABLE train_seats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    train_id INT NOT NULL,
    class_id INT NOT NULL,
    total_seats INT NOT NULL,
    available_seats INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (train_id) REFERENCES trains(id),
    FOREIGN KEY (class_id) REFERENCES train_classes(id)
);

-- Create passenger_types table
CREATE TABLE passenger_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    price_multiplier DECIMAL(3,2) DEFAULT 1.00
);

-- Create bookings table
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_number VARCHAR(20) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    train_id INT NOT NULL,
    class_id INT NOT NULL,
    booking_date DATE NOT NULL,
    journey_date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (train_id) REFERENCES trains(id),
    FOREIGN KEY (class_id) REFERENCES train_classes(id)
);

-- Create booking_passengers table
CREATE TABLE booking_passengers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    passenger_name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    gender ENUM('M', 'F', 'Other') NOT NULL,
    passenger_type_id INT NOT NULL,
    seat_number VARCHAR(10),
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    FOREIGN KEY (passenger_type_id) REFERENCES passenger_types(id)
);

-- Create payment_details table
CREATE TABLE payment_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('credit_card', 'debit_card', 'net_banking', 'upi', 'cash') NOT NULL,
    transaction_id VARCHAR(100),
    payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- Insert sample data for train categories
INSERT INTO train_categories (name, description, base_price_multiplier) VALUES
('Express', 'Fast trains with limited stops', 1.20),
('Superfast', 'Very fast trains with minimal stops', 1.40),
('Rajdhani', 'Premium express trains', 1.60),
('Shatabdi', 'High-speed day trains', 1.50),
('Duronto', 'Non-stop express trains', 1.30),
('Local', 'Regular trains with all stops', 1.00);

-- Insert sample data for train classes
INSERT INTO train_classes (name, description, price_multiplier) VALUES
('First Class AC', 'Luxury air-conditioned compartment', 3.00),
('Second Class AC', 'Air-conditioned compartment', 2.50),
('Third Class AC', 'Air-conditioned compartment with more seats', 2.00),
('Sleeper Class', 'Non-AC compartment with sleeping berths', 1.50),
('General', 'Regular seating arrangement', 1.00);

-- Insert sample data for passenger types
INSERT INTO passenger_types (name, description, price_multiplier) VALUES
('Adult', 'Regular adult passenger', 1.00),
('Child (5-12)', 'Child between 5 and 12 years', 0.50),
('Senior Citizen', 'Passenger above 60 years', 0.80),
('Student', 'Student with valid ID', 0.75),
('Infant', 'Child below 5 years', 0.00);

-- Insert sample trains
INSERT INTO trains (train_number, name, category_id, from_station, to_station, departure_time, arrival_time, duration) VALUES
('12301', 'Rajdhani Express', 3, 'Mumbai', 'Delhi', '08:00:00', '16:00:00', '8h'),
('12302', 'Shatabdi Express', 4, 'Delhi', 'Agra', '06:00:00', '08:00:00', '2h'),
('12303', 'Duronto Express', 5, 'Bangalore', 'Chennai', '10:00:00', '14:00:00', '4h'),
('12304', 'Garib Rath', 1, 'Kolkata', 'Patna', '07:00:00', '12:00:00', '5h'),
('12305', 'Tejas Express', 2, 'Mumbai', 'Ahmedabad', '09:00:00', '15:00:00', '6h'),
('12306', 'Konkan Kanya Express', 1, 'Mumbai', 'Goa', '11:00:00', '19:00:00', '8h'),
('12307', 'Deccan Queen', 6, 'Mumbai', 'Pune', '07:15:00', '10:30:00', '3h'),
('12308', 'Gatimaan Express', 2, 'Delhi', 'Agra', '08:10:00', '09:50:00', '1h 40m'),
('12309', 'Vande Bharat Express', 3, 'Delhi', 'Varanasi', '06:00:00', '14:00:00', '8h'),
('12310', 'Humsafar Express', 1, 'Delhi', 'Kolkata', '20:00:00', '08:00:00', '12h'),
('12311', 'Mumbai Rajdhani', 3, 'Mumbai', 'Delhi', '17:00:00', '09:00:00', '16h'),
('12312', 'Karnataka Express', 1, 'Delhi', 'Bangalore', '19:00:00', '10:00:00', '15h'),
('12313', 'Chennai Express', 1, 'Delhi', 'Chennai', '20:00:00', '12:00:00', '16h'),
('12314', 'Howrah Rajdhani', 3, 'Delhi', 'Kolkata', '16:50:00', '09:00:00', '16h'),
('12315', 'August Kranti Rajdhani', 3, 'Mumbai', 'Delhi', '17:00:00', '09:00:00', '16h'),
('12316', 'Sealdah Rajdhani', 3, 'Delhi', 'Kolkata', '17:00:00', '09:00:00', '16h'),
('12317', 'Bhopal Shatabdi', 4, 'Delhi', 'Bhopal', '06:00:00', '12:00:00', '6h'),
('12318', 'Kalka Shatabdi', 4, 'Delhi', 'Kalka', '07:40:00', '11:45:00', '4h'),
('12319', 'Amritsar Shatabdi', 4, 'Delhi', 'Amritsar', '07:20:00', '13:20:00', '6h'),
('12320', 'Lucknow Shatabdi', 4, 'Delhi', 'Lucknow', '06:00:00', '12:00:00', '6h'),
('12321', 'Mumbai Duronto', 5, 'Delhi', 'Mumbai', '22:00:00', '10:00:00', '12h'),
('12322', 'Ahmedabad Duronto', 5, 'Mumbai', 'Ahmedabad', '23:00:00', '05:00:00', '6h'),
('12323', 'Pune Duronto', 5, 'Delhi', 'Pune', '22:00:00', '11:00:00', '13h'),
('12324', 'Jaipur Duronto', 5, 'Delhi', 'Jaipur', '22:30:00', '05:00:00', '6h'),
('12325', 'Mumbai Superfast', 2, 'Delhi', 'Mumbai', '21:00:00', '11:00:00', '14h'),
('12326', 'Chennai Superfast', 2, 'Delhi', 'Chennai', '20:00:00', '14:00:00', '18h'),
('12327', 'Kolkata Superfast', 2, 'Delhi', 'Kolkata', '19:00:00', '11:00:00', '16h'),
('12328', 'Bangalore Superfast', 2, 'Delhi', 'Bangalore', '20:00:00', '15:00:00', '19h'),
('12329', 'Mumbai Local', 6, 'Thane', 'Mumbai', '08:00:00', '09:00:00', '1h'),
('12330', 'Delhi Local', 6, 'Noida', 'Delhi', '09:00:00', '10:00:00', '1h');

-- Insert sample train seats
INSERT INTO train_seats (train_id, class_id, total_seats, available_seats, price) VALUES
(1, 1, 20, 20, 2500.00),
(1, 2, 40, 40, 2000.00),
(1, 3, 60, 60, 1500.00),
(2, 4, 100, 100, 800.00),
(3, 2, 40, 40, 1200.00);

-- Insert sample user (password: test123)
INSERT INTO users (username, email, password, full_name, phone_number) VALUES
('testuser', 'test@example.com', '$2a$10$YourHashedPasswordHere', 'Test User', '9876543210'); 