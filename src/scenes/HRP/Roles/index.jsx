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
} from "@mui/material";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SearchIcon from "@mui/icons-material/Search";

import { useAuth } from "../../../contexts/AuthContext";

const API_BASE =
  "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

function hashColor(str) {
  // deterministic pleasant-ish HSL from string
  const s = String(str || "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue} 70% 45%)`;
}

const Roles = () => {
  const { cognitoId } = useAuth();

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
      const res = await fetch(
        `${API_BASE}/roles/list?cognito_id=${encodeURIComponent(cognitoId)}`
      );
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
        `${API_BASE}/roles/delete/${encodeURIComponent(
          id
        )}?cognito_id=${encodeURIComponent(cognitoId)}`,
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
    <Box p={3}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          background:
            "linear-gradient(135deg, rgba(124,58,237,0.10), rgba(255,255,255,1) 45%)",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h4" fontWeight={900} sx={{ lineHeight: 1.1 }}>
              Roles
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
              Manage roles used across HRP and rostering.
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip
                size="small"
                label={`${stats.total} total`}
                sx={{ fontWeight: 900 }}
              />
              <Chip
                size="small"
                label={`${stats.prod} production`}
                sx={{ fontWeight: 900 }}
                variant="outlined"
              />
            </Stack>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField
              size="small"
              placeholder="Search roles…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              sx={{ minWidth: { xs: "100%", sm: 280 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
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
                backgroundColor: "#7C3AED",
                "&:hover": { backgroundColor: "#5B21B6" },
              }}
            >
              Add Role
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Table */}
      <Paper sx={{ width: "100%", overflow: "hidden", borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "rgba(124,58,237,0.06)" }}>
              <TableCell sx={{ fontWeight: 900 }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 900 }}>Code</TableCell>
              <TableCell sx={{ fontWeight: 900 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 900 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 900, width: 140 }} align="center">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filtered.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={5} align="center">
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
                    "&:hover": { backgroundColor: "rgba(124,58,237,0.04)" },
                  }}
                >
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          backgroundColor: color,
                          boxShadow: "0 0 0 3px rgba(0,0,0,0.03)",
                        }}
                      />
                      <Typography fontWeight={900}>{role.name}</Typography>
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
                          backgroundColor: "rgba(15,23,42,0.06)",
                        }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
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
                        color: role.is_production_role ? "#065f46" : "#0f172a",
                        backgroundColor: role.is_production_role
                          ? "rgba(16,185,129,0.14)"
                          : "rgba(148,163,184,0.22)",
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {role.description || "—"}
                    </Typography>
                  </TableCell>

                  <TableCell align="center">
                    <Tooltip title="Edit">
                      <IconButton onClick={() => openEdit(role)} size="small">
                        <EditOutlinedIcon />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete">
                      <IconButton
                        onClick={() => deleteRole(role.id)}
                        size="small"
                        color="error"
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
            <Typography variant="body2" color="text.secondary">
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
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          {editing ? "Edit Role" : "Create Role"}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Role Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />

            <TextField
              fullWidth
              label="Code (optional)"
              placeholder="e.g. packing, admin, dispatch"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              helperText="Short code helps link roles to roster templates cleanly."
            />

            <FormControlLabel
              control={
                <Switch
                  checked={form.is_production_role}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      is_production_role: e.target.checked,
                    }))
                  }
                />
              }
              label="Production role"
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description (optional)"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />

            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                backgroundColor: "rgba(124,58,237,0.04)",
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 900 }}>
                Preview
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
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
                  sx={{ fontWeight: 900, borderRadius: 2 }}
                />
                {form.code?.trim() ? (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={form.code.trim()}
                    sx={{ fontWeight: 900, borderRadius: 2 }}
                  />
                ) : null}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={saveRole}
            sx={{
              fontWeight: 900,
              borderRadius: 2,
              backgroundColor: "#7C3AED",
              "&:hover": { backgroundColor: "#5B21B6" },
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
