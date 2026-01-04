// index.js (AWS Lambda - getBillingStatus) - CommonJS
// Runtime: Node.js 20.x
// Handler: index.handler
//
// Env vars:
// - USERS_TABLE = Users (optional)

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

const USERS_TABLE = process.env.USERS_TABLE || "Users";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // tighten later
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
};

exports.handler = async (event) => {
  // CORS preflight
  const method =
    event.requestContext?.http?.method ||
    event.httpMethod ||
    "GET";

  if (method === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }

  try {
    const qs = event.queryStringParameters || {};
    const cognitoSub = qs.cognitoSub;

    if (!cognitoSub) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ ok: false, error: "Missing cognitoSub" }),
      };
    }

    const res = await ddb.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { cognitoSub },
      })
    );

    const item = res.Item || null;

    // If no record yet, they are not paid (webhook hasn't written)
    if (!item) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          ok: true,
          user: {
            cognitoSub,
            billingStatus: "none",
            stripeCustomerId: null,
            stripeSubscriptionId: null,
            currentPeriodEnd: null,
          },
        }),
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        ok: true,
        user: {
          cognitoSub: item.cognitoSub,
          billingStatus: item.billingStatus || "none",
          stripeCustomerId: item.stripeCustomerId || null,
          stripeSubscriptionId: item.stripeSubscriptionId || null,
          currentPeriodEnd: item.currentPeriodEnd || null,
          updatedAt: item.updatedAt || null,
        },
      }),
    };
  } catch (err) {
    console.log("getBillingStatus error:", err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, error: "Server error" }),
    };
  }
};
