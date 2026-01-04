import React from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { Box, Button, Typography, Paper } from "@mui/material";

const STRIPE_PAYMENT_LINK =
  "https://buy.stripe.com/test_cNi8wI6zcdRhfbneQn0gw00";

function getCognitoSub(user) {
  return user?.userId || user?.username || user?.attributes?.sub || null;
}

export default function Billing() {
  const { user } = useAuthenticator((ctx) => [ctx.user]);

  if (!user) return null;

  const cognitoSub = getCognitoSub(user);
  const email =
    user?.signInDetails?.loginId ||
    user?.attributes?.email ||
    "";

  const goToCheckout = () => {
    if (!cognitoSub) {
      alert("Preparing your account, please wait a second and try again.");
      return;
    }

    const url = new URL(STRIPE_PAYMENT_LINK);
    if (email) url.searchParams.set("prefilled_email", email);
    url.searchParams.set("client_reference_id", cognitoSub);

    window.location.href = url.toString();
  };

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        p: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 520,
          width: "100%",
          p: 4,
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          textAlign: "center",
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
          Start your free trial
        </Typography>

        <Typography sx={{ color: "text.secondary", mb: 3 }}>
          Hupes MRP Planner is <b>€124.99/month</b> after a 7-day free trial.
          Cancel anytime during the trial.
        </Typography>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            background: "#f8fafc",
            border: "1px solid #e5e7eb",
            mb: 3,
          }}
        >
          <Typography sx={{ fontWeight: 800 }}>
            What’s included
          </Typography>
          <Typography sx={{ fontSize: 14, mt: 1 }}>
            • Inventory & recipe tracking  
            • Production planning  
            • Full ingredient traceability  
            • Staff & role management  
          </Typography>
        </Box>

        <Button
          size="large"
          variant="contained"
          onClick={goToCheckout}
          sx={{
            borderRadius: "999px",
            px: 4,
            py: 1.5,
            fontWeight: 800,
          }}
        >
          Start 7-day free trial
        </Button>

        <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 2 }}>
          You’ll be redirected to Stripe Checkout to securely start your subscription.
        </Typography>
      </Paper>
    </Box>
  );
}
