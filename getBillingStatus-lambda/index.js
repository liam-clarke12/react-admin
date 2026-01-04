// index.js (AWS Lambda - billing/subscription)
// Runtime: Node.js 20.x
// Handler: index.handler

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

const USERS_TABLE = process.env.USERS_TABLE || "Users";
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
};

function formatRenewsOn(currentPeriodEnd) {
  if (currentPeriodEnd === null || currentPeriodEnd === undefined || currentPeriodEnd === "") return "";
  const n = Number(currentPeriodEnd);
  if (!Number.isFinite(n)) return "";
  const ms = n > 10_000_000_000 ? n : n * 1000; // handles ms or seconds
  return new Date(ms).toISOString().slice(0, 10); // YYYY-MM-DD
}

function normalizeStatus(s) {
  if (!s) return "none";
  return String(s).trim().toLowerCase();
}

exports.handler = async (event) => {
  const method = event.requestContext?.http?.method || event.httpMethod || "GET";
  if (method === "OPTIONS") return { statusCode: 200, headers: corsHeaders, body: "" };
  if (method !== "GET") return { statusCode: 405, headers: corsHeaders, body: "Method Not Allowed" };

  try {
    const claims =
      event.requestContext?.authorizer?.jwt?.claims ||
      event.requestContext?.authorizer?.claims ||
      null;

    const cognitoSub = claims?.sub;

    if (!cognitoSub) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ ok: false, error: "Unauthorized (missing user sub)" }),
      };
    }

    const res = await ddb.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { cognitoSub },
        ConsistentRead: true, // ✅ important after cancel/update
      })
    );

    const item = res.Item || {};

    const status = normalizeStatus(item.billingStatus);
    const renewsOn = formatRenewsOn(item.currentPeriodEnd);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        ok: true,
        plan: item.plan || "—",
        status,
        renewsOn,
        // debug-friendly fields (safe to remove later)
        currentPeriodEndRaw: item.currentPeriodEnd ?? null,
        updatedAt: item.updatedAt ?? null,
      }),
    };
  } catch (err) {
    console.log("billing/subscription error:", err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, error: "Server error" }),
    };
  }
};
