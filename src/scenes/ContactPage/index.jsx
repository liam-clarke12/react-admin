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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";

const brand = {
  text: "#0f172a",
  subtext: "#334155",
  border: "#e5e7eb",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  primary: "#e11d48",
  primaryDark: "#be123c",
  focusRing: "rgba(225, 29, 72, 0.35)",
  shadow: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)",
};

const ContactPage = () => {
  const navigate = useNavigate();

  // form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [snack, setSnack] = useState({ open: false, severity: "success", message: "" });

  const handleSignIn = () => navigate("/login");
  const goHome = () => navigate("/");

  // Match LandingPage behavior for header nav
  const handleNavClick = (item) => {
    if (item === "Contact") {
      navigate("/contact");
      return;
    }
    if (item === "Features") {
      navigate("/#features"); // jump to features section on landing
      return;
    }
    if (item === "About") {
      navigate("/"); // you can add a real about section later
      return;
    }
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

  const onChange = (field) => (evt) => {
    setForm((f) => ({ ...f, [field]: evt.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (evt) => {
    evt.preventDefault();
    if (!validate()) return;

    const to = "hello@hupes.app"; // <-- change to your support email
    const subject = `Contact from ${form.name}${form.company ? " (" + form.company + ")" : ""}`;
    const body = `Name: ${form.name}
Email: ${form.email}
Company: ${form.company || "-"}

${form.message}`;
    const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    try {
      window.location.href = mailto;
    } catch {}
    setSnack({ open: true, severity: "success", message: "Thanks! We’ll be in touch shortly." });
    setForm({ name: "", email: "", company: "", message: "" });
  };

  return (
    <Box sx={{ fontFamily: "Roboto, sans-serif" }}>
      {/* Header (matches Landing) */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 2,
          px: 4,
          backgroundColor: "#fff",
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
          <img src="/user.png" alt="Logo" style={{ height: 40, marginRight: 8, pointerEvents: "none" }} />
        </Box>

        {/* Navigation + Sign In */}
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
              title={item}
            >
              {item}
            </Typography>
          ))}
          <Button
            variant="contained"
            sx={{
              borderRadius: "999px",
              px: 2.5,
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

      {/* Hero / Split */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "46% 1fr" },
          minHeight: "80vh",
          background:
            "radial-gradient(800px 400px at 80% -20%, #ffe4ea 0%, rgba(255,228,234,0) 60%), linear-gradient(180deg, #fff 0%, #f8fafc 100%)",
        }}
      >
        {/* Left: Intro + contact info cards */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            px: { xs: 3, md: 8 },
            py: { xs: 6, md: 0 },
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              mb: 2,
              lineHeight: 1.15,
              color: brand.text,
              fontSize: { xs: "2rem", md: "2.6rem" },
            }}
          >
            Let’s talk.
          </Typography>
          <Typography sx={{ mb: 4, color: brand.subtext, fontSize: 16 }}>
            Questions about inventory, production, or onboarding? Drop us a line and we’ll get back
            to you within one business day.
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${brand.border}`,
                  background: brand.surface,
                  boxShadow: brand.shadow,
                  height: "100%",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <EmailOutlinedIcon sx={{ color: brand.primary }} />
                  <Typography sx={{ fontWeight: 800, color: brand.text }}>Email</Typography>
                </Box>
                <Typography sx={{ color: brand.subtext, mt: 1 }}>hello@hupes.app</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${brand.border}`,
                  background: brand.surface,
                  boxShadow: brand.shadow,
                  height: "100%",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <AccessTimeOutlinedIcon sx={{ color: brand.primary }} />
                  <Typography sx={{ fontWeight: 800, color: brand.text }}>Hours</Typography>
                </Box>
                <Typography sx={{ color: brand.subtext, mt: 1 }}>
                  Mon–Fri · 9:00–17:00 (GMT)
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${brand.border}`,
                  background: brand.surface,
                  boxShadow: brand.shadow,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PlaceOutlinedIcon sx={{ color: brand.primary }} />
                  <Typography sx={{ fontWeight: 800, color: brand.text }}>Address</Typography>
                </Box>
                <Typography sx={{ color: brand.subtext, mt: 1 }}>
                  Add your business address here
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Right: Contact form card */}
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
            px: { xs: 3, md: 4 },
            py: { xs: 6, md: 0 },
          }}
        >
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              width: "100%",
              maxWidth: 560,
              p: 3,
              borderRadius: 2,
              border: `1px solid ${brand.border}`,
              background: brand.surface,
              boxShadow: brand.shadow,
            }}
          >
            <Typography sx={{ fontWeight: 800, color: brand.text, mb: 2 }}>
              Send us a message
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Your Name"
                  fullWidth
                  value={form.name}
                  onChange={onChange("name")}
                  error={Boolean(errors.name)}
                  helperText={errors.name}
                  sx={{
                    "& .MuiOutlinedInput-root": { borderRadius: 2 },
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: brand.border },
                    "& .Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: brand.primary },
                    "& .Mui-focused": { boxShadow: `0 0 0 4px ${brand.focusRing}` },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  fullWidth
                  value={form.email}
                  onChange={onChange("email")}
                  error={Boolean(errors.email)}
                  helperText={errors.email}
                  sx={{
                    "& .MuiOutlinedInput-root": { borderRadius: 2 },
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: brand.border },
                    "& .Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: brand.primary },
                    "& .Mui-focused": { boxShadow: `0 0 0 4px ${brand.focusRing}` },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Company (optional)"
                  fullWidth
                  value={form.company}
                  onChange={onChange("company")}
                  sx={{
                    "& .MuiOutlinedInput-root": { borderRadius: 2 },
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: brand.border },
                    "& .Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: brand.primary },
                    "& .Mui-focused": { boxShadow: `0 0 0 4px ${brand.focusRing}` },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Message"
                  fullWidth
                  multiline
                  minRows={5}
                  value={form.message}
                  onChange={onChange("message")}
                  error={Boolean(errors.message)}
                  helperText={errors.message}
                  sx={{
                    "& .MuiOutlinedInput-root": { borderRadius: 2 },
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: brand.border },
                    "& .Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: brand.primary },
                    "& .Mui-focused": { boxShadow: `0 0 0 4px ${brand.focusRing}` },
                  }}
                />
              </Grid>
              <Grid item xs={12} display="flex" justifyContent="flex-end">
                <Button
                  type="submit"
                  startIcon={<SendOutlinedIcon />}
                  variant="contained"
                  sx={{
                    borderRadius: "999px",
                    px: 3,
                    fontWeight: 800,
                    textTransform: "none",
                    background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`,
                    boxShadow:
                      "0 8px 16px rgba(29,78,216,0.25), 0 2px 4px rgba(15,23,42,0.06)",
                    "&:hover": {
                      background: `linear-gradient(180deg, ${brand.primaryDark}, ${brand.primaryDark})`,
                    },
                  }}
                >
                  Send
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>

      {/* Footer bar (brand color) */}
      <Box sx={{ height: 60, backgroundColor: brand.primary }} />

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          variant="filled"
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ContactPage;
