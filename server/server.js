const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const User = require('./models/Users'); // Import the User model
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Use express.json() instead of body-parser

// Sample route
app.get('/', (req, res) => {
    res.send('Welcome to the API!');
});

// Signup route
app.post('/api/signup', async (req, res) => {
    console.log(req.body); 
    const { email, password } = req.body;

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser  = new User({ email, password: hashedPassword });
        await newUser .save();
        res.status(201).json({ message: 'User  created successfully!' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Email already exists.' });
        }
        res.status(400).json({ error: 'Error creating user: ' + error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});