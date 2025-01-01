const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
require('dotenv').config();
const AWS = require('aws-sdk'); // Import AWS SDK

// Configure AWS
AWS.config.update({
    region: process.env.AWS_REGION || 'eu-west-1', // Set your AWS region
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Your AWS access key
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY // Your AWS secret key
});

const dynamoDB = new AWS.DynamoDB.DocumentClient(); // Initialize DynamoDB client

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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        // Check if the email already exists in DynamoDB
        const params = {
            TableName: 'Users',
            Key: { email }
        };
        const existingUser = await dynamoDB.get(params).promise();

        if (existingUser.Item) {
            return res.status(409).json({ error: 'Email already exists.' });
        }

        // Generate salt and hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Save the user to DynamoDB
        const putParams = {
            TableName: 'Users',
            Item: {
                email,
                password: hashedPassword,
                createdAt: new Date().toISOString()
            }
        };
        await dynamoDB.put(putParams).promise();

        res.status(201).json({ message: 'User created successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating user: ' + error.message });
    }
});


app.get('/api/users', async (req, res) => {
    try {
        const params = {
            TableName: 'Users'
        };

        const data = await dynamoDB.scan(params).promise();
        res.json(data.Items);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error retrieving users: ' + error.message });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});