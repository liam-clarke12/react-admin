// src/components/LandingPage.jsx
import React from "react";
import { Box, Button, Typography, Container, Grid } from "@mui/material";
import { useNavigate } from "react-router-dom";
import WarehouseImage from "../assets/pexels-shvetsa-5953694.jpg"; // replace with your image path
import CheckIcon from "@mui/icons-material/Check";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import Inventory2Icon from "@mui/icons-material/Inventory2";

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/login"); // redirect to login / Authenticator
  };

  return (
    <Box sx={{ fontFamily: "Roboto, sans-serif" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 2,
          px: 4,
          backgroundColor: "#fff",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <img src="/user.png" alt="Logo" style={{ height: 40, marginRight: 8 }} />
          <Typography variant="h6">LOGO</Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 3 }}>
          <Typography sx={{ cursor: "pointer" }}>Home</Typography>
          <Typography sx={{ cursor: "pointer" }}>Features</Typography>
          <Typography sx={{ cursor: "pointer" }}>About</Typography>
          <Typography sx={{ cursor: "pointer" }}>Contact</Typography>
        </Box>
      </Box>

      {/* Hero Section */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "46% 1fr" },
          minHeight: "90vh",
          background:
            "radial-gradient(800px 400px at 80% -20%, #ffe4ea 0%, rgba(255,228,234,0) 60%), linear-gradient(180deg, #fff 0%, #f8fafc 100%)",
        }}
      >
        {/* Left Hero Text */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            px: { xs: 3, md: 8 },
          }}
        >
          <img
            src="/user.png"
            alt="Logo"
            style={{ width: 90, height: 90, objectFit: "contain", marginBottom: 16 }}
          />
          <Typography
            variant="h2"
            sx={{ fontWeight: 900, mb: 3, lineHeight: 1.2, color: "#0f172a" }}
          >
            Efficient <br /> Inventory <br /> Management
          </Typography>
          <Typography sx={{ mb: 4, color: "#334155", fontSize: 16 }}>
            Track ingredients, plan production, and keep waste in check — all in one place.
          </Typography>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
            <li style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700 }}>
              <CheckIcon sx={{ color: "#e11d48" }} /> Real-time stock & barcodes
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700 }}>
              <ShowChartIcon sx={{ color: "#e11d48" }} /> Recipe-driven production
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700 }}>
              <Inventory2Icon sx={{ color: "#e11d48" }} /> Focused on product traceability
            </li>
          </ul>
          <Button
            variant="contained"
            sx={{
              mt: 4,
              borderRadius: "999px",
              padding: "12px 32px",
              fontWeight: 600,
              backgroundColor: "#e11d48",
              "&:hover": { backgroundColor: "#be123c" },
            }}
            onClick={handleGetStarted}
          >
            Get Started
          </Button>
        </Box>

        {/* Right Hero Image */}
        <Box sx={{ display: { xs: "none", md: "block" }, overflow: "hidden" }}>
          <img
            src={WarehouseImage}
            alt="Warehouse"
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 16 }}
          />
        </Box>
      </Box>

      {/* Features Section */}
      <Container sx={{ py: 10 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, textAlign: "center", mb: 6 }}
        >
          Streamline Your Inventory
        </Typography>
        <Grid container spacing={5} justifyContent="center">
          <Grid item xs={12} md={4} textAlign="center">
            <CheckIcon sx={{ fontSize: 50, color: "#e11d48", mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Real-Time Tracking
            </Typography>
            <Typography>
              Track inventory levels in <b>real-time</b> and reduce stockouts
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} textAlign="center">
            <ShowChartIcon sx={{ fontSize: 50, color: "#e11d48", mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Sales Insights
            </Typography>
            <Typography>
              Gain valuable insights into sales trends and product performance.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} textAlign="center">
            <Inventory2Icon sx={{ fontSize: 50, color: "#e11d48", mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Inventory Optimization
            </Typography>
            <Typography>
              Optimize stock levels and reduce excess inventory
            </Typography>
          </Grid>
        </Grid>
      </Container>

      {/* Footer */}
      <Box sx={{ height: 60, backgroundColor: "#e11d48" }} />
    </Box>
  );
};

export default LandingPage;
