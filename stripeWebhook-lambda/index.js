// index.js (AWS Lambda - Stripe webhook + DynamoDB user billing status)
// Runtime: Node.js 20.x
// Handler: index.handler
//
// Env vars needed:
// - STRIPE_SECRET_KEY
// - STRIPE_WEBHOOK_SECRET
// - USERS_TABLE (defaults to "Users")

const Stripe = require("stripe");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const USERS_TABLE = process.env.USERS_TABLE || "Users";

// DynamoDB v3 client
const ddbClient = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(ddbClient);

async function upsertUserBilling({
  cognitoSub,
  billingStatus,
  stripeCustomerId,
  stripeSubscriptionId,
  currentPeriodEnd,
}) {
  await ddb.send(
    new PutCommand({
      TableName: USERS_TABLE,
      Item: {
        cognitoSub,
        billingStatus,
        stripeCustomerId,
        stripeSubscriptionId,
        currentPeriodEnd,
        updatedAt: new Date().toISOString(),
      },
    })
  );

  console.log("✅ Billing updated:", { cognitoSub, billingStatus });
}

exports.handler = async (event) => {
  const sig = event.headers?.["stripe-signature"] || event.headers?.["Stripe-Signature"];
  if (!sig) return { statusCode: 400, body: "Missing Stripe-Signature" };

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || "", "base64").toString("utf8")
    : (event.body || "");

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log("❌ Signature verification failed:", err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  console.log("📩 Stripe event received:", stripeEvent.type);

  try {
    switch (stripeEvent.type) {
      case "checkout.session.completed": {
        const session = stripeEvent.data.object;

        const cognitoSub = session.client_reference_id;
        const stripeCustomerId = session.customer;
        const stripeSubscriptionId = session.subscription;

        console.log("✅ Checkout completed:", { cognitoSub, stripeCustomerId, stripeSubscriptionId });

        if (!cognitoSub || !stripeSubscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

        await upsertUserBilling({
          cognitoSub,
          billingStatus: subscription.status,
          stripeCustomerId,
          stripeSubscriptionId,
          currentPeriodEnd: subscription.current_period_end || null,
        });

        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.created":
      case "customer.subscription.deleted": {
        const sub = stripeEvent.data.object;

        const stripeSubscriptionId = sub.id;
        const stripeCustomerId = sub.customer;
        const billingStatus = sub.status;
        const currentPeriodEnd = sub.current_period_end || null;

        // For testing only (scan). Later add a GSI on stripeSubscriptionId.
        const scanRes = await ddb.send(
          new ScanCommand({
            TableName: USERS_TABLE,
            FilterExpression: "stripeSubscriptionId = :sid",
            ExpressionAttributeValues: { ":sid": stripeSubscriptionId },
            Limit: 1,
          })
        );

        const cognitoSub = scanRes.Items?.[0]?.cognitoSub;

        console.log("🔁 Subscription event:", { stripeSubscriptionId, billingStatus, cognitoSub });

        if (!cognitoSub) break;

        await upsertUserBilling({
          cognitoSub,
          billingStatus,
          stripeCustomerId,
          stripeSubscriptionId,
          currentPeriodEnd,
        });

        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.log("❌ Webhook handler error:", err);
  }

  return { statusCode: 200, body: "ok" };
};
