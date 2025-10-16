// src/components/LandingPage.jsx
import React from "react";
import { Box, Button, Typography, Container, Grid } from "@mui/material";
import { useNavigate } from "react-router-dom";
import CheckIcon from "@mui/icons-material/Check";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import Inventory2Icon from "@mui/icons-material/Inventory2";

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/login");
  };

  const handleSignIn = () => {
    navigate("/login");
  };

  const handleNavClick = (item) => {
    if (item === "Contact") {
      navigate("/contact");
      return;
    }
    if (item === "Features") {
      navigate("/features");
      return;
    }
    if (item === "About") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goHome = () => navigate("/");

  // Brand tokens (Pantone-accent update)
  const brand = {
    text: "#0f172a",
    subtext: "#334155",
    border: "#e5e7eb",
    surface: "#ffffff",
    surfaceMuted: "#f8fafc",
    primary: "#A3CDD5", // Pantone 13-4520 TCX
    primaryDark: "#82A4AA",
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
          backgroundColor: brand.surface,
          borderBottom: `1px solid ${brand.border}`,
        }}
      >
        {/* Logo & Brand Name (clickable → landing page) */}
        <Box
          onClick={goHome}
          role="button"
          aria-label="Go to home"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            cursor: "pointer",
            userSelect: "none",
            "&:hover .brand-text": { color: brand.primaryDark },
          }}
        >
          <Typography
            className="brand-text"
            sx={{
              fontWeight: "bold",
              fontSize: "1.25rem",
              color: brand.text,
              transition: "color .15s ease",
            }}
          >
            Hupes
          </Typography>
          <img
            src="/user.png"
            alt="Logo"
            style={{ height: 40, marginRight: 8, pointerEvents: "none" }}
          />
        </Box>

        {/* Navigation + Sign In Button */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          {["Features", "About", "Contact"].map((item) => (
            <Typography
              key={item}
              onClick={() => handleNavClick(item)}
              sx={{
                cursor: "pointer",
                fontWeight: "bold",
                color: brand.primary,
                "&:hover": { color: brand.primaryDark },
                transition: "color .15s ease",
              }}
            >
              {item}
            </Typography>
          ))}
          <Button
            variant="contained"
            sx={{
              borderRadius: "999px",
              padding: "6px 20px",
              fontWeight: 600,
              backgroundColor: brand.primary,
              "&:hover": { backgroundColor: brand.primaryDark },
              textTransform: "none",
            }}
            onClick={handleSignIn}
          >
            Sign In
          </Button>
        </Box>
      </Box>

      {/* Hero Section */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "46% 1fr" },
          minHeight: "90vh",
          background:
            `radial-gradient(800px 400px at 80% -20%, rgba(163,205,213,0.18) 0%, rgba(163,205,213,0) 60%), linear-gradient(180deg, ${brand.surface} 0%, ${brand.surfaceMuted} 100%)`,
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
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              mb: 3,
              lineHeight: 1.2,
              color: brand.text,
              fontSize: { xs: "2rem", md: "2.8rem" },
            }}
          >
            Efficient <br /> Inventory <br /> Management
          </Typography>
          <Typography sx={{ mb: 4, color: brand.subtext, fontSize: 16 }}>
            Track ingredients, plan production, and keep waste in check all in one place.
          </Typography>
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "grid",
              gap: 10,
            }}
          >
            <li
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontWeight: 700,
              }}
            >
              <CheckIcon sx={{ color: brand.primary }} /> Real-time stock & barcodes
            </li>
            <li
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontWeight: 700,
              }}
            >
              <ShowChartIcon sx={{ color: brand.primary }} /> Recipe-driven production
            </li>
            <li
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontWeight: 700,
              }}
            >
              <Inventory2Icon sx={{ color: brand.primary }} /> Focused on product traceability
            </li>
          </ul>
          <Button
            variant="contained"
            sx={{
              mt: 4,
              borderRadius: "999px",
              padding: "12px 32px",
              fontWeight: 600,
              backgroundColor: brand.primary,
              "&:hover": { backgroundColor: brand.primaryDark },
            }}
            onClick={handleGetStarted}
          >
            Get Started
          </Button>
        </Box>

        {/* Right Hero Image */}
        <Box
          sx={{
            display: { xs: "none", md: "block" },
            overflow: "hidden",
            maxWidth: "60%",
            margin: "auto",
            borderRadius: 16,
          }}
        >
          <img
            src="/assets/pexels-shvetsa-5953694.jpg"
            alt="Warehouse"
            style={{
              width: "100%",
              height: "auto",
              objectFit: "cover",
              borderRadius: 16,
            }}
          />
        </Box>
      </Box>

      {/* Features Section */}
      <Container id="features" sx={{ py: 10 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, textAlign: "center", mb: 6 }}>
          Streamline Your Inventory
        </Typography>
        <Grid container spacing={5} justifyContent="center">
          <Grid item xs={12} md={4} textAlign="center">
            <CheckIcon sx={{ fontSize: 50, color: brand.primary, mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Real-Time Tracking
            </Typography>
            <Typography>
              Track inventory levels in <b>real-time</b> and reduce stockouts
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} textAlign="center">
            <ShowChartIcon sx={{ fontSize: 50, color: brand.primary, mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Sales Insights
            </Typography>
            <Typography>Gain valuable insights into sales trends and product performance.</Typography>
          </Grid>
          <Grid item xs={12} md={4} textAlign="center">
            <Inventory2Icon sx={{ fontSize: 50, color: brand.primary, mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Inventory Optimization
            </Typography>
            <Typography>Optimize stock levels and reduce excess inventory</Typography>
          </Grid>
        </Grid>
      </Container>

      {/* Footer */}
      <Box sx={{ height: 60, backgroundColor: brand.primary }} />
    </Box>
  );
};

export default LandingPage;
