// src/components/AboutPage.jsx
import React from "react";
import {
  Box,
  Typography,
  Container,
  Grid,
  Button,
  Stack,
  Paper,
  Avatar,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import GroupsIcon from "@mui/icons-material/Groups";
import SpeedIcon from "@mui/icons-material/Speed";
import VerifiedIcon from "@mui/icons-material/Verified";

const brand = {
  text: "#1e293b",
  subtext: "#64748b",
  primary: "#7C3AED",
  primaryDark: "#5B21B6",
  surface: "#ffffff",
  surfaceMuted: "#F8FAFC",
  border: "#f1f5f9",
};

const AboutPage = () => {
  const navigate = useNavigate();

  const goHome = () => navigate("/");
  const handleSignIn = () => navigate("/login");
  const handleNavClick = (item) => {
    if (item === "Features") navigate("/features");
    if (item === "Contact") navigate("/contact");
    if (item === "About") window.scrollTo({ top: 0, behavior: "smooth" });
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
                color: item === "About" ? brand.primary : brand.subtext,
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
      <Box sx={{ py: { xs: 8, md: 15 }, bgcolor: brand.surfaceMuted }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography variant="overline" sx={{ color: brand.primary, fontWeight: 800, letterSpacing: 2 }}>
                OUR MISSION
              </Typography>
              <Typography variant="h2" sx={{ fontWeight: 900, color: brand.text, mt: 2, mb: 3, fontSize: { xs: "2.5rem", md: "3.5rem" } }}>
                Simplifying production for the <span style={{ color: brand.primary }}>modern kitchen.</span>
              </Typography>
              <Typography sx={{ color: brand.subtext, fontSize: "1.2rem", mb: 4, lineHeight: 1.7 }}>
                Hupes was founded on a simple premise: managing a growing food business shouldn't feel like a recipe for disaster. We build the tools that bridge the gap between complex spreadsheets and efficient production floors.
              </Typography>
            </Grid>
            <Grid item xs={12} md={5}>
                {/* A placeholder for a team photo or brand graphic */}
              <Box sx={{ 
                height: 350, 
                bgcolor: "white", 
                borderRadius: "32px", 
                border: `1px solid ${brand.border}`,
                boxShadow: "0 24px 48px rgba(0,0,0,0.06)",
                display: "grid",
                placeItems: "center",
                p: 4
              }}>
                <img src="/user.png" alt="Brand Graphic" style={{ height: 180, opacity: 0.8 }} />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* --- CORE VALUES --- */}
      <Container sx={{ py: 12 }}>
        <Typography variant="h4" sx={{ textAlign: "center", fontWeight: 900, mb: 8 }}>
          Why we do what we do
        </Typography>
        <Grid container spacing={4}>
          {[
            { 
                icon: <SpeedIcon />, 
                title: "Efficiency First", 
                desc: "We believe in removing friction. From goods-in to waste insights, our platform is designed for speed." 
            },
            { 
                icon: <VerifiedIcon />, 
                title: "Radical Traceability", 
                desc: "Compliance shouldn't be a chore. We automate batch tracking so you can focus on quality." 
            },
            { 
                icon: <GroupsIcon />, 
                title: "User-Centric", 
                desc: "Built for the people on the production floor, not just the board room. If it's not easy to use, it's not Hupes." 
            }
          ].map((val, i) => (
            <Grid item xs={12} md={4} key={i}>
              <Paper elevation={0} sx={{ p: 5, textAlign: "center", borderRadius: "24px", bgcolor: brand.surfaceMuted, border: `1px solid ${brand.border}` }}>
                <Box sx={{ display: "inline-flex", p: 2, borderRadius: "50%", bgcolor: "white", color: brand.primary, mb: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                  {val.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>{val.title}</Typography>
                <Typography sx={{ color: brand.subtext, fontSize: "0.95rem" }}>{val.desc}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* --- VISION STATEMENT --- */}
      <Box sx={{ py: 12, borderTop: `1px solid ${brand.border}` }}>
        <Container maxWidth="md">
          <Paper elevation={0} sx={{ p: { xs: 4, md: 8 }, borderRadius: "40px", bgcolor: brand.primary, color: "white", textAlign: "center" }}>
            <Typography variant="h3" sx={{ fontWeight: 900, mb: 4 }}>The future of food is digital.</Typography>
            <Typography sx={{ fontSize: "1.2rem", opacity: 0.9, mb: 0, lineHeight: 1.8 }}>
              "Our goal is to provide every kitchen from local start-ups to global enterprises with the data they need to eliminate waste and maximize their potential. We're not just a software company; we're your partner in production."
            </Typography>
          </Paper>
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

export default AboutPage;