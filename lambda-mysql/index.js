const serverless = require('serverless-http');
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const morgan = require('morgan');

// ... (previous code)

const app = express();

// ✅ Enhanced request logging
app.use(morgan(':method :url :status :res[content-length] - :response-time ms\nHeaders: :req[headers]\nBody: :req[body]'));

// ✅ Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ MySQL connection pool
const db = mysql.createPool({
  host: "database-2.clk2kak2yxlo.eu-west-1.rds.amazonaws.com",
  user: "admin",
  password: "Incorrect_123",
  database: "hupes_database"
});

// ✅ Test database connection
db.getConnection((err, conn) => {
  if (err) {
    console.error('DB connection failed:', err);
    return;
  }
  console.log('DB connected successfully');
  conn.release();
});

// ✅ CORS Configuration (THIS IS THE ONE TO KEEP)
app.use(cors({
  origin: function (origin, callback) {
    console.log(`CORS Origin Check: ${origin}`);
    const allowedOrigins = [
      'https://master.d2fdrxobxyr2je.amplifyapp.com',
      'http://localhost:3000' // For local development
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
  credentials: true,
  maxAge: 86400,
  preflightContinue: false, // This is usually false, meaning the cors middleware handles the preflight.
  optionsSuccessStatus: 204
}));

app.options(/(.*)/, cors()); // Allow preflight requests globally

app.use((req, res, next) => {
  if (typeof req.body === 'string') {
    try {
      req.body = JSON.parse(req.body);
    } catch (err) {
      console.error('Error parsing JSON body:', err.message);
    }
  }
  next();
});

// ✅ Route: Submit Goods In
app.post("/api/submit", async (req, res) => {
  const { 
    date, 
    ingredient, 
    stockReceived, 
    unit,            // new unit field
    barCode, 
    expiryDate, 
    temperature, 
    cognito_id 
  } = req.body;

  // Set CORS headers explicitly
  res.setHeader('Access-Control-Allow-Origin', 'https://master.d2fdrxobxyr2je.amplifyapp.com');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  try {
    console.log("Raw request body:", req.body);

    // Validate required fields, including unit
    if (!date || !ingredient || !stockReceived || !unit || !barCode || !expiryDate || 
        temperature === undefined || temperature === null || !cognito_id) {
      console.error("❌ Missing fields in request body:", { date, ingredient, stockReceived, unit, barCode, expiryDate, temperature, cognito_id });
      return res.status(400).json({ 
        error: "All fields are required",
        received: req.body
      });
    }

    const connection = await db.promise().getConnection();
    try {
      await connection.beginTransaction();

      // Insert into goods_in (including unit)
      const goodsInQuery = `
        INSERT INTO goods_in 
        (date, ingredient, stockReceived, stockRemaining, barCode, expiryDate, temperature, unit, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [goodsInResult] = await connection.execute(goodsInQuery, [
        date,
        ingredient,
        stockReceived,
        stockReceived, // Initial stockRemaining equals stockReceived
        barCode,
        expiryDate,
        temperature,
        unit,          // pass unit
        cognito_id,
      ]);

      // Update ingredient_inventory (including unit)
      const ingredientInventoryQuery = `
        INSERT INTO ingredient_inventory (ingredient, amount, barcode, unit)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE amount = amount + ?
      `;
      await connection.execute(ingredientInventoryQuery, [
        ingredient,
        stockReceived,
        barCode,
        unit,           // pass unit
        stockReceived
      ]);

      await connection.commit();
      res.status(200).json({ 
        success: true,
        message: "Data saved successfully", 
        id: goodsInResult.insertId 
      });
    } catch (err) {
      await connection.rollback();
      console.error("Database error:", { message: err.message, stack: err.stack, sql: err.sql, parameters: err.parameters });
      res.status(500).json({ success: false, error: "Database operation failed", details: err.message });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Server error:", { message: err.message, stack: err.stack, request: { headers: req.headers, body: req.body } });
    res.status(500).json({ success: false, error: "Server error", details: err.message });
  }
});

// Example root route
app.get('/', (req, res) => {
  res.json({ message: 'Hello from Express + AWS Lambda!' });
});

// Adjusted GET /dev/api/goods-in route to include stage prefix 'dev'
app.get("/api/goods-in", async (req, res) => {
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

app.post("/api/delete-row", async (req, res) => {
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

// **New API Endpoint to Add a Recipe**
app.post("/api/add-recipe", async (req, res) => {
  console.log("Received request body:", req.body);

  const { recipe, upb, ingredients, quantities, units, cognito_id } = req.body;

  // Basic validation
  if (
    !recipe ||
    !upb ||
    !cognito_id ||
    !Array.isArray(ingredients) ||
    !Array.isArray(quantities) ||
    !Array.isArray(units) ||
    ingredients.length !== quantities.length ||
    ingredients.length !== units.length
  ) {
    console.error("Invalid input data:", req.body);
    return res.status(400).json({ error: "Invalid input data" });
  }

  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();
    console.log("Transaction started");

    // Insert into recipes
    const [recipeResult] = await connection.execute(
      `INSERT INTO recipes 
         (recipe_name, units_per_batch, user_id) 
       VALUES (?, ?, ?)`,
      [recipe, upb, cognito_id]
    );
    const recipeId = recipeResult.insertId;
    console.log("Inserted recipe with ID:", recipeId);

    // For each ingredient, link (with quantity + unit)
    for (let i = 0; i < ingredients.length; i++) {
      const name = ingredients[i];
      const qty  = quantities[i];
      const unit = units[i];
      console.log(`Processing ${name}: ${qty} ${unit}`);

      // Find or create ingredient
      const [ingRows] = await connection.execute(
        `SELECT id 
           FROM ingredients 
          WHERE ingredient_name = ? 
            AND user_id = ?`,
        [name, cognito_id]
      );

      let ingredientId;
      if (ingRows.length) {
        ingredientId = ingRows[0].id;
      } else {
        const [ingRes] = await connection.execute(
          `INSERT INTO ingredients 
             (ingredient_name, user_id) 
           VALUES (?, ?)`,
          [name, cognito_id]
        );
        ingredientId = ingRes.insertId;
      }

      // Link in recipe_ingredients (with unit)
      await connection.execute(
        `INSERT INTO recipe_ingredients 
           (recipe_id, ingredient_id, quantity, unit, user_id) 
         VALUES (?, ?, ?, ?, ?)`,
        [recipeId, ingredientId, qty, unit, cognito_id]
      );
      console.log(`Linked ingredient ${ingredientId} → recipe ${recipeId}`);
    }

    await connection.commit();
    console.log("Transaction committed");
    res.status(200).json({ message: "Recipe added successfully!" });
  } catch (err) {
    await connection.rollback();
    console.error("Error, rolled back:", err);
    res.status(500).json({ error: "Database transaction failed", details: err.message });
  } finally {
    connection.release();
    console.log("Connection released");
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

// **Delete Recipe by Name**
app.post("/api/delete-recipe", async (req, res) => {
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

app.post("/api/add-production-log", async (req, res) => {
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
        console.log(`Inserting into stock_usage: production_log_id=${productionLogResult.insertId}, goods_in_id=${goodsInId}, user_id=${cognito_id}`);
        await connection.execute(
          `INSERT INTO stock_usage (production_log_id, goods_in_id, user_id)
           VALUES (?, ?, ?)`,
          [productionLogResult.insertId, goodsInId, cognito_id]
        );

        console.log(`amountNeeded before: ${amountNeeded}`);
        amountNeeded -= deduction;
        console.log(`amountNeeded after: ${amountNeeded}`);
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

app.get("/api/production-log", async (req, res) => {
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

app.post("/api/delete-production-log", async (req, res) => {
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

app.get('/api/stock-usage/:cognitoId', (req, res) => {
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

app.post("/api/add-goods-out", async (req, res) => {
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

app.get("/api/goods-out-with-batches", async (req, res) => {
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

app.get("/api/goods-out", async (req, res) => {
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

app.get('/dev/health', (req, res) => {
  db.getConnection((err, conn) => {
    if (err) {
      res.status(500).json({ db: "DOWN", error: err.message });
    } else {
      conn.release();
      res.json({ db: "OK" });
    }
  });
});

app.use((req, res) => {
  console.error('404 Not Found:', {
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    ip: req.ip
  });
  res.status(404).json({ error: 'Not found' });
});

// ✅ Enhanced error handling middleware
app.use((err, req, res, next) => {
  const errorDetails = {
    message: err.message,
    stack: err.stack,
    type: err.type,
    status: err.status,
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      query: req.query
    },
    timestamp: new Date().toISOString()
  };

  console.error('SERVER ERROR:', JSON.stringify(errorDetails, null, 2));

  // Special handling for CORS errors
  if (err.message.includes('CORS')) {
    console.error('CORS ERROR DETAILS:', {
      origin: req.headers.origin,
      allowedOrigins: '*', // Update this in production
      method: req.method
    });
    
    return res.status(403).json({
      error: 'CORS Error',
      message: err.message,
      details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    });
  }

  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: err.message,
    details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
  });
});

module.exports.handler = serverless(app, {
  request: {
    parse: true,
    passThrough: true,
  },
});