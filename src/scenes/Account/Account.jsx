// src/scenes/account/AccountPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Avatar,
  IconButton,
  Grid,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import UploadIcon from "@mui/icons-material/Upload";
import KeyOutlinedIcon from "@mui/icons-material/KeyOutlined";
// ✅ Amplify v6 modular auth API (no Auth class)
import { updatePassword } from "aws-amplify/auth";
import { useAuth } from "../../contexts/AuthContext";

/** Nory-like brand tokens */
const brand = {
  text: "#0f172a",
  subtext: "#334155",
  border: "#e5e7eb",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  primary: "#e11d48",
  primaryDark: "#be123c",
  focusRing: "rgba(225, 29, 72, 0.35)",
  danger: "#dc2626",
  shadow: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)",
};

function splitName(full = "") {
  const s = String(full).trim();
  if (!s) return { firstName: "", lastName: "" };
  const parts = s.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts.slice(-1)[0] };
}
function joinName(first = "", last = "") {
  return [first, last].filter(Boolean).join(" ").trim();
}

export default function AccountPage() {
  const { userProfile, updateProfile, loading } = useAuth();

  // --- edit state
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    company: "",
    jobTitle: "",
  });
  const [avatarUrl, setAvatarUrl] = useState("");

  // --- password dialog state
  const [pwOpen, setPwOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwBusy, setPwBusy] = useState(false);

  // --- feedback
  const [snack, setSnack] = useState({ open: false, severity: "success", message: "" });

  // derive email from profile (read-only)
  const email = useMemo(() => userProfile?.email || "", [userProfile]);

  // hydrate form from profile
  useEffect(() => {
    if (!loading && userProfile) {
      const { firstName, lastName } = splitName(userProfile.name || "");
      setForm({
        firstName,
        lastName,
        company: userProfile.company || "",
        jobTitle: userProfile.jobTitle || "",
      });
      setAvatarUrl(userProfile.picture || "");
    }
  }, [loading, userProfile]);

  const onChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const onAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) setAvatarUrl(URL.createObjectURL(file));
  };

  const onCancel = () => {
    setEditMode(false);
    if (!userProfile) return;
    const { firstName, lastName } = splitName(userProfile.name || "");
    setForm({
      firstName,
      lastName,
      company: userProfile.company || "",
      jobTitle: userProfile.jobTitle || "",
    });
    setAvatarUrl(userProfile.picture || "");
  };

  const onSave = async () => {
    if (!form.firstName.trim()) {
      return setSnack({ open: true, severity: "warning", message: "First name is required." });
    }
    if (!form.lastName.trim()) {
      return setSnack({ open: true, severity: "warning", message: "Last name is required." });
    }

    const toUpdate = {
      name: joinName(form.firstName, form.lastName),
      company: form.company,
      jobTitle: form.jobTitle,
      // picture: avatarUrl, // uncomment if your updateProfile handles picture
    };
    try {
      await updateProfile(toUpdate);
      setEditMode(false);
      setSnack({ open: true, severity: "success", message: "Profile updated." });
    } catch (err) {
      console.error("Failed to update profile:", err);
      setSnack({ open: true, severity: "error", message: "Failed to update profile." });
    }
  };

  // password handlers
  const openPwDialog = () => {
    setPwForm({ current: "", next: "", confirm: "" });
    setPwOpen(true);
  };
  const closePwDialog = () => {
    if (!pwBusy) setPwOpen(false);
  };
  const onPwChange = (field) => (e) => setPwForm((p) => ({ ...p, [field]: e.target.value }));

  const onChangePassword = async () => {
    const { current, next, confirm } = pwForm;
    if (!current || !next || !confirm) {
      return setSnack({ open: true, severity: "warning", message: "Please fill in all password fields." });
    }
    if (next !== confirm) {
      return setSnack({ open: true, severity: "warning", message: "New passwords do not match." });
    }
    if (next.length < 8) {
      return setSnack({ open: true, severity: "warning", message: "New password must be at least 8 characters." });
    }

    setPwBusy(true);
    try {
      // ✅ Amplify v6 modular API
      await updatePassword({ oldPassword: current, newPassword: next });

      setPwBusy(false);
      setPwOpen(false);
      setSnack({ open: true, severity: "success", message: "Password changed successfully." });
    } catch (err) {
      console.error("Change password failed:", err);
      setPwBusy(false);
      // Many Amplify auth errors put a message on err.name/err.message
      const message =
        err?.message ||
        err?.toString?.() ||
        "Failed to change password. Check your current password and try again.";
      setSnack({ open: true, severity: "error", message });
    }
  };

  if (loading) {
    return (
      <Box p={4} display="grid" placeItems="center">
        <CircularProgress />
      </Box>
    );
  }
  if (!userProfile) {
    return (
      <Box p={4}>
        <Typography color="error">Failed to load profile.</Typography>
      </Box>
    );
  }

  return (
    <Box m="20px">
      {/* Scoped Nory styles */}
      <style>{`
        .acct-card {
          border: 1px solid ${brand.border};
          background: ${brand.surface};
          border-radius: 16px;
          box-shadow: ${brand.shadow};
          overflow: hidden;
        }
        .acct-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 16px;
          border-bottom: 1px solid ${brand.border};
          background: ${brand.surface};
        }
        .acct-title {
          margin: 0;
          font-weight: 900;
          color: ${brand.text};
        }
        .acct-body {
          padding: 16px;
          background: ${brand.surface};
        }
        .pill {
          color: #fff;
          border-radius: 999px;
          font-weight: 800;
          padding: 10px 16px;
          background: linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark});
          box-shadow: 0 8px 16px rgba(29,78,216,0.25), 0 2px 4px rgba(15,23,42,0.06);
          text-transform: none;
        }
        .pill:hover {
          background: linear-gradient(180deg, ${brand.primaryDark}, ${brand.primaryDark});
        }
        .ghost {
          border: 1px solid ${brand.border};
          color: ${brand.text};
          background: ${brand.surface};
          font-weight: 800;
          border-radius: 12px;
          text-transform: none;
        }
        .ghost:hover {
          background: ${brand.surfaceMuted};
        }
        .input .MuiOutlinedInput-root {
          border-radius: 12px;
        }
        .input .MuiOutlinedInput-notchedOutline {
          border-color: ${brand.border};
        }
        .input .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
          border-color: ${brand.primary};
        }
        .input .MuiOutlinedInput-root.Mui-focused {
          box-shadow: 0 0 0 4px ${brand.focusRing};
        }
      `}</style>

      <Box className="acct-card">
        <Box className="acct-header">
          <Typography className="acct-title" variant="h5">My Account</Typography>
          {!editMode ? (
            <Button
              onClick={() => setEditMode(true)}
              startIcon={<EditIcon />}
              className="pill"
            >
              Edit Profile
            </Button>
          ) : (
            <Box display="flex" gap={1}>
              <Button onClick={onCancel} startIcon={<CancelIcon />} className="ghost">
                Cancel
              </Button>
              <Button onClick={onSave} startIcon={<SaveIcon />} className="pill">
                Save
              </Button>
            </Box>
          )}
        </Box>

        <Box className="acct-body">
          <Grid container spacing={2} alignItems="flex-start">
            {/* Avatar */}
            <Grid item xs={12} sm={4} md={3}>
              <Box position="relative" textAlign="center">
                <Avatar
                  src={avatarUrl}
                  sx={{
                    width: 110,
                    height: 110,
                    m: "auto",
                    border: `1px solid ${brand.border}`,
                    boxShadow: brand.shadow,
                  }}
                />
                {editMode && (
                  <IconButton
                    component="label"
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      right: "calc(50% - 55px)",
                      transform: "translateX(55px)",
                      background: "#f1f5f9",
                      border: `1px solid ${brand.border}`,
                      "&:hover": { background: "#e2e8f0" },
                    }}
                  >
                    <UploadIcon />
                    <input hidden type="file" accept="image/*" onChange={onAvatarUpload} />
                  </IconButton>
                )}
              </Box>
            </Grid>

            {/* Fields */}
            <Grid item xs={12} sm={8} md={9} container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Email"
                  fullWidth
                  value={email}
                  InputProps={{ readOnly: true }}
                  className="input"
                />
              </Grid>

              <Grid item xs={12} md={6} display="flex" alignItems="stretch">
                <Button
                  onClick={openPwDialog}
                  startIcon={<KeyOutlinedIcon />}
                  className="pill"
                  sx={{ width: "100%" }}
                >
                  Change Password
                </Button>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="First Name"
                  fullWidth
                  value={form.firstName}
                  onChange={onChange("firstName")}
                  InputProps={{ readOnly: !editMode }}
                  className="input"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Last Name"
                  fullWidth
                  value={form.lastName}
                  onChange={onChange("lastName")}
                  InputProps={{ readOnly: !editMode }}
                  className="input"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Company"
                  fullWidth
                  value={form.company}
                  onChange={onChange("company")}
                  InputProps={{ readOnly: !editMode }}
                  className="input"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Job Title"
                  fullWidth
                  value={form.jobTitle}
                  onChange={onChange("jobTitle")}
                  InputProps={{ readOnly: !editMode }}
                  className="input"
                />
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Change Password Dialog */}
      <Dialog
        open={pwOpen}
        onClose={closePwDialog}
        PaperProps={{
          sx: {
            borderRadius: 14,
            border: `1px solid ${brand.border}`,
            boxShadow: brand.shadow,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: brand.text }}>
          Change Password
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: "grid", gap: 2, minWidth: { xs: 280, sm: 420 } }}>
            <TextField
              label="Current Password"
              type="password"
              value={pwForm.current}
              onChange={onPwChange("current")}
              className="input"
              autoFocus
            />
            <TextField
              label="New Password"
              type="password"
              value={pwForm.next}
              onChange={onPwChange("next")}
              className="input"
            />
            <TextField
              label="Confirm New Password"
              type="password"
              value={pwForm.confirm}
              onChange={onPwChange("confirm")}
              className="input"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closePwDialog} className="ghost" disabled={pwBusy}>
            Cancel
          </Button>
          <Button onClick={onChangePassword} className="pill" disabled={pwBusy}>
            {pwBusy ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Update Password"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
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
}
