// src/scenes/Billing/Return.jsx
import React, { useEffect, useRef, useState } from "react";
import { Box, CircularProgress, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function BillingReturn() {
  const nav = useNavigate();
  const { billingStatus, billingLoading, refreshBilling } = useAuth();

  const [tries, setTries] = useState(0);
  const [error, setError] = useState("");

  const timerRef = useRef(null);

  // ✅ normalize once (avoids case mismatches)
  const status = (billingStatus || "").toLowerCase();

  // ✅ Treat "cancelling" as still paid (cancel_at_period_end)
  const isPaid = status === "trialing" || status === "active" || status === "cancelling";

  // Decide what "not paid" means in your product:
  // - "past_due" can be blocked (strict) or allowed (grace). Keeping strict here.
  const isKnownNotPaid =
    status === "none" ||
    status === "canceled" ||
    status === "cancelled" ||
    status === "incomplete" ||
    status === "incomplete_expired" ||
    status === "unpaid" ||
    status === "past_due";

  const isUnknown = status === "unknown" || status === "";

  // ✅ Always clear any pending timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // ✅ Kick one refresh immediately on mount
  useEffect(() => {
    refreshBilling?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ If paid, go dashboard immediately
  useEffect(() => {
    if (isPaid) {
      if (timerRef.current) clearTimeout(timerRef.current);
      nav("/dashboard", { replace: true });
    }
  }, [isPaid, nav]);

  // ✅ If we definitively know they are NOT paid, stop and go to billing immediately
  useEffect(() => {
    if (!billingLoading && isKnownNotPaid) {
      if (timerRef.current) clearTimeout(timerRef.current);
      nav("/billing", { replace: true });
    }
  }, [billingLoading, isKnownNotPaid, nav]);

  // ✅ Poll ONLY when status is unknown (i.e. we genuinely expect it may flip soon)
  useEffect(() => {
    // Don’t poll while loading is true (refreshBilling is already in-flight)
    if (billingLoading) return;

    // If status is known (paid or not paid), no polling.
    if (!isUnknown) return;

    // Max tries
    if (tries >= 15) {
      setError(
        "We didn’t receive confirmation from Stripe yet. If you completed checkout, wait a moment and try again."
      );
      return;
    }

    timerRef.current = setTimeout(async () => {
      try {
        await refreshBilling?.();
      } catch (e) {
        // ignore
      } finally {
        setTries((t) => t + 1);
      }
    }, 2000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [billingLoading, isUnknown, tries, refreshBilling]);

  // If they hit max tries, show manual actions
  const showSpinner = !error && (billingLoading || isUnknown);

  return (
    <Box sx={{ p: 3, maxWidth: 720, mx: "auto" }}>
      <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
        Finishing setup…
      </Typography>

      <Typography sx={{ color: "text.secondary", mb: 2 }}>
        We’re waiting for Stripe to confirm your subscription.
      </Typography>

      {showSpinner ? <CircularProgress /> : null}

      <Typography sx={{ color: "text.secondary", mt: 2, fontSize: 13 }}>
        Status: <b>{billingLoading ? "checking…" : String(status || "unknown")}</b> • Attempt{" "}
        {Math.min(tries + 1, 15)} of 15
      </Typography>

      {error ? (
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ color: "error.main", mb: 1 }}>{error}</Typography>

          <Button
            variant="contained"
            onClick={async () => {
              setError("");
              setTries(0);
              try {
                await refreshBilling?.();
              } catch (e) {
                // ignore
              }
            }}
          >
            Check again
          </Button>

          <Button sx={{ ml: 1 }} variant="outlined" onClick={() => nav("/billing", { replace: true })}>
            Back to billing
          </Button>
        </Box>
      ) : null}
    </Box>
  );
}
