require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Strictly check for userId
        if (!decoded || !decoded.userId) {
            console.error('Invalid token structure:', decoded);
            return res.status(403).json({ error: 'Invalid token format' });
        }
        
        // Set user info in request
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Token verification error:', error.message);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token has expired' });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({ error: 'Invalid token' });
        }
        
        return res.status(403).json({ error: 'Authentication failed' });
    }
};

// Create MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test database connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Successfully connected to the database');
    connection.release();
});

// Get all stations
app.get('/api/stations', async (req, res) => {
    let connection;
    try {
        console.log('Fetching stations...');
        connection = await pool.promise().getConnection();
        
        // First check if trains table exists
        const [tables] = await connection.query('SHOW TABLES LIKE "trains"');
        console.log('Tables check result:', tables);
        
        if (tables.length === 0) {
            console.log('Trains table does not exist');
            return res.status(500).json({ error: 'Database not properly initialized' });
        }

        // Get unique stations from trains table
        const [stations] = await connection.query(`
            SELECT DISTINCT from_station as station FROM trains
            UNION
            SELECT DISTINCT to_station as station FROM trains
            ORDER BY station
        `);
        
        console.log('Found stations:', stations);
        
        if (stations.length === 0) {
            return res.status(404).json({ error: 'No stations found' });
        }
        
        res.json(stations);
    } catch (error) {
        console.error('Error fetching stations:', error);
        res.status(500).json({ 
            error: 'Failed to fetch stations',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        if (connection) connection.release();
    }
});

// User registration
app.post('/api/register', async (req, res) => {
    let connection;
    try {
        const { username, email, password, full_name, phone_number } = req.body;
        
        // Validate required fields
        if (!username || !email || !password || !full_name || !phone_number) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        connection = await pool.promise().getConnection();

        // Check if username or email already exists
        const [existingUsers] = await connection.query(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        const [result] = await connection.query(
            'INSERT INTO users (username, email, password, full_name, phone_number) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, full_name, phone_number]
        );

        res.status(201).json({
            message: 'User registered successfully',
            userId: result.insertId
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to register user' });
    } finally {
        if (connection) connection.release();
    }
});

// Login user
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const [users] = await pool.promise().query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Create token with consistent structure
        const token = jwt.sign(
            { 
                userId: user.id,  // Always use userId
                username: user.username,
                full_name: user.full_name,
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// Search trains
app.post('/api/search-trains', async (req, res) => {
    let connection;
    try {
        const { from_station, to_station, journey_date, class_id } = req.body;

        if (!from_station || !to_station || !journey_date || !class_id) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Validate journey date
        const selectedDate = new Date(journey_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            return res.status(400).json({ error: 'Journey date cannot be in the past' });
        }

        connection = await pool.promise().getConnection();

        const [trains] = await connection.query(`
            SELECT 
                t.*,
                ts.total_seats,
                ts.available_seats,
                ts.price,
                tc.name as class_name
            FROM trains t
            JOIN train_seats ts ON t.id = ts.train_id
            JOIN train_classes tc ON ts.class_id = tc.id
            WHERE t.from_station = ? 
            AND t.to_station = ?
            AND ts.class_id = ?
            AND ts.available_seats > 0
            ORDER BY t.departure_time
        `, [from_station, to_station, class_id]);

        if (trains.length === 0) {
            return res.status(404).json({ error: 'No trains found for the selected criteria' });
        }

        res.json(trains);
    } catch (error) {
        console.error('Search trains error:', error);
        res.status(500).json({ error: 'Failed to search trains' });
    } finally {
        if (connection) connection.release();
    }
});

// Book train
app.post('/api/bookings', authenticateToken, async (req, res) => {
    let connection;
    try {
        const { train_id, class_id, journey_date, passenger_name, passenger_age, passenger_gender } = req.body;
        const user_id = req.user.userId;

        if (!user_id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        if (!train_id || !class_id || !journey_date || !passenger_name || !passenger_age || !passenger_gender) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        connection = await pool.promise().getConnection();
        
        // First check seat availability and get price
        const [seats] = await connection.query(
            'SELECT available_seats, price FROM train_seats WHERE train_id = ? AND class_id = ?',
            [train_id, class_id]
        );

        if (seats.length === 0 || seats[0].available_seats <= 0) {
            return res.status(400).json({ error: 'No seats available for this train and class' });
        }

        // Start transaction
        await connection.beginTransaction();

        try {
            // Generate booking number first
            const booking_number = `BK${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
            
            // Get current date for booking_date
            const booking_date = new Date().toISOString().split('T')[0];
            
            // Get total amount from train_seats
            const total_amount = seats[0].price;

            // Create booking with all required fields
            const [bookingResult] = await connection.query(
                'INSERT INTO bookings (user_id, train_id, class_id, journey_date, status, booking_number, booking_date, total_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [user_id, train_id, class_id, journey_date, 'confirmed', booking_number, booking_date, total_amount]
            );

            const booking_id = bookingResult.insertId;

            // Add passenger - using the correct table structure
            await connection.query(
                'INSERT INTO booking_passengers (booking_id, passenger_name, age, gender, passenger_type_id) VALUES (?, ?, ?, ?, ?)',
                [booking_id, passenger_name, passenger_age, passenger_gender, 1] // Using 1 as default passenger_type_id
            );

            // Update available seats
            await connection.query(
                'UPDATE train_seats SET available_seats = available_seats - 1 WHERE train_id = ? AND class_id = ?',
                [train_id, class_id]
            );

            // Commit transaction
            await connection.commit();

            res.json({
                message: 'Booking successful',
                booking_id,
                booking_number
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({ error: 'Failed to create booking' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// Get user bookings
app.get('/api/bookings/:userId', async (req, res) => {
    let connection;
    try {
        const { userId } = req.params;
        connection = await pool.promise().getConnection();

        const [bookings] = await connection.query(`
            SELECT 
                b.*,
                t.name as train_name,
                t.train_number,
                t.from_station,
                t.to_station,
                t.departure_time,
                t.arrival_time,
                tc.name as class_name,
                ts.price
            FROM bookings b
            JOIN trains t ON b.train_id = t.id
            JOIN train_classes tc ON b.class_id = tc.id
            JOIN train_seats ts ON t.id = ts.train_id AND b.class_id = ts.class_id
            WHERE b.user_id = ?
            ORDER BY b.journey_date DESC
        `, [userId]);

        res.json(bookings);
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    } finally {
        if (connection) connection.release();
    }
});

// Get booking details by ID
app.get('/api/booking-details/:id', async (req, res) => {
    let connection;
    try {
        const bookingId = req.params.id;
        
        connection = await pool.promise().getConnection();
        
        // Get booking details with train and class information
        const [bookings] = await connection.query(`
            SELECT 
                b.id, b.booking_number, b.booking_date, b.journey_date, b.status, b.total_amount,
                t.name as train_name, t.train_number, t.from_station, t.to_station, t.departure_time, t.arrival_time,
                tc.name as class_name,
                bp.passenger_name, bp.age as passenger_age, bp.gender as passenger_gender, bp.seat_number
            FROM 
                bookings b
            JOIN 
                trains t ON b.train_id = t.id
            JOIN 
                train_classes tc ON b.class_id = tc.id
            JOIN 
                booking_passengers bp ON b.id = bp.booking_id
            WHERE 
                b.id = ?
        `, [bookingId]);
        
        if (bookings.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        res.json(bookings[0]);
    } catch (error) {
        console.error('Error fetching booking details:', error);
        res.status(500).json({ error: 'Failed to fetch booking details' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// Get booking details by booking number
app.get('/api/booking-details/number/:bookingNumber', async (req, res) => {
    let connection;
    try {
        const bookingNumber = req.params.bookingNumber;
        
        connection = await pool.promise().getConnection();
        
        // Get booking details with train and class information
        const [bookings] = await connection.query(`
            SELECT 
                b.id, b.booking_number, b.booking_date, b.journey_date, b.status, b.total_amount,
                t.name as train_name, t.train_number, t.from_station, t.to_station, t.departure_time, t.arrival_time,
                tc.name as class_name,
                bp.passenger_name, bp.age as passenger_age, bp.gender as passenger_gender, bp.seat_number
            FROM 
                bookings b
            JOIN 
                trains t ON b.train_id = t.id
            JOIN 
                train_classes tc ON b.class_id = tc.id
            JOIN 
                booking_passengers bp ON b.id = bp.booking_id
            WHERE 
                b.booking_number = ?
        `, [bookingNumber]);
        
        if (bookings.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        res.json(bookings[0]);
    } catch (error) {
        console.error('Error fetching booking details:', error);
        res.status(500).json({ error: 'Failed to fetch booking details' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Available routes:');
    console.log(`- http://localhost:${PORT}/login.html`);
    console.log(`- http://localhost:${PORT}/signup.html`);
    console.log(`- http://localhost:${PORT}/booking.html`);
}); 