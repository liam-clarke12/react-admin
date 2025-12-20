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
  Divider,
  Chip,
  InputAdornment,
  Tooltip,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import UploadIcon from "@mui/icons-material/Upload";
import KeyOutlinedIcon from "@mui/icons-material/KeyOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

// Amplify v6 modular APIs
import {
  fetchUserAttributes,
  updateUserAttributes,
  updatePassword,
  getCurrentUser,
} from "aws-amplify/auth";
import { uploadData, getUrl } from "aws-amplify/storage";

const brand = {
  text: "#0f172a",
  subtext: "#334155",
  border: "#e5e7eb",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  primary: "#7C3AED",
  primaryDark: "#5B21B6",
  focusRing: "rgba(124,58,237,0.18)",
  shadow: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)",
  shadowLg: "0 20px 40px rgba(2,6,23,0.12)",
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
function isHttpUrl(v = "") {
  return /^https?:\/\//i.test(v);
}
function initialsFromName(first = "", last = "", fallback = "U") {
  const a = (first || "").trim()[0] || "";
  const b = (last || "").trim()[0] || "";
  const i = `${a}${b}`.toUpperCase();
  return i || fallback;
}

export default function AccountPage() {
  // Loading gate for initial fetch
  const [loading, setLoading] = useState(true);

  // Profile form
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    company: "",
    jobTitle: "",
  });
  const [email, setEmail] = useState("");

  // Avatar states
  const [avatarUrl, setAvatarUrl] = useState(""); // resolved (signed) URL for <Avatar src>
  const [avatarKey, setAvatarKey] = useState(""); // S3 key saved into Cognito 'picture'
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarProgress, setAvatarProgress] = useState(0);

  // Edit state
  const [editMode, setEditMode] = useState(false);

  // Password dialog state
  const [pwOpen, setPwOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwBusy, setPwBusy] = useState(false);

  // Feedback
  const [snack, setSnack] = useState({ open: false, severity: "success", message: "" });

  const fullName = useMemo(
    () => joinName(form.firstName, form.lastName) || "Your profile",
    [form.firstName, form.lastName]
  );

  // Helper: resolve a Cognito 'picture' value to a displayable URL
  const resolveAvatarUrl = async (pictureAttr) => {
    if (!pictureAttr) return "";
    if (isHttpUrl(pictureAttr)) return pictureAttr; // already an http(s) URL
    try {
      const { url } = await getUrl({
        key: pictureAttr, // S3 key stored in 'picture'
        options: { level: "private", expiresIn: 60 * 60 }, // 1 hour signed URL
      });
      return url.toString();
    } catch (e) {
      console.warn("[AccountPage] Failed to sign avatar URL:", e);
      return "";
    }
  };

  // Fetch from Cognito on mount
  useEffect(() => {
    (async () => {
      try {
        const attrs = await fetchUserAttributes();
        // attrs: { email, name, given_name, family_name, "custom:Company", "custom:jobTitle", picture?, ... }
        const first = attrs?.given_name || splitName(attrs?.name || "").firstName;
        const last = attrs?.family_name || splitName(attrs?.name || "").lastName;

        setForm({
          firstName: first || "",
          lastName: last || "",
          company: attrs?.["custom:Company"] || "",
          jobTitle: attrs?.["custom:jobTitle"] || "",
        });
        setEmail(attrs?.email || "");

        const picture = attrs?.picture || "";
        setAvatarKey(picture || "");
        setAvatarUrl(await resolveAvatarUrl(picture));
      } catch (err) {
        console.error("[AccountPage] Failed to fetch user attributes:", err);
        setSnack({ open: true, severity: "error", message: "Failed to load profile." });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  // Upload avatar to S3 (private level), set preview, and mark key for saving
  const onAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setAvatarUploading(true);
      setAvatarProgress(0);

      const { userId } = await getCurrentUser(); // for a stable, unique filename component
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const key = `avatars/${userId}/${Date.now()}-${safeName}`;

      await uploadData({
        key,
        data: file,
        options: {
          level: "private",
          contentType: file.type,
          onProgress: ({ transferredBytes, totalBytes }) => {
            if (totalBytes) {
              setAvatarProgress(Math.round((transferredBytes / totalBytes) * 100));
            }
          },
        },
      }).result;

      // Generate a signed URL for immediate preview
      const url = await resolveAvatarUrl(key);
      setAvatarKey(key);
      setAvatarUrl(url);

      setSnack({
        open: true,
        severity: "success",
        message: "Image uploaded. Click Save to update your profile.",
      });
    } catch (err) {
      console.error("[AccountPage] Avatar upload failed:", err);
      setSnack({ open: true, severity: "error", message: "Failed to upload image." });
    } finally {
      setAvatarUploading(false);
    }
  };

  const onCancel = async () => {
    // Re-fetch to reset fields back to server state (and revert avatar if changed)
    try {
      const attrs = await fetchUserAttributes();
      const first = attrs?.given_name || splitName(attrs?.name || "").firstName;
      const last = attrs?.family_name || splitName(attrs?.name || "").lastName;

      setForm({
        firstName: first || "",
        lastName: last || "",
        company: attrs?.["custom:Company"] || "",
        jobTitle: attrs?.["custom:jobTitle"] || "",
      });

      const picture = attrs?.picture || "";
      setAvatarKey(picture || "");
      setAvatarUrl(await resolveAvatarUrl(picture));
    } catch (err) {
      console.error("[AccountPage] Failed to refresh attributes:", err);
    } finally {
      setEditMode(false);
    }
  };

  const onSave = async () => {
    if (!form.firstName.trim()) {
      return setSnack({ open: true, severity: "warning", message: "First name is required." });
    }
    if (!form.lastName.trim()) {
      return setSnack({ open: true, severity: "warning", message: "Last name is required." });
    }
    if (avatarUploading) {
      return setSnack({
        open: true,
        severity: "info",
        message: "Please wait for the image to finish uploading.",
      });
    }

    try {
      await updateUserAttributes({
        userAttributes: {
          given_name: form.firstName,
          family_name: form.lastName,
          name: joinName(form.firstName, form.lastName),
          "custom:Company": form.company || "",
          "custom:jobTitle": form.jobTitle || "",
          ...(avatarKey ? { picture: avatarKey } : {}),
        },
      });

      setSnack({ open: true, severity: "success", message: "Profile updated." });
      setEditMode(false);
    } catch (err) {
      console.error("[AccountPage] Failed to update attributes:", err);
      const msg =
        err?.message ||
        "Failed to update profile. Please ensure custom attributes exist in your user pool.";
      setSnack({ open: true, severity: "error", message: msg });
    }
  };

  // Password handlers
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
      await updatePassword({ oldPassword: current, newPassword: next });
      setPwBusy(false);
      setPwOpen(false);
      setSnack({ open: true, severity: "success", message: "Password changed successfully." });
    } catch (err) {
      console.error("[AccountPage] Change password failed:", err);
      setPwBusy(false);
      const message =
        err?.message || "Failed to change password. Check your current password and try again.";
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

  return (
    <Box className="acct-shell">
      {/* Fun + premium scoped styles (keeps your brand purple) */}
      <style>{`
        .acct-shell{
          min-height: calc(100vh - 40px);
          padding: 20px;
          background:
            radial-gradient(1000px 500px at 10% -10%, rgba(124,58,237,0.18), transparent 60%),
            radial-gradient(900px 500px at 90% 0%, rgba(91,33,182,0.14), transparent 60%),
            linear-gradient(180deg, #f6f7fb, #eef2ff 55%, #f6f7fb);
        }

        .acct-max{
          max-width: 1180px;
          margin: 0 auto;
        }

        .hero{
          position: relative;
          border-radius: 22px;
          overflow: hidden;
          border: 1px solid ${brand.border};
          box-shadow: ${brand.shadowLg};
          background:
            radial-gradient(900px 420px at 15% 30%, rgba(124,58,237,0.35), rgba(124,58,237,0) 55%),
            radial-gradient(900px 420px at 85% 40%, rgba(91,33,182,0.28), rgba(91,33,182,0) 60%),
            linear-gradient(135deg, ${brand.primary}, ${brand.primaryDark});
        }

        .hero::after{
          content:"";
          position:absolute;
          inset:-2px;
          background:
            radial-gradient(circle at 20% 30%, rgba(255,255,255,0.18), transparent 30%),
            radial-gradient(circle at 80% 40%, rgba(255,255,255,0.14), transparent 35%),
            radial-gradient(circle at 40% 85%, rgba(255,255,255,0.10), transparent 40%);
          pointer-events:none;
          mix-blend-mode: overlay;
          opacity: 0.9;
        }

        .hero-inner{
          position: relative;
          z-index: 1;
          padding: 18px 18px 16px;
        }

        .hero-top{
          display:flex;
          align-items:flex-start;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }

        .hero-title{
          margin:0;
          font-weight: 950;
          letter-spacing: -0.02em;
          color: #fff;
          line-height: 1.05;
        }
        .hero-sub{
          margin: 6px 0 0;
          color: rgba(255,255,255,0.86);
          font-weight: 600;
        }

        .hero-actions{
          display:flex;
          gap: 10px;
          align-items:center;
          flex-wrap: wrap;
        }

        .btn-pill{
          color:#fff;
          border-radius: 999px;
          font-weight: 900;
          padding: 10px 16px;
          text-transform:none;
          background: rgba(255,255,255,0.18);
          border: 1px solid rgba(255,255,255,0.28);
          backdrop-filter: blur(10px);
        }
        .btn-pill:hover{
          background: rgba(255,255,255,0.22);
        }

        .btn-solid{
          color:#fff;
          border-radius: 999px;
          font-weight: 950;
          padding: 10px 16px;
          text-transform:none;
          background: #0b1220;
          border: 1px solid rgba(255,255,255,0.16);
          box-shadow: 0 10px 24px rgba(2,6,23,0.28);
        }
        .btn-solid:hover{ background:#0a1020; }

        .btn-ghost{
          border: 1px solid rgba(255,255,255,0.35);
          color: #fff;
          background: transparent;
          font-weight: 900;
          border-radius: 999px;
          text-transform: none;
        }
        .btn-ghost:hover{
          background: rgba(255,255,255,0.10);
        }

        .hero-badges{
          display:flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 14px;
          align-items:center;
        }

        .badge{
          display:flex;
          gap: 8px;
          align-items:center;
          padding: 8px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,0.16);
          border: 1px solid rgba(255,255,255,0.22);
          color: rgba(255,255,255,0.92);
          font-weight: 800;
          font-size: 12px;
          backdrop-filter: blur(10px);
        }

        .content{
          margin-top: 16px;
          display:grid;
          gap: 14px;
          grid-template-columns: 360px minmax(0, 1fr);
          align-items: start;
        }

        @media (max-width: 980px){
          .content{ grid-template-columns: 1fr; }
        }

        .card{
          border: 1px solid ${brand.border};
          background: ${brand.surface};
          border-radius: 20px;
          box-shadow: ${brand.shadowLg};
          overflow: hidden;
        }

        .card-h{
          display:flex;
          align-items:center;
          justify-content: space-between;
          gap: 10px;
          padding: 14px 16px;
          border-bottom: 1px solid ${brand.border};
          background: linear-gradient(180deg, #fff, ${brand.surfaceMuted});
        }

        .card-title{
          margin:0;
          font-weight: 950;
          color: ${brand.text};
          letter-spacing: -0.01em;
        }
        .card-sub{
          margin: 2px 0 0;
          color: ${brand.subtext};
          font-weight: 650;
          font-size: 13px;
        }

        .card-b{
          padding: 16px;
        }

        .avatar-wrap{
          position: relative;
          width: 128px;
          margin: 4px auto 0;
        }

        .avatar-ring{
          border-radius: 999px;
          padding: 4px;
          background:
            radial-gradient(circle at 20% 20%, rgba(255,255,255,0.55), rgba(255,255,255,0) 45%),
            linear-gradient(135deg, rgba(124,58,237,0.75), rgba(91,33,182,0.75));
          box-shadow: 0 18px 40px rgba(2,6,23,0.18);
        }

        .avatar-overlay{
          position:absolute; inset:0;
          display:grid; place-items:center;
          background: rgba(248, 250, 252, 0.72);
          border-radius: 999px;
          backdrop-filter: blur(6px);
        }

        .upload-btn{
          position: absolute;
          bottom: -6px;
          right: -6px;
          background: #fff;
          border: 1px solid ${brand.border};
          box-shadow: 0 10px 22px rgba(2,6,23,0.12);
        }
        .upload-btn:hover{
          background: ${brand.surfaceMuted};
        }

        .mini-actions{
          display:grid;
          gap: 10px;
          margin-top: 14px;
        }

        .side-stat{
          display:flex;
          align-items:center;
          justify-content: space-between;
          gap: 10px;
          padding: 12px 12px;
          border: 1px solid ${brand.border};
          border-radius: 14px;
          background: linear-gradient(180deg, #fff, ${brand.surfaceMuted});
        }
        .side-stat strong{
          color:${brand.text};
          font-weight: 950;
        }
        .side-stat span{
          color:${brand.subtext};
          font-weight: 700;
          font-size: 13px;
        }

        .form-grid{
          display:grid;
          gap: 12px;
        }

        .section{
          padding: 14px 16px;
          border: 1px solid ${brand.border};
          border-radius: 18px;
          background: linear-gradient(180deg, #fff, ${brand.surfaceMuted});
        }

        .section-h{
          display:flex;
          align-items:center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
        }

        .section-h .kicker{
          display:flex;
          align-items:center;
          gap: 10px;
        }

        .k-icon{
          width: 34px; height: 34px;
          border-radius: 12px;
          display:grid; place-items:center;
          background: rgba(124,58,237,0.12);
          border: 1px solid rgba(124,58,237,0.22);
          color: ${brand.primaryDark};
        }

        .input .MuiOutlinedInput-root{
          border-radius: 14px;
          background: #fff;
        }
        .input .MuiOutlinedInput-notchedOutline{
          border-color: ${brand.border};
        }
        .input .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline{
          border-color: ${brand.primary};
        }
        .input .MuiOutlinedInput-root.Mui-focused{
          box-shadow: 0 0 0 4px ${brand.focusRing};
        }
        .input .MuiInputLabel-root.Mui-focused{
          color: ${brand.primaryDark};
          font-weight: 800;
        }

        .hint{
          display:flex;
          gap: 8px;
          align-items:flex-start;
          color: ${brand.subtext};
          font-weight: 650;
          font-size: 12.5px;
          line-height: 1.35;
          padding: 10px 12px;
          border-radius: 14px;
          border: 1px dashed rgba(124,58,237,0.35);
          background: rgba(124,58,237,0.06);
        }
      `}</style>

      <Box className="acct-max">
        {/* Hero */}
        <Box className="hero">
          <Box className="hero-inner">
            <Box className="hero-top">
              <Box>
                <Typography className="hero-title" variant="h4">
                  My Account
                </Typography>
                <Typography className="hero-sub">
                  Keep your profile fresh — and make it unmistakably <b>Dae</b>.
                </Typography>
              </Box>

              <Box className="hero-actions">
                {!editMode ? (
                  <Button onClick={() => setEditMode(true)} startIcon={<EditIcon />} className="btn-solid">
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button onClick={onCancel} startIcon={<CancelIcon />} className="btn-ghost">
                      Cancel
                    </Button>
                    <Button onClick={onSave} startIcon={<SaveIcon />} className="btn-solid">
                      Save Changes
                    </Button>
                  </>
                )}
              </Box>
            </Box>

            <Box className="hero-badges">
              <Box className="badge">
                <ShieldOutlinedIcon sx={{ fontSize: 16 }} />
                Private avatar storage
              </Box>
              <Box className="badge">
                <AutoAwesomeOutlinedIcon sx={{ fontSize: 16 }} />
                Profile shows across the platform
              </Box>
              <Box className="badge">
                <InfoOutlinedIcon sx={{ fontSize: 16 }} />
                Email is read-only
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Main content */}
        <Box className="content">
          {/* Left: Identity card */}
          <Box className="card">
            <Box className="card-h">
              <Box>
                <Typography className="card-title">Identity</Typography>
                <Typography className="card-sub">Avatar + quick actions</Typography>
              </Box>

              <Chip
                label={editMode ? "Editing" : "View mode"}
                size="small"
                sx={{
                  fontWeight: 900,
                  borderRadius: 999,
                  border: `1px solid ${brand.border}`,
                  background: editMode ? "rgba(124,58,237,0.12)" : brand.surface,
                  color: editMode ? brand.primaryDark : brand.subtext,
                }}
              />
            </Box>

            <Box className="card-b">
              <Box className="avatar-wrap">
                <Box className="avatar-ring">
                  <Avatar
                    src={avatarUrl || undefined}
                    alt={fullName}
                    sx={{
                      width: 120,
                      height: 120,
                      bgcolor: "rgba(255,255,255,0.2)",
                      color: "#fff",
                      fontWeight: 950,
                      border: "1px solid rgba(255,255,255,0.22)",
                    }}
                  >
                    {initialsFromName(form.firstName, form.lastName)}
                  </Avatar>
                </Box>

                {avatarUploading && (
                  <Box className="avatar-overlay">
                    <Box display="grid" gap={1} justifyItems="center">
                      <CircularProgress size={28} />
                      <Typography variant="caption" sx={{ color: brand.subtext, fontWeight: 800 }}>
                        Uploading… {avatarProgress}%
                      </Typography>
                    </Box>
                  </Box>
                )}

                {editMode && (
                  <Tooltip title="Upload a new avatar">
                    <IconButton component="label" className="upload-btn">
                      <UploadIcon />
                      <input hidden type="file" accept="image/*" onChange={onAvatarUpload} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>

              <Box textAlign="center" mt={1.5}>
                <Typography sx={{ fontWeight: 950, color: brand.text, fontSize: 18, letterSpacing: -0.01 }}>
                  {fullName}
                </Typography>
                <Typography sx={{ color: brand.subtext, fontWeight: 700, fontSize: 13 }}>
                  {form.jobTitle || "—"} {form.company ? `• ${form.company}` : ""}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box className="mini-actions">
                <Button
                  onClick={openPwDialog}
                  startIcon={<KeyOutlinedIcon />}
                  className="btn-solid"
                  sx={{ borderRadius: 14, justifyContent: "center" }}
                >
                  Change Password
                </Button>

                <Box className="side-stat">
                  <Box>
                    <strong>Email</strong>
                    <Box mt={0.3}>
                      <span>{email || "—"}</span>
                    </Box>
                  </Box>
                  <MailOutlineIcon sx={{ color: brand.primaryDark }} />
                </Box>

                <Box className="hint">
                  <InfoOutlinedIcon sx={{ fontSize: 18, mt: "1px", color: brand.primaryDark }} />
                  Your avatar is uploaded to private storage and the profile saves the S3 key to your Cognito{" "}
                  <b>picture</b> attribute.
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Right: Profile form */}
          <Box className="card">
            <Box className="card-h">
              <Box>
                <Typography className="card-title">Profile Details</Typography>
                <Typography className="card-sub">Update your details (and they’ll sync everywhere)</Typography>
              </Box>
              <Chip
                label={editMode ? "Fields unlocked" : "Locked"}
                size="small"
                sx={{
                  fontWeight: 900,
                  borderRadius: 999,
                  border: `1px solid ${brand.border}`,
                  background: editMode ? "rgba(124,58,237,0.12)" : brand.surface,
                  color: editMode ? brand.primaryDark : brand.subtext,
                }}
              />
            </Box>

            <Box className="card-b">
              <Grid container spacing={2}>
                {/* Section: Contact */}
                <Grid item xs={12}>
                  <Box className="section">
                    <Box className="section-h">
                      <Box className="kicker">
                        <Box className="k-icon">
                          <MailOutlineIcon sx={{ fontSize: 18 }} />
                        </Box>
                        <Box>
                          <Typography sx={{ fontWeight: 950, color: brand.text, letterSpacing: -0.01 }}>
                            Contact
                          </Typography>
                          <Typography sx={{ color: brand.subtext, fontWeight: 650, fontSize: 13 }}>
                            Email is fixed to your login
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <TextField
                      label="Email"
                      fullWidth
                      value={email}
                      InputProps={{
                        readOnly: true,
                        startAdornment: (
                          <InputAdornment position="start">
                            <MailOutlineIcon sx={{ color: brand.subtext }} />
                          </InputAdornment>
                        ),
                      }}
                      className="input"
                    />
                  </Box>
                </Grid>

                {/* Section: Personal */}
                <Grid item xs={12}>
                  <Box className="section">
                    <Box className="section-h">
                      <Box className="kicker">
                        <Box className="k-icon">
                          <PersonOutlineIcon sx={{ fontSize: 18 }} />
                        </Box>
                        <Box>
                          <Typography sx={{ fontWeight: 950, color: brand.text, letterSpacing: -0.01 }}>
                            Personal
                          </Typography>
                          <Typography sx={{ color: brand.subtext, fontWeight: 650, fontSize: 13 }}>
                            Your name appears in activity logs and reports
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          label="First Name"
                          fullWidth
                          value={form.firstName}
                          onChange={onChange("firstName")}
                          InputProps={{
                            readOnly: !editMode,
                            startAdornment: (
                              <InputAdornment position="start">
                                <PersonOutlineIcon sx={{ color: brand.subtext }} />
                              </InputAdornment>
                            ),
                          }}
                          className="input"
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          label="Last Name"
                          fullWidth
                          value={form.lastName}
                          onChange={onChange("lastName")}
                          InputProps={{
                            readOnly: !editMode,
                            startAdornment: (
                              <InputAdornment position="start">
                                <PersonOutlineIcon sx={{ color: brand.subtext }} />
                              </InputAdornment>
                            ),
                          }}
                          className="input"
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>

                {/* Section: Work */}
                <Grid item xs={12}>
                  <Box className="section">
                    <Box className="section-h">
                      <Box className="kicker">
                        <Box className="k-icon">
                          <BusinessOutlinedIcon sx={{ fontSize: 18 }} />
                        </Box>
                        <Box>
                          <Typography sx={{ fontWeight: 950, color: brand.text, letterSpacing: -0.01 }}>
                            Work
                          </Typography>
                          <Typography sx={{ color: brand.subtext, fontWeight: 650, fontSize: 13 }}>
                            Used for permissions, routing, and B2B visibility
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          label="Company"
                          fullWidth
                          value={form.company}
                          onChange={onChange("company")}
                          InputProps={{
                            readOnly: !editMode,
                            startAdornment: (
                              <InputAdornment position="start">
                                <BusinessOutlinedIcon sx={{ color: brand.subtext }} />
                              </InputAdornment>
                            ),
                          }}
                          className="input"
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          label="Job Title"
                          fullWidth
                          value={form.jobTitle}
                          onChange={onChange("jobTitle")}
                          InputProps={{
                            readOnly: !editMode,
                            startAdornment: (
                              <InputAdornment position="start">
                                <BadgeOutlinedIcon sx={{ color: brand.subtext }} />
                              </InputAdornment>
                            ),
                          }}
                          className="input"
                        />
                      </Grid>
                    </Grid>

                    <Box mt={2} className="hint">
                      <InfoOutlinedIcon sx={{ fontSize: 18, mt: "1px", color: brand.primaryDark }} />
                      Tip: if you upload a new avatar, you still need to hit <b>Save Changes</b> to persist the key to
                      Cognito.
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Box>

        {/* Change Password Dialog */}
        <Dialog
          open={pwOpen}
          onClose={closePwDialog}
          PaperProps={{
            sx: {
              borderRadius: 18,
              border: `1px solid ${brand.border}`,
              boxShadow: brand.shadowLg,
              overflow: "hidden",
            },
          }}
        >
          <DialogTitle
            sx={{
              fontWeight: 950,
              color: brand.text,
              background: `linear-gradient(180deg, #fff, ${brand.surfaceMuted})`,
              borderBottom: `1px solid ${brand.border}`,
            }}
          >
            Change Password
          </DialogTitle>

          <DialogContent sx={{ pt: 2 }}>
            <Box sx={{ display: "grid", gap: 2, minWidth: { xs: 280, sm: 420 } }}>
              <TextField
                label="Current Password"
                type="password"
                value={pwForm.current}
                onChange={onPwChange("current")}
                className="input"
                autoFocus
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <KeyOutlinedIcon sx={{ color: brand.subtext }} />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="New Password"
                type="password"
                value={pwForm.next}
                onChange={onPwChange("next")}
                className="input"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <KeyOutlinedIcon sx={{ color: brand.subtext }} />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Confirm New Password"
                type="password"
                value={pwForm.confirm}
                onChange={onPwChange("confirm")}
                className="input"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <KeyOutlinedIcon sx={{ color: brand.subtext }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={closePwDialog}
              disabled={pwBusy}
              sx={{
                borderRadius: 14,
                fontWeight: 900,
                textTransform: "none",
                border: `1px solid ${brand.border}`,
                color: brand.text,
                background: "#fff",
                "&:hover": { background: brand.surfaceMuted },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={onChangePassword}
              disabled={pwBusy}
              className="btn-solid"
              sx={{ borderRadius: 14, minWidth: 160 }}
            >
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
    </Box>
  );
}
