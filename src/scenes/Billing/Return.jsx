import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

export default function BillingReturn() {
  return (
    <Box sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }}>
      <CircularProgress />
      <Typography sx={{ fontWeight: 700 }}>
        Payment complete — updating your access…
      </Typography>
    </Box>
  );
}
