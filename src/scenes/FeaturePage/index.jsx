// src/components/FeaturesPage.jsx
import React from "react";
import {
  Box,
  Typography,
  Container,
  Grid,
  Button,
  Stack,
  Paper,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

// Icons
import InventoryIcon from "@mui/icons-material/Inventory";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import HistoryIcon from "@mui/icons-material/History";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import InsightsIcon from "@mui/icons-material/Insights";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const brand = {
  text: "#1e293b",
  subtext: "#64748b",
  primary: "#7C3AED",
  primaryDark: "#5B21B6",
  accent: "#10B981",
  surface: "#ffffff",
  surfaceMuted: "#F8FAFC",
  border: "#f1f5f9",
};

const features = [
  {
    title: "Real-time Stock",
    desc: "Instant visibility into your raw materials and finished goods. Never guess your stock levels again.",
    icon: <InventoryIcon sx={{ fontSize: 32 }} />,
  },
  {
    title: "Recipe-driven Production",
    desc: "Convert recipes into production runs. Automatically deduct ingredients and calculate costs in one click.",
    icon: <RestaurantMenuIcon sx={{ fontSize: 32 }} />,
  },
  {
    title: "Expiry & Batch Tracking",
    desc: "Full traceability from farm to fork. Monitor shelf life and manage batch recalls with precision.",
    icon: <HistoryIcon sx={{ fontSize: 32 }} />,
  },
  {
    title: "Goods In & Out",
    desc: "Streamline your loading dock. Track supplier deliveries and outbound shipments seamlessly.",
    icon: <LocalShippingIcon sx={{ fontSize: 32 }} />,
  },
  {
    title: "Waste & Yield Insights",
    desc: "Identify where you're losing money. Analyze production efficiency and optimize your margins.",
    icon: <InsightsIcon sx={{ fontSize: 32 }} />,
  },
  {
    title: "Smart Notifications",
    desc: "Get alerted before stock runs low or ingredients expire. Stay proactive, not reactive.",
    icon: <NotificationsActiveIcon sx={{ fontSize: 32 }} />,
  },
];

const FeaturesPage = () => {
  const navigate = useNavigate();

  const goHome = () => navigate("/");
  const handleSignIn = () => navigate("/login");
  const handleNavClick = (item) => {
    if (item === "Contact") navigate("/contact");
    if (item === "About") navigate("/");
    if (item === "Features") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Box sx={{ backgroundColor: brand.surface, minHeight: "100vh" }}>
      {/* --- NAVBAR --- */}
      <Box
        component="nav"
        sx={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          py: 2, px: { xs: 2, md: 8 }, position: "sticky", top: 0, zIndex: 1000,
          backgroundColor: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(10px)",
          borderBottom: `1px solid ${brand.border}`,
        }}
      >
        <Box onClick={goHome} sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer" }}>
          <img src="/user.png" alt="Logo" style={{ height: 40 }} />
          <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: brand.text, letterSpacing: "-0.5px" }}>
            Hupes
          </Typography>
        </Box>

        <Stack direction="row" spacing={4} alignItems="center">
          {["Features", "About", "Contact"].map((item) => (
            <Typography
              key={item}
              onClick={() => handleNavClick(item)}
              sx={{
                display: { xs: "none", md: "block" },
                cursor: "pointer", fontWeight: 600, fontSize: "0.95rem",
                color: item === "Features" ? brand.primary : brand.subtext,
                "&:hover": { color: brand.primary }, transition: "0.2s",
              }}
            >
              {item}
            </Typography>
          ))}
          <Button
            variant="contained" disableElevation onClick={handleSignIn}
            sx={{
              borderRadius: "12px", px: 3, py: 1, textTransform: "none",
              fontWeight: 700, backgroundColor: brand.primary,
              "&:hover": { backgroundColor: brand.primaryDark },
            }}
          >
            Sign In
          </Button>
        </Stack>
      </Box>

      {/* --- HERO SECTION --- */}
      <Box sx={{ py: { xs: 10, md: 15 }, textAlign: "center", bgcolor: brand.surfaceMuted }}>
        <Container maxWidth="md">
          <Typography
            variant="overline"
            sx={{ color: brand.primary, fontWeight: 800, letterSpacing: 2 }}
          >
            Platform Capabilities
          </Typography>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              color: brand.text,
              mt: 2,
              mb: 3,
              fontSize: { xs: "2.5rem", md: "3.5rem" },
            }}
          >
            Built for modern <br />
            <span style={{ color: brand.primary }}>food production.</span>
          </Typography>
          <Typography sx={{ color: brand.subtext, fontSize: "1.2rem", mb: 5 }}>
            Everything you need to manage your kitchen at scale, from the moment ingredients arrive to the second they leave as finished products.
          </Typography>
        </Container>
      </Box>

      {/* --- FEATURES GRID --- */}
      <Container sx={{ py: 12 }}>
        <Grid container spacing={4}>
          {features.map((f, idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <Paper
                elevation={0}
                sx={{
                  p: 5,
                  height: "100%",
                  borderRadius: "24px",
                  border: `1px solid ${brand.border}`,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.04)",
                    borderColor: brand.primary,
                  },
                }}
              >
                <Box
                  sx={{
                    display: "inline-flex",
                    p: 2,
                    borderRadius: "16px",
                    bgcolor: "rgba(124, 58, 237, 0.1)",
                    color: brand.primary,
                    mb: 3,
                  }}
                >
                  {f.icon}
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, color: brand.text }}>
                  {f.title}
                </Typography>
                <Typography sx={{ color: brand.subtext, lineHeight: 1.7 }}>
                  {f.desc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* --- CTA SECTION --- */}
      <Box sx={{ bgcolor: brand.text, py: 10, color: "white", textAlign: "center" }}>
        <Container maxWidth="sm">
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>
            Ready to streamline your workflow?
          </Typography>
          <Typography sx={{ opacity: 0.8, mb: 4, fontSize: "1.1rem" }}>
            Join the leading food brands using Hupes to eliminate waste and maximize yields.
          </Typography>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate("/contact")}
            sx={{
              bgcolor: brand.primary,
              px: 4,
              py: 2,
              borderRadius: "12px",
              fontWeight: 700,
              textTransform: "none",
              "&:hover": { bgcolor: brand.primaryDark },
            }}
          >
            Get Started Now
          </Button>
        </Container>
      </Box>

      {/* --- FOOTER --- */}
      <Box sx={{ py: 6, textAlign: "center", borderTop: `1px solid ${brand.border}` }}>
        <Typography variant="body2" sx={{ color: brand.subtext }}>
          © {new Date().getFullYear()} Hupes Technologies. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default FeaturesPage;