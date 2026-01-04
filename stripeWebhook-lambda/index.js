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
const {
  DynamoDBDocumentClient,
  UpdateCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const USERS_TABLE = process.env.USERS_TABLE || "Users";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

function deriveBillingStatus(sub) {
  // Stripe status can remain "trialing"/"active" even if cancellation is scheduled.
  const stripeStatus = sub?.status || "unknown";
  const cancelAtPeriodEnd = !!sub?.cancel_at_period_end;

  // ✅ Your app-level "cancelling" state
  if (cancelAtPeriodEnd) return "cancelling";

  // If Stripe actually cancelled immediately, it'll be "canceled"
  return stripeStatus;
}

async function updateUserBilling({
  cognitoSub,
  stripeCustomerId,
  stripeSubscriptionId,
  stripeStatus,
  billingStatus,
  cancelAtPeriodEnd,
  currentPeriodEnd,
}) {
  // ✅ Update (not Put) to avoid wiping other user fields
  await ddb.send(
    new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { cognitoSub },
      UpdateExpression: `
        SET
          billingStatus = :bs,
          stripeCustomerId = :scid,
          stripeSubscriptionId = :ssid,
          stripeStatus = :ss,
          cancelAtPeriodEnd = :cape,
          currentPeriodEnd = :cpe,
          updatedAt = :u
      `,
      ExpressionAttributeValues: {
        ":bs": billingStatus || "unknown",
        ":scid": stripeCustomerId || "",
        ":ssid": stripeSubscriptionId || "",
        ":ss": stripeStatus || "unknown",
        ":cape": !!cancelAtPeriodEnd,
        // store Stripe seconds as NUMBER (or null)
        ":cpe": typeof currentPeriodEnd === "number" ? currentPeriodEnd : null,
        ":u": new Date().toISOString(),
      },
    })
  );

  console.log("✅ Billing updated:", {
    cognitoSub,
    billingStatus,
    stripeStatus,
    cancelAtPeriodEnd: !!cancelAtPeriodEnd,
    currentPeriodEnd,
  });
}

async function findCognitoSubBySubscriptionId(stripeSubscriptionId) {
  // For testing only (scan). Later add a GSI on stripeSubscriptionId.
  const scanRes = await ddb.send(
    new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: "stripeSubscriptionId = :sid",
      ExpressionAttributeValues: { ":sid": stripeSubscriptionId },
      Limit: 1,
      ProjectionExpression: "cognitoSub",
    })
  );

  return scanRes.Items?.[0]?.cognitoSub || null;
}

exports.handler = async (event) => {
  const sig = event.headers?.["stripe-signature"] || event.headers?.["Stripe-Signature"];
  if (!sig) return { statusCode: 400, body: "Missing Stripe-Signature" };

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || "", "base64").toString("utf8")
    : (event.body || "");

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
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

        console.log("✅ Checkout completed:", {
          cognitoSubPresent: !!cognitoSub,
          stripeCustomerIdPresent: !!stripeCustomerId,
          stripeSubscriptionIdPresent: !!stripeSubscriptionId,
        });

        if (!cognitoSub || !stripeSubscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

        const stripeStatus = subscription.status || "unknown";
        const cancelAtPeriodEnd = !!subscription.cancel_at_period_end;
        const billingStatus = deriveBillingStatus(subscription);
        const currentPeriodEnd = subscription.current_period_end || null; // seconds

        await updateUserBilling({
          cognitoSub,
          stripeCustomerId,
          stripeSubscriptionId,
          stripeStatus,
          billingStatus,
          cancelAtPeriodEnd,
          currentPeriodEnd,
        });

        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.created":
      case "customer.subscription.deleted": {
        const sub = stripeEvent.data.object;

        const stripeSubscriptionId = sub.id;
        const stripeCustomerId = sub.customer;

        // ✅ IMPORTANT: derive "cancelling" from cancel_at_period_end
        const stripeStatus = sub.status || "unknown";
        const cancelAtPeriodEnd = !!sub.cancel_at_period_end;
        const billingStatus = deriveBillingStatus(sub);
        const currentPeriodEnd = sub.current_period_end || null; // seconds

        const cognitoSub = await findCognitoSubBySubscriptionId(stripeSubscriptionId);

        console.log("🔁 Subscription event:", {
          stripeSubscriptionId,
          stripeStatus,
          cancelAtPeriodEnd,
          derivedBillingStatus: billingStatus,
          cognitoSubFound: !!cognitoSub,
        });

        if (!cognitoSub) break;

        await updateUserBilling({
          cognitoSub,
          stripeCustomerId,
          stripeSubscriptionId,
          stripeStatus,
          billingStatus,
          cancelAtPeriodEnd,
          currentPeriodEnd,
        });

        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.log("❌ Webhook handler error:", err);
    // You can return 500 here if you want Stripe to retry, but for now keep 200.
  }

  return { statusCode: 200, body: "ok" };
};
