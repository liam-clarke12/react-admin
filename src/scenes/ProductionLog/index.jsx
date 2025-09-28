// src/scenes/production/ProductionLog.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  useTheme,
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
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
  shadow: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)",
};

const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

/** Utility to safely format dates as yyyy-mm-dd */
const formatDateYMD = (val) => {
  if (!val) return "";
  // Accept either Date object or ISO string with timezone or plain yyyy-mm-dd
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) {
    // if invalid, attempt substring yyyy-MM-dd if present
    const s = String(val);
    const m = s.match(/\d{4}-\d{2}-\d{2}/);
    return m ? m[0] : s;
  }
  return d.toISOString().split("T")[0];
};

const ProductionLog = () => {
  const theme = useTheme();
  const { cognitoId } = useAuth();

  const [productionLogs, setProductionLogs] = useState([]);
  const [recipesMap, setRecipesMap] = useState({});
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

  // Editing state (single cell or full row)
  const [activeCell, setActiveCell] = useState(null); // { id: batchCode, field, value, row }
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [editingRow, setEditingRow] = useState(null); // full row edit
  const [updating, setUpdating] = useState(false);

  // Fetch recipe data for upb map (unchanged behavior)
  useEffect(() => {
    if (!cognitoId) return;
    const fetchRecipeData = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/recipes?cognito_id=${encodeURIComponent(cognitoId)}`
        );
        if (!res.ok) throw new Error("Failed to fetch recipes");
        const data = await res.json();
        const map = {};
        data.forEach((r) => {
          const key = r.recipe_name ?? r.recipe ?? r.name ?? "unknown";
          const upb = Number(r.units_per_batch) || 0;
          map[key] = upb;
        });
        setRecipesMap(map);
      } catch (err) {
        console.error("Error fetching recipes:", err);
      }
    };
    fetchRecipeData();
  }, [cognitoId]);

  // Fetch production logs (only active) and normalize dates
  useEffect(() => {
    if (!cognitoId) return;
    const fetchProductionLogData = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/production-log/active?cognito_id=${encodeURIComponent(cognitoId)}`
        );
        if (!response.ok) throw new Error(`Fetch failed with status ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data)) return;

        const sanitized = data.map((row, idx) => {
          const batchesProduced = Number(row.batchesProduced) || 0;
          const batchRemaining = Number(row.batchRemaining) || 0;
          const unitsOfWaste = Number(row.units_of_waste || row.unitsOfWaste) || 0;
          const upb = recipesMap[row.recipe] ?? Number(row.units_per_batch || 0);
          // compute unitsRemaining if schema has it, otherwise compute
          const unitsRemaining = Number(row.unitsRemaining ?? (batchRemaining * upb - unitsOfWaste)) || 0;

          return {
            date: formatDateYMD(row.date),
            recipe: row.recipe,
            batchesProduced,
            batchRemaining,
            unitsOfWaste,
            unitsRemaining,
            batchCode: row.batchCode || `gen-${idx}`,
            id: row.batchCode || `gen-${idx}-${Date.now()}`,
          };
        });

        setProductionLogs(sanitized);
      } catch (error) {
        console.error("Error fetching production log:", error);
      }
    };

    fetchProductionLogData();
  }, [cognitoId, recipesMap]);

  // Columns
  const columns = useMemo(
    () => [
      { field: "date", headerName: "Date", flex: 1 },
      { field: "recipe", headerName: "Recipe Name", flex: 1 },
      {
        field: "batchesProduced",
        headerName: "Batches Produced",
        type: "number",
        flex: 1,
        align: "left",
        headerAlign: "left",
      },
      {
        field: "unitsOfWaste",
        headerName: "Units of Waste",
        type: "number",
        flex: 1,
        align: "left",
        headerAlign: "left",
      },
      {
        field: "unitsRemaining",
        headerName: "Units Remaining",
        type: "number",
        flex: 1,
        align: "left",
        headerAlign: "left",
      },
      { field: "batchCode", headerName: "Batch Code", flex: 1 },
      {
        field: "actions",
        headerName: "Actions",
        width: 88,
        sortable: false,
        filterable: false,
        align: "center",
        renderCell: (params) => (
          <IconButton
            size="small"
            aria-label="Edit row"
            onClick={() => {
              setEditingRow(params.row);
              setActiveCell({ id: params.row.batchCode, field: null, value: null, row: params.row });
              setEditValue("");
              setEditDialogOpen(true);
            }}
          >
            <EditOutlinedIcon sx={{ color: brand.primary }} />
          </IconButton>
        ),
      },
    ],
    []
  );

  // Cell click handler: record active cell
  const handleCellClick = (params) => {
    if (params.field === "__check__") return;
    setActiveCell({
      id: params.row.batchCode,
      field: params.field,
      value: params.value,
      row: params.row,
    });
  };

  // open editor for active cell
  const openEditForActiveCell = () => {
    if (!activeCell) return;
    setEditValue(activeCell.value ?? "");
    setEditingRow(activeCell.row ?? null);
    setEditDialogOpen(true);
  };

  // process update call to backend (single object)
  const processRowUpdate = async (updatedRow) => {
    if (!cognitoId) throw new Error("Missing cognitoId");
    const payload = {
      // send only allowed fields
      date: updatedRow.date,
      recipe: updatedRow.recipe,
      batchesProduced: Number(updatedRow.batchesProduced || 0),
      batchRemaining: Number(updatedRow.batchRemaining || 0),
      unitsOfWaste: Number(updatedRow.unitsOfWaste || updatedRow.unitsOfWaste || 0),
      unitsRemaining: Number(updatedRow.unitsRemaining || 0),
      cognito_id: cognitoId,
    };

    // PUT by batchCode (path param)
    const url = `${API_BASE}/production-log/${encodeURIComponent(updatedRow.batchCode)}`;
    console.info("[processRowUpdate] PUT", url, "payload:", payload);

    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(txt || `Server returned ${res.status}`);
    }
    const json = await res.json();
    return json;
  };

  const handleConfirmEdit = async () => {
    if (!editingRow && !activeCell) {
      setEditDialogOpen(false);
      return;
    }

    setUpdating(true);
    try {
      let patched;
      if (activeCell && activeCell.field && !editingRow) {
        // single-cell edit
        const row = (productionLogs || []).find((r) => r.batchCode === activeCell.id);
        if (!row) throw new Error("Row not found locally");
        patched = { ...row, [activeCell.field]: activeCell.field === "date" ? formatDateYMD(editValue) : editValue };
        // coerce numbers for numeric fields
        if (["batchesProduced", "batchRemaining", "unitsOfWaste", "unitsRemaining"].includes(activeCell.field)) {
          patched[activeCell.field] = Number(editValue || 0);
        }
      } else {
        // full-row editing: editingRow holds string values; ensure types and date format
        const r = editingRow || (activeCell ? activeCell.row : null);
        if (!r) throw new Error("No row to edit");
        patched = {
          ...r,
          date: formatDateYMD(r.date),
          batchesProduced: Number(r.batchesProduced || 0),
          batchRemaining: Number(r.batchRemaining || 0),
          unitsOfWaste: Number(r.unitsOfWaste || 0),
          unitsRemaining: Number(r.unitsRemaining || 0),
        };
      }

      // call backend
      await processRowUpdate(patched);

      // update local state
      setProductionLogs((prev) => (prev || []).map((p) => (p.batchCode === patched.batchCode ? { ...p, ...patched } : p)));

      // clear states
      setEditDialogOpen(false);
      setEditingRow(null);
      setActiveCell(null);
      setEditValue("");
    } catch (err) {
      console.error("Confirm edit failed:", err);
      alert("Update failed. See console for details.");
    } finally {
      setUpdating(false);
    }
  };

  // Delete selected rows (soft-delete)
  const handleDeleteSelectedRows = async () => {
    if (!cognitoId || selectedRows.length === 0) return;
    const rowsToDelete = productionLogs.filter((r) => selectedRows.includes(r.id));
    try {
      await Promise.all(
        rowsToDelete.map((row) =>
          fetch(`${API_BASE}/delete-production-log`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ batchCode: row.batchCode, cognito_id: cognitoId }),
          }).then(async (res) => {
            if (!res.ok) {
              const t = await res.text().catch(() => "");
              throw new Error(t || `Delete failed for ${row.batchCode}`);
            }
          })
        )
      );

      // remove locally
      setProductionLogs((prev) => prev.filter((r) => !selectedRows.includes(r.id)));
      setSelectedRows([]);
      setOpenConfirmDialog(false);
    } catch (err) {
      console.error("Error deleting rows:", err);
      alert("Delete failed. See console.");
    }
  };

  // Render input for field
  const renderEditInputForField = (fieldName, value, onChange) => {
    if (fieldName === "date") {
      return <TextField fullWidth type="date" value={formatDateYMD(value)} onChange={(e) => onChange(e.target.value)} />;
    }
    if (["batchesProduced", "batchRemaining", "unitsOfWaste", "unitsRemaining"].includes(fieldName)) {
      return <TextField fullWidth type="number" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
    }
    // default
    return <TextField fullWidth value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
  };

  return (
    <Box m="20px">
      <style>{`
        .pl-card { border: 1px solid ${brand.border}; background: ${brand.surface}; border-radius: 16px; box-shadow: ${brand.shadow}; overflow: hidden; }
        .pl-toolbar { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-bottom:1px solid ${brand.border}; background:${brand.surface}; }
      `}</style>

      <Box className="pl-card" mt={2}>
        <Box className="pl-toolbar">
          <Typography sx={{ fontWeight: 800, color: brand.text }}>Production Log</Typography>

          <IconButton
            aria-label="Delete selected"
            onClick={() => setOpenConfirmDialog(true)}
            disabled={selectedRows.length === 0}
            sx={{
              color: "#fff",
              borderRadius: 999,
              width: 40,
              height: 40,
              background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`,
              boxShadow: "0 8px 16px rgba(29,78,216,0.25), 0 2px 4px rgba(15,23,42,0.06)",
              opacity: selectedRows.length === 0 ? 0.5 : 1,
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>

        <Box sx={{ height: "70vh", "& .MuiDataGrid-root": { border: "none", minWidth: "750px" } }}>
          <DataGrid
            rows={productionLogs}
            getRowId={(row) => row.id}
            checkboxSelection
            onRowSelectionModelChange={(model) => setSelectedRows(model)}
            columns={columns}
            onCellClick={handleCellClick}
          />
        </Box>
      </Box>

      {/* Edit dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingRow(null);
          setActiveCell(null);
          setEditValue("");
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 14, border: `1px solid ${brand.border}`, boxShadow: brand.shadow } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: brand.text }}>
          {activeCell && activeCell.field ? `Edit ${activeCell.field}` : "Edit Row"}
        </DialogTitle>

        <DialogContent dividers>
          {activeCell && activeCell.field && !editingRow && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ color: brand.subtext }}>
                Batch Code: {activeCell.id}
              </Typography>
              <Box sx={{ mt: 1 }}>
                {renderEditInputForField(activeCell.field, editValue !== "" ? editValue : activeCell.value, setEditValue)}
              </Box>
            </Box>
          )}

          {(editingRow || (activeCell && activeCell.field === null)) && (
            <Box sx={{ display: "grid", gap: 2, mt: 1 }}>
              {(() => {
                const row = editingRow || (activeCell ? activeCell.row : null);
                if (!row) return null;
                return (
                  <>
                    <TextField
                      label="Recipe"
                      fullWidth
                      value={editingRow?.recipe ?? row.recipe ?? ""}
                      onChange={(e) => setEditingRow((prev) => ({ ...(prev || row), recipe: e.target.value }))}
                    />
                    <TextField
                      label="Date"
                      fullWidth
                      type="date"
                      value={editingRow?.date ?? row.date ?? ""}
                      onChange={(e) => setEditingRow((prev) => ({ ...(prev || row), date: formatDateYMD(e.target.value) }))}
                    />
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                      <TextField
                        label="Batches Produced"
                        fullWidth
                        type="number"
                        value={editingRow?.batchesProduced ?? row.batchesProduced ?? 0}
                        onChange={(e) => setEditingRow((prev) => ({ ...(prev || row), batchesProduced: e.target.value }))}
                      />
                      <TextField
                        label="Batch Remaining"
                        fullWidth
                        type="number"
                        value={editingRow?.batchRemaining ?? row.batchRemaining ?? 0}
                        onChange={(e) => setEditingRow((prev) => ({ ...(prev || row), batchRemaining: e.target.value }))}
                      />
                    </Box>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                      <TextField
                        label="Units of Waste"
                        fullWidth
                        type="number"
                        value={editingRow?.unitsOfWaste ?? row.unitsOfWaste ?? 0}
                        onChange={(e) => setEditingRow((prev) => ({ ...(prev || row), unitsOfWaste: e.target.value }))}
                      />
                      <TextField
                        label="Units Remaining"
                        fullWidth
                        type="number"
                        value={editingRow?.unitsRemaining ?? row.unitsRemaining ?? 0}
                        onChange={(e) => setEditingRow((prev) => ({ ...(prev || row), unitsRemaining: e.target.value }))}
                      />
                    </Box>
                    <TextField
                      label="Batch Code"
                      fullWidth
                      value={editingRow?.batchCode ?? row.batchCode ?? ""}
                      onChange={(e) => setEditingRow((prev) => ({ ...(prev || row), batchCode: e.target.value }))}
                    />
                  </>
                );
              })()}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setEditDialogOpen(false);
              setEditingRow(null);
              setActiveCell(null);
              setEditValue("");
            }}
            sx={{ textTransform: "none" }}
            disabled={updating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmEdit}
            sx={{ textTransform: "none", fontWeight: 800, borderRadius: 999, px: 2, color: "#fff", background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`, "&:hover": { background: brand.primaryDark } }}
            startIcon={updating ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : null}
            disabled={updating}
          >
            {updating ? "Updating…" : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={openConfirmDialog}
        onClose={() => setOpenConfirmDialog(false)}
        PaperProps={{ sx: { borderRadius: 14, border: `1px solid ${brand.border}`, boxShadow: brand.shadow } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: brand.text }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: brand.subtext }}>Are you sure you want to delete the selected row(s)?</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenConfirmDialog(false)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button onClick={handleDeleteSelectedRows} sx={{ textTransform: "none", fontWeight: 800, borderRadius: 999, px: 2, color: "#fff", background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`, "&:hover": { background: brand.primaryDark } }} startIcon={<DeleteIcon />}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductionLog;
