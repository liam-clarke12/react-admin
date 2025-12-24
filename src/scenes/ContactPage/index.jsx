// src/components/ContactPage.jsx
import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Container,
  Grid,
  TextField,
  Snackbar,
  Alert,
  Paper,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

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

const CONTACT_EMAIL = "euhupes@gmail.com";

const ContactPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [errors, setErrors] = useState({});
  const [snack, setSnack] = useState({ open: false, severity: "success", message: "" });

  const goHome = () => navigate("/");
  const handleSignIn = () => navigate("/login");
  
  const handleNavClick = (item) => {
    if (item === "Features") navigate("/features");
    if (item === "About") navigate("/about")
    if (item === "Contact") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.message.trim()) e.message = "Message is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (evt) => {
    evt.preventDefault();
    if (!validate()) return;

    // Construct the mailto link
    const subject = `Contact from ${form.name}${form.company ? " (" + form.company + ")" : ""}`;
    const body = `Name: ${form.name}
Email: ${form.email}
Company: ${form.company || "Not provided"}

Message:
${form.message}`;

    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Trigger redirect
    window.location.href = mailto;

    // Show feedback and reset form
    setSnack({ 
      open: true, 
      severity: "success", 
      message: "Opening your email client..." 
    });
    setForm({ name: "", email: "", company: "", message: "" });
  };

  return (
    <Box sx={{ backgroundColor: brand.surface, minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
      
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
                color: item === "Contact" ? brand.primary : brand.subtext,
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

      {/* --- CONTENT SECTION --- */}
      <Box sx={{ bgcolor: brand.surfaceMuted, py: { xs: 8, md: 12 }, borderBottom: `1px solid ${brand.border}` }}>
        <Container maxWidth="lg">
          <Grid container spacing={8} alignItems="center">
            
            {/* Left Column: Info */}
            <Grid item xs={12} md={5}>
              <Box sx={{ display: "inline-flex", p: 1, px: 2, mb: 2, bgcolor: "rgba(124, 58, 237, 0.1)", borderRadius: "20px", color: brand.primary }}>
                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase" }}>Get in Touch</Typography>
              </Box>
              <Typography variant="h2" sx={{ fontWeight: 900, color: brand.text, mb: 3, fontSize: { xs: "2.5rem", md: "3.5rem" }, lineHeight: 1.1 }}>
                Let’s talk <span style={{ color: brand.primary }}>production</span>.
              </Typography>
              <Typography sx={{ color: brand.subtext, fontSize: "1.1rem", mb: 6, lineHeight: 1.6 }}>
                Have questions about scaling your food brand? Our experts are ready to help you optimize your inventory and traceability.
              </Typography>

              <Stack spacing={4}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                  <Box sx={{ bgcolor: "white", p: 1.5, borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", color: brand.primary }}>
                    <EmailOutlinedIcon />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: brand.text }}>Email us</Typography>
                    <Typography sx={{ color: brand.subtext }}>{CONTACT_EMAIL}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                  <Box sx={{ bgcolor: "white", p: 1.5, borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", color: brand.primary }}>
                    <AccessTimeOutlinedIcon />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: brand.text }}>Support Hours</Typography>
                    <Typography sx={{ color: brand.subtext }}>Monday – Friday<br />9:00 – 17:00 (GMT)</Typography>
                  </Box>
                </Box>
              </Stack>
            </Grid>

            {/* Right Column: Form */}
            <Grid item xs={12} md={7}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: { xs: 4, md: 6 }, 
                  borderRadius: "32px", 
                  border: `1px solid ${brand.border}`,
                  boxShadow: "0 24px 48px rgba(0,0,0,0.04)",
                  bgcolor: "white"
                }}
              >
                <form onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, ml: 0.5 }}>Your Name</Typography>
                      <TextField
                        fullWidth placeholder="John Doe"
                        value={form.name}
                        onChange={(e) => setForm({...form, name: e.target.value})}
                        error={!!errors.name} helperText={errors.name}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: brand.surfaceMuted }}}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, ml: 0.5 }}>Work Email</Typography>
                      <TextField
                        fullWidth placeholder="john@company.com"
                        value={form.email}
                        onChange={(e) => setForm({...form, email: e.target.value})}
                        error={!!errors.email} helperText={errors.email}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: brand.surfaceMuted }}}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, ml: 0.5 }}>Company (Optional)</Typography>
                      <TextField
                        fullWidth placeholder="Your Food Brand"
                        value={form.company}
                        onChange={(e) => setForm({...form, company: e.target.value})}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: brand.surfaceMuted }}}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, ml: 0.5 }}>Message</Typography>
                      <TextField
                        fullWidth multiline rows={4} placeholder="Tell us about your production needs..."
                        value={form.message}
                        onChange={(e) => setForm({...form, message: e.target.value})}
                        error={!!errors.message} helperText={errors.message}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: brand.surfaceMuted }}}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        fullWidth type="submit" variant="contained" size="large"
                        startIcon={<SendOutlinedIcon />}
                        sx={{
                          py: 2, borderRadius: "12px", fontWeight: 700, textTransform: "none",
                          fontSize: "1rem", bgcolor: brand.primary, 
                          "&:hover": { bgcolor: brand.primaryDark, boxShadow: "0 8px 20px rgba(124, 58, 237, 0.3)" }
                        }}
                      >
                        Send Email
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* --- FOOTER TRUST LOGOS --- */}
      <Container sx={{ py: 6 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={4} justifyContent="center" alignItems="center">
          {["Secure SSL Encryption", "Fast Response Time", "Dedicated Support"].map((text) => (
            <Box key={text} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CheckCircleIcon sx={{ color: brand.accent, fontSize: 20 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: brand.subtext }}>{text}</Typography>
            </Box>
          ))}
        </Stack>
      </Container>

      {/* Simple Footer Text */}
      <Box sx={{ py: 4, textAlign: "center", borderTop: `1px solid ${brand.border}` }}>
        <Typography variant="body2" sx={{ color: brand.subtext }}>
          © {new Date().getFullYear()} Hupes Technologies. All rights reserved.
        </Typography>
      </Box>

      <Snackbar
        open={snack.open} autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} variant="filled" sx={{ borderRadius: "12px" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ContactPage;