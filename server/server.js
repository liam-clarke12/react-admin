const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Use express.json() to parse JSON bodies

// Sample route
app.get('/', (req, res) => {
    res.send('Welcome to the API!');
});

// In-memory user storage (for demonstration purposes)
const users = [];

// Signup route with validation
app.post('/api/signup', [
    body('email').isEmail().withMessage('Please enter a valid email address.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.')
], async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        // Check if password is provided
        if (!password) {
            return res.status(400).json({ error: 'Password is required.' });
        }

        // Check if the email already exists
        const existingUser  = users.find(user => user.email === email);
        if (existingUser ) {
            return res.status(409).json({ error: 'Email already exists.' });
        }

        // Generate salt and hash the password
        const salt = await bcrypt.genSalt(10); // Generate a salt
        const hashedPassword = await bcrypt.hash(password, salt); // Hash the password with the salt

        // Simulate saving the user in memory
        users.push({ email, password: hashedPassword });

        res.status(201).json({ message: 'User  created successfully!' });
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).json({ error: 'Error creating user: ' + error.message });
    }
});

app.get('/api/users', (req, res) => {
    res.json(users); // Assuming 'users' is an array of user objects
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});