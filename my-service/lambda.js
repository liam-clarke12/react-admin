const serverless = require('serverless-http');
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require("body-parser");


const app = express();

// Add middleware to parse JSON bodies
app.use(express.json());
app.use(bodyParser.json()); // <-- Required
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
  if (Buffer.isBuffer(req.body)) {
    try {
      req.body = JSON.parse(req.body.toString('utf-8'));
    } catch (e) {
      console.error('Failed to parse body buffer:', e);
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  }
  next();
});

const cors = require('cors');

// Option 1: Use cors package with specific config
app.use(cors({
  origin: 'https://master.d2fdrxobxyr2je.amplifyapp.com', // your frontend
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Option 2: Or if you prefer manual headers (not needed if using cors above)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://master.d2fdrxobxyr2je.amplifyapp.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight OPTIONS request');
    return res.sendStatus(204);
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

app.post("/dev/api/delete-row", async (req, res) => {
  const { barCode, cognito_id } = req.body; // Use barCode instead of id

  if (!barCode || !cognito_id) {
    return res.status(400).json({ error: "barCode and cognito_id are required" });
  }

  try {
    const [result] = await db
      .promise()
      .query("DELETE FROM goods_in WHERE barCode = ? AND user_id = ?", [barCode, cognito_id]); // Match barCode and cognito_id

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
app.post("/dev/api/submit", async (req, res) => {
  const { date, ingredient, stockReceived, barCode, expiryDate, temperature, cognito_id } = req.body;

  // Log the incoming request data
  console.log("Received /submit request with:", req.body);

  if (!date || !ingredient || !stockReceived || !barCode || !expiryDate || !temperature || !cognito_id) {
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
      temperature,
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
      temperature,
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
app.post("/dev/api/add-recipe", async (req, res) => {
  console.log("Received request body:", req.body);

  const { recipe, upb, ingredients, quantities, cognito_id } = req.body;

  if (!recipe || !upb || !ingredients || !quantities || ingredients.length !== quantities.length || !cognito_id) {
    console.error("Invalid input data:", {
      recipe,
      upb,
      ingredients,
      quantities,
      cognito_id
    });
    return res.status(400).json({ error: "Invalid input data" });
  }

  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();
    console.log("Transaction started");

    // ✅ Insert into recipes table
    const [recipeResult] = await connection.execute(
      "INSERT INTO recipes (recipe_name, units_per_batch, user_id) VALUES (?, ?, ?)",
      [recipe, upb, cognito_id]
    );
    const recipeId = recipeResult.insertId;
    console.log("Inserted recipe with ID:", recipeId);

    for (let i = 0; i < ingredients.length; i++) {
      let ingredientName = ingredients[i];
      let quantity = quantities[i];
      console.log(`Processing ingredient: ${ingredientName} (Quantity: ${quantity})`);

      // ✅ Check if ingredient exists
      const [ingredientRows] = await connection.execute(
        "SELECT id FROM ingredients WHERE ingredient_name = ? AND user_id = ?",
        [ingredientName, cognito_id]
      );

      let ingredientId;
      if (ingredientRows.length > 0) {
        ingredientId = ingredientRows[0].id;
        console.log(`Found existing ingredient "${ingredientName}" with ID:`, ingredientId);
      } else {
        // ✅ Insert new ingredient
        const [ingredientResult] = await connection.execute(
          "INSERT INTO ingredients (ingredient_name, user_id) VALUES (?, ?)",
          [ingredientName, cognito_id]
        );
        ingredientId = ingredientResult.insertId;
        console.log(`Inserted new ingredient "${ingredientName}" with ID:`, ingredientId);
      }

      // ✅ Insert into recipe_ingredients
      await connection.execute(
        "INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, user_id) VALUES (?, ?, ?, ?)",
        [recipeId, ingredientId, quantity, cognito_id]
      );
      console.log(`Linked ingredient ID ${ingredientId} to recipe ID ${recipeId}`);
    }

    await connection.commit();
    console.log("Transaction committed successfully");
    res.status(200).json({ message: "Recipe added successfully!" });
  } catch (error) {
    await connection.rollback();
    console.error("Error adding recipe, transaction rolled back:", error);
    res.status(500).json({ error: "Database transaction failed", details: error.message });
  } finally {
    connection.release();
    console.log("Database connection released");
  }
});


// **Fetch all recipes**
app.get("/dev/api/recipes", async (req, res) => {
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

// **Delete Recipe by Name**
app.delete("/dev/api/delete-recipe", async (req, res) => {
  const { recipeName, cognito_id } = req.body;

  // Validate input
  if (!recipeName || !cognito_id) {
    return res.status(400).json({ error: "recipeName and cognito_id are required" });
  }

  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();

    // Log the incoming request data
    console.log("Received delete-recipe request:", { recipeName, cognito_id });

    // Check if the recipe exists and belongs to the user
    const [recipeCheck] = await connection.execute(
      "SELECT id FROM recipes WHERE recipe_name = ? AND user_id = ?",
      [recipeName, cognito_id]
    );

    if (recipeCheck.length === 0) {
      return res.status(404).json({ error: "Recipe not found or does not belong to this user" });
    }

    const recipeId = recipeCheck[0].id;

    // Delete associated records from recipe_ingredients table
    await connection.execute(
      "DELETE FROM recipe_ingredients WHERE recipe_id = ?",
      [recipeId]
    );

    // Delete the recipe itself
    await connection.execute(
      "DELETE FROM recipes WHERE id = ? AND user_id = ?",
      [recipeId, cognito_id]
    );

    // Commit the transaction
    await connection.commit();
    res.status(200).json({ message: "Recipe deleted successfully" });
  } catch (err) {
    await connection.rollback();
    console.error("Error deleting recipe:", err);
    res.status(500).json({ error: "Error deleting recipe" });
  } finally {
    connection.release();
  }
});

// Endpoint to fetch unique recipe names for a given cognito_id
app.get('/dev/get-recipes', (req, res) => {
  const { cognito_id } = req.query;  // Extract cognito_id from query parameters
  const query = `
    SELECT DISTINCT recipe_name
    FROM recipes
    WHERE user_id = ?;
  `;
  
  db.query(query, [cognito_id], (error, results) => {  // Use cognito_id from query parameters
    if (error) {
      return res.status(500).json({ message: 'Error fetching recipes', error });
    }
    res.json(results); // Send back the recipe names
  });
});

// **Add user to the database**
app.post('/dev/api/add-user', async (req, res) => {
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

app.post("/dev/add-production-log", async (req, res) => {
  const { date, recipe, batchesProduced, batchCode, cognito_id } = req.body;

  console.log("Received /add-production-log request with:", req.body);

  // Validate input fields
  if (!date || !recipe || !batchesProduced || !batchCode || !cognito_id) {
    console.error("Missing fields in request:", req.body);
    return res.status(400).json({ error: "All fields are required, including cognito_id" });
  }

  const connection = await db.promise().getConnection();
  try {
    console.log("Starting database transaction...");
    await connection.beginTransaction();

    // Insert into production_log table
    const productionLogQuery = `
      INSERT INTO production_log (date, recipe, batchesProduced, batchRemaining, batchCode, user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [productionLogResult] = await connection.execute(productionLogQuery, [
      date,
      recipe,
      batchesProduced,
      batchesProduced,  // Assuming batchRemaining is the same as batchesProduced initially
      batchCode,
      cognito_id,
    ]);

    console.log("Inserted into production_log. ID:", productionLogResult.insertId);

    // Retrieve recipe ID from recipe name
    const [recipeRows] = await connection.execute(
      `SELECT id FROM recipes WHERE recipe_name = ?`,
      [recipe]
    );

    if (recipeRows.length === 0) {
      console.error(`Recipe not found: ${recipe}`);
      return res.status(400).json({ error: "Recipe not found" });
    }

    const recipeId = recipeRows[0].id;
    console.log(`Recipe ID for "${recipe}": ${recipeId}`);

    // Retrieve ingredients for the recipe
    const ingredientsQuery = `
      SELECT i.id AS ingredient_id, i.ingredient_name, ri.quantity * ? AS total_needed
      FROM recipe_ingredients ri
      JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE ri.recipe_id = ?
    `;
    const [ingredients] = await connection.execute(ingredientsQuery, [
      batchesProduced,
      recipeId,
    ]);

    console.log("Ingredients required for the recipe:", ingredients);

    if (ingredients.length === 0) {
      console.error("No ingredients found for recipe ID:", recipeId);
      return res.status(400).json({ error: "No ingredients found for this recipe" });
    }

    // Deduct stock from goods_in and track barcodes
    console.log("Starting stock deduction from goods_in...");
    for (const ingredient of ingredients) {
      let amountNeeded = ingredient.total_needed;
      console.log(`Processing ingredient: ${ingredient.ingredient_name} with total needed: ${amountNeeded}`);

      while (amountNeeded > 0) {
        // Query to match ingredient name in goods_in
        const [stockRows] = await connection.execute(
          `SELECT gi.id, gi.stockRemaining, gi.barCode
           FROM goods_in gi
           WHERE gi.ingredient = ? AND gi.stockRemaining > 0
           ORDER BY gi.id ASC LIMIT 1`,
          [ingredient.ingredient_name]  // Use ingredient_name to find the correct stock entry
        );

        console.log("Stock rows retrieved:", stockRows);

        if (stockRows.length === 0) {
          console.warn(`Not enough stock for ingredient ${ingredient.ingredient_name}. Needed ${amountNeeded}.`);
          break;  // Exit the while loop if there's not enough stock
        }

        const { id: goodsInId, stockRemaining, barCode } = stockRows[0]; // Get the ID of the stock entry
        const deduction = Math.min(amountNeeded, stockRemaining);
        console.log(`Deducting ${deduction} units from stock (ID: ${goodsInId}).`);

        // Deduct stock
        await connection.execute(
          `UPDATE goods_in SET stockRemaining = stockRemaining - ? WHERE id = ?`,
          [deduction, goodsInId]  // Deduct from the specific goods_in entry
        );

        // Insert stock usage record
        await connection.execute(
          `INSERT INTO stock_usage (production_log_id, goods_in_id, user_id)
           VALUES (?, ?, ?)`,
          [productionLogResult.insertId, goodsInId, cognito_id]
        );

        amountNeeded -= deduction;  // Reduce the amount needed by the deduction
      }
    }

    await connection.commit();
    res.status(200).json({ message: "Production log saved successfully", id: productionLogResult.insertId });
  } catch (err) {
    await connection.rollback();
    console.error("Error processing transaction:", err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

app.get("/dev/api/production-log", async (req, res) => {
  const { cognito_id } = req.query; // Get cognito_id from query parameters

  // Log the incoming request
  console.log("Received /api/production-log request with query:", req.query);

  // Ensure cognito_id is provided
  if (!cognito_id) {
    console.error("Missing cognito_id in request:", req.query);
    return res.status(400).json({ error: "cognito_id is required" });
  }

  console.log("Cognito ID provided:", cognito_id);

  try {
    // Log the SQL query before execution
    console.log("Executing query to fetch production_log data filtered by user_id (cognito_id):");
    const query = "SELECT * FROM production_log WHERE user_id = ?";
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

app.post("/dev/api/delete-production-log", async (req, res) => {
  console.log("Received delete request:", req.body); // Debugging log
  const { batchCode, cognito_id } = req.body;

  if (!batchCode || !cognito_id) {
    console.error("Missing batchCode or cognito_id");
    return res.status(400).json({ error: "batchCode and cognito_id are required" });
  }

  try {
    // Check if row exists before deleting
    const [existingRows] = await db
      .promise()
      .query("SELECT * FROM production_log WHERE LOWER(batchCode) = LOWER(?) AND user_id = ?", [batchCode, cognito_id]);
    
    if (existingRows.length === 0) {
      console.error("Row not found or does not belong to the user");
      return res.status(404).json({ error: "Row not found or does not belong to the user" });
    }

    // Delete the production log row
    const [result] = await db
      .promise()
      .query("DELETE FROM production_log WHERE LOWER(batchCode) = LOWER(?) AND user_id = ?", [batchCode, cognito_id]);

    console.log("Delete result:", result); // Log SQL result

    res.json({ message: "Row deleted successfully" });
  } catch (err) {
    console.error("Failed to delete row:", err);
    res.status(500).json({ error: "Failed to delete row" });
  }
});

app.get('/dev/api/stock-usage/:cognitoId', (req, res) => {
  console.log(`Received request for stock usage with cognitoId: ${req.params.cognitoId}`);

  const sqlQuery = `
  SELECT 
    su.production_log_id,
    pl.date AS production_log_date,
    r.recipe_name,
    pl.batchCode,
    pl.batchRemaining,
    pl.user_id AS production_log_user_id,
    r.id AS recipe_id,
    i.id AS ingredient_id,
    i.ingredient_name,
    ri.quantity,  -- Fetch quantity from recipe_ingredients
    pl.batchesProduced,  -- Fetch batchesProduced from production_log
    GROUP_CONCAT(DISTINCT gi.barCode ORDER BY gi.id SEPARATOR ', ') AS ingredient_barcodes  
  FROM 
    stock_usage su
  JOIN 
    production_log pl ON su.production_log_id = pl.id
  JOIN 
    recipes r ON pl.recipe = r.recipe_name
  JOIN 
    recipe_ingredients ri ON r.id = ri.recipe_id
  JOIN 
    ingredients i ON ri.ingredient_id = i.id
  JOIN 
    goods_in gi ON gi.id = su.goods_in_id AND gi.ingredient = i.ingredient_name  -- Ensure correct ingredient match
  WHERE
    su.user_id = ?  
  GROUP BY
    su.production_log_id, pl.date, pl.batchCode, pl.batchRemaining, 
    pl.user_id, r.id, i.id, i.ingredient_name, ri.quantity, pl.batchesProduced;  -- Group by necessary fields
  `;

  console.log('Executing SQL query:', sqlQuery);

  db.query(sqlQuery, [req.params.cognitoId], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }

    console.log('Fetched Stock Usage Data:', JSON.stringify(results, null, 2));

    const formattedResults = results.map(row => {
      console.log(`Transforming row: ${JSON.stringify(row)}`);
      return {
        production_log_id: row.production_log_id,
        production_log_date: row.production_log_date,
        recipe_name: row.recipe_name,
        batchCode: row.batchCode,
        batchRemaining: row.batchRemaining,
        production_log_user_id: row.production_log_user_id,
        recipe_id: row.recipe_id,
        batchesProduced: row.batchesProduced,  // Include batchesProduced
        ingredients: [{
          ingredient_id: row.ingredient_id,
          ingredient_name: row.ingredient_name,
          ingredient_barcodes: row.ingredient_barcodes,
          quantity: row.quantity,  // Include quantity
          total_quantity: row.quantity * row.batchesProduced,  // Calculate total quantity
        }]
      };
    });

    console.log('Formatted Results:', JSON.stringify(formattedResults, null, 2));

    const groupedResults = formattedResults.reduce((acc, row) => {
      const logId = row.production_log_id;
      const existingLog = acc.find(log => log.production_log_id === logId);

      if (!existingLog) {
        console.log(`Creating new log entry for production_log_id: ${logId}`);
        acc.push({
          production_log_id: logId,
          production_log_date: row.production_log_date,
          recipe_name: row.recipe_name,
          batchCode: row.batchCode,
          batchRemaining: row.batchRemaining,
          production_log_user_id: row.production_log_user_id,
          recipe_id: row.recipe_id,
          batchesProduced: row.batchesProduced,  // Include batchesProduced
          ingredients: row.ingredients
        });
      } else {
        const existingIngredient = existingLog.ingredients.find(ing => ing.ingredient_id === row.ingredients[0].ingredient_id);
        if (!existingIngredient) {
          console.log(`Adding ingredient to existing log entry for production_log_id: ${logId}`);
          existingLog.ingredients.push(row.ingredients[0]);
        } else {
          console.log(`Ingredient already exists for production_log_id: ${logId}, ingredient_id: ${existingIngredient.ingredient_id}`);
          console.log(`Existing ingredient barcodes: ${existingIngredient.ingredient_barcodes}`);
          console.log(`Attempting to add barcodes: ${row.ingredients[0].ingredient_barcodes}`);
        }
      }
      return acc;
    }, []);

    console.log('Grouped Results:', JSON.stringify(groupedResults, null, 2));
    res.json(groupedResults);
  });
});

app.post("/dev/api/add-goods-out", async (req, res) => {
  const { date, recipe, stockAmount, recipients, cognito_id } = req.body;

  console.log("Received /add-goods-out request with:", req.body);

  if (!date || !recipe || !stockAmount || !recipients || !cognito_id) {
    console.error("Missing fields in request:", req.body);
    return res.status(400).json({ error: "All fields are required, including cognito_id" });
  }

  const connection = await db.promise().getConnection();
  try {
    console.log("Starting database transaction...");
    await connection.beginTransaction();

    // 1. Insert into goods_out
    const goodsoutQuery = `
      INSERT INTO goods_out (date, recipe, stockAmount, recipients, user_id)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [GoodsOutResult] = await connection.execute(goodsoutQuery, [
      date,
      recipe,
      stockAmount,
      recipients,
      cognito_id,
    ]);

    const goodsOutId = GoodsOutResult.insertId;
    console.log("Inserted into goods_out. ID:", goodsOutId);

    // 2. Deduct from production_log (starting from highest ID)
    let remainingToDeduct = stockAmount;

    const [productionRows] = await connection.execute(
      `SELECT id, batchRemaining, batchCode FROM production_log WHERE recipe = ? AND batchRemaining > 0 ORDER BY id ASC`,
      [recipe]
    );

    for (const row of productionRows) {
      if (remainingToDeduct <= 0) break;

      const deductAmount = Math.min(row.batchRemaining, remainingToDeduct);

      // Deduct batches
      await connection.execute(
        `UPDATE production_log SET batchRemaining = batchRemaining - ? WHERE id = ?`,
        [deductAmount, row.id]
      );

      // Track which batch (production_log row) was used and the quantity
      await connection.execute(
        `INSERT INTO goods_out_batches (goods_out_id, production_log_id, quantity_used) VALUES (?, ?, ?)`,
        [goodsOutId, row.id, deductAmount] // Insert quantity used here
      );

      console.log(`Deducted ${deductAmount} from production_log ID ${row.id}`);
      remainingToDeduct -= deductAmount;
    }

    if (remainingToDeduct > 0) {
      console.warn(`Warning: Not enough batches to cover stockAmount. ${remainingToDeduct} still unaccounted for.`);
      // Optional: throw error or continue as partial
    }

    await connection.commit();
    res.status(200).json({ message: "Goods out added and production log updated with batch tracking." });
  } catch (err) {
    await connection.rollback();
    console.error("Error processing transaction:", err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

app.get("/dev/api/goods-out-with-batches", async (req, res) => {
  const { cognito_id } = req.query;

  if (!cognito_id) {
    return res.status(400).json({ error: "cognito_id is required" });
  }

  try {
    const query = `
      SELECT 
        go.id AS goods_out_id,
        go.date,
        go.recipe,
        go.stockAmount,
        go.recipients,
        go.user_id,
        GROUP_CONCAT(pl.batchCode ORDER BY pl.id SEPARATOR ', ') AS batchCodesUsed,
        GROUP_CONCAT(gob.quantity_used ORDER BY pl.id SEPARATOR ', ') AS quantitiesUsed
      FROM goods_out go
      JOIN goods_out_batches gob ON go.id = gob.goods_out_id
      JOIN production_log pl ON gob.production_log_id = pl.id
      WHERE go.user_id = ?
      GROUP BY go.id
      ORDER BY go.date DESC
    `;

    const [results] = await db.promise().query(query, [cognito_id]);

    res.json(results);
  } catch (err) {
    console.error("Error fetching goods_out with batchCodes:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/dev/api/goods-out", async (req, res) => {
  const { cognito_id } = req.query; // Get cognito_id from query parameters

  if (!cognito_id) {
    return res.status(400).json({ error: "cognito_id is required" });
  }

  try {
    const query = `
      SELECT go.id, go.date, go.recipe, go.stockAmount, go.recipients,
             JSON_ARRAYAGG(pl.batchCode) AS batchcodes,
             JSON_ARRAYAGG(gob.quantity_used) AS quantitiesUsed
      FROM goods_out go
      JOIN goods_out_batches gob ON go.id = gob.goods_out_id
      JOIN production_log pl ON gob.production_log_id = pl.id
      WHERE go.user_id = ?
      GROUP BY go.id
      ORDER BY go.date DESC
    `;
    
    const [results] = await db.promise().query(query, [cognito_id]);

    res.json(results);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error" });
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

module.exports.handler = serverless(app, {
  request: {
    // This forces serverless-http to decode the body from base64 if needed
    parse: true,
  },
});