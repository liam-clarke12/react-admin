// src/scenes/HRP/Roles.jsx
import React, { useEffect, useState } from "react";
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
} from "@mui/material";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";

import { useAuth } from "../../../contexts/AuthContext";

const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

const Roles = () => {
  const { cognitoId } = useAuth();

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    role_name: "",
    description: "",
  });

  // Load roles
  useEffect(() => {
    if (!cognitoId) return;
    loadRoles();
  }, [cognitoId]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/roles/list?cognito_id=${cognitoId}`);
      const json = await res.json();
      setRoles(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error("[Roles] Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm({ role_name: "", description: "" });
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (role) => {
    setForm({
      role_name: role.role_name,
      description: role.description || "",
    });
    setEditingId(role.id);
    setModalOpen(true);
  };

  const saveRole = async () => {
    try {
      const body = {
        cognito_id: cognitoId,
        role_name: form.role_name,
        description: form.description,
      };

      let res;
      if (editingId) {
        res = await fetch(`${API_BASE}/roles/update/${editingId}`, {
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

      const json = await res.json();
      if (!res.ok) {
        alert("Error: " + JSON.stringify(json));
        return;
      }

      setModalOpen(false);
      loadRoles();
    } catch (err) {
      console.error("[Roles] Save error:", err);
    }
  };

  const deleteRole = async (id) => {
    if (!window.confirm("Delete this role?")) return;

    try {
      const res = await fetch(`${API_BASE}/roles/delete/${id}?cognito_id=${cognitoId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json();
        alert("Error: " + JSON.stringify(json));
        return;
      }

      loadRoles();
    } catch (err) {
      console.error("[Roles] Delete error:", err);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={800} mb={2}>
        Roles
      </Typography>

      <Button
        variant="contained"
        startIcon={<AddOutlinedIcon />}
        sx={{ mb: 2 }}
        onClick={openCreate}
      >
        Add Role
      </Button>

      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Role Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 700, width: 120 }} align="center">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {roles.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  No roles found.
                </TableCell>
              </TableRow>
            )}

            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>{role.role_name}</TableCell>
                <TableCell>{role.description}</TableCell>

                <TableCell align="center">
                  <IconButton onClick={() => openEdit(role)} size="small">
                    <EditOutlinedIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => deleteRole(role.id)}
                    size="small"
                    color="error"
                  >
                    <DeleteOutlineOutlinedIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? "Edit Role" : "Create Role"}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="dense"
            label="Role Name"
            value={form.role_name}
            onChange={(e) => setForm({ ...form, role_name: e.target.value })}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            margin="dense"
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveRole}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Roles;
