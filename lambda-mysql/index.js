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

function addCorsHeaders(res, req) {
  try {
    const FRONTEND_ORIGIN = 'https://master.d2fdrxobxyr2je.amplifyapp.com';
    // If req is provided and has an Origin header, echo it when allowed (optional)
    const origin = (req && req.headers && req.headers.origin) || FRONTEND_ORIGIN;
    // Always set these headers so client receives them even on error responses
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  } catch (err) {
    // defensive: if res is already finished, don't let this blow up the request
    console.warn('addCorsHeaders failed:', err && err.message);
  }
}

const wrapAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

function registerGlobalErrorHandler(app) {
  app.use((err, req, res, next) => {
    // ensure CORS on the error response too
    try { addCorsHeaders(res, req); } catch (e) { /* ignore */ }

    // log stack/traces to CloudWatch for debugging
    console.error('Unhandled error in route:', {
      message: err && err.message,
      stack: err && err.stack,
      route: req && `${req.method} ${req.originalUrl}`,
      body: req && req.body,
      headers: req && req.headers && { origin: req.headers.origin },
    });

    // common error response (do not leak internals in prod)
    const status = (err && err.status) || 500;
    const payload = {
      message: status === 500 ? 'Internal server error' : err.message,
      // include details only if you want them visible in client (optional)
      ...(process.env.NODE_ENV !== 'production' ? { details: err && err.message } : {}),
    };

    try {
      res.status(status).json(payload);
    } catch (sendErr) {
      console.error('Failed to send JSON error response:', sendErr);
      try { res.sendStatus(500); } catch (e) { /* nothing */ }
    }
  });
}

registerGlobalErrorHandler(app);

async function syncIngredientInventoryForUser(userId) {
  const tag = "[syncIngredientInventoryForUser]";
  const conn = await db.promise().getConnection();
  try {
    console.info(`${tag} start for user=${userId}`);
    await conn.beginTransaction();

    // 1) Aggregate active goods_in per ingredient for this user
    const aggSql = `
      SELECT
        ingredient,
        COALESCE(SUM(stockRemaining), 0) AS amount
      FROM goods_in
      WHERE user_id = ? AND deleted_at IS NULL
      GROUP BY ingredient
    `;
    console.info(`${tag} executing aggregation`, { sql: aggSql, params: [userId] });
    const [aggRows] = await conn.execute(aggSql, [userId]);

    // Convert to map for easy lookup
    const ingredientMap = new Map(); // ingredient -> amount
    for (const r of aggRows) {
      const name = r.ingredient;
      const amount = Number(r.amount || 0);
      ingredientMap.set(name, amount);
    }

    // 2) For each ingredient in map, find a representative barcode (earliest expiryDate)
    // We'll also collect unit if goods_in has unit.
    const upsertSql = `
      INSERT INTO ingredient_inventory (ingredient, amount, barcode, unit, user_id)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        amount = VALUES(amount),
        barcode = VALUES(barcode),
        unit = VALUES(unit)
    `;

    // For ingredients that have zero amount (i.e. no active goods), we'll set amount = 0.
    // You may prefer to delete rows with zero amount — adjust below if desired.

    for (const [ingredient, amount] of ingredientMap.entries()) {
      // Attempt to pick the barcode with earliest expiryDate (fallback to any barcode)
      const barcodeSql = `
        SELECT barCode, unit
        FROM goods_in
        WHERE user_id = ? AND ingredient = ? AND deleted_at IS NULL
        ORDER BY expiryDate IS NULL, expiryDate ASC, date ASC
        LIMIT 1
      `;
      const [pickRows] = await conn.execute(barcodeSql, [userId, ingredient]);
      let barcode = null;
      let unit = null;
      if (Array.isArray(pickRows) && pickRows.length > 0) {
        barcode = pickRows[0].barCode || null;
        unit = pickRows[0].unit || null;
      }

      // Upsert to inventory
      console.info(`${tag} upserting ingredient`, { ingredient, amount, barcode, unit });
      await conn.execute(upsertSql, [ingredient, amount, barcode, unit, userId]);
    }

    // 3) OPTIONAL: If you want ingredient_inventory rows for ingredients that no longer exist
    // in goods_in to be removed or zeroed out, handle here. We'll set any not present to amount = 0.
    // Fetch all inventory ingredients for user to find stale rows.
    const [invRows] = await conn.execute(`SELECT ingredient FROM ingredient_inventory WHERE user_id = ?`, [userId]);
    for (const inv of invRows) {
      if (!ingredientMap.has(inv.ingredient)) {
        // Set to 0 and null barcode/unit (or delete if you prefer)
        console.info(`${tag} zeroing stale inventory for`, inv.ingredient);
        await conn.execute(
          `UPDATE ingredient_inventory SET amount = 0, barcode = NULL, unit = NULL WHERE ingredient = ? AND user_id = ?`,
          [inv.ingredient, userId]
        );
        // alternatively: await conn.execute(`DELETE FROM ingredient_inventory WHERE ingredient = ? AND user_id = ?`, [inv.ingredient, userId]);
      }
    }

    await conn.commit();
    console.info(`${tag} committed for user=${userId}`);
    return { success: true };
  } catch (err) {
    try { await conn.rollback(); } catch (e) { console.error("[sync] rollback failed", e); }
    console.error("[sync] error:", err && err.stack ? err.stack : err);
    throw err;
  } finally {
    try { conn.release(); } catch (e) { console.warn("[sync] release failed", e); }
  }
}

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

// POST /api/submit/batch
app.post("/api/submit/batch", async (req, res) => {
  const { entries, cognito_id } = req.body;

  // Allow your frontend origin (same as single route)
  res.setHeader('Access-Control-Allow-Origin', 'https://master.d2fdrxobxyr2je.amplifyapp.com');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ success: false, error: "entries must be a non-empty array" });
  }
  if (!cognito_id) {
    return res.status(400).json({ success: false, error: "cognito_id is required" });
  }

  // Validate entries quickly before DB work (collect errors)
  const invalid = entries
    .map((e, i) => {
      const missing = [];
      if (!e.date) missing.push("date");
      if (!e.ingredient) missing.push("ingredient");
      if (e.stockReceived === undefined || e.stockReceived === null) missing.push("stockReceived");
      if (!e.unit) missing.push("unit");
      if (!e.barCode) missing.push("barCode");
      if (!e.expiryDate) missing.push("expiryDate");
      if (e.temperature === undefined || e.temperature === null) missing.push("temperature");
      return missing.length ? { index: i, missing } : null;
    })
    .filter(Boolean);

  if (invalid.length) {
    return res.status(400).json({ success: false, error: "Validation failed for some entries", details: invalid });
  }

  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();

    const insertedIds = [];
    for (const entry of entries) {
      // Normalize numeric stock
      const stock = Number(entry.stockReceived) || 0;

      const goodsInQuery = `
        INSERT INTO goods_in
          (date, ingredient, stockReceived, stockRemaining, barCode, expiryDate, temperature, unit, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [goodsRes] = await connection.execute(goodsInQuery, [
        entry.date,
        entry.ingredient,
        stock,
        stock, // initial remaining
        entry.barCode,
        entry.expiryDate,
        entry.temperature,
        entry.unit,
        cognito_id,
      ]);
      insertedIds.push(goodsRes.insertId);

      // upsert inventory
      const ingredientInventoryQuery = `
        INSERT INTO ingredient_inventory (ingredient, amount, barcode, unit)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE amount = amount + VALUES(amount)
      `;
      await connection.execute(ingredientInventoryQuery, [
        entry.ingredient,
        stock,
        entry.barCode,
        entry.unit,
      ]);
    }

    await connection.commit();
    return res.status(200).json({
      success: true,
      message: `Inserted ${insertedIds.length} entries`,
      insertedIds,
    });
  } catch (err) {
    await connection.rollback();
    console.error("Batch submit DB error:", { message: err.message, stack: err.stack });
    return res.status(500).json({ success: false, error: "Database error", details: err.message });
  } finally {
    connection.release();
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

app.put("/api/goods-in/:barcode", async (req, res) => {
  const startTs = new Date().toISOString();
  const log = (tag, obj) => console.info(`[PUT.goods-in] ${tag}`, typeof obj === "string" ? obj : JSON.stringify(obj));

  const originalPathBarcode = req.params.barcode;
  const {
    date,
    ingredient,
    temperature,
    stockReceived,
    stockRemaining,
    unit,
    expiryDate,
    barCode: newBarCode, // new barcode (optional) supplied in body
    cognito_id,
  } = req.body || {};

  log("Request start", { startTs, originalPathBarcode, body: req.body });

  if (!originalPathBarcode) {
    log("Missing path barcode", {});
    return res.status(400).json({ error: "barcode is required in path" });
  }
  if (!cognito_id) {
    log("Missing cognito_id", {});
    return res.status(400).json({ error: "cognito_id is required" });
  }

  const conn = await db.promise().getConnection();
  try {
    await conn.beginTransaction();
    log("Started DB transaction for user", cognito_id);

    // 1) Find the row by the path barcode AND user_id (and not soft-deleted)
    const selectSql = `SELECT * FROM goods_in WHERE barCode = ? AND user_id = ? AND deleted_at IS NULL LIMIT 1`;
    log("Executing", { sql: selectSql, params: [originalPathBarcode, cognito_id] });
    const [rows] = await conn.execute(selectSql, [originalPathBarcode, cognito_id]);

    if (!rows || rows.length === 0) {
      // Diagnostic queries to help CloudWatch debugging
      log("Exact match rows.length", rows ? rows.length : 0);
      const diag1Sql = `SELECT id, barCode, user_id, deleted_at FROM goods_in WHERE TRIM(LOWER(barCode)) = TRIM(LOWER(?)) LIMIT 10`;
      log("Running diagnostic query 1", { sql: diag1Sql, params: [originalPathBarcode] });
      const [diagRows] = await conn.execute(diag1Sql, [originalPathBarcode]);
      log("diagRows.length", diagRows ? diagRows.length : 0);
      const diag2Sql = `SELECT id, barCode, user_id, deleted_at FROM goods_in WHERE barCode LIKE ? LIMIT 10`;
      log("Running diagnostic query 2 (LIKE)", { sql: diag2Sql, params: [`%${originalPathBarcode}%`] });
      const [likeRows] = await conn.execute(diag2Sql, [`%${originalPathBarcode}%`]);
      log("likeRows.length", likeRows ? likeRows.length : 0);

      await conn.rollback();
      return res.status(404).json({
        error: "No matching goods_in row found for that barCode/user",
        debug: {
          message: "No exact match for this user. Nearby barcodes (if any):",
          exactMatches: diagRows || [],
          likeMatches: likeRows || [],
        },
      });
    }

    const existing = rows[0];
    log("Found existing row", { id: existing.id, barCode: existing.barCode, user_id: existing.user_id });

    // If client wants to change barcode, check unique constraint for the same user.
    if (typeof newBarCode === "string" && newBarCode.trim() && newBarCode !== existing.barCode) {
      const checkSql = `SELECT COUNT(*) AS cnt FROM goods_in WHERE barCode = ? AND user_id = ? AND deleted_at IS NULL`;
      log("Checking new barcode uniqueness", { sql: checkSql, params: [newBarCode, cognito_id] });
      const [chk] = await conn.execute(checkSql, [newBarCode, cognito_id]);
      const conflict = (Array.isArray(chk) && chk[0] && chk[0].cnt) ? Number(chk[0].cnt) > 0 : false;
      log("Barcode conflict check", { conflict, chk });

      if (conflict) {
        await conn.rollback();
        return res.status(409).json({ error: "Conflict: new barCode already exists for this user" });
      }
    }

    // Build update set (allow updating barCode too)
    const updateCols = [];
    const params = [];

    if (date !== undefined) {
      updateCols.push("date = ?");
      params.push(date);
    }
    if (ingredient !== undefined) {
      updateCols.push("ingredient = ?");
      params.push(ingredient);
    }
    if (temperature !== undefined) {
      updateCols.push("temperature = ?");
      params.push(temperature);
    }
    if (stockReceived !== undefined) {
      updateCols.push("stockReceived = ?");
      params.push(Number(stockReceived));
    }
    if (stockRemaining !== undefined) {
      updateCols.push("stockRemaining = ?");
      params.push(Number(stockRemaining));
    }
    if (unit !== undefined) {
      updateCols.push("unit = ?");
      params.push(unit);
    }
    if (expiryDate !== undefined) {
      updateCols.push("expiryDate = ?");
      params.push(expiryDate);
    }
    // IMPORTANT: support changing the barcode on update
    if (newBarCode !== undefined) {
      updateCols.push("barCode = ?");
      params.push(newBarCode);
    }

    if (updateCols.length === 0) {
      await conn.rollback();
      log("No updatable fields supplied", {});
      return res.status(400).json({ error: "No updatable fields supplied" });
    }

    // append WHERE params
    params.push(originalPathBarcode, cognito_id);

    const updateSql = `UPDATE goods_in SET ${updateCols.join(", ")} WHERE barCode = ? AND user_id = ? AND deleted_at IS NULL`;
    log("Executing update", { sql: updateSql, params });
    const [updateRes] = await conn.execute(updateSql, params);
    log("Update result", updateRes);

    // Recompute inventory for user (function assumed present)
    try {
      log("Calling syncIngredientInventoryForUser", { user: cognito_id });
      await syncIngredientInventoryForUser(cognito_id);
    } catch (syncErr) {
      // non-fatal: log, but proceed to commit (you might want to handle differently)
      log("syncIngredientInventoryForUser failed", { error: syncErr && syncErr.message ? syncErr.message : String(syncErr) });
    }

    await conn.commit();
    log("Transaction committed", {});

    // Return updated row (fresh from DB)
    const [updatedRows] = await conn.execute(`SELECT * FROM goods_in WHERE barCode = ? AND user_id = ? LIMIT 1`, [ newBarCode || originalPathBarcode, cognito_id ]);
    log("Selected updated row", { updatedRows: (updatedRows && updatedRows[0]) ? { id: updatedRows[0].id, barCode: updatedRows[0].barCode } : null });

    return res.json({ success: true, updated: (updatedRows && updatedRows[0]) ? updatedRows[0] : null });
  } catch (err) {
    try { await conn.rollback(); } catch (e) { log("Rollback failed", { err: e && e.message ? e.message : e }); }
    log("Database error (update)", { error: err && err.message ? err.message : String(err), stack: err && err.stack ? err.stack : null });
    return res.status(500).json({ error: "Database error", details: err.message || String(err) });
  } finally {
    try { conn.release(); } catch (e) { log("Conn release failed", { err: e && e.message ? e.message : e }); }
    log("Finished handler", {});
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

app.put("/api/recipes/:id", async (req, res) => {
  const recipeId = req.params.id;
  const FRONTEND_ORIGIN = "https://master.d2fdrxobxyr2je.amplifyapp.com";
  const { recipe, upb, ingredients, quantities, units, cognito_id } = req.body;

  res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (!recipeId) return res.status(400).json({ error: "recipe id required in path" });
  if (!cognito_id) return res.status(400).json({ error: "cognito_id is required" });
  if (!recipe) return res.status(400).json({ error: "recipe name is required" });
  if (!Array.isArray(ingredients) || !Array.isArray(quantities) || !Array.isArray(units) || ingredients.length !== quantities.length || ingredients.length !== units.length) {
    return res.status(400).json({ error: "ingredients, quantities, units arrays must be same length" });
  }

  const conn = await db.promise().getConnection();
  try {
    console.info(`[PUT.recipes] Starting transaction for recipe=${recipeId} user=${cognito_id}`);
    await conn.beginTransaction();

    // Verify ownership
    const [found] = await conn.execute(`SELECT id, user_id FROM recipes WHERE id = ? LIMIT 1`, [recipeId]);
    if (!found || found.length === 0 || String(found[0].user_id) !== String(cognito_id)) {
      await conn.rollback();
      console.warn(`[PUT.recipes] recipe not found or not owned: recipe=${recipeId}, user=${cognito_id}`);
      return res.status(404).json({ error: "Recipe not found or not owned by user" });
    }

    // Update recipe meta
    await conn.execute(`UPDATE recipes SET recipe_name = ?, units_per_batch = ? WHERE id = ?`, [recipe, upb, recipeId]);

    // Delete existing recipe_ingredients for this recipe and user
    await conn.execute(`DELETE FROM recipe_ingredients WHERE recipe_id = ? AND user_id = ?`, [recipeId, cognito_id]);

    // For each provided ingredient name, ensure an ingredient row exists for the user (find or create), then insert into recipe_ingredients
    for (let i = 0; i < ingredients.length; i++) {
      const ingName = String(ingredients[i]).trim();
      const qty = quantities[i];
      const unitVal = units[i];

      if (!ingName) {
        // skip blank names but log this unusual case
        console.warn(`[PUT.recipes] Skipping empty ingredient at index ${i} for recipe ${recipeId}`);
        continue;
      }

      // find ingredient for user
      const [ingRows] = await conn.execute(`SELECT id FROM ingredients WHERE ingredient_name = ? AND user_id = ? LIMIT 1`, [ingName, cognito_id]);
      let ingredientId;
      if (ingRows && ingRows.length) {
        ingredientId = ingRows[0].id;
      } else {
        const [ins] = await conn.execute(`INSERT INTO ingredients (ingredient_name, user_id) VALUES (?, ?)`, [ingName, cognito_id]);
        ingredientId = ins.insertId;
      }

      // insert recipe_ingredient
      await conn.execute(
        `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit, user_id) VALUES (?, ?, ?, ?, ?)`,
        [recipeId, ingredientId, qty, unitVal, cognito_id]
      );
    }

    await conn.commit();
    console.info(`[PUT.recipes] Commit successful recipe=${recipeId} user=${cognito_id}`);

    // Return updated recipe (reselect)
    const [updatedRows] = await db.promise().execute(
      `SELECT r.id as recipe_id, r.recipe_name, r.units_per_batch,
              i.ingredient_name, ri.quantity, ri.unit
       FROM recipes r
       JOIN recipe_ingredients ri ON ri.recipe_id = r.id
       JOIN ingredients i ON i.id = ri.ingredient_id
       WHERE r.id = ? AND r.user_id = ?
    `,
      [recipeId, cognito_id]
    );

    return res.json({ success: true, updated: updatedRows });
  } catch (err) {
    await conn.rollback();
    console.error("[PUT.recipes] DB error, rollback:", err);
    return res.status(500).json({ error: "Database error", details: err.message });
  } finally {
    conn.release();
  }
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

// GET /api/recipes/:id - detailed logging
app.get("/api/recipes/:id", async (req, res) => {
  const recipeId = req.params.id;
  const cognito_id = req.query.cognito_id;
  const start = Date.now();

  // set CORS to match other routes you have
  res.setHeader("Access-Control-Allow-Origin", "https://master.d2fdrxobxyr2je.amplifyapp.com");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  console.info(`[GET.recipes.id] incoming request recipeId=${recipeId} query=${JSON.stringify(req.query)} headers=${JSON.stringify(req.headers)}`);

  if (!recipeId) {
    console.warn("[GET.recipes.id] missing recipeId in params");
    return res.status(400).json({ error: "recipe id required in path" });
  }
  if (!cognito_id) {
    console.warn("[GET.recipes.id] missing cognito_id in query");
    return res.status(400).json({ error: "cognito_id is required" });
  }

  try {
    // Query recipe + its ingredients
    const sql = `
      SELECT r.id as recipe_id,
             r.recipe_name,
             r.units_per_batch,
             ri.id as recipe_ingredient_id,
             ri.quantity,
             ri.unit,
             i.id as ingredient_id,
             i.ingredient_name
      FROM recipes r
      LEFT JOIN recipe_ingredients ri ON ri.recipe_id = r.id AND ri.user_id = r.user_id
      LEFT JOIN ingredients i ON i.id = ri.ingredient_id AND i.user_id = r.user_id
      WHERE r.id = ? AND r.user_id = ?
    `;
    console.info(`[GET.recipes.id] Executing query: ${sql.trim()} -- params: [${recipeId}, ${cognito_id}]`);

    const [rows] = await db.promise().execute(sql, [recipeId, cognito_id]);

    console.info(`[GET.recipes.id] Query returned rows.length=${rows && rows.length}`);

    if (!rows || rows.length === 0) {
      console.warn(`[GET.recipes.id] Not found or not owned by user: recipe=${recipeId} user=${cognito_id}`);
      return res.status(404).json({ error: "Recipe not found or not owned by user" });
    }

    // build response shape
    const recipeMeta = rows[0];
    const ingredients = rows
      .filter((r) => r.ingredient_name !== null)
      .map((r) => ({
        recipe_ingredient_id: r.recipe_ingredient_id,
        ingredient_id: r.ingredient_id,
        ingredient_name: r.ingredient_name,
        quantity: r.quantity,
        unit: r.unit,
      }));

    const payload = {
      recipe_id: recipeMeta.recipe_id,
      recipe_name: recipeMeta.recipe_name,
      units_per_batch: recipeMeta.units_per_batch,
      ingredients,
    };

    console.info(`[GET.recipes.id] Responding (${Date.now() - start}ms) payload.items=${ingredients.length}`);
    return res.json(payload);
  } catch (err) {
    console.error("[GET.recipes.id] DB error:", { message: err.message, stack: err.stack });
    return res.status(500).json({ error: "Database error", details: err.message });
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

app.put("/api/production-log/:batchCode", async (req, res) => {
  const { batchCode } = req.params;
  const body = req.body || {};
  const {
    date,
    recipe,
    batchesProduced,
    // client may send units_of_waste (snake) or unitsOfWaste (camel)
    units_of_waste,
    unitsOfWaste,
    // client-editable value (NOT a DB column): when present, this drives batchRemaining
    unitsRemaining,
    cognito_id,
  } = body;

  console.info("[PUT.production-log] called", { batchCode, body });

  if (!batchCode) return res.status(400).json({ error: "batchCode is required in path" });
  if (!cognito_id) return res.status(400).json({ error: "cognito_id is required" });

  const conn = await db.promise().getConnection();
  try {
    await conn.beginTransaction();
    console.info("[PUT.production-log] transaction started for user:", cognito_id);

    // fetch existing row
    const [existingRows] = await conn.execute(
      `SELECT * FROM production_log WHERE batchCode = ? AND user_id = ? AND deleted_at IS NULL LIMIT 1`,
      [batchCode, cognito_id]
    );

    if (!existingRows || !existingRows.length) {
      await conn.rollback();
      console.warn("[PUT.production-log] no matching row found for", { batchCode, cognito_id });
      return res.status(404).json({ error: "No matching production_log row found for that batchCode/user" });
    }
    const existing = existingRows[0];

    // resolve units_of_waste value (prefer explicit in body; otherwise keep existing)
    const newUnitsOfWaste =
      units_of_waste !== undefined ? Number(units_of_waste)
      : unitsOfWaste !== undefined ? Number(unitsOfWaste)
      : Number(existing.units_of_waste || 0);

    // Determine recipe to use for the lookup (body.recipe overrides existing.recipe)
    const recipeToUse = (recipe !== undefined && recipe !== null && String(recipe).trim() !== "")
      ? recipe
      : existing.recipe;

    // Fetch units_per_batch (UPB) for recipe (scoped to user) — needed only to return batchesRemaining in response
    let upb = 0;
    try {
      const [recipeRows] = await conn.execute(
        `SELECT id, units_per_batch FROM recipes WHERE recipe_name = ? AND user_id = ? LIMIT 1`,
        [recipeToUse, cognito_id]
      );
      if (Array.isArray(recipeRows) && recipeRows.length) {
        upb = Number(recipeRows[0].units_per_batch || 0) || 0;
      } else {
        upb = 0;
      }
    } catch (err) {
      console.warn("[PUT.production-log] warning: failed to lookup recipe UPB:", err && err.message ? err.message : err);
      upb = 0;
    }

    // DECISION: Only update batchRemaining when client supplies unitsRemaining explicitly.
    // If unitsRemaining provided => compute batchRemaining_units = unitsRemaining + units_of_waste
    // If not provided => DO NOT touch batchRemaining (leave DB value unchanged).
    let computedBatchRemainingUnits = null; // null => do not update DB batchRemaining

    if (unitsRemaining !== undefined && unitsRemaining !== null && unitsRemaining !== "") {
      const uRem = Number(unitsRemaining || 0);
      computedBatchRemainingUnits = uRem + (Number(newUnitsOfWaste) || 0);
      console.info("[PUT.production-log] will update batchRemaining (units) from unitsRemaining:", {
        unitsRemaining: uRem,
        units_of_waste: newUnitsOfWaste,
        batchRemaining_units: computedBatchRemainingUnits
      });
    } else {
      console.info("[PUT.production-log] unitsRemaining not supplied by client — will NOT modify batchRemaining");
    }

    // Build update columns for DB (only real DB columns)
    const updateCols = [];
    const params = [];

    if (date !== undefined) { updateCols.push("date = ?"); params.push(date); }
    if (recipe !== undefined) { updateCols.push("recipe = ?"); params.push(recipe); }
    if (batchesProduced !== undefined) { updateCols.push("batchesProduced = ?"); params.push(Number(batchesProduced)); }

    // Only include batchRemaining if we computed it from unitsRemaining above
    if (computedBatchRemainingUnits !== null) {
      updateCols.push("batchRemaining = ?");
      params.push(Number(computedBatchRemainingUnits));
    }

    // Update units_of_waste if explicitly provided (either name)
    if (units_of_waste !== undefined || unitsOfWaste !== undefined) {
      updateCols.push("units_of_waste = ?");
      params.push(Number(newUnitsOfWaste));
    }

    if (updateCols.length === 0) {
      await conn.rollback();
      console.warn("[PUT.production-log] nothing to update");
      return res.status(400).json({ error: "No updatable fields supplied" });
    }

    // add WHERE params
    params.push(batchCode, cognito_id);

    const updateSql = `UPDATE production_log SET ${updateCols.join(", ")} WHERE batchCode = ? AND user_id = ? AND deleted_at IS NULL`;
    console.info("[PUT.production-log] Executing update:", updateSql, "params:", params);
    await conn.execute(updateSql, params);

    // Re-select the updated row and join recipe UPB for the response, compute derived fields server-side
    const [updatedRows] = await conn.execute(
      `SELECT pl.*, COALESCE(r.units_per_batch,0) AS units_per_batch
       FROM production_log pl
       LEFT JOIN recipes r ON r.recipe_name = pl.recipe AND r.user_id = pl.user_id
       WHERE pl.batchCode = ? AND pl.user_id = ? LIMIT 1`,
      [batchCode, cognito_id]
    );

    if (!updatedRows || !updatedRows.length) {
      await conn.rollback();
      console.error("[PUT.production-log] failed to fetch updated row after update");
      return res.status(500).json({ error: "Failed to fetch updated row" });
    }

    const updated = updatedRows[0];
    // compute returned derived values (server truth)
    const returnedBatchRemainingUnits = Number(updated.batchRemaining || 0);
    const returnedUnitsOfWaste = Number(updated.units_of_waste || 0);
    const returnedUnitsRemaining = returnedBatchRemainingUnits - returnedUnitsOfWaste;
    const returnedUPB = Number(updated.units_per_batch || 0);
    const returnedBatchesRemaining = returnedUPB > 0 ? Number(returnedUnitsRemaining) / returnedUPB : null;

    await conn.commit();
    console.info("[PUT.production-log] commit successful, returning updated row with derived fields");

    return res.json({
      success: true,
      updated: {
        ...updated,
        unitsRemaining: returnedUnitsRemaining,
        batchesRemaining: returnedBatchesRemaining,
      },
    });
  } catch (err) {
    await conn.rollback().catch(() => {});
    console.error("[PUT.production-log] DB error:", err && err.message ? err.message : err);
    return res.status(500).json({ error: "Database error", details: err && err.message ? err.message : String(err) });
  } finally {
    conn.release();
  }
});

/* Helper: syncProductionInventoryForUser (simple template) */
async function syncProductionInventoryForUser(cognito_id, connArg = null) {
  const conn = connArg || (await db.promise().getConnection());
  let mustRelease = !connArg;
  try {
    console.info("[syncProductionInventoryForUser] computing totals for user:", cognito_id);
    const sql = `
      SELECT recipe, SUM(COALESCE(unitsRemaining, 0)) AS totalUnitsRemaining
      FROM production_log
      WHERE user_id = ? AND deleted_at IS NULL
      GROUP BY recipe
    `;
    const [rows] = await conn.execute(sql, [cognito_id]);
    console.info("[syncProductionInventoryForUser] rows:", rows.length);

    for (const r of rows) {
      // Upsert into production_inventory (example table)
      await conn.execute(
        `INSERT INTO production_inventory (recipe, amount, user_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE amount = VALUES(amount)`,
        [r.recipe, Number(r.totalUnitsRemaining || 0), cognito_id]
      );
    }
    console.info("[syncProductionInventoryForUser] done");
  } catch (err) {
    console.error("[syncProductionInventoryForUser] error:", err);
    throw err;
  } finally {
    if (mustRelease) conn.release();
  }
}

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
    return res.status(400).json({ error: "All fields are required, including cognito_id" });
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

    // If stockAmount is actually UNITS, use the next line instead of the one after it:
    // const batchesToDeduct = Math.ceil(Number(stockAmount) / unitsPerBatch);
    const batchesToDeduct = Math.ceil(Number(stockAmount));
    console.log(`Stock amount ${stockAmount} => ${batchesToDeduct} batch(es) to deduct`);

    // 1) Insert goods_out record
    const goodsOutQuery = `
      INSERT INTO goods_out (date, recipe, stockAmount, recipients, user_id)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [goodsOutResult] = await connection.execute(goodsOutQuery, [
      date, recipe, stockAmount, recipients, cognito_id,
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
          AND deleted_at IS NULL
        ORDER BY id ASC`, // FIFO
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
      // Decide if you want to rollback here instead of committing a partial deduction.
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