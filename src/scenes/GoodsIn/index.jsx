// src/scenes/data/GoodsIn/index.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
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
  Stack,
  Tooltip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useData } from "../../contexts/DataContext";
import DeleteIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { useAuth } from "../../contexts/AuthContext";
import { useLocation } from "react-router-dom";

/**
 * Redesigned GoodsIn table (fixed toolbar error).
 * - Search (debounced)
 * - Unit filter
 * - Export CSV
 * - Responsive + horizontal scroll
 * - Pagination
 * - Row detail modal with small chart
 * - Kept existing processRowUpdate() logic and delete
 */

const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

const brand = {
  text: "#0f172a",
  subtext: "#334155",
  border: "#e5e7eb",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  danger: "#dc2626",
  primary: "#7C3AED",
  primaryDark: "#5B21B6",
  focusRing: "rgba(124,58,237,0.18)",
  shadow: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)",
  inputBg: "#ffffff",
};

const unitOptions = [
  { value: "", label: "All units" },
  { value: "grams", label: "Grams (g)" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "kg", label: "Kilograms (Kg)" },
  { value: "l", label: "Litres (L)" },
  { value: "units", label: "Units" },
];

const GoodsIn = () => {
  const { goodsInRows, setGoodsInRows, setIngredientInventory } = useData();
  const { cognitoId } = useAuth();
  const location = useLocation();

  // selection & editing
  const [selectedRows, setSelectedRows] = useState([]);
  const [activeCell, setActiveCell] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [originalBarcode, setOriginalBarcode] = useState(null);
  const [originalId, setOriginalId] = useState(null);
  const [updating, setUpdating] = useState(false);

  // UI controls
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailRow, setDetailRow] = useState(null);

  // Keep your existing fetching logic (normalization)
  useEffect(() => {
    const fetchGoodsInData = async () => {
      try {
        if (!cognitoId) return;
        const response = await fetch(`${API_BASE}/goods-in/active?cognito_id=${encodeURIComponent(cognitoId)}`);
        if (!response.ok) throw new Error("Failed to fetch Goods In data");
        const data = await response.json();

        const normalized = (Array.isArray(data) ? data : []).map((row, idx) => {
          const date = row.date ? String(row.date).slice(0, 10) : row.date;
          const expiryDate = row.expiryDate ? String(row.expiryDate).slice(0, 10) : row.expiryDate;
          const stockReceived = Number(row.stockReceived || 0);
          const stockRemaining = Number(row.stockRemaining || 0);
          const serverBar = row.barCode ? String(row.barCode) : null;
          const _id = serverBar
            ? `${serverBar}-${idx}`
            : `gen-${idx}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const invoiceNumber = row.invoice_number ?? row.invoiceNumber ?? null;
          const unit = row.unit ?? row.unitName ?? row.unit_label ?? "";

          return {
            ...row,
            date,
            expiryDate,
            stockReceived,
            stockRemaining,
            processed: Number(stockRemaining) === 0 ? "Yes" : "No",
            barCode: serverBar || row.barCode || null,
            invoiceNumber,
            unit,
            _id,
          };
        });

        setGoodsInRows(normalized);
        computeAndSetIngredientInventory(normalized);
      } catch (error) {
        console.error("Error fetching Goods In data:", error);
      }
    };
    if (cognitoId) fetchGoodsInData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cognitoId]);

  // compute inventory (unchanged)
  const computeAndSetIngredientInventory = (rows) => {
    const active = (Array.isArray(rows) ? rows : []).filter((r) => Number(r.stockRemaining) > 0);
    const map = new Map();
    for (const r of active) {
      const key = r.ingredient;
      const prev = map.get(key) || { ingredient: key, amount: 0, barcode: r.barCode, _date: r.date, unit: r.unit };
      const amount = prev.amount + Number(r.stockRemaining || 0);
      let nextBarcode = prev.barcode;
      let nextDate = prev._date;
      try {
        const prevTime = new Date(prev._date).getTime() || Infinity;
        const curTime = new Date(r.date).getTime() || Infinity;
        if (curTime < prevTime) {
          nextBarcode = r.barCode;
          nextDate = r.date;
        }
      } catch {}
      map.set(key, { ingredient: key, amount, barcode: nextBarcode, _date: nextDate, unit: r.unit });
    }
    const inventory = Array.from(map.values()).map(({ _date, ...rest }) => rest);
    setIngredientInventory(inventory);
  };

  // Process row update (kept intact — uses your backend)
  const processRowUpdate = async (newRow, oldRow) => {
    const oldBar = oldRow && oldRow.barCode ? String(oldRow.barCode) : undefined;
    const oldId = oldRow && oldRow._id ? String(oldRow._id) : undefined;

    const payload = {
      date: newRow.date,
      ingredient: newRow.ingredient,
      temperature: newRow.temperature,
      stockReceived: Number(newRow.stockReceived || 0),
      stockRemaining: Number(newRow.stockRemaining || 0),
      unit: newRow.unit,
      expiryDate: newRow.expiryDate,
      barCode: newRow.barCode,
      invoice_number: newRow.invoiceNumber ?? null,
      cognito_id: cognitoId,
    };

    const identifierForPath = oldBar || newRow.barCode;
    const url = `${API_BASE}/goods-in/${encodeURIComponent(identifierForPath)}`;

    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        console.error("[processRowUpdate] server returned non-OK:", response.status, text);
        try {
          const jsonErr = JSON.parse(text || "{}");
          throw new Error(JSON.stringify(jsonErr));
        } catch {
          throw new Error(text || `Failed to update row (status ${response.status})`);
        }
      }

      const json = await response.json().catch(() => null);
      const serverRow = json && json.updated ? json.updated : json || null;

      const normalizedResult = {
        ...newRow,
        ...(serverRow ? serverRow : {}),
        stockReceived: Number((serverRow && serverRow.stockReceived) ?? newRow.stockReceived ?? 0),
        stockRemaining: Number((serverRow && serverRow.stockRemaining) ?? newRow.stockRemaining ?? 0),
        processed:
          Number(((serverRow && serverRow.stockRemaining) ?? newRow.stockRemaining) || 0) === 0 ? "Yes" : "No",
        invoiceNumber: (serverRow && (serverRow.invoice_number ?? serverRow.invoiceNumber)) ?? newRow.invoiceNumber ?? null,
        unit: (serverRow && (serverRow.unit ?? serverRow.unit_label ?? serverRow.unitName)) ?? newRow.unit ?? "",
      };

      normalizedResult._id =
        oldId ||
        newRow._id ||
        (serverRow && serverRow.barCode ? `${serverRow.barCode}-${Date.now()}` : `gen-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);

      normalizedResult.barCode = (serverRow && serverRow.barCode) ? serverRow.barCode : (newRow.barCode || null);

      setGoodsInRows((prev = []) => {
        const list = Array.isArray(prev) ? prev.slice() : [];
        let found = false;
        const next = list.map((r) => {
          if (oldId && r._id === oldId) {
            found = true;
            return { ...r, ...normalizedResult };
          }
          if (!oldId && identifierForPath && r.barCode === identifierForPath) {
            found = true;
            return { ...r, ...normalizedResult };
          }
          return r;
        });

        if (!found) {
          next.push(normalizedResult);
        }

        computeAndSetIngredientInventory(next);
        return next;
      });

      return normalizedResult;
    } catch (error) {
      console.error("Backend update error:", error);
      throw error;
    }
  };

  // Delete selected rows (keeps your backend calls)
  const handleDeleteSelectedRows = async () => {
    if (!cognitoId || selectedRows.length === 0) return;
    try {
      const rowsToDelete = (goodsInRows || []).filter((r) => selectedRows.includes(r._id));
      await Promise.all(
        rowsToDelete.map((row) =>
          fetch(`${API_BASE}/delete-row`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ barCode: row.barCode, cognito_id: cognitoId }),
          }).then(async (res) => {
            if (!res.ok) {
              const t = await res.text().catch(() => "");
              throw new Error(t || `Soft delete failed for ${row.barCode}`);
            }
          })
        )
      );

      setGoodsInRows((prev = []) => {
        const remaining = prev.filter((r) => !selectedRows.includes(r._id));
        computeAndSetIngredientInventory(remaining);
        return remaining;
      });

      setSelectedRows([]);
    } catch (err) {
      console.error("Soft delete error:", err);
      alert("Could not delete selected records. Check console for details.");
    }
  };

  // Cell click — used to open inline edit or detail
  const handleCellClick = (params) => {
    if (params.field === "__check__") return;
    setActiveCell({
      id: params.row.barCode,
      field: params.field,
      value: params.value,
      row: params.row,
    });
  };

  // Open edit dialog for the active cell
  const openEditForActiveCell = () => {
    if (!activeCell) return;
    setEditingRow(activeCell.row ?? null);
    setOriginalBarcode(activeCell.row?.barCode ?? null);
    setOriginalId(activeCell.row?._id ?? null);
    setEditDialogOpen(true);
  };

  const handleConfirmEdit = async () => {
    if (!editingRow && !activeCell) {
      setEditDialogOpen(false);
      return;
    }

    setUpdating(true);
    try {
      let result;
      if (activeCell && activeCell.field && !editingRow) {
        const row = (goodsInRows || []).find((r) => r._id === (activeCell.row?._id) || r.barCode === activeCell.id);
        if (!row) throw new Error("Row not found");
        const patched = {
          ...row,
          [activeCell.field]: activeCell.field === "stockRemaining" || activeCell.field === "stockReceived"
            ? Number(activeCell.value || 0)
            : activeCell.value,
        };
        if (patched.stockRemaining !== undefined) patched.processed = Number(patched.stockRemaining) === 0 ? "Yes" : "No";

        result = await processRowUpdate(patched, { barCode: originalBarcode || activeCell.id, _id: originalId || row._id });
      } else {
        const patched = { ...editingRow };
        patched.stockReceived = Number(patched.stockReceived || 0);
        patched.stockRemaining = Number(patched.stockRemaining || 0);
        patched.processed = Number(patched.stockRemaining) === 0 ? "Yes" : "No";

        result = await processRowUpdate(patched, { barCode: originalBarcode, _id: originalId });
      }

      setEditDialogOpen(false);
      setEditingRow(null);
      setActiveCell(null);
      setUpdating(false);
    } catch (err) {
      console.error("Confirm edit failed:", err);
      alert("Update failed. See console for details.");
      setUpdating(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim().toLowerCase()), 220);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Filtered rows memo (search + unit filter)
  const filteredRows = useMemo(() => {
    const base = Array.isArray(goodsInRows) ? goodsInRows : [];
    if (!debouncedSearch && !unitFilter) return base;
    return base.filter((r) => {
      const matchesUnit = unitFilter ? String(r.unit || "").toLowerCase() === unitFilter.toLowerCase() : true;
      const hay = `${r.ingredient ?? ""} ${r.barCode ?? ""} ${r.invoiceNumber ?? ""} ${r.date ?? ""}`.toLowerCase();
      const matchesSearch = debouncedSearch ? hay.includes(debouncedSearch) : true;
      return matchesUnit && matchesSearch;
    });
  }, [goodsInRows, debouncedSearch, unitFilter]);

  // CSV export for current filtered rows
  const exportCsv = () => {
    try {
      const header = ["Date", "Ingredient", "Temperature", "Received", "Remaining", "Unit", "Invoice", "Batch"];
      const rows = filteredRows.map((r) => [
        r.date ?? "",
        r.ingredient ?? "",
        r.temperature ?? "",
        r.stockReceived ?? "",
        r.stockRemaining ?? "",
        r.unit ?? "",
        r.invoiceNumber ?? "",
        r.barCode ?? "",
      ]);
      const csv = [header, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `goods-in-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed", e);
      alert("Export failed");
    }
  };

  // Detail modal (small chart)
  const openDetailModal = (row) => {
    setDetailRow(row);
    setDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setDetailRow(null);
    setDetailModalOpen(false);
  };

  // Columns with unit formatting and actions
  const columns = useMemo(
    () => [
      { field: "date", headerName: "Date", flex: 1, minWidth: 110 },
      { field: "ingredient", headerName: "Ingredient", flex: 1.6, minWidth: 180 },
      { field: "temperature", headerName: "Temperature", flex: 0.9, minWidth: 100 },
      {
        field: "stockReceived",
        headerName: "Received",
        type: "number",
        flex: 1,
        minWidth: 110,
        renderCell: (params) => {
          const val = params.row?.stockReceived ?? params.value ?? 0;
          const unit = params.row?.unit ?? "";
          return (
            <Typography variant="body2" sx={{ color: brand.text }}>
              {`${val}${unit ? ` ${unit}` : ""}`}
            </Typography>
          );
        },
      },
      {
        field: "stockRemaining",
        headerName: "Remaining",
        type: "number",
        flex: 1,
        minWidth: 120,
        renderCell: (params) => {
          const val = params.row?.stockRemaining ?? params.value ?? 0;
          const unit = params.row?.unit ?? "";
          return (
            <Typography variant="body2" sx={{ color: brand.text, fontWeight: 800 }}>
              {`${val}${unit ? ` ${unit}` : ""}`}
            </Typography>
          );
        },
      },
      { field: "invoiceNumber", headerName: "Invoice #", flex: 1, minWidth: 140 },
      {
        field: "barCode",
        headerName: "Batch",
        flex: 1,
        minWidth: 140,
        cellClassName: "barCode-column--cell",
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 96,
        sortable: false,
        filterable: false,
        align: "center",
        renderCell: (params) => {
          return (
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  onClick={() => {
                    setEditingRow(params.row);
                    setOriginalBarcode(params.row.barCode);
                    setOriginalId(params.row._id);
                    setEditDialogOpen(true);
                  }}
                >
                  <EditOutlinedIcon sx={{ color: brand.primary }} />
                </IconButton>
              </Tooltip>

              <Tooltip title="Detail">
                <IconButton
                  size="small"
                  onClick={() => openDetailModal(params.row)}
                  sx={{ color: brand.primaryDark }}
                >
                  <FileDownloadOutlinedIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          );
        },
      },
    ],
    []
  );

  // Focus/scroll logic (unchanged)
  useEffect(() => {
    const focusBar =
      (location && location.state && location.state.focusBar) ||
      new URLSearchParams(window.location.search).get("focusBar");
    if (!focusBar) return;
    if (!goodsInRows || goodsInRows.length === 0) return;

    const target = goodsInRows.find((r) => r.barCode === focusBar);
    if (!target) return;
    const targetId = target._id;

    try {
      setSelectedRows([targetId]);
    } catch (e) {}

    setTimeout(() => {
      const el = document.querySelector(`[data-id="${targetId}"]`);
      if (el) {
        try {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        } catch {}
        el.classList.add("plf-row-highlight");
        setTimeout(() => el.classList.remove("plf-row-highlight"), 2500);
      }
    }, 250);
    try {
      if (window && window.history && window.history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.delete("focusBar");
        window.history.replaceState({}, document.title, url.pathname + url.search);
      }
    } catch (e) {}
  }, [goodsInRows, location]);

  // Custom toolbar implemented with Box (DO NOT use GridToolbarContainer here)
  const CustomToolbar = ({ search, unit, onSearchChange, onUnitChange, onExport }) => (
    <Box sx={{ display: "flex", gap: 1, p: 1, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
      <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder="Search ingredient, batch or invoice"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ minWidth: 260, background: brand.surface, borderRadius: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="unit-select-label">Unit</InputLabel>
          <Select
            labelId="unit-select-label"
            value={unit}
            label="Unit"
            onChange={(e) => onUnitChange(e.target.value)}
          >
            {unitOptions.map((u) => (
              <MenuItem key={u.value} value={u.value}>{u.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button variant="outlined" startIcon={<FileDownloadOutlinedIcon />} onClick={onExport} sx={{ textTransform: "none" }}>
          Export CSV
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <Typography variant="caption" sx={{ color: brand.subtext }}>Rows per page</Typography>
        <FormControl size="small" sx={{ minWidth: 80 }}>
          <Select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
            {[10, 25, 50, 100].map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
          </Select>
        </FormControl>
        <Button onClick={() => { setSearchTerm(""); setUnitFilter(""); }} sx={{ textTransform: "none" }}>Reset</Button>
      </Box>
    </Box>
  );

  return (
    <Box m="20px">
      <style>{`
        .plf-row-highlight { animation: plfHighlight 2.4s ease forwards; }
        @keyframes plfHighlight {
          0% { background-color: rgba(255, 239, 213, 0.95); }
          10% { background-color: rgba(255, 239, 213, 0.95); }
          90% { background-color: transparent; }
          100% { background-color: transparent; }
        }
        .barCode-column--cell { color: ${brand.primary}; font-weight: 700; }
        .goodsin-card { border: 1px solid ${brand.border}; border-radius: 16px; box-shadow: ${brand.shadow}; overflow: hidden; background: ${brand.surface}; }
      `}</style>

      <Box className="goodsin-card" sx={{ mt: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.25, borderBottom: `1px solid ${brand.border}` }}>
          <Typography sx={{ fontWeight: 800, color: brand.text }}>Goods In</Typography>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title={activeCell ? `Edit ${activeCell.field}` : "Select a cell to edit"}>
              <span>
                <IconButton
                  onClick={openEditForActiveCell}
                  disabled={!activeCell}
                  sx={{
                    color: "#fff", borderRadius: 999, width: 40, height: 40,
                    background: activeCell ? `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})` : "#f1f5f9",
                  }}
                >
                  <EditOutlinedIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title={selectedRows.length ? "Delete selected" : "Select rows to delete"}>
              <span>
                <IconButton
                  onClick={() => setSelectedRows(selectedRows.length ? selectedRows : [])}
                  disabled={selectedRows.length === 0}
                  sx={{
                    color: "#fff", borderRadius: 999, width: 40, height: 40,
                    background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`, opacity: selectedRows.length === 0 ? 0.5 : 1,
                  }}
                  onDoubleClick={handleDeleteSelectedRows}
                >
                  <DeleteIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>

        {/* Toolbar */}
        <CustomToolbar
          search={searchTerm}
          unit={unitFilter}
          onSearchChange={setSearchTerm}
          onUnitChange={setUnitFilter}
          onExport={exportCsv}
        />

        {/* DataGrid container — horizontal scroll enabled by minWidth */}
        <Box sx={{ width: "100%", overflowX: "auto", p: 2 }}>
          <Box sx={{ minWidth: 980, height: `calc(70vh - 64px)` }}>
            <DataGrid
              rows={filteredRows}
              columns={columns}
              getRowId={(r) => r._id}
              pagination
              pageSize={pageSize}
              rowsPerPageOptions={[10, 25, 50, 100]}
              checkboxSelection
              rowSelectionModel={selectedRows}
              onRowSelectionModelChange={(model) => setSelectedRows(Array.isArray(model) ? model : [])}
              disableRowSelectionOnClick
              editMode="row"
              processRowUpdate={processRowUpdate}
              onProcessRowUpdateError={(err) => console.error("Row update failed:", err)}
              onCellClick={handleCellClick}
              onRowDoubleClick={(params) => openDetailModal(params.row)}
              sx={{
                border: "none",
                "& .MuiDataGrid-columnHeaders": { backgroundColor: "#fbfcfd", color: brand.subtext, borderBottom: `1px solid ${brand.border}`, fontWeight: 800 },
                "& .MuiDataGrid-cell": { borderBottom: `1px solid ${brand.border}`, color: brand.text },
                "& .MuiDataGrid-row:hover": { backgroundColor: brand.surfaceMuted },
                "& .MuiDataGrid-footerContainer": { borderTop: `1px solid ${brand.border}`, background: brand.surface },
                "& .MuiDataGrid-virtualScroller": { background: brand.surface },
              }}
              getRowClassName={(params) => (params.indexRelativeToCurrentPage % 2 === 0 ? "even-row" : "odd-row")}
            />
          </Box>
        </Box>
      </Box>

      {/* Edit Dialog (small) */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: brand.text }}>
          {editingRow ? `Edit: ${editingRow.ingredient}` : "Edit Row"}
        </DialogTitle>
        <DialogContent dividers>
          {editingRow ? (
            <Box sx={{ display: "grid", gap: 2, mt: 1 }}>
              <TextField label="Ingredient" fullWidth value={editingRow.ingredient} onChange={(e) => setEditingRow((p) => ({ ...p, ingredient: e.target.value }))} />
              <TextField label="Date" type="date" fullWidth value={editingRow.date} onChange={(e) => setEditingRow((p) => ({ ...p, date: e.target.value }))} />
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                <TextField label="Received" type="number" value={editingRow.stockReceived} onChange={(e) => setEditingRow((p) => ({ ...p, stockReceived: e.target.value }))} />
                <TextField label="Remaining" type="number" value={editingRow.stockRemaining} onChange={(e) => setEditingRow((p) => ({ ...p, stockRemaining: e.target.value }))} />
              </Box>
              <FormControl fullWidth>
                <InputLabel id="unit-edit">Unit</InputLabel>
                <Select labelId="unit-edit" value={editingRow.unit ?? ""} label="Unit" onChange={(e) => setEditingRow((p) => ({ ...p, unit: e.target.value }))}>
                  {unitOptions.slice(1).map((u) => <MenuItem key={u.value} value={u.value}>{u.label}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Batch Code" fullWidth value={editingRow.barCode} onChange={(e) => setEditingRow((p) => ({ ...p, barCode: e.target.value }))} />
              <TextField label="Invoice #" fullWidth value={editingRow.invoiceNumber ?? ""} onChange={(e) => setEditingRow((p) => ({ ...p, invoiceNumber: e.target.value }))} />
              <TextField label="Temperature" fullWidth value={editingRow.temperature ?? ""} onChange={(e) => setEditingRow((p) => ({ ...p, temperature: e.target.value }))} />
            </Box>
          ) : (
            <Typography sx={{ color: brand.subtext }}>Loading…</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} sx={{ textTransform: "none" }} disabled={updating}>Cancel</Button>
          <Button onClick={handleConfirmEdit} sx={{ textTransform: "none", fontWeight: 800, px: 2, color: "#fff", background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})` }} disabled={updating}>
            {updating ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={detailModalOpen} onClose={closeDetailModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: brand.text }}>Detail view</DialogTitle>
        <DialogContent dividers>
          {!detailRow ? (
            <Typography sx={{ color: brand.subtext }}>No detail.</Typography>
          ) : (
            <Box sx={{ display: "grid", gap: 2 }}>
              <Typography sx={{ fontWeight: 800 }}>{detailRow.ingredient}</Typography>
              <Typography variant="caption" sx={{ color: brand.subtext }}>{detailRow.date} · Batch: {detailRow.barCode}</Typography>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2">Received</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: 20 }}>{detailRow.stockReceived} {detailRow.unit}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2">Remaining</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: 20 }}>{detailRow.stockRemaining} {detailRow.unit}</Typography>
                </Box>
              </Box>

              {/* Small inline bar chart (SVG) comparing Received vs Remaining */}
              <Box sx={{ mt: 1 }}>
                <svg width="100%" height="60" viewBox="0 0 300 60" preserveAspectRatio="none">
                  <rect x="0" y="0" width="300" height="60" fill="#fff" />
                  {(() => {
                    const r = Number(detailRow.stockReceived || 0);
                    const rem = Number(detailRow.stockRemaining || 0);
                    const maxv = Math.max(1, r, rem);
                    const rw = Math.round((r / maxv) * 120);
                    const remw = Math.round((rem / maxv) * 120);
                    return (
                      <>
                        <rect x="10" y="10" width={rw} height="18" fill="#7C3AED" rx="4" />
                        <rect x="10" y="34" width={remw} height="12" fill="#60a5fa" rx="3" />
                        <text x={140} y="22" fontSize="10" fill="#334155">Received: {r} {detailRow.unit}</text>
                        <text x={140} y="46" fontSize="10" fill="#334155">Remaining: {rem} {detailRow.unit}</text>
                      </>
                    );
                  })()}
                </svg>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeDetailModal} sx={{ textTransform: "none" }}>Close</Button>
          <Button onClick={() => { navigator.clipboard?.writeText(JSON.stringify(detailRow)); }} sx={{ textTransform: "none", fontWeight: 800, px: 2, color: "#fff", background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})` }}>Copy JSON</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GoodsIn;
