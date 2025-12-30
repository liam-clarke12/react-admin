// src/scenes/HRP/Roles.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Stack,
  Switch,
  FormControlLabel,
  InputAdornment,
  Tooltip,
  Divider,
} from "@mui/material";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SearchIcon from "@mui/icons-material/Search";

import { useAuth } from "../../../contexts/AuthContext";

const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

function hashColor(str) {
  const s = String(str || "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue} 70% 45%)`;
}

// ✅ Topbar-style theme tokens
const getBrand = (isDark) => ({
  text: isDark ? "#f1f5f9" : "#0f172a",
  subtext: isDark ? "#94a3b8" : "#64748b",
  border: isDark ? "rgba(148,163,184,0.14)" : "#e5e7eb",
  surface: isDark ? "rgba(15, 23, 42, 0.7)" : "rgba(255, 255, 255, 0.9)",
  surfaceSolid: isDark ? "#0f172a" : "#ffffff",
  surfaceMuted: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
  primary: "#7C3AED",
  primaryDark: "#5B21B6",
  shadow: isDark ? "0 10px 26px rgba(0,0,0,0.35)" : "0 10px 26px rgba(15,23,42,0.08)",
});

const Roles = () => {
  const { cognitoId } = useAuth();

  // ✅ Dark mode sync with Topbar
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme-mode") === "dark");
  useEffect(() => {
    const onThemeChanged = () => setIsDark(localStorage.getItem("theme-mode") === "dark");
    window.addEventListener("themeChanged", onThemeChanged);
    return () => window.removeEventListener("themeChanged", onThemeChanged);
  }, []);

  const brand = useMemo(() => getBrand(isDark), [isDark]);

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // full role object or null

  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    is_production_role: true,
  });

  // Load roles
  useEffect(() => {
    if (!cognitoId) return;
    loadRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cognitoId]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/roles/list?cognito_id=${encodeURIComponent(cognitoId)}`);
      const json = await res.json();
      setRoles(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error("[Roles] Load error:", err);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter((r) => {
      const name = String(r.name || "").toLowerCase();
      const code = String(r.code || "").toLowerCase();
      const desc = String(r.description || "").toLowerCase();
      return name.includes(q) || code.includes(q) || desc.includes(q);
    });
  }, [roles, query]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      code: "",
      description: "",
      is_production_role: true,
    });
    setModalOpen(true);
  };

  const openEdit = (role) => {
    setEditing(role);
    setForm({
      name: role.name || "",
      code: role.code || "",
      description: role.description || "",
      is_production_role: !!role.is_production_role,
    });
    setModalOpen(true);
  };

  const saveRole = async () => {
    try {
      if (!form.name.trim()) {
        alert("Role name is required.");
        return;
      }

      const body = {
        cognito_id: cognitoId,
        name: form.name.trim(),
        code: form.code.trim() ? form.code.trim() : null,
        description: form.description.trim() ? form.description.trim() : null,
        is_production_role: form.is_production_role ? 1 : 0,
      };

      let res;
      if (editing?.id) {
        res = await fetch(`${API_BASE}/roles/update/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`${API_BASE}/roles/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert("Error: " + JSON.stringify(json));
        return;
      }

      setModalOpen(false);
      await loadRoles();
    } catch (err) {
      console.error("[Roles] Save error:", err);
      alert(err?.message || "Save failed");
    }
  };

  const deleteRole = async (id) => {
    if (!window.confirm("Delete this role?")) return;

    try {
      const res = await fetch(
        `${API_BASE}/roles/delete/${encodeURIComponent(id)}?cognito_id=${encodeURIComponent(cognitoId)}`,
        { method: "DELETE" }
      );

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert("Error: " + JSON.stringify(json));
        return;
      }

      await loadRoles();
    } catch (err) {
      console.error("[Roles] Delete error:", err);
      alert(err?.message || "Delete failed");
    }
  };

  const stats = useMemo(() => {
    const total = roles.length;
    const prod = roles.filter((r) => !!r.is_production_role).length;
    return { total, prod };
  }, [roles]);

  return (
    <Box
      p={3}
      sx={{
        minHeight: "100vh",
        background: isDark ? "#0a0f1e" : "#f6f7fb",
        color: brand.text,
        transition: "background .25s ease, color .25s ease",
      }}
    >
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 3,
          border: `1px solid ${brand.border}`,
          background: isDark
            ? "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(15,23,42,0.85) 55%)"
            : "linear-gradient(135deg, rgba(124,58,237,0.10), rgba(255,255,255,1) 45%)",
          boxShadow: brand.shadow,
          backdropFilter: "blur(10px)",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h4" fontWeight={900} sx={{ lineHeight: 1.1, color: brand.text }}>
              Roles
            </Typography>
            <Typography variant="body2" sx={{ color: brand.subtext, mt: 0.5 }}>
              Manage roles used across HRP and rostering.
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
              <Chip
                size="small"
                label={`${stats.total} total`}
                sx={{
                  fontWeight: 900,
                  bgcolor: brand.surfaceMuted,
                  border: `1px solid ${brand.border}`,
                  color: brand.text,
                }}
              />
              <Chip
                size="small"
                label={`${stats.prod} production`}
                variant="outlined"
                sx={{
                  fontWeight: 900,
                  borderRadius: 2,
                  borderColor: brand.border,
                  color: brand.text,
                  bgcolor: "transparent",
                }}
              />
            </Stack>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField
              size="small"
              placeholder="Search roles…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              sx={{
                minWidth: { xs: "100%", sm: 280 },
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  color: brand.text,
                  bgcolor: brand.surfaceMuted,
                  "& fieldset": { borderColor: brand.border },
                  "&:hover fieldset": { borderColor: brand.primary },
                  "&.Mui-focused fieldset": { borderColor: brand.primary },
                },
                "& .MuiInputBase-input::placeholder": { color: brand.subtext, opacity: 1 },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: brand.subtext }} />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              variant="contained"
              startIcon={<AddOutlinedIcon />}
              onClick={openCreate}
              sx={{
                fontWeight: 900,
                borderRadius: 2,
                backgroundColor: brand.primary,
                "&:hover": { backgroundColor: brand.primaryDark },
                boxShadow: "0 12px 24px rgba(124,58,237,0.22)",
              }}
            >
              Add Role
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Table */}
      <Paper
        sx={{
          width: "100%",
          overflow: "hidden",
          borderRadius: 3,
          border: `1px solid ${brand.border}`,
          background: brand.surfaceSolid,
          boxShadow: brand.shadow,
        }}
      >
        <Table>
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: isDark ? "rgba(124,58,237,0.12)" : "rgba(124,58,237,0.06)",
              }}
            >
              <TableCell sx={{ fontWeight: 900, color: brand.text }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 900, color: brand.text }}>Code</TableCell>
              <TableCell sx={{ fontWeight: 900, color: brand.text }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 900, color: brand.text }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 900, width: 140, color: brand.text }} align="center">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filtered.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ color: brand.subtext }}>
                  No roles found.
                </TableCell>
              </TableRow>
            )}

            {filtered.map((role) => {
              const color = hashColor(role.code || role.name);
              return (
                <TableRow
                  key={role.id}
                  hover
                  sx={{
                    "&:hover": { backgroundColor: isDark ? "rgba(124,58,237,0.08)" : "rgba(124,58,237,0.04)" },
                    "& td": { borderColor: brand.border },
                  }}
                >
                  <TableCell sx={{ color: brand.text }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          backgroundColor: color,
                          boxShadow: isDark ? "0 0 0 3px rgba(255,255,255,0.04)" : "0 0 0 3px rgba(0,0,0,0.03)",
                        }}
                      />
                      <Typography fontWeight={900} sx={{ color: brand.text }}>
                        {role.name}
                      </Typography>
                    </Stack>
                  </TableCell>

                  <TableCell>
                    {role.code ? (
                      <Chip
                        size="small"
                        label={role.code}
                        sx={{
                          fontWeight: 900,
                          borderRadius: 2,
                          bgcolor: brand.surfaceMuted,
                          border: `1px solid ${brand.border}`,
                          color: brand.text,
                        }}
                      />
                    ) : (
                      <Typography variant="body2" sx={{ color: brand.subtext }}>
                        —
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    <Chip
                      size="small"
                      label={role.is_production_role ? "Production" : "Non-production"}
                      sx={{
                        fontWeight: 900,
                        borderRadius: 2,
                        color: role.is_production_role ? (isDark ? "#6ee7b7" : "#065f46") : brand.text,
                        backgroundColor: role.is_production_role
                          ? isDark
                            ? "rgba(16,185,129,0.16)"
                            : "rgba(16,185,129,0.14)"
                          : isDark
                          ? "rgba(148,163,184,0.18)"
                          : "rgba(148,163,184,0.22)",
                        border: `1px solid ${brand.border}`,
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" sx={{ color: brand.subtext }}>
                      {role.description || "—"}
                    </Typography>
                  </TableCell>

                  <TableCell align="center">
                    <Tooltip title="Edit">
                      <IconButton
                        onClick={() => openEdit(role)}
                        size="small"
                        sx={{
                          color: brand.subtext,
                          "&:hover": { color: brand.text, bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" },
                        }}
                      >
                        <EditOutlinedIcon />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete">
                      <IconButton
                        onClick={() => deleteRole(role.id)}
                        size="small"
                        sx={{
                          color: isDark ? "#fca5a5" : "error.main",
                          "&:hover": { bgcolor: isDark ? "rgba(239,68,68,0.10)" : "rgba(239,68,68,0.08)" },
                        }}
                      >
                        <DeleteOutlineOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {loading && (
          <Box p={2}>
            <Typography variant="body2" sx={{ color: brand.subtext }}>
              Loading…
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: brand.surfaceSolid,
            border: `1px solid ${brand.border}`,
            boxShadow: brand.shadow,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: brand.text }}>
          {editing ? "Edit Role" : "Create Role"}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Role Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              InputLabelProps={{ sx: { color: brand.subtext } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  color: brand.text,
                  bgcolor: brand.surfaceMuted,
                  "& fieldset": { borderColor: brand.border },
                  "&:hover fieldset": { borderColor: brand.primary },
                  "&.Mui-focused fieldset": { borderColor: brand.primary },
                },
              }}
            />

            <TextField
              fullWidth
              label="Code (optional)"
              placeholder="e.g. packing, admin, dispatch"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              helperText="Short code helps link roles to roster templates cleanly."
              FormHelperTextProps={{ sx: { color: brand.subtext } }}
              InputLabelProps={{ sx: { color: brand.subtext } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  color: brand.text,
                  bgcolor: brand.surfaceMuted,
                  "& fieldset": { borderColor: brand.border },
                  "&:hover fieldset": { borderColor: brand.primary },
                  "&.Mui-focused fieldset": { borderColor: brand.primary },
                },
                "& .MuiInputBase-input::placeholder": { color: brand.subtext, opacity: 1 },
              }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={form.is_production_role}
                  onChange={(e) => setForm((f) => ({ ...f, is_production_role: e.target.checked }))}
                />
              }
              label={<span style={{ color: brand.text, fontWeight: 900 }}>Production role</span>}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description (optional)"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              InputLabelProps={{ sx: { color: brand.subtext } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  color: brand.text,
                  bgcolor: brand.surfaceMuted,
                  "& fieldset": { borderColor: brand.border },
                  "&:hover fieldset": { borderColor: brand.primary },
                  "&.Mui-focused fieldset": { borderColor: brand.primary },
                },
              }}
            />

            <Divider sx={{ borderColor: brand.border }} />

            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: `1px solid ${brand.border}`,
                backgroundColor: isDark ? "rgba(124,58,237,0.10)" : "rgba(124,58,237,0.04)",
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 900, color: brand.text }}>
                Preview
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1, flexWrap: "wrap" }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    backgroundColor: hashColor(form.code || form.name),
                  }}
                />
                <Chip
                  size="small"
                  label={form.name || "Role name"}
                  sx={{
                    fontWeight: 900,
                    borderRadius: 2,
                    bgcolor: brand.surfaceMuted,
                    border: `1px solid ${brand.border}`,
                    color: brand.text,
                  }}
                />
                {form.code?.trim() ? (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={form.code.trim()}
                    sx={{
                      fontWeight: 900,
                      borderRadius: 2,
                      borderColor: brand.border,
                      color: brand.text,
                    }}
                  />
                ) : null}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setModalOpen(false)} sx={{ color: brand.subtext, fontWeight: 900 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={saveRole}
            sx={{
              fontWeight: 900,
              borderRadius: 2,
              backgroundColor: brand.primary,
              "&:hover": { backgroundColor: brand.primaryDark },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Roles;
