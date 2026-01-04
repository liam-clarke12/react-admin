// billingCancel.js (CommonJS - tailored to Dynamo PK: cognitoSub)
const Stripe = require("stripe");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

const TABLE_NAME = process.env.TABLE_NAME;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

const stripe = new Stripe(STRIPE_SECRET_KEY || "", { apiVersion: "2024-06-20" });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "OPTIONS,POST",
};

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...corsHeaders },
    body: JSON.stringify(payload),
  };
}

function getClaims(event) {
  const httpClaims = event?.requestContext?.authorizer?.jwt?.claims;
  if (httpClaims && typeof httpClaims === "object") return httpClaims;

  const restClaims = event?.requestContext?.authorizer?.claims;
  if (restClaims && typeof restClaims === "object") return restClaims;

  return null;
}

function safeParseBody(event) {
  if (!event?.body) return {};
  try {
    return JSON.parse(event.body);
  } catch {
    return {};
  }
}

exports.handler = async (event) => {
  try {
    const method = event?.requestContext?.http?.method || event?.httpMethod;

    if (method === "OPTIONS") return { statusCode: 204, headers: corsHeaders, body: "" };

    if (!TABLE_NAME) return json(500, { ok: false, error: "Missing TABLE_NAME env var" });
    if (!STRIPE_SECRET_KEY) return json(500, { ok: false, error: "Missing STRIPE_SECRET_KEY env var" });

    const claims = getClaims(event);
    const cognitoSub = claims?.sub;
    const email = claims?.email;

    console.log("[billing/cancel] start", {
      method,
      cognitoSubPresent: !!cognitoSub,
      emailPresent: !!email,
      table: TABLE_NAME,
    });

    if (!cognitoSub) return json(401, { ok: false, error: "Unauthorized: missing JWT claim sub" });

    const body = safeParseBody(event);
    const immediate = !!body?.immediate;
    const reason = body?.reason || "user_initiated";

    // 1) Load user
    const getRes = await ddb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { cognitoSub },
        ConsistentRead: true,
      })
    );

    const user = getRes?.Item || null;
    console.log("[billing/cancel] user record found:", !!user);

    if (!user) {
      return json(404, { ok: false, error: "User record not found in Dynamo", cognitoSub });
    }

    const stripeCustomerId = user?.stripeCustomerId || null;
    const stripeSubscriptionId = user?.stripeSubscriptionId || null;

    if (!stripeCustomerId && !stripeSubscriptionId) {
      return json(404, {
        ok: false,
        error: "No Stripe IDs on user record (stripeCustomerId/stripeSubscriptionId missing)",
        cognitoSub,
      });
    }

    // 2) Determine subscription id
    let subId = stripeSubscriptionId;

    if (!subId && stripeCustomerId) {
      const subs = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: "all",
        limit: 10,
      });

      const activeLike =
        subs.data.find((s) => ["active", "trialing", "past_due", "unpaid"].includes(s.status)) ||
        subs.data[0];

      subId = activeLike?.id || null;

      if (!subId) {
        return json(404, { ok: false, error: "No Stripe subscription found for customer" });
      }
    }

    // 3) Cancel in Stripe
    let stripeSub;
    if (immediate) {
      stripeSub = await stripe.subscriptions.cancel(subId);
    } else {
      stripeSub = await stripe.subscriptions.update(subId, {
        cancel_at_period_end: true,
        metadata: {
          cancel_reason: reason,
          cancelled_by: "self_serve_portal",
          cancelled_by_email: email || "",
          cancelled_by_sub: cognitoSub,
        },
      });
    }

    const now = new Date().toISOString();

    // ✅ store as NUMBER (seconds) so /billing/subscription can format it
    const currentPeriodEnd = typeof stripeSub?.current_period_end === "number"
      ? stripeSub.current_period_end
      : null;

    const cancelAtPeriodEnd = !!stripeSub?.cancel_at_period_end;

    // ✅ derived billing status for YOUR app
    const billingStatus = immediate ? "cancelled" : (cancelAtPeriodEnd ? "cancelling" : (stripeSub?.status || "unknown"));

    // 4) Update Dynamo
    await ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { cognitoSub },
        UpdateExpression:
          "SET billingStatus = :bs, cancelAtPeriodEnd = :cape, currentPeriodEnd = :cpe, stripeCustomerId = if_not_exists(stripeCustomerId, :scid), stripeSubscriptionId = :ssid, updatedAt = :u",
        ExpressionAttributeValues: {
          ":bs": billingStatus,
          ":cape": cancelAtPeriodEnd,
          ":cpe": currentPeriodEnd,              // ✅ number (seconds) or null
          ":scid": stripeCustomerId || "",
          ":ssid": stripeSub?.id || subId,
          ":u": now,
        },
      })
    );

    return json(200, {
      ok: true,
      status: billingStatus,
      stripeStatus: stripeSub?.status || "unknown",
      cancelAtPeriodEnd,
      currentPeriodEnd, // seconds
      currentPeriodEndDate: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString().slice(0,10) : "",
    });
  } catch (err) {
    console.error("[billing/cancel] fatal:", err);
    return json(500, { ok: false, error: err?.message || "Internal error" });
  }
};
