const serverless = require('serverless-http');
const express = require('express');
const mysql = require('mysql2');

const app = express();

// Add middleware to parse JSON bodies
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Or restrict to your frontend domain
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// MySQL connection
const db = mysql.createPool({
  host: "database-1.clk2kak2yxlo.eu-west-1.rds.amazonaws.com",
  user: "admin",
  password: "Hupes_123",
  database: "Hupes_Database"
});

// Test connection
db.getConnection((err, conn) => {
  if (err) {
    console.error('DB connection failed:', err);
    return;
  }
  console.log('DB connected successfully');
  conn.release();
});

// Example root route
app.get('/', (req, res) => {
  res.json({ message: 'Hello from Express + AWS Lambda!' });
});

// Adjusted GET /dev/api/goods-in route to include stage prefix 'dev'
app.get("/dev/api/goods-in", async (req, res) => {
  const { cognito_id } = req.query; // Get cognito_id from query parameters

  if (!cognito_id) {
    return res.status(400).json({ error: "cognito_id is required" });
  }

  try {
    const query = "SELECT * FROM goods_in WHERE user_id = ?";
    const [results] = await db.promise().query(query, [cognito_id]);
    res.json(results);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Catch-all for any other GET routes
app.use((req, res, next) => {
  if (req.method === 'GET') {
    res.json({ message: 'Catch-all route for GET requests' });
  } else {
    next();
  }
});

// 404 handler for everything else
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Export Lambda handler
module.exports.handler = serverless(app);
