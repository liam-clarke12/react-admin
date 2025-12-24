// src/components/LandingPage.jsx
import React from "react";
import { Box, Button, Typography, Container, Grid, Paper, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import RestaurantIcon from '@mui/icons-material/Restaurant';
import ScienceIcon from '@mui/icons-material/Science';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => navigate("/login");
  const handleSignIn = () => navigate("/login");
  const goHome = () => navigate("/");

  const handleNavClick = (item) => {
    if (item === "Contact") return navigate("/contact");
    if (item === "Features") return navigate("/features");
    if (item === "About") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const brand = {
    text: "#1e293b",
    subtext: "#64748b",
    primary: "#7C3AED", // Nory Purple
    primaryDark: "#5B21B6",
    accent: "#10B981", // Fresh Green for "Food/Growth"
    surface: "#ffffff",
    surfaceMuted: "#F8FAFC",
    border: "#f1f5f9",
  };

  return (
    <Box sx={{ backgroundColor: brand.surface, minHeight: "100vh" }}>
      {/* Navbar */}
      <Box
        component="nav"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 2,
          px: { xs: 2, md: 8 },
          position: "sticky",
          top: 0,
          zIndex: 1000,
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(10px)",
          borderBottom: `1px solid ${brand.border}`,
        }}
      >
        <Box onClick={goHome} sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer" }}>
          <Box sx={{ bgcolor: brand.primary, p: 0.8, borderRadius: 1.5, display: "flex" }}>
            <RestaurantIcon sx={{ color: "white", fontSize: 24 }} />
          </Box>
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
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.95rem",
                color: brand.subtext,
                "&:hover": { color: brand.primary },
                transition: "0.2s",
              }}
            >
              {item}
            </Typography>
          ))}
          <Button
            variant="contained"
            disableElevation
            onClick={handleSignIn}
            sx={{
              borderRadius: "12px",
              px: 3,
              py: 1,
              textTransform: "none",
              fontWeight: 700,
              backgroundColor: brand.primary,
              "&:hover": { backgroundColor: brand.primaryDark },
            }}
          >
            Sign In
          </Button>
        </Stack>
      </Box>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: { xs: 8, md: 12 }, pb: 10 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                px: 2,
                py: 0.5,
                mb: 3,
                borderRadius: "20px",
                bgcolor: "rgba(124, 91, 255, 0.1)",
                color: brand.primary,
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                Next-Gen Food ERP
              </Typography>
            </Box>
            <Typography
              variant="h1"
              sx={{
                fontWeight: 900,
                fontSize: { xs: "2.5rem", md: "4rem" },
                lineHeight: 1.1,
                color: brand.text,
                mb: 3,
              }}
            >
              From <span style={{ color: brand.primary }}>Recipe</span> to <br /> Scale.
            </Typography>
            <Typography sx={{ fontSize: "1.15rem", color: brand.subtext, mb: 4, maxWidth: "500px", lineHeight: 1.6 }}>
              The all-in-one operating system for modern food producers. Automate production logs, 
              track batch traceability, and eliminate food waste.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                size="large"
                variant="contained"
                onClick={handleGetStarted}
                sx={{
                  py: 2,
                  px: 4,
                  borderRadius: "12px",
                  fontWeight: 700,
                  fontSize: "1rem",
                  backgroundColor: brand.primary,
                  textTransform: "none",
                }}
              >
                Start Free Trial
              </Button>
              <Button
                size="large"
                variant="outlined"
                sx={{
                  py: 2,
                  px: 4,
                  borderRadius: "12px",
                  fontWeight: 700,
                  borderColor: brand.border,
                  color: brand.text,
                  textTransform: "none",
                  "&:hover": { borderColor: brand.primary, bgcolor: "transparent" },
                }}
              >
                Watch Demo
              </Button>
            </Stack>
          </Grid>

          <Grid item xs={12} md={6} sx={{ display: { xs: "none", md: "block" } }}>
            <Box sx={{ position: "relative" }}>
              <Box
                component="img"
                src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80"
                alt="Food Production"
                sx={{
                  width: "100%",
                  borderRadius: "24px",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                  transform: "rotate(-2deg)",
                }}
              />
              <Paper
                sx={{
                  position: "absolute",
                  bottom: -20,
                  left: -20,
                  p: 3,
                  borderRadius: "16px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <TrendingDownIcon sx={{ color: brand.accent, fontSize: 40 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>-24%</Typography>
                  <Typography variant="body2" sx={{ color: brand.subtext }}>Ingredient Waste</Typography>
                </Box>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Value Props */}
      <Box sx={{ bgcolor: brand.surfaceMuted, py: 12 }}>
        <Container>
          <Box sx={{ textAlign: "center", mb: 8 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, color: brand.text }}>
              Built for high-growth food brands
            </Typography>
            <Typography sx={{ color: brand.subtext }}>Everything you need to move from commercial kitchen to retail shelves.</Typography>
          </Box>
          
          <Grid container spacing={4}>
            {[
              { 
                title: "Batch Traceability", 
                desc: "Instant recall readiness. Track every ingredient from supplier to finished product.",
                icon: <AssignmentTurnedInIcon />,
                color: "#7C3AED" 
              },
              { 
                title: "Smart Formulation", 
                desc: "Auto-calculate nutritional values and COGS as you tweak your recipes.",
                icon: <ScienceIcon />,
                color: "#10B981" 
              },
              { 
                title: "Real-time Inventory", 
                desc: "Smart alerts for low-shelf-life items. Never run out of your hero ingredients.",
                icon: <RestaurantIcon />,
                color: "#F59E0B" 
              },
            ].map((feature, idx) => (
              <Grid item xs={12} md={4} key={idx}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    height: "100%",
                    borderRadius: "20px",
                    border: `1px solid ${brand.border}`,
                    transition: "0.3s",
                    "&:hover": { transform: "translateY(-8px)", boxShadow: "0 12px 24px rgba(0,0,0,0.05)" }
                  }}
                >
                  <Box sx={{ color: feature.color, mb: 2 }}>
                    {React.cloneElement(feature.icon, { sx: { fontSize: 40 } })}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{feature.title}</Typography>
                  <Typography sx={{ color: brand.subtext, lineHeight: 1.6 }}>{feature.desc}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Simple Footer */}
      <Box sx={{ py: 6, textAlign: "center", borderTop: `1px solid ${brand.border}` }}>
        <Typography variant="body2" sx={{ color: brand.subtext }}>
          © {new Date().getFullYear()} Hupes Technologies. Built for the future of food.
        </Typography>
      </Box>
    </Box>
  );
};

export default LandingPage;