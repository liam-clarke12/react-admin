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

app.get("/api/ingredients", async (req, res) => {
  try {
    // 🔍 Canary test: make sure the pool is responsive
    db.getConnection((pingErr, conn) => {
      if (pingErr) {
        console.error("[Ingredients] DB ping failed:", pingErr);
      } else {
        console.log("[Ingredients] DB ping OK");
        conn.release();
      }
    });

    // fetch every distinct ingredient name
    const [rows] = await db
      .promise()
      .query(`
        SELECT DISTINCT name
          FROM user_ingredients
        ORDER BY name
      `);

    // return as { id, name } objects
    const ingredients = rows.map(r => ({
      id:   r.name,
      name: r.name,
    }));

    return res.json(ingredients);
  } catch (err) {
    console.error("🔥 /api/ingredients error:", err.stack || err);
    return res
      .status(500)
      .json({ error: err.message || "Unknown server error" });
  }
});

app.get("/api/custom-ingredients", async (req, res) => {
  const userId = req.query.cognito_id;
  if (!userId) {
    return res.status(400).json({ error: "Missing cognito_id query parameter" });
  }

  try {
    const [rows] = await db
      .promise()
      .query(
        `SELECT id, name, created_at
           FROM custom_ingredients
          WHERE user_id = ?
          ORDER BY created_at DESC`,
        [userId]
      );
    res.json(rows);
  } catch (err) {
    console.error("🔥 GET /api/custom-ingredients error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch custom ingredients" });
  }
});

app.post("/api/custom-ingredients", async (req, res) => {
  const { cognito_id: userId, name } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Missing cognito_id in request body" });
  }
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Missing or empty name in request body" });
  }

  try {
    // Insert new custom ingredient
    await db
      .promise()
      .query(
        `INSERT INTO custom_ingredients (user_id, name)
         VALUES (?, ?)`,
        [userId, name.trim()]
      );

    // Return updated list
    const [rows] = await db
      .promise()
      .query(
        `SELECT id, name, created_at
           FROM custom_ingredients
          WHERE user_id = ?
          ORDER BY created_at DESC`,
        [userId]
      );
    res.json(rows);
  } catch (err) {
    console.error("🔥 POST /api/custom-ingredients error:", err);
    res.status(500).json({ error: err.message || "Failed to add custom ingredient" });
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

// GET only active goods_in rows (soft-delete aware)
app.get("/api/goods-in/active", async (req, res) => {
  const { cognito_id } = req.query;

  if (!cognito_id) {
    return res.status(400).json({ error: "cognito_id is required" });
  }

  try {
    const query = `
      SELECT *
      FROM goods_in
      WHERE user_id = ?
        AND deleted_at IS NULL
      ORDER BY date DESC, id DESC
    `;
    const [results] = await db.promise().query(query, [cognito_id]);
    res.json(results);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/delete-row", async (req, res) => {
  const { barCode, cognito_id } = req.body;

  if (!barCode || !cognito_id) {
    return res.status(400).json({ error: "barCode and cognito_id are required" });
  }

  try {
    // Ensure the row exists and is not already soft-deleted
    const [existing] = await db
      .promise()
      .query(
        `SELECT id FROM goods_in
         WHERE barCode = ? AND user_id = ? AND deleted_at IS NULL
         LIMIT 1`,
        [barCode, cognito_id]
      );

    if (existing.length === 0) {
      return res
        .status(404)
        .json({ error: "Row not found, not yours, or already deleted" });
    }

    // Soft delete (UTC for consistency)
    const [result] = await db
      .promise()
      .query(
        `UPDATE goods_in
           SET deleted_at = UTC_TIMESTAMP()
         WHERE barCode = ? AND user_id = ? AND deleted_at IS NULL`,
        [barCode, cognito_id]
      );

    return res.json({
      message: "Row soft-deleted successfully",
      barCode,
    });
  } catch (err) {
    console.error("Failed to soft-delete row:", err);
    res.status(500).json({ error: "Failed to soft-delete row" });
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
  const {
    date,
    recipe,
    batchesProduced,
    batchCode,
    unitsOfWaste,
    cognito_id
  } = req.body;

  console.log("📥 Received /add-production-log request:", req.body);

  if (
    date == null ||
    recipe == null ||
    batchesProduced == null ||
    batchCode == null ||
    unitsOfWaste == null ||
    cognito_id == null
  ) {
    console.error("❌ Missing fields in request:", req.body);
    return res.status(400).json({ error: "All fields are required, including cognito_id" });
  }

  const connection = await db.promise().getConnection();

  try {
    console.log("🔄 Starting database transaction...");
    await connection.beginTransaction();

    // 🔍 Fetch recipe (scoped to user) and its UPB
    const [recipeRows] = await connection.execute(
      `SELECT id, units_per_batch
         FROM recipes
        WHERE recipe_name = ? AND user_id = ?`,
      [recipe, cognito_id]
    );

    if (recipeRows.length === 0) {
      console.error(`❌ Recipe not found for user: ${recipe} / ${cognito_id}`);
      await connection.rollback();
      return res.status(400).json({ error: "Recipe not found" });
    }

    const recipeId = recipeRows[0].id;
    const unitsPerBatch = Number(recipeRows[0].units_per_batch) || 1;
    const batchRemaining = Number(batchesProduced) * unitsPerBatch;
    const finalUnitsOfWaste = Number(unitsOfWaste) || 0;

    console.log("📤 Inserting production_log:", {
      date,
      recipe,
      batchesProduced,
      batchRemaining,
      batchCode,
      user_id: cognito_id,
      units_of_waste: finalUnitsOfWaste
    });

    // ✅ Insert production log
    const [productionLogResult] = await connection.execute(
      `
      INSERT INTO production_log
        (date, recipe, batchesProduced, batchRemaining, batchCode, user_id, units_of_waste)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        date,
        recipe,
        batchesProduced,
        batchRemaining,
        batchCode,
        cognito_id,
        finalUnitsOfWaste
      ]
    );

    const productionLogId = productionLogResult.insertId;
    console.log("✅ Inserted production_log ID:", productionLogId);

    // 🔄 Pull recipe ingredients WITH UNIT and compute total needed
    const [ingredients] = await connection.execute(
      `
      SELECT
        i.id AS ingredient_id,
        i.ingredient_name,
        ri.unit AS unit,
        (ri.quantity * ?) AS total_needed
      FROM recipe_ingredients ri
      JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE ri.recipe_id = ?
      `,
      [batchesProduced, recipeId]
    );

    if (ingredients.length === 0) {
      console.error("❌ No ingredients found for recipe ID:", recipeId);
      await connection.rollback();
      return res.status(400).json({ error: "No ingredients found for this recipe" });
    }

    // 📉 Deduct from ACTIVE goods_in (FIFO by date,id), matching unit and user, skipping soft-deleted rows
    console.log("🔁 Deducting stock from goods_in (FIFO, active lots only)...");
    for (const ing of ingredients) {
      let amountNeeded = Number(ing.total_needed) || 0;
      const ingName = ing.ingredient_name;
      const ingUnit = ing.unit;

      console.log(`▶ ${ingName} (${ingUnit}): need ${amountNeeded}`);

      while (amountNeeded > 0) {
        const [stockRows] = await connection.execute(
          `
          SELECT gi.id, gi.stockRemaining, gi.barCode, gi.date
            FROM goods_in gi
           WHERE gi.user_id = ?
             AND gi.ingredient = ?
             AND gi.unit = ?
             AND gi.deleted_at IS NULL
             AND gi.stockRemaining > 0
           ORDER BY gi.date ASC, gi.id ASC
           LIMIT 1
          `,
          [cognito_id, ingName, ingUnit]
        );

        if (stockRows.length === 0) {
          console.warn(
            `⚠ Not enough stock for ${ingName} (${ingUnit}). Remaining shortfall: ${amountNeeded}`
          );
          break; // continue with other ingredients; partial fulfillment
        }

        const { id: goodsInId, stockRemaining } = stockRows[0];
        const deduction = Math.min(amountNeeded, Number(stockRemaining) || 0);

        // Deduct from the lot
        await connection.execute(
          `UPDATE goods_in SET stockRemaining = stockRemaining - ? WHERE id = ?`,
          [deduction, goodsInId]
        );

        // Track which lot (barcode) was used for this production
        // (If you later add a "quantity_used" column, include it here.)
        await connection.execute(
          `
          INSERT INTO stock_usage (production_log_id, goods_in_id, user_id)
          VALUES (?, ?, ?)
          `,
          [productionLogId, goodsInId, cognito_id]
        );

        amountNeeded -= deduction;
        console.log(
          `   • Used ${deduction} from goods_in.id=${goodsInId}; still need ${amountNeeded}`
        );
      }
    }

    await connection.commit();
    console.log("✅ Transaction committed.");
    res.status(200).json({
      message: "Production log saved successfully",
      id: productionLogId
    });
  } catch (err) {
    await connection.rollback();
    console.error("❌ Error in transaction:", err);
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

// GET /api/ingredient-inventory/active?cognito_id=...
app.get("/api/ingredient-inventory/active", async (req, res) => {
  const { cognito_id } = req.query;
  if (!cognito_id) return res.status(400).json({ error: "cognito_id is required" });

  try {
    const [rows] = await db.promise().query(
      `
      SELECT
        gi.ingredient,
        gi.unit,
        SUM(gi.stockRemaining) AS totalRemaining,
        (
          SELECT gi2.barCode
          FROM goods_in gi2
          WHERE gi2.ingredient = gi.ingredient
            AND gi2.unit = gi.unit
            AND gi2.user_id = gi.user_id
            AND gi2.deleted_at IS NULL
            AND gi2.stockRemaining > 0
          ORDER BY gi2.date ASC, gi2.id ASC
          LIMIT 1
        ) AS activeBarcode,
        (
          SELECT gi2.expiryDate
          FROM goods_in gi2
          WHERE gi2.ingredient = gi.ingredient
            AND gi2.unit = gi.unit
            AND gi2.user_id = gi.user_id
            AND gi2.deleted_at IS NULL
            AND gi2.stockRemaining > 0
          ORDER BY gi2.date ASC, gi2.id ASC
          LIMIT 1
        ) AS activeExpiry
      FROM goods_in gi
      WHERE gi.user_id = ?
        AND gi.deleted_at IS NULL
        AND gi.stockRemaining > 0
      GROUP BY gi.ingredient, gi.unit
      ORDER BY gi.ingredient
      `,
      [cognito_id]
    );

    res.json(rows);
  } catch (err) {
    console.error("Error building ingredient inventory:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Only return non–soft-deleted rows
app.get("/api/production-log/active", async (req, res) => {
  const { cognito_id } = req.query; // Get cognito_id from query parameters

  // Log the incoming request
  console.log("Received /api/production-log/active request with query:", req.query);

  // Ensure cognito_id is provided
  if (!cognito_id) {
    console.error("Missing cognito_id in request:", req.query);
    return res.status(400).json({ error: "cognito_id is required" });
  }

  console.log("Cognito ID provided:", cognito_id);

  try {
    // Log the SQL query before execution
    console.log("Executing query to fetch non-deleted production_log rows filtered by user_id (cognito_id):");
    const query = "SELECT * FROM production_log WHERE user_id = ? AND deleted_at IS NULL";
    console.log("SQL Query:", query);
    console.log("Query Parameters:", [cognito_id]);

    // Query table filtered by user_id (cognito_id) and not soft-deleted
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
  console.log("[/api/delete-production-log] Received:", req.body);
  const { batchCode, cognito_id } = req.body;

  if (!batchCode || !cognito_id) {
    console.error("[/api/delete-production-log] Missing batchCode or cognito_id");
    return res.status(400).json({ error: "batchCode and cognito_id are required" });
  }

  try {
    // 1) Ensure the row exists and isn't already soft-deleted
    const [existingRows] = await db
      .promise()
      .query(
        `SELECT id, batchCode, deleted_at
           FROM production_log
          WHERE LOWER(batchCode) = LOWER(?)
            AND user_id = ?
            AND deleted_at IS NULL`,
        [batchCode, cognito_id]
      );

    if (existingRows.length === 0) {
      console.warn("[/api/delete-production-log] Not found or already deleted:", { batchCode, cognito_id });
      return res.status(404).json({ error: "Row not found, already deleted, or not owned by this user" });
    }

    // 2) Soft delete (requires columns: deleted_at DATETIME NULL, deleted_by VARCHAR(64) NULL)
    const [result] = await db
      .promise()
      .query(
        `UPDATE production_log
            SET deleted_at = NOW(),
                deleted_by = ?
          WHERE LOWER(batchCode) = LOWER(?)
            AND user_id = ?
            AND deleted_at IS NULL`,
        [cognito_id, batchCode, cognito_id]
      );

    console.log("[/api/delete-production-log] Soft delete result:", result);

    if (result.affectedRows === 0) {
      // Race condition safety: someone may have deleted it between SELECT and UPDATE
      return res.status(409).json({ error: "Row was modified concurrently; please refresh" });
    }

    return res.json({ message: "Row soft-deleted" });
  } catch (err) {
    console.error("[/api/delete-production-log] Failed:", err);
    return res.status(500).json({ error: "Failed to soft-delete row" });
  }
});

app.get('/api/stock-usage/:cognitoId', (req, res) => {
  const cognitoId = req.params.cognitoId;
  console.log(`[GET] /api/stock-usage/${cognitoId}`);

  const sqlQuery = `
    SELECT 
      su.production_log_id,
      GROUP_CONCAT(DISTINCT su.id ORDER BY su.id) AS stock_usage_ids,   -- ✅ add IDs to delete
      pl.date AS production_log_date,
      r.recipe_name,
      pl.batchCode,
      pl.batchRemaining,
      pl.user_id AS production_log_user_id,
      r.id AS recipe_id,
      i.id AS ingredient_id,
      i.ingredient_name,
      ri.quantity,
      pl.batchesProduced,
      GROUP_CONCAT(DISTINCT gi.barCode ORDER BY gi.id SEPARATOR ', ') AS ingredient_barcodes
    FROM stock_usage su
    JOIN production_log pl ON su.production_log_id = pl.id
    JOIN recipes r ON pl.recipe = r.recipe_name
    JOIN recipe_ingredients ri ON r.id = ri.recipe_id
    JOIN ingredients i ON ri.ingredient_id = i.id
    JOIN goods_in gi ON gi.id = su.goods_in_id AND gi.ingredient = i.ingredient_name
    WHERE su.user_id = ?
    GROUP BY
      su.production_log_id, pl.date, pl.batchCode, pl.batchRemaining,
      pl.user_id, r.id, i.id, i.ingredient_name, ri.quantity, pl.batchesProduced
  `;

  console.log('[GET /api/stock-usage] Executing SQL:\n', sqlQuery);

  db.query(sqlQuery, [cognitoId], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }

    // Each row = one ingredient line for a production_log, with a comma string of su.id's for that line
    const formatted = (results || []).map((row) => {
      // Parse "1,2,3" -> [1,2,3]
      const ids =
        String(row.stock_usage_ids || '')
          .split(',')
          .map((s) => Number(s.trim()))
          .filter((n) => Number.isFinite(n));

      return {
        production_log_id: row.production_log_id,
        production_log_date: row.production_log_date,
        recipe_name: row.recipe_name,
        batchCode: row.batchCode,
        batchRemaining: row.batchRemaining,
        production_log_user_id: row.production_log_user_id,
        recipe_id: row.recipe_id,
        batchesProduced: row.batchesProduced,
        ids, // ✅ carry the array of stock_usage ids
        ingredients: [
          {
            ingredient_id: row.ingredient_id,
            ingredient_name: row.ingredient_name,
            ingredient_barcodes: row.ingredient_barcodes,
            quantity: row.quantity,
            total_quantity: (Number(row.quantity) || 0) * (Number(row.batchesProduced) || 0),
          },
        ],
      };
    });

    // Group by production_log (collapsing ingredients & merging id arrays)
    const grouped = formatted.reduce((acc, row) => {
      const key = row.production_log_id;
      let group = acc.find((g) => g.production_log_id === key);

      if (!group) {
        group = {
          production_log_id: row.production_log_id,
          production_log_date: row.production_log_date,
          recipe_name: row.recipe_name,
          batchCode: row.batchCode,
          batchRemaining: row.batchRemaining,
          production_log_user_id: row.production_log_user_id,
          recipe_id: row.recipe_id,
          batchesProduced: row.batchesProduced,
          ids: [...row.ids],                 // ✅ start with this row’s ids
          ingredients: [...row.ingredients], // first ingredient
        };
        acc.push(group);
      } else {
        // merge unique IDs
        const merged = new Set([...(group.ids || []), ...row.ids]);
        group.ids = Array.from(merged);

        // add ingredient if new
        const incoming = row.ingredients[0];
        if (!group.ingredients.some((ing) => ing.ingredient_id === incoming.ingredient_id)) {
          group.ingredients.push(incoming);
        }
      }
      return acc;
    }, []);

    console.log('[GET /api/stock-usage] Response groups:', grouped.length);
    res.json(grouped);
  });
});

// Hard-delete stock_usage rows by ids, owned by the given user
app.post("/api/stock-usage/delete", async (req, res) => {
  let { ids, id, cognito_id } = req.body;

  console.log("[/api/stock-usage/delete] body:", req.body);

  // Normalize to an array
  if (!Array.isArray(ids)) ids = typeof id !== "undefined" ? [id] : [];
  // Coerce to numbers (if your stock_usage.id is numeric)
  ids = ids.map((x) => Number(x)).filter((x) => Number.isFinite(x));

  // Basic validation
  if (!cognito_id || ids.length === 0) {
    return res.status(400).json({ error: "cognito_id and at least one id are required" });
  }

  // If stock_usage.user_id stores an *internal numeric* user id instead of the Cognito sub,
  // UNCOMMENT this lookup and use `internalUserId` in the queries below:
  //
  // const [[userRow]] = await db
  //   .promise()
  //   .query("SELECT id FROM users WHERE cognito_id = ? LIMIT 1", [cognito_id]);
  // if (!userRow) return res.status(404).json({ error: "Unknown user" });
  // const userKey = userRow.id; // internal numeric
  //
  // Otherwise, if stock_usage.user_id stores the Cognito sub directly, use:
  const userKey = cognito_id;

  // Build placeholders (?, ?, ...) for the IN() clause
  const inPlaceholders = ids.map(() => "?").join(", ");

  try {
    // 1) Which rows exist for those ids?
    const [rowsAnyUser] = await db
      .promise()
      .query(`SELECT id, user_id FROM stock_usage WHERE id IN (${inPlaceholders})`, ids);

    if (rowsAnyUser.length === 0) {
      return res.status(404).json({ error: "No matching rows for provided ids", ids });
    }

    // 2) Which rows belong to this user?
    const [rowsThisUser] = await db
      .promise()
      .query(
        `SELECT id FROM stock_usage WHERE id IN (${inPlaceholders}) AND user_id = ?`,
        [...ids, userKey]
      );

    if (rowsThisUser.length === 0) {
      // Helpful diagnostics when user_id mismatches (e.g., internal numeric vs cognito sub)
      return res.status(403).json({
        error: "Rows do not belong to this user_id. Check user_id type/mapping.",
        sampleRowUserIds: rowsAnyUser.slice(0, 5).map((r) => r.user_id),
        cognito_id_received: cognito_id,
      });
    }

    // 3) Delete
    const [result] = await db
      .promise()
      .query(
        `DELETE FROM stock_usage
         WHERE id IN (${inPlaceholders})
           AND user_id = ?`,
        [...ids, userKey]
      );

    return res.json({
      message: "Stock usage rows hard-deleted",
      requested: ids.length,
      matchedForUser: rowsThisUser.length,
      deleted: result.affectedRows,
    });
  } catch (err) {
    console.error("[/api/stock-usage/delete] Failed:", err);
    return res.status(500).json({ error: "Failed to hard-delete stock usage rows" });
  }
});

app.post("/api/add-goods-out", async (req, res) => {
  const { date, recipe, stockAmount, recipients, cognito_id } = req.body;

  console.log("Received /add-goods-out request with:", req.body);

  if (!date || !recipe || !stockAmount || !recipients || !cognito_id) {
    console.error("Missing fields in request:", req.body);
    return res
      .status(400)
      .json({ error: "All fields are required, including cognito_id" });
  }

  const connection = await db.promise().getConnection();
  try {
    console.log("Starting database transaction...");
    await connection.beginTransaction();

    // 0) Look up units_per_batch for this recipe (scoped to this user)
    const [recipeRows] = await connection.execute(
      `SELECT units_per_batch 
         FROM recipes 
        WHERE recipe_name = ? 
          AND user_id = ?`,
      [recipe, cognito_id]
    );

    if (recipeRows.length === 0) {
      throw new Error(`Recipe '${recipe}' not found for user ${cognito_id}`);
    }

    const unitsPerBatch = Number(recipeRows[0].units_per_batch) || 1;
    console.log(`Units per batch for '${recipe}':`, unitsPerBatch);

    // NOTE: Your original code treats stockAmount as **batches**.
    // If stockAmount is actually **units**, use:
    // const batchesToDeduct = Math.ceil(Number(stockAmount) / unitsPerBatch);
    const batchesToDeduct = Math.ceil(Number(stockAmount));
    console.log(
      `Stock amount ${stockAmount} => ${batchesToDeduct} batch(es) to deduct`
    );

    // 1) Insert goods_out record
    const goodsOutQuery = `
      INSERT INTO goods_out (date, recipe, stockAmount, recipients, user_id)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [goodsOutResult] = await connection.execute(goodsOutQuery, [
      date,
      recipe,
      stockAmount,
      recipients,
      cognito_id,
    ]);
    const goodsOutId = goodsOutResult.insertId;
    console.log("Inserted into goods_out. ID:", goodsOutId);

    // 2) Deduct from ACTIVE production_log rows (deleted_at IS NULL) for this user, FIFO by id
    let remainingToDeduct = batchesToDeduct;

    const [productionRows] = await connection.execute(
      `SELECT id, batchRemaining, batchCode
         FROM production_log
        WHERE recipe = ?
          AND user_id = ?
          AND batchRemaining > 0
          AND deleted_at IS NULL          -- ✅ only active rows
        ORDER BY id ASC`,                  -- FIFO
      [recipe, cognito_id]
    );

    for (const row of productionRows) {
      if (remainingToDeduct <= 0) break;

      const deductAmount = Math.min(row.batchRemaining, remainingToDeduct);

      // a) Update production_log
      await connection.execute(
        `UPDATE production_log
            SET batchRemaining = batchRemaining - ?
          WHERE id = ?`,
        [deductAmount, row.id]
      );

      // b) Track deduction against this batch
      await connection.execute(
        `INSERT INTO goods_out_batches
           (goods_out_id, production_log_id, quantity_used)
         VALUES (?, ?, ?)`,
        [goodsOutId, row.id, deductAmount]
      );

      console.log(
        `Deducted ${deductAmount} batch(es) from production_log ID ${row.id} (batchCode: ${row.batchCode})`
      );

      remainingToDeduct -= deductAmount;
    }

    if (remainingToDeduct > 0) {
      console.warn(
        `Not enough active batches to cover stockAmount; ${remainingToDeduct} batch(es) short.`
      );
      // You may choose to rollback here instead of committing a partial deduction.
    }

    await connection.commit();
    return res.status(200).json({
      message:
        "Goods out added; deducted from ACTIVE production_log rows (deleted_at IS NULL).",
    });
  } catch (err) {
    await connection.rollback();
    console.error("Error processing transaction:", err);
    return res.status(500).json({ error: err.message });
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

// HARD DELETE goods_out rows (and their links) for the signed-in user
app.post("/api/goods-out/delete", async (req, res) => {
  let { ids, id, cognito_id } = req.body;

  // Normalize ids to an array of integers
  if (!Array.isArray(ids)) ids = typeof id !== "undefined" ? [id] : [];
  ids = (ids || []).map((x) => Number(x)).filter((x) => Number.isInteger(x) && x > 0);

  if (!cognito_id || ids.length === 0) {
    return res.status(400).json({ error: "cognito_id and at least one numeric id are required" });
  }

  const placeholders = ids.map(() => "?").join(", ");

  // If you have ON DELETE CASCADE from goods_out -> goods_out_batches you can skip the first DELETE.
  // This version works even without CASCADE by manually removing child rows first.
  const conn = await db.promise().getConnection();
  try {
    await conn.beginTransaction();

    // 1) Delete join rows for only the caller's rows
    const delJoinSql = `
      DELETE gob
        FROM goods_out_batches AS gob
        JOIN goods_out AS go ON gob.goods_out_id = go.id
       WHERE go.id IN (${placeholders})
         AND go.user_id = ?`;
    const [delJoinRes] = await conn.query(delJoinSql, [...ids, cognito_id]);

    // 2) Delete goods_out rows themselves (scoped to user)
    const delSql = `
      DELETE FROM goods_out
       WHERE id IN (${placeholders})
         AND user_id = ?`;
    const [delRes] = await conn.query(delSql, [...ids, cognito_id]);

    await conn.commit();
    return res.json({
      message: "Goods out rows hard-deleted",
      requested: ids.length,
      deleted: delRes.affectedRows,
      deletedJoinRows: delJoinRes.affectedRows || 0,
    });
  } catch (err) {
    await conn.rollback();
    console.error("[/api/goods-out/delete] Failed:", err);
    return res.status(500).json({ error: "Failed to hard-delete goods out rows" });
  } finally {
    conn.release();
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

// ─── Update a goods_in row ─────────────────────────────────────────────────────
app.put("/api/goods-in/:barCode", async (req, res) => {
  const { barCode } = req.params;
  const {
    date,
    ingredient,
    stockReceived,
    stockRemaining,
    unit,
    expiryDate,
    temperature,
    cognito_id
  } = req.body;

  // Basic validation
  if (
    !barCode ||
    !cognito_id ||
    !date ||
    !ingredient ||
    stockReceived  == null ||
    stockRemaining == null ||
    !unit ||
    !expiryDate    ||
    temperature    == null
  ) {
    return res.status(400).json({
      error: "barCode, cognito_id and all fields (date, ingredient, stockReceived, stockRemaining, unit, expiryDate, temperature) are required"
    });
  }

  try {
    const [result] = await db
      .promise()
      .execute(
        `UPDATE goods_in
            SET date           = ?,
                ingredient     = ?,
                stockReceived  = ?,
                stockRemaining = ?,
                unit           = ?,
                expiryDate     = ?,
                temperature    = ?
          WHERE barCode = ?
            AND user_id = ?`,
        [
          date,
          ingredient,
          stockReceived,
          stockRemaining,
          unit,
          expiryDate,
          temperature,
          barCode,
          cognito_id
        ]
      );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "No matching goods_in row found for that barCode/user" });
    }

    // Optionally: fetch and return the updated row
    const [[updatedRow]] = await db
      .promise()
      .query(
        `SELECT * FROM goods_in WHERE barCode = ? AND user_id = ?`,
        [barCode, cognito_id]
      );

    res.json({ success: true, updated: updatedRow });
  } catch (err) {
    console.error("Failed to update goods_in row:", err);
    res.status(500).json({
      error: "Database error updating goods_in row",
      details: err.message
    });
  }
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