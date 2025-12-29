// src/scenes/account/AccountPage.jsx
"use client"

import React, { useEffect, useMemo, useState } from "react"
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
} from "@mui/material"

import EditIcon from "@mui/icons-material/Edit"
import SaveIcon from "@mui/icons-material/Save"
import CancelIcon from "@mui/icons-material/Cancel"
import UploadIcon from "@mui/icons-material/Upload"
import KeyOutlinedIcon from "@mui/icons-material/KeyOutlined"
import MailOutlineIcon from "@mui/icons-material/MailOutline"
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined"
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined"
import PersonOutlineIcon from "@mui/icons-material/PersonOutline"
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined"
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"

// Amplify v6 modular APIs
import { fetchUserAttributes, updateUserAttributes, updatePassword, getCurrentUser } from "aws-amplify/auth"
import { uploadData, getUrl } from "aws-amplify/storage"

/* =====================
   Indigo SaaS theme (match IngredientInventory style)
   ===================== */
const Styles = ({ isDark }) => (
  <style>{`
    :root{
      --bg: ${isDark ? "#0a0f1e" : "#f8fafc"};
      --bg-card: ${isDark ? "#0f172a" : "#ffffff"};
      --text: ${isDark ? "#f1f5f9" : "#0f172a"};
      --text-muted: ${isDark ? "#94a3b8" : "#64748b"};
      --text-soft: ${isDark ? "#cbd5e1" : "#94a3b8"};

      --border: ${isDark ? "rgba(148,163,184,0.12)" : "#e2e8f0"};
      --input-bg: ${isDark ? "rgba(15,23,42,0.6)" : "#ffffff"};

      --shadow: ${
        isDark
          ? "0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -1px rgba(0,0,0,0.2)"
          : "0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px 0 rgba(0,0,0,0.04)"
      };
      --shadow-lg: ${
        isDark
          ? "0 20px 25px -5px rgba(0,0,0,0.4), 0 10px 10px -5px rgba(0,0,0,0.2)"
          : "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)"
      };

      --primary: #6366f1;
      --primary-dark: #4f46e5;
      --primary-light: #818cf8;
      --primary-ring: rgba(99,102,241,0.2);

      --overlay: ${isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)"};
    }

    .acct-page{
      background: var(--bg);
      min-height: 100vh;
      color: var(--text);
      transition: background 0.3s ease, color 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      position: relative;
      overflow-x: hidden;
    }

    .acct-backdrop{
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      background:
        radial-gradient(900px 420px at 10% -10%, rgba(99,102,241,0.18), transparent 60%),
        radial-gradient(900px 420px at 90% 0%, rgba(79,70,229,0.14), transparent 60%),
        linear-gradient(180deg, ${isDark ? "#0a0f1e" : "#f8fafc"}, ${isDark ? "#0a0f1e" : "#eef2ff"} 55%, ${
    isDark ? "#0a0f1e" : "#f8fafc"
  });
    }

    .acct-shell{
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 1280px;
      margin: 0 auto;
      padding: 24px 20px;
      box-sizing: border-box;
    }

    .acct-topbar{
      display:flex;
      align-items:flex-start;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 18px;
    }

    .acct-title{
      margin:0;
      font-weight:700;
      font-size:24px;
      letter-spacing:-0.02em;
      color: var(--text);
    }
    .acct-sub{
      margin: 4px 0 0;
      color: var(--text-muted);
      font-size: 14px;
      font-weight: 500;
    }

    .acct-actions{
      display:flex;
      gap: 10px;
      align-items:center;
      flex-wrap: wrap;
    }

    .btn-solid{
      color:#fff;
      border-radius: 12px;
      font-weight: 700;
      padding: 10px 16px;
      text-transform:none;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      border: 1px solid rgba(255,255,255,0.10);
      box-shadow: 0 2px 8px rgba(99,102,241,0.25);
    }
    .btn-solid:hover{
      background: linear-gradient(135deg, var(--primary-light), var(--primary));
      box-shadow: 0 4px 12px rgba(99,102,241,0.35);
      transform: translateY(-1px);
    }

    .btn-ghost{
      border: 1px solid var(--border);
      color: var(--text);
      background: transparent;
      font-weight: 700;
      border-radius: 12px;
      text-transform: none;
    }
    .btn-ghost:hover{
      background: ${isDark ? "rgba(255,255,255,0.05)" : "#f8fafc"};
      transform: translateY(-1px);
    }

    .acct-grid{
      display:grid;
      gap: 20px;
      grid-template-columns: 360px minmax(0, 1fr);
      align-items: start;
    }
    @media (max-width: 980px){
      .acct-grid{ grid-template-columns: 1fr; }
    }

    .card{
      border: 1px solid var(--border);
      background: var(--bg-card);
      border-radius: 16px;
      box-shadow: var(--shadow);
      overflow: hidden;
      min-width: 0;
      transition: box-shadow .25s ease, transform .2s ease;
    }
    .card:hover{
      box-shadow: ${
        isDark
          ? "0 8px 16px -4px rgba(0,0,0,0.4), 0 4px 8px -2px rgba(0,0,0,0.2)"
          : "0 4px 12px -2px rgba(0,0,0,0.08), 0 2px 6px -1px rgba(0,0,0,0.04)"
      };
    }

    .card-h{
      display:flex;
      align-items:center;
      justify-content: space-between;
      gap: 10px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      background: ${isDark ? "rgba(99,102,241,0.03)" : "var(--bg-card)"};
    }

    .card-title{
      margin:0;
      font-weight:700;
      color: var(--text);
      letter-spacing:-0.01em;
      font-size: 16px;
    }
    .card-sub{
      margin: 4px 0 0;
      color: var(--text-muted);
      font-weight:500;
      font-size: 13px;
    }

    .card-b{ padding: 16px; }

    .avatar-wrap{
      position: relative;
      width: 128px;
      margin: 4px auto 0;
    }
    .avatar-ring{
      border-radius: 999px;
      padding: 4px;
      background:
        radial-gradient(circle at 20% 20%, rgba(255,255,255,0.45), rgba(255,255,255,0) 45%),
        linear-gradient(135deg, rgba(99,102,241,0.75), rgba(79,70,229,0.75));
      box-shadow: 0 18px 40px rgba(2,6,23,0.18);
    }
    .avatar-overlay{
      position:absolute; inset:0;
      display:grid; place-items:center;
      background: ${isDark ? "rgba(15,23,42,0.55)" : "rgba(248, 250, 252, 0.72)"};
      border-radius: 999px;
      backdrop-filter: blur(6px);
    }
    .upload-btn{
      position: absolute;
      bottom: -6px;
      right: -6px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      box-shadow: 0 10px 22px rgba(2,6,23,0.12);
    }
    .upload-btn:hover{ background: ${isDark ? "rgba(255,255,255,0.05)" : "#f8fafc"}; }

    .mini-actions{
      display:grid;
      gap: 10px;
      margin-top: 14px;
      min-width: 0;
    }

    .side-stat{
      display:flex;
      align-items:center;
      justify-content: space-between;
      gap: 10px;
      padding: 12px 12px;
      border: 1px solid var(--border);
      border-radius: 14px;
      background: ${isDark ? "rgba(99,102,241,0.03)" : "#fafbfc"};
      min-width: 0;
    }
    .side-stat strong{ color: var(--text); font-weight: 700; }
    .side-stat span{
      color: var(--text-muted);
      font-weight: 600;
      font-size: 13px;
      overflow:hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display:block;
      max-width: 220px;
    }

    .section{
      padding: 14px 16px;
      border: 1px solid var(--border);
      border-radius: 16px;
      background: ${isDark ? "rgba(99,102,241,0.03)" : "#fafbfc"};
      min-width: 0;
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
      min-width: 0;
    }

    .k-icon{
      width: 34px; height: 34px;
      border-radius: 12px;
      display:grid; place-items:center;
      background: rgba(99,102,241,0.12);
      border: 1px solid rgba(99,102,241,0.22);
      color: var(--primary-dark);
    }

    .input .MuiOutlinedInput-root{
      border-radius: 14px;
      background: var(--input-bg);
      color: var(--text);
    }
    .input .MuiOutlinedInput-notchedOutline{ border-color: var(--border); }
    .input .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline{ border-color: rgba(99,102,241,0.35); }
    .input .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline{ border-color: var(--primary); }
    .input .MuiOutlinedInput-root.Mui-focused{ box-shadow: 0 0 0 3px var(--primary-ring); }
    .input .MuiInputLabel-root{ color: var(--text-muted); font-weight: 600; }
    .input .MuiInputLabel-root.Mui-focused{ color: var(--primary-dark); font-weight: 700; }
    .input .MuiInputBase-input{ color: var(--text); font-weight: 600; }
    .input .MuiInputBase-input.Mui-disabled{ -webkit-text-fill-color: var(--text-muted); }
    .input .MuiSvgIcon-root{ color: var(--text-muted); }

    .hint{
      display:flex;
      gap: 8px;
      align-items:flex-start;
      color: var(--text-muted);
      font-weight: 600;
      font-size: 12.5px;
      line-height: 1.35;
      padding: 10px 12px;
      border-radius: 14px;
      border: 1px dashed rgba(99,102,241,0.35);
      background: rgba(99,102,241,${isDark ? "0.10" : "0.06"});
      min-width: 0;
    }

    .badge-row{
      display:flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 12px;
      align-items:center;
    }

    .pill{
      display:flex;
      gap: 8px;
      align-items:center;
      padding: 8px 10px;
      border-radius: 999px;
      background: ${isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)"};
      border: 1px solid rgba(99,102,241,0.22);
      color: ${isDark ? "rgba(241,245,249,0.92)" : "rgba(15,23,42,0.88)"};
      font-weight: 700;
      font-size: 12px;
      backdrop-filter: blur(10px);
    }

    /* Modal overlay for password dialog (Dialog already handles backdrop; keep for consistency) */
    @keyframes ii-pop { to { transform:none; opacity:1 } }
  `}</style>
)

function splitName(full = "") {
  const s = String(full).trim()
  if (!s) return { firstName: "", lastName: "" }
  const parts = s.split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0], lastName: "" }
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts.slice(-1)[0] }
}
function joinName(first = "", last = "") {
  return [first, last].filter(Boolean).join(" ").trim()
}
function isHttpUrl(v = "") {
  return /^https?:\/\//i.test(v)
}
function initialsFromName(first = "", last = "", fallback = "U") {
  const a = (first || "").trim()[0] || ""
  const b = (last || "").trim()[0] || ""
  const i = `${a}${b}`.toUpperCase()
  return i || fallback
}

export default function AccountPage() {
  const [loading, setLoading] = useState(true)

  // Theme sync with Topbar (same pattern as other pages)
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme-mode") === "dark")
  useEffect(() => {
    const onThemeChanged = () => setIsDark(localStorage.getItem("theme-mode") === "dark")
    window.addEventListener("themeChanged", onThemeChanged)
    return () => window.removeEventListener("themeChanged", onThemeChanged)
  }, [])

  const [form, setForm] = useState({ firstName: "", lastName: "", company: "", jobTitle: "" })
  const [email, setEmail] = useState("")

  const [avatarUrl, setAvatarUrl] = useState("")
  const [avatarKey, setAvatarKey] = useState("")
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarProgress, setAvatarProgress] = useState(0)

  const [editMode, setEditMode] = useState(false)

  const [pwOpen, setPwOpen] = useState(false)
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" })
  const [pwBusy, setPwBusy] = useState(false)

  const [snack, setSnack] = useState({ open: false, severity: "success", message: "" })

  const fullName = useMemo(
    () => joinName(form.firstName, form.lastName) || "Your profile",
    [form.firstName, form.lastName],
  )

  const resolveAvatarUrl = async (pictureAttr) => {
    if (!pictureAttr) return ""
    if (isHttpUrl(pictureAttr)) return pictureAttr
    try {
      const { url } = await getUrl({ key: pictureAttr, options: { level: "private", expiresIn: 60 * 60 } })
      return url.toString()
    } catch (e) {
      console.warn("[AccountPage] Failed to sign avatar URL:", e)
      return ""
    }
  }

  useEffect(() => {
    ;(async () => {
      try {
        const attrs = await fetchUserAttributes()
        const first = attrs?.given_name || splitName(attrs?.name || "").firstName
        const last = attrs?.family_name || splitName(attrs?.name || "").lastName

        setForm({
          firstName: first || "",
          lastName: last || "",
          company: attrs?.["custom:Company"] || "",
          jobTitle: attrs?.["custom:jobTitle"] || "",
        })
        setEmail(attrs?.email || "")

        const picture = attrs?.picture || ""
        setAvatarKey(picture || "")
        setAvatarUrl(await resolveAvatarUrl(picture))
      } catch (err) {
        console.error("[AccountPage] Failed to fetch user attributes:", err)
        setSnack({ open: true, severity: "error", message: "Failed to load profile." })
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const onAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setAvatarUploading(true)
      setAvatarProgress(0)

      const { userId } = await getCurrentUser()
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
      const key = `avatars/${userId}/${Date.now()}-${safeName}`

      await uploadData({
        key,
        data: file,
        options: {
          level: "private",
          contentType: file.type,
          onProgress: ({ transferredBytes, totalBytes }) => {
            if (totalBytes) setAvatarProgress(Math.round((transferredBytes / totalBytes) * 100))
          },
        },
      }).result

      const url = await resolveAvatarUrl(key)
      setAvatarKey(key)
      setAvatarUrl(url)

      setSnack({ open: true, severity: "success", message: "Image uploaded. Click Save to update your profile." })
    } catch (err) {
      console.error("[AccountPage] Avatar upload failed:", err)
      setSnack({ open: true, severity: "error", message: "Failed to upload image." })
    } finally {
      setAvatarUploading(false)
    }
  }

  const onCancel = async () => {
    try {
      const attrs = await fetchUserAttributes()
      const first = attrs?.given_name || splitName(attrs?.name || "").firstName
      const last = attrs?.family_name || splitName(attrs?.name || "").lastName

      setForm({
        firstName: first || "",
        lastName: last || "",
        company: attrs?.["custom:Company"] || "",
        jobTitle: attrs?.["custom:jobTitle"] || "",
      })

      const picture = attrs?.picture || ""
      setAvatarKey(picture || "")
      setAvatarUrl(await resolveAvatarUrl(picture))
    } catch (err) {
      console.error("[AccountPage] Failed to refresh attributes:", err)
    } finally {
      setEditMode(false)
    }
  }

  const onSave = async () => {
    if (!form.firstName.trim()) return setSnack({ open: true, severity: "warning", message: "First name is required." })
    if (!form.lastName.trim()) return setSnack({ open: true, severity: "warning", message: "Last name is required." })
    if (avatarUploading)
      return setSnack({ open: true, severity: "info", message: "Please wait for the image to finish uploading." })

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
      })

      setSnack({ open: true, severity: "success", message: "Profile updated." })
      setEditMode(false)
    } catch (err) {
      console.error("[AccountPage] Failed to update attributes:", err)
      const msg =
        err?.message ||
        "Failed to update profile. Please ensure custom attributes exist in your user pool."
      setSnack({ open: true, severity: "error", message: msg })
    }
  }

  const openPwDialog = () => {
    setPwForm({ current: "", next: "", confirm: "" })
    setPwOpen(true)
  }
  const closePwDialog = () => {
    if (!pwBusy) setPwOpen(false)
  }
  const onPwChange = (field) => (e) => setPwForm((p) => ({ ...p, [field]: e.target.value }))

  const onChangePassword = async () => {
    const { current, next, confirm } = pwForm
    if (!current || !next || !confirm) {
      return setSnack({ open: true, severity: "warning", message: "Please fill in all password fields." })
    }
    if (next !== confirm) {
      return setSnack({ open: true, severity: "warning", message: "New passwords do not match." })
    }
    if (next.length < 8) {
      return setSnack({ open: true, severity: "warning", message: "New password must be at least 8 characters." })
    }

    setPwBusy(true)
    try {
      await updatePassword({ oldPassword: current, newPassword: next })
      setPwBusy(false)
      setPwOpen(false)
      setSnack({ open: true, severity: "success", message: "Password changed successfully." })
    } catch (err) {
      console.error("[AccountPage] Change password failed:", err)
      setPwBusy(false)
      const message = err?.message || "Failed to change password. Check your current password and try again."
      setSnack({ open: true, severity: "error", message })
    }
  }

  if (loading) {
    return (
      <Box p={4} display="grid" placeItems="center">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box className="acct-page">
      <Styles isDark={isDark} />
      <Box className="acct-backdrop" aria-hidden />
      <Box className="acct-shell">
        {/* ✅ Header removed — keep edit/save/cancel actions in a light topbar */}
        <Box className="acct-topbar">
          <Box>
            <Typography className="acct-title">Account</Typography>
            <Typography className="acct-sub">Manage your profile and security settings</Typography>

            <Box className="badge-row">
              <Box className="pill">
                <ShieldOutlinedIcon sx={{ fontSize: 16 }} />
                Private avatar storage
              </Box>
              <Box className="pill">
                <AutoAwesomeOutlinedIcon sx={{ fontSize: 16 }} />
                Profile syncs across platform
              </Box>
              <Box className="pill">
                <InfoOutlinedIcon sx={{ fontSize: 16 }} />
                Email is read-only
              </Box>
            </Box>
          </Box>

          <Box className="acct-actions">
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

        {/* Main content */}
        <Box className="acct-grid">
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
                  fontWeight: 700,
                  borderRadius: 999,
                  border: "1px solid var(--border)",
                  background: editMode ? "rgba(99,102,241,0.12)" : "transparent",
                  color: editMode ? "var(--primary-dark)" : "var(--text-muted)",
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
                      bgcolor: "rgba(99,102,241,0.25)",
                      color: "#fff",
                      fontWeight: 800,
                      border: "1px solid rgba(255,255,255,0.18)",
                    }}
                  >
                    {initialsFromName(form.firstName, form.lastName)}
                  </Avatar>
                </Box>

                {avatarUploading && (
                  <Box className="avatar-overlay">
                    <Box display="grid" gap={1} justifyItems="center">
                      <CircularProgress size={28} />
                      <Typography variant="caption" sx={{ color: "var(--text-muted)", fontWeight: 700 }}>
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
                <Typography sx={{ fontWeight: 800, color: "var(--text)", fontSize: 18, letterSpacing: -0.01 }}>
                  {fullName}
                </Typography>
                <Typography sx={{ color: "var(--text-muted)", fontWeight: 600, fontSize: 13 }}>
                  {form.jobTitle || "—"} {form.company ? `• ${form.company}` : ""}
                </Typography>
              </Box>

              <Divider sx={{ my: 2, borderColor: "var(--border)" }} />

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
                  <MailOutlineIcon sx={{ color: "var(--primary-dark)" }} />
                </Box>

                <Box className="hint">
                  <InfoOutlinedIcon sx={{ fontSize: 18, mt: "1px", color: "var(--primary-dark)" }} />
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
                  fontWeight: 700,
                  borderRadius: 999,
                  border: "1px solid var(--border)",
                  background: editMode ? "rgba(99,102,241,0.12)" : "transparent",
                  color: editMode ? "var(--primary-dark)" : "var(--text-muted)",
                }}
              />
            </Box>

            <Box className="card-b">
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box className="section">
                    <Box className="section-h">
                      <Box className="kicker">
                        <Box className="k-icon">
                          <MailOutlineIcon sx={{ fontSize: 18 }} />
                        </Box>
                        <Box>
                          <Typography sx={{ fontWeight: 800, color: "var(--text)", letterSpacing: -0.01 }}>
                            Contact
                          </Typography>
                          <Typography sx={{ color: "var(--text-muted)", fontWeight: 500, fontSize: 13 }}>
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
                            <MailOutlineIcon sx={{ color: "var(--text-muted)" }} />
                          </InputAdornment>
                        ),
                      }}
                      className="input"
                    />
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box className="section">
                    <Box className="section-h">
                      <Box className="kicker">
                        <Box className="k-icon">
                          <PersonOutlineIcon sx={{ fontSize: 18 }} />
                        </Box>
                        <Box>
                          <Typography sx={{ fontWeight: 800, color: "var(--text)", letterSpacing: -0.01 }}>
                            Personal
                          </Typography>
                          <Typography sx={{ color: "var(--text-muted)", fontWeight: 500, fontSize: 13 }}>
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
                                <PersonOutlineIcon sx={{ color: "var(--text-muted)" }} />
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
                                <PersonOutlineIcon sx={{ color: "var(--text-muted)" }} />
                              </InputAdornment>
                            ),
                          }}
                          className="input"
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box className="section">
                    <Box className="section-h">
                      <Box className="kicker">
                        <Box className="k-icon">
                          <BusinessOutlinedIcon sx={{ fontSize: 18 }} />
                        </Box>
                        <Box>
                          <Typography sx={{ fontWeight: 800, color: "var(--text)", letterSpacing: -0.01 }}>
                            Work
                          </Typography>
                          <Typography sx={{ color: "var(--text-muted)", fontWeight: 500, fontSize: 13 }}>
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
                                <BusinessOutlinedIcon sx={{ color: "var(--text-muted)" }} />
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
                                <BadgeOutlinedIcon sx={{ color: "var(--text-muted)" }} />
                              </InputAdornment>
                            ),
                          }}
                          className="input"
                        />
                      </Grid>
                    </Grid>

                    <Box mt={2} className="hint">
                      <InfoOutlinedIcon sx={{ fontSize: 18, mt: "1px", color: "var(--primary-dark)" }} />
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
              borderRadius: 16,
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-lg)",
              overflow: "hidden",
              background: "var(--bg-card)",
              color: "var(--text)",
            },
          }}
        >
          <DialogTitle
            sx={{
              fontWeight: 800,
              color: "var(--text)",
              background: isDark ? "rgba(99,102,241,0.03)" : "var(--bg-card)",
              borderBottom: "1px solid var(--border)",
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

          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={closePwDialog} disabled={pwBusy} className="btn-ghost" sx={{ borderRadius: 14 }}>
              Cancel
            </Button>
            <Button onClick={onChangePassword} disabled={pwBusy} className="btn-solid" sx={{ borderRadius: 14, minWidth: 160 }}>
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
  )
}
