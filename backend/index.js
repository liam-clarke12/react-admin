const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Create a MySQL connection pool
const db = mysql.createPool({
  host: "database-1.clk2kak2yxlo.eu-west-1.rds.amazonaws.com",
  user: "admin",
  password: "Hupes_123",
  database: "Hupes_Database",
  waitForConnections: true,
  connectionLimit: 10, // Allows up to 10 simultaneous connections
  queueLimit: 0,       // No limit on queued requests
});

// Ensure the database is connected
db.getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    process.exit(1);
  }
  console.log("Connected to MySQL database");
  connection.release(); // Release connection after testing
});

// Fetch all goods_in data
app.get("/api/goods-in", async (req, res) => {
  const { cognito_id } = req.query; // Get cognito_id from query parameters

  // Log the incoming request
  console.log("Received /api/goods-in request with query:", req.query);

  // Ensure cognito_id is provided
  if (!cognito_id) {
    console.error("Missing cognito_id in request:", req.query);
    return res.status(400).json({ error: "cognito_id is required" });
  }

  console.log("Cognito ID provided:", cognito_id);

  try {
    // Log the SQL query before execution
    console.log("Executing query to fetch goods_in data filtered by user_id (cognito_id):");
    const query = "SELECT * FROM goods_in WHERE user_id = ?";
    console.log("SQL Query:", query);
    console.log("Query Parameters:", [cognito_id]);

    // Query goods_in table filtered by user_id (cognito_id)
    const [results] = await db.promise().query(query, [cognito_id]);

    // Log the results of the query
    console.log("Query successful. Results fetched:", results);

    res.json(results);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Update a row in goods_in
app.post("/api/update-row", async (req, res) => {
  const { id, stockReceived, stockRemaining, expiryDate, processed, cognito_id } = req.body;

  if (!cognito_id) {
    console.error("Missing cognito_id in request body:", req.body);
    return res.status(400).json({ error: "cognito_id is required" });
  }

  try {
    await db
      .promise()
      .query(
        "UPDATE goods_in SET stockReceived = ?, stockRemaining = ?, expiryDate = ?, processed = ? WHERE id = ? AND user_id = ?",
        [stockReceived, stockRemaining, expiryDate, processed, id, cognito_id]
      );
    res.json({ message: "Row updated successfully" });
  } catch (err) {
    console.error("Failed to update row:", err);
    res.status(500).json({ error: "Failed to update row" });
  }
});

app.post("/api/delete-row", async (req, res) => {
  const { id, cognito_id } = req.body;

  if (!id || !cognito_id) {
    return res.status(400).json({ error: "id and cognito_id are required" });
  }

  try {
    const [result] = await db
      .promise()
      .query("DELETE FROM goods_in WHERE id = ? AND user_id = ?", [id, cognito_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Row not found or does not belong to the user" });
    }

    res.json({ message: "Row deleted successfully" });
  } catch (err) {
    console.error("Failed to delete row:", err);
    res.status(500).json({ error: "Failed to delete row" });
  }
});

// Insert into goods_in and update ingredient_inventory
app.post("/submit", async (req, res) => {
  const { date, ingredient, stockReceived, barCode, expiryDate, Temperature, cognito_id } = req.body;

  // Log the incoming request data
  console.log("Received /submit request with:", req.body);

  if (!date || !ingredient || !stockReceived || !barCode || !expiryDate || !Temperature || !cognito_id) {
    console.error("Missing fields in request:", req.body);
    return res.status(400).json({ error: "All fields are required, including cognito_id" });
  }

  const connection = await db.promise().getConnection();
  try {
    console.log("Starting database transaction...");

    await connection.beginTransaction();

    // Log before inserting into goods_in
    console.log("Inserting into goods_in with the following data:");
    console.log({
      date,
      ingredient,
      stockReceived,
      stockRemaining: stockReceived, // Assuming stockRemaining equals stockReceived initially
      barCode,
      expiryDate,
      Temperature,
      user_id: cognito_id, // Store cognito_id directly in user_id
    });

    // Insert into goods_in with cognito_id directly in user_id column (no need to check users table)
    const goodsInQuery = `
      INSERT INTO goods_in (date, ingredient, stockReceived, stockRemaining, barCode, expiryDate, temperature, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [goodsInResult] = await connection.execute(goodsInQuery, [
      date,
      ingredient,
      stockReceived,
      stockReceived, // Assuming stockRemaining equals stockReceived initially
      barCode,
      expiryDate,
      Temperature,
      cognito_id, // Store cognito_id directly in user_id
    ]);

    console.log("Successfully inserted into goods_in. Inserted ID:", goodsInResult.insertId);

    // Log before inserting into ingredient_inventory
    console.log("Inserting into ingredient_inventory with the following data:");
    console.log({
      ingredient,
      amount: stockReceived,
      barcode: barCode,
    });

    // Insert into ingredient_inventory (or update if exists)
    const ingredientInventoryQuery = `
      INSERT INTO ingredient_inventory (ingredient, amount, barcode)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE amount = amount + ?
    `;
    await connection.execute(ingredientInventoryQuery, [ingredient, stockReceived, barCode, stockReceived]);

    console.log("Successfully inserted/updated ingredient_inventory.");

    // Commit transaction and log success
    await connection.commit();
    console.log("Transaction committed successfully.");
    
    res.status(200).json({ message: "Data saved successfully", id: goodsInResult.insertId });
  } catch (err) {
    await connection.rollback();
    console.error("Error processing transaction:", err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
    console.log("Connection released.");
  }
});

// **New API Endpoint to Add a Recipe**
app.post("/api/add-recipe", async (req, res) => {
  const { recipe, upb, ingredients, quantities, cognito_id } = req.body;

  if (!recipe || !upb || !ingredients || !quantities || ingredients.length !== quantities.length || !cognito_id) {
    return res.status(400).json({ error: "Invalid input data" });
  }

  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();

    // ✅ Insert into recipes table (now includes user_id)
    const [recipeResult] = await connection.execute(
      "INSERT INTO recipes (recipe_name, units_per_batch, user_id) VALUES (?, ?, ?)", 
      [recipe, upb, cognito_id]
    );
    const recipeId = recipeResult.insertId;

    for (let i = 0; i < ingredients.length; i++) {
      let ingredientName = ingredients[i];
      let quantity = quantities[i];

      // ✅ Check if ingredient exists
      const [ingredientRows] = await connection.execute(
        "SELECT id FROM ingredients WHERE ingredient_name = ? AND user_id = ?", 
        [ingredientName, cognito_id]
      );

      let ingredientId;
      if (ingredientRows.length > 0) {
        ingredientId = ingredientRows[0].id;
      } else {
        // ✅ Insert new ingredient (includes user_id)
        const [ingredientResult] = await connection.execute(
          "INSERT INTO ingredients (ingredient_name, user_id) VALUES (?, ?)", 
          [ingredientName, cognito_id]
        );
        ingredientId = ingredientResult.insertId;
      }

      // ✅ Insert into recipe_ingredients table (includes user_id)
      await connection.execute(
        "INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, user_id) VALUES (?, ?, ?, ?)", 
        [recipeId, ingredientId, quantity, cognito_id]
      );
    }

    await connection.commit();
    res.status(200).json({ message: "Recipe added successfully!" });
  } catch (error) {
    await connection.rollback();
    console.error("Error adding recipe:", error);
    res.status(500).json({ error: "Database transaction failed" });
  } finally {
    connection.release();
  }
});

// **Fetch all recipes**
app.get("/api/recipes", async (req, res) => {
  const { cognito_id } = req.query;

  if (!cognito_id) {
    console.error("Missing cognito_id in request query:", req.query);
    return res.status(400).json({ error: "cognito_id is required" });
  }

  try {
    const [results] = await db.promise().query(`
      SELECT r.id as recipe_id, r.recipe_name as recipe, r.units_per_batch, i.ingredient_name as ingredient, ri.quantity
      FROM recipes r
      JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE r.user_id = ?
    `, [cognito_id]);

    res.json(results);
  } catch (err) {
    console.error("Failed to fetch recipes:", err);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

// **Add user to the database**
app.post('/api/add-user', async (req, res) => {
  try {
    const { cognito_id, email } = req.body;
    console.log("Received request at /api/add-user", req.body);

    if (!cognito_id || !email) {
      console.error("Missing fields:", { cognito_id, email });
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if the email already exists in the database
    const [existingUser] = await db
      .promise()
      .query("SELECT * FROM users WHERE email = ?", [email]);

    if (existingUser.length > 0) {
      console.log("User already exists with email:", email);
      return res.status(200).json({ message: "User already exists!" });
    }

    // Insert new user if it doesn't already exist
    const [result] = await db
      .promise()
      .query("INSERT INTO users (cognito_id, email) VALUES (?, ?)", [
        cognito_id,
        email,
      ]);

    console.log("User inserted:", result);
    res.status(200).json({ message: "User added successfully!" });
  } catch (error) {
    console.error("Error while adding user:", error);
    res.status(500).json({ message: "Error registering user", error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});