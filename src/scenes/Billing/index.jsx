import React from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { Box, Button, Typography } from "@mui/material";

const STRIPE_PAYMENT_LINK =
  "https://buy.stripe.com/test_cNi8wI6zcdRhfbneQn0gw00";

function getCognitoSub(user) {
  return user?.userId || user?.username || user?.attributes?.sub || null;
}

export default function Billing() {
  const { user } = useAuthenticator((ctx) => [ctx.user]);

  const cognitoSub = getCognitoSub(user);
  const email = user?.signInDetails?.loginId || user?.attributes?.email || "";

  const goToCheckout = () => {
    const url =
      `${STRIPE_PAYMENT_LINK}` +
      `?prefilled_email=${encodeURIComponent(email)}` +
      `&client_reference_id=${encodeURIComponent(cognitoSub || "")}`;

    window.location.href = url;
  };

  return (
    <Box sx={{ p: 3, maxWidth: 720 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
        Start your 7-day free trial
      </Typography>

      <Typography sx={{ color: "text.secondary", mb: 2 }}>
        Hupes MRP Planner is <b>€124.99/month</b> after a 7-day free trial. Cancel anytime during the trial.
      </Typography>

      <Button variant="contained" onClick={goToCheckout}>
        Start free trial
      </Button>

      <Box sx={{ mt: 2 }}>
        <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
          You’ll be redirected to Stripe Checkout to securely start your subscription.
        </Typography>
      </Box>
    </Box>
  );
}
