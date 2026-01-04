// src/scenes/Billing/index.jsx
import React from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { Box, Button, Typography, Paper, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/test_cNi8wI6zcdRhfbneQn0gw00";

// Static dashboard preview image (NOT the real dashboard)
const DASH_PREVIEW_SRC = "/dashboard-preview.png";

function getCognitoSub(user) {
  return user?.userId || user?.username || user?.attributes?.sub || null;
}

export default function Billing() {
  const { user, signOut: amplifySignOut } = useAuthenticator((ctx) => [ctx.user]);
  const { signOut: appSignOut } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const cognitoSub = getCognitoSub(user);
  const email = user?.signInDetails?.loginId || user?.attributes?.email || "";

  const brand = {
    text: "#1e293b",
    subtext: "#64748b",
    primary: "#7C3AED",
    primaryDark: "#5B21B6",
    surface: "#ffffff",
    surfaceMuted: "#F8FAFC",
    border: "#f1f5f9",
  };

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

  // ✅ IMPORTANT: "Back" should actually sign them out,
  // otherwise Cognito session rehydrates and they bounce back to /billing.
  const handleBack = async () => {
    try {
      // App-level cleanup (your localStorage/cookie cleanup)
      await appSignOut?.();
    } catch (e) {
      // ignore
    }

    try {
      // Amplify/Cognito sign out
      await amplifySignOut?.();
    } catch (e) {
      // ignore
    }

    // Hard navigate to clear any router state
    window.location.assign("/");
  };

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        position: "relative",
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
        px: { xs: 2, md: 4 },
        py: { xs: 6, md: 10 },
        background: `linear-gradient(180deg, ${brand.surface} 0%, ${brand.surfaceMuted} 100%)`,
      }}
    >
      {/* Blurred dashboard preview background */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${DASH_PREVIEW_SRC})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          transform: "scale(1.04)",
          filter: "blur(5px)",
          opacity: 0.95,
        }}
      />

      {/* Softer overlay */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(900px 520px at 70% 10%, rgba(124,58,237,0.18) 0%, rgba(124,58,237,0) 60%)," +
            "linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(248,250,252,0.75) 100%)",
        }}
      />

      {/* Foreground card */}
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 560,
          borderRadius: "24px",
          border: `1px solid ${brand.border}`,
          backgroundColor: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
          p: { xs: 3, md: 4 },
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* Pill */}
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            px: 2,
            py: 0.6,
            borderRadius: "999px",
            bgcolor: "rgba(124, 91, 255, 0.1)",
            color: brand.primary,
            mb: 2.5,
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 0.4 }}>
            Subscription
          </Typography>
        </Box>

        <Typography variant="h4" sx={{ fontWeight: 900, color: brand.text, mb: 1 }}>
          Start your free trial
        </Typography>

        <Typography sx={{ color: brand.subtext, mb: 3, lineHeight: 1.7 }}>
          Hupes MRP Planner is <b>€124.99/month</b> after a 7-day free trial. Cancel anytime during the trial.
        </Typography>

        {/* Feature block */}
        <Box
          sx={{
            p: 2.25,
            borderRadius: "16px",
            border: `1px solid ${brand.border}`,
            background: brand.surfaceMuted,
            mb: 3,
          }}
        >
          <Typography sx={{ fontWeight: 900, color: brand.text, mb: 1 }}>
            What you get
          </Typography>

          <Stack spacing={1}>
            {[
              "Inventory, recipes & production planning",
              "Batch traceability & compliance logs",
              "Waste reduction & stock usage tracking"
            ].map((t) => (
              <Box key={t} sx={{ display: "flex", gap: 1.25 }}>
                <Box sx={{ color: brand.primary, fontWeight: 900 }}>✓</Box>
                <Typography sx={{ fontSize: 14, color: brand.subtext }}>{t}</Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button
            size="large"
            variant="contained"
            onClick={goToCheckout}
            sx={{
              flex: 1,
              py: 1.6,
              borderRadius: "12px",
              fontWeight: 800,
              textTransform: "none",
              backgroundColor: brand.primary,
              "&:hover": { backgroundColor: brand.primaryDark },
            }}
          >
            Start 7-day free trial
          </Button>

          {/* ✅ This is now a real "Back" (logs out) */}
          <Button
            size="large"
            variant="outlined"
            onClick={handleBack}
            sx={{
              py: 1.6,
              borderRadius: "12px",
              fontWeight: 800,
              textTransform: "none",
              borderColor: brand.border,
              color: brand.text,
            }}
          >
            Back
          </Button>
        </Stack>

        <Typography sx={{ fontSize: 12, color: brand.subtext, mt: 2 }}>
          You’ll be redirected to Stripe Checkout to securely start your subscription.
        </Typography>
      </Paper>
    </Box>
  );
}
