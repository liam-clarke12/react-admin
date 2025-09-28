// src/scenes/data/GoodsIn/index.jsx
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
  Tooltip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useData } from "../../contexts/DataContext";
import { useEffect, useMemo, useState } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { useAuth } from "../../contexts/AuthContext";

const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

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

// keep select options for editing; UI shows friendly units for display
const unitOptions = [
  { value: "g", label: "Grams (g)" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "units", label: "Units" },
];

/** Unit helpers: detect type + base factor */
const detectUnitTypeAndFactor = (rawUnit) => {
  const u = String(rawUnit || "").trim().toLowerCase();
  if (!u) return { type: "units", base: "units", factor: 1 };

  // mass
  if (u === "kg" || u.includes("kg") || u.includes("kilogram")) return { type: "mass", base: "g", factor: 1000 };
  if (u === "g" || u.includes("g") || u.includes("gram")) return { type: "mass", base: "g", factor: 1 };

  // volume
  if (u === "l" || u.includes("l ") || u.includes("litre") || u.includes("liter")) return { type: "volume", base: "ml", factor: 1000 };
  if (u === "ml" || u.includes("ml") || u.includes("milliliter") || u.includes("millilitre")) return { type: "volume", base: "ml", factor: 1 };

  // counts
  if (u === "unit" || u.includes("unit") || u.includes("each") || u.includes("pcs") || u.includes("piece")) return { type: "units", base: "units", factor: 1 };

  // fallback
  return { type: "units", base: "units", factor: 1 };
};

const normalizeToBase = (value, rawUnit) => {
  const n = Number(value || 0) || 0;
  const { factor } = detectUnitTypeAndFactor(rawUnit);
  return n * factor;
};

/** Format value for display:
 * - mass base unit 'g' -> display 'kg' when abs(value) >= 1000 (value/1000, 2 decimals)
 * - volume base unit 'ml' -> display 'L' when abs(value) >= 1000
 * - otherwise show base with thousand separators
 */
const formatForDisplay = (value, baseUnit) => {
  const n = Number(value || 0) || 0;
  if (baseUnit === "g") {
    if (Math.abs(n) >= 1000) {
      const kg = n / 1000;
      const str = Math.abs(kg) >= 100 ? kg.toFixed(1) : kg.toFixed(2);
      return { text: `${Number(str)} kg`, unit: "kg", raw: `${n.toLocaleString()} g` };
    }
    return { text: `${n.toLocaleString()} g`, unit: "g", raw: `${n.toLocaleString()} g` };
  }
  if (baseUnit === "ml") {
    if (Math.abs(n) >= 1000) {
      const l = n / 1000;
      const str = Math.abs(l) >= 100 ? l.toFixed(1) : l.toFixed(2);
      return { text: `${Number(str)} L`, unit: "L", raw: `${n.toLocaleString()} ml` };
    }
    return { text: `${n.toLocaleString()} ml`, unit: "ml", raw: `${n.toLocaleString()} ml` };
  }
  // units or unknown
  return { text: `${n.toLocaleString()} ${baseUnit}`, unit: baseUnit, raw: `${n.toLocaleString()} ${baseUnit}` };
};

/** Parse user input string into base units.
 * Accepts forms:
 *  - "1500"           => treated as base units (number)
 *  - "1.5 kg"         => converted to base (1500) if base is g
 *  - "1,500 g"        => converted (1500)
 *  - "1.2 L"          => converted to ml if base is ml
 * Returns a Number (base units). If parsing fails returns NaN.
 */
const parseInputToBase = (input, baseUnit) => {
  if (input === null || input === undefined) return NaN;
  if (typeof input === "number") return Number(input || 0);

  const s = String(input).trim().toLowerCase().replace(/\u00A0/g, ""); // remove NBSP
  if (s.length === 0) return NaN;

  // match number (allow commas) and optional unit token
  const m = s.match(/^([\d,]*\.?\d+)\s*(kg|g|l|ml|litre|liter|millilitre|milliliter|units?|pcs?|pieces?)?$/i);
  if (!m) {
    // fallback: remove commas and parse number
    const cleaned = s.replace(/,/g, "");
    const v = Number(cleaned);
    return Number.isFinite(v) ? v : NaN;
  }

  const numStr = m[1].replace(/,/g, "");
  const num = Number(numStr);
  const unitToken = (m[2] || "").toLowerCase();

  if (!unitToken) {
    // no unit specified — assume the user entered base units (backwards compatible)
    return num;
  }

  // map token to factor relative to baseUnit
  // mass
  if (unitToken === "kg" || unitToken === "kilogram") {
    if (baseUnit === "g") return num * 1000;
    if (baseUnit === "ml") return num * 1000; // improbable, but let user convert if they typed L for a ml base; treat similarly
  }
  if (unitToken === "g" || unitToken === "gram") {
    if (baseUnit === "g") return num;
    if (baseUnit === "ml") return num; // weird, but keep numeric
  }

  // volume
  if (unitToken === "l" || unitToken === "litre" || unitToken === "liter") {
    if (baseUnit === "ml") return num * 1000;
    if (baseUnit === "g") return num * 1000;
  }
  if (unitToken === "ml" || unitToken === "millilitre" || unitToken === "milliliter") {
    if (baseUnit === "ml") return num;
    if (baseUnit === "g") return num;
  }

  // units / pieces
  if (unitToken.startsWith("unit") || unitToken.startsWith("pcs") || unitToken.startsWith("piece")) {
    return num;
  }

  // fallback: return numeric as-is
  return num;
};

const GoodsIn = () => {
  const { goodsInRows, setGoodsInRows, setIngredientInventory } = useData();
  const [selectedRows, setSelectedRows] = useState([]); // array of selected barCodes
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const { cognitoId } = useAuth();

  // Editing state
  const [activeCell, setActiveCell] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [editingRow, setEditingRow] = useState(null);
  const [originalBarcode, setOriginalBarcode] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Fetch ACTIVE goods-in rows
  useEffect(() => {
    const fetchGoodsInData = async () => {
      try {
        if (!cognitoId) return;
        const response = await fetch(
          `${API_BASE}/goods-in/active?cognito_id=${encodeURIComponent(cognitoId)}`
        );
        if (!response.ok) throw new Error("Failed to fetch Goods In data");
        const data = await response.json();

        // Normalize: convert stockReceived/stockRemaining to base units (g/ml/units)
        const normalized = (Array.isArray(data) ? data : []).map((row, idx) => {
          const rawUnit = row.unit || "";
          const { base } = detectUnitTypeAndFactor(rawUnit);
          const stockReceivedBase = normalizeToBase(row.stockReceived, rawUnit);
          const stockRemainingBase = normalizeToBase(row.stockRemaining, rawUnit);

          return {
            ...row,
            date: row.date ? String(row.date).slice(0, 10) : row.date,
            expiryDate: row.expiryDate ? String(row.expiryDate).slice(0, 10) : row.expiryDate,
            stockReceived: stockReceivedBase,
            stockRemaining: stockRemainingBase,
            unit: base,
            processed: Number(stockRemainingBase) === 0 ? "Yes" : "No",
            barCode: row.barCode ?? `gen-${idx}-${String(row.ingredient || "x").replace(/\s+/g, "-")}`,
          };
        });

        setGoodsInRows(normalized);
        updateIngredientInventory(normalized);
      } catch (error) {
        console.error("Error fetching Goods In data:", error);
      }
    };
    if (cognitoId) fetchGoodsInData();
  }, [cognitoId, setGoodsInRows]);

  // Update ingredient inventory by summing stockRemaining (base units)
  const updateIngredientInventory = (rows) => {
    const active = (rows || []).filter((r) => Number(r.stockRemaining) > 0);

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
      } catch {
        // ignore parsing errors
      }

      map.set(key, { ingredient: key, amount, barcode: nextBarcode, _date: nextDate, unit: r.unit || prev.unit });
    }

    const inventory = Array.from(map.values()).map(({ _date, ...rest }) => rest);
    setIngredientInventory(inventory);
  };

  // Columns: show friendly display for stock values, unit column shows display unit (kg/L/g/ml/units)
  const columns = useMemo(
    () => [
      { field: "date", headerName: "Date", flex: 1, editable: false },
      { field: "ingredient", headerName: "Ingredient", flex: 1, editable: false },
      { field: "temperature", headerName: "Temperature", flex: 1, editable: false },
      {
        field: "stockReceived",
        headerName: "Stock Received",
        flex: 1,
        headerAlign: "left",
        align: "left",
        editable: false,
        renderCell: (params) => {
          const { text, raw } = formatForDisplay(params.value, params.row.unit);
          return (
            <Tooltip
              arrow
              placement="top"
              title={
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>Raw: {raw}</Typography>
                  <br />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>Display: {text}</Typography>
                </Box>
              }
            >
              <Typography sx={{ fontWeight: 700 }}>{text}</Typography>
            </Tooltip>
          );
        },
      },
      {
        field: "stockRemaining",
        headerName: "Stock Remaining",
        flex: 1,
        headerAlign: "left",
        align: "left",
        editable: false,
        renderCell: (params) => {
          const { text, raw } = formatForDisplay(params.value, params.row.unit);
          return (
            <Tooltip
              arrow
              placement="top"
              title={
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>Raw: {raw}</Typography>
                  <br />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>Display: {text}</Typography>
                </Box>
              }
            >
              <Box>
                <Typography sx={{ fontWeight: 700 }}>{text}</Typography>
              </Box>
            </Tooltip>
          );
        },
      },
      {
        field: "unit",
        headerName: "Unit",
        flex: 0.8,
        editable: false,
        renderCell: (params) => {
          const chooseVal = params.row.stockRemaining !== undefined ? params.row.stockRemaining : params.row.stockReceived;
          const { unit: displayUnit } = formatForDisplay(chooseVal, params.row.unit);
          return <Typography sx={{ color: brand.subtext, fontWeight: 700 }}>{displayUnit}</Typography>;
        },
      },
      { field: "expiryDate", headerName: "Expiry Date", flex: 1, editable: false },
      {
        field: "barCode",
        headerName: "Bar Code",
        flex: 1,
        cellClassName: "barCode-column--cell",
        editable: false,
      },
      { field: "processed", headerName: "Processed", flex: 1, editable: false },
      {
        field: "fileAttachment",
        headerName: "File Attachment",
        sortable: false,
        filterable: false,
        align: "center",
        flex: 1,
        renderCell: (params) => {
          const file = params.row.file;
          return file ? (
            <Button
              variant="outlined"
              onClick={() => handleFileOpen(file)}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                borderColor: brand.border,
                color: brand.primary,
                borderRadius: 10,
                "&:hover": { borderColor: brand.primary, background: brand.surfaceMuted },
              }}
            >
              View File
            </Button>
          ) : (
            <Typography variant="body2" sx={{ color: brand.subtext }}>
              No File
            </Typography>
          );
        },
      },
      {
        field: "actions",
        headerName: "Actions",
        sortable: false,
        filterable: false,
        width: 96,
        align: "center",
        renderCell: (params) => (
          <IconButton
            size="small"
            aria-label="Edit row"
            onClick={() => {
              setEditingRow(params.row);
              setOriginalBarcode(params.row.barCode);
              setActiveCell({ id: params.row.barCode, field: null, value: null, row: params.row });
              setEditValue(null);
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

  // Bulk soft delete
  const handleDeleteSelectedRows = async () => {
    if (!cognitoId || selectedRows.length === 0) return;

    try {
      await Promise.all(
        selectedRows.map((barCode) =>
          fetch(`${API_BASE}/delete-row`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ barCode, cognito_id: cognitoId }),
          }).then(async (res) => {
            if (!res.ok) {
              const t = await res.text().catch(() => "");
              throw new Error(t || `Soft delete failed for ${barCode}`);
            }
          })
        )
      );

      const remaining = goodsInRows.filter((r) => !selectedRows.includes(r.barCode));
      setGoodsInRows(remaining);
      updateIngredientInventory(remaining);

      setSelectedRows([]);
      setOpenConfirmDialog(false);
    } catch (err) {
      console.error("Soft delete error:", err);
      alert("Could not delete selected records. Check console for details.");
    }
  };

  const handleOpenConfirmDialog = () => setOpenConfirmDialog(true);
  const handleCloseConfirmDialog = () => setOpenConfirmDialog(false);
  const handleFileOpen = (fileUrl) => window.open(fileUrl, "_blank");

  // Cell click
  const handleCellClick = (params) => {
    if (params.field === "__check__") return;
    setActiveCell({
      id: params.row.barCode,
      field: params.field,
      value: params.value,
      row: params.row,
    });
  };

  // When editing we send values in base units (normalized)
  const processRowUpdate = async (newRow, originalBar) => {
    const identifier = originalBar || newRow.barCode;
    const updatedRow = {
      ...newRow,
      processed: Number(newRow.stockRemaining) === 0 ? "Yes" : "No",
    };

    try {
      const url = `${API_BASE}/goods-in/${encodeURIComponent(identifier)}`;

      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: updatedRow.date,
          ingredient: updatedRow.ingredient,
          temperature: updatedRow.temperature,
          stockReceived: Number(updatedRow.stockReceived || 0),
          stockRemaining: Number(updatedRow.stockRemaining || 0),
          unit: updatedRow.unit,
          expiryDate: updatedRow.expiryDate,
          barCode: updatedRow.barCode,
          cognito_id: cognitoId,
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        console.error("[processRowUpdate] server returned non-OK:", response.status, text);
        try {
          const json = JSON.parse(text || "{}");
          throw new Error(JSON.stringify(json));
        } catch {
          throw new Error(text || `Failed to update row (status ${response.status})`);
        }
      }

      const json = await response.json().catch(() => null);
      const resultRow = (json && json.updated) ? json.updated : updatedRow;

      // Normalize server result into base units for UI
      const serverUnit = resultRow.unit ?? updatedRow.unit;
      const serverReceivedBase = normalizeToBase(resultRow.stockReceived, serverUnit);
      const serverRemainingBase = normalizeToBase(resultRow.stockRemaining, serverUnit);

      const normalizedResult = {
        ...resultRow,
        stockReceived: serverReceivedBase,
        stockRemaining: serverRemainingBase,
        unit: detectUnitTypeAndFactor(serverUnit).base,
        processed: Number(serverRemainingBase) === 0 ? "Yes" : "No",
      };

      const nextRows = (goodsInRows || []).map((r) => (r.barCode === identifier ? normalizedResult : r));
      setGoodsInRows(nextRows);
      updateIngredientInventory(nextRows);

      return normalizedResult;
    } catch (error) {
      console.error("Backend update error:", error);
      throw error;
    }
  };

  const openEditForActiveCell = () => {
    if (!activeCell) return;
    setEditValue(activeCell.value ?? "");
    setEditingRow(activeCell.row ?? null);
    setOriginalBarcode(activeCell.id);
    setEditDialogOpen(true);
  };

  const handleConfirmEdit = async () => {
    if (!editingRow && !activeCell) {
      setEditDialogOpen(false);
      return;
    }

    setUpdating(true);
    try {
      let updatedRow;
      if (activeCell && activeCell.field && !editingRow) {
        const row = (goodsInRows || []).find((r) => r.barCode === activeCell.id);
        if (!row) throw new Error("Row not found");
        const patched = { ...row, [activeCell.field]: editValue };

        // If editing stock fields allow friendly input like "1.5 kg"
        if (activeCell.field === "stockReceived" || activeCell.field === "stockRemaining") {
          const parsed = parseInputToBase(editValue, row.unit);
          if (!Number.isFinite(parsed)) throw new Error("Invalid numeric input");
          patched[activeCell.field] = parsed;
        }

        if (patched.stockRemaining !== undefined) {
          patched.processed = Number(patched.stockRemaining) === 0 ? "Yes" : "No";
        }

        updatedRow = await processRowUpdate(patched, originalBarcode || activeCell.id);
      } else {
        const patched = { ...(editingRow || (activeCell ? activeCell.row : null)) };

        // For full-row editing, allow friendly strings as input for the numeric fields
        patched.stockReceived = Number.isFinite(Number(patched.stockReceived))
          ? Number(patched.stockReceived)
          : parseInputToBase(patched.stockReceived, patched.unit);
        patched.stockRemaining = Number.isFinite(Number(patched.stockRemaining))
          ? Number(patched.stockRemaining)
          : parseInputToBase(patched.stockRemaining, patched.unit);

        if (!Number.isFinite(patched.stockReceived)) patched.stockReceived = 0;
        if (!Number.isFinite(patched.stockRemaining)) patched.stockRemaining = 0;

        patched.processed = Number(patched.stockRemaining) === 0 ? "Yes" : "No";

        const original = originalBarcode || (activeCell ? activeCell.id : patched.barCode);
        updatedRow = await processRowUpdate(patched, original);
      }

      setEditDialogOpen(false);
      setEditingRow(null);
      setActiveCell(null);
      setEditValue("");
      setOriginalBarcode(null);
    } catch (err) {
      console.error("Confirm edit failed:", err);
      alert("Update failed. See console for details.");
    } finally {
      setUpdating(false);
    }
  };

  // Render appropriate input
  const renderEditInputForField = (fieldName, value, onChange) => {
    if (fieldName === "unit") {
      return (
        <FormControl fullWidth>
          <InputLabel id="unit-edit-label">Unit</InputLabel>
          <Select
            labelId="unit-edit-label"
            value={value ?? "g"}
            label="Unit"
            onChange={(e) => onChange(e.target.value)}
          >
            {unitOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    if (fieldName === "expiryDate" || fieldName === "date") {
      return <TextField fullWidth type="date" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
    }

    if (fieldName === "stockReceived" || fieldName === "stockRemaining") {
      return (
        <TextField
          fullWidth
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          helperText="You can enter '1500' (base g/ml/units) or friendly '1.5 kg', '1.2 L', '1200 g'."
        />
      );
    }

    return <TextField fullWidth value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
  };

  return (
    <Box m="20px">
      {/* Card container */}
      <Box
        sx={{
          mt: 2,
          border: `1px solid ${brand.border}`,
          borderRadius: 16,
          background: brand.surface,
          boxShadow: brand.shadow,
          overflow: "hidden",
        }}
      >
        {/* Toolbar */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1.25,
            borderBottom: `1px solid ${brand.border}`,
          }}
        >
          <Typography sx={{ fontWeight: 800, color: brand.text }}>Goods In</Typography>

          <Box sx={{ display: "flex", gap: 1 }}>
            <IconButton
              aria-label="Edit selected cell"
              onClick={openEditForActiveCell}
              disabled={!activeCell}
              title={activeCell ? `Edit ${activeCell.field}` : "Select a cell to edit"}
              sx={{
                color: "#fff",
                borderRadius: 999,
                width: 40,
                height: 40,
                background: activeCell ? `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})` : "#f1f5f9",
                boxShadow: activeCell && "0 8px 16px rgba(29,78,216,0.25), 0 2px 4px rgba(15,23,42,0.06)",
              }}
            >
              <EditOutlinedIcon />
            </IconButton>

            <IconButton
              aria-label="Delete selected"
              onClick={handleOpenConfirmDialog}
              disabled={selectedRows.length === 0}
              sx={{
                color: "#fff",
                borderRadius: 999,
                width: 40,
                height: 40,
                background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`,
                boxShadow: "0 8px 16px rgba(29,78,216,0.25), 0 2px 4px rgba(15,23,42,0.06)",
                "&:hover": {
                  background: `linear-gradient(180deg, ${brand.primaryDark}, ${brand.primaryDark})`,
                },
                opacity: selectedRows.length === 0 ? 0.5 : 1,
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>

        {/* DataGrid */}
        <Box
          sx={{
            height: "70vh",
            "& .MuiDataGrid-root": { border: "none", borderRadius: 0 },
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#fbfcfd",
              color: brand.subtext,
              borderBottom: `1px solid ${brand.border}`,
              fontWeight: 800,
            },
            "& .MuiDataGrid-columnSeparator": { display: "none" },
            "& .MuiDataGrid-cell": {
              borderBottom: `1px solid ${brand.border}`,
              color: brand.text,
            },
            "& .MuiDataGrid-row:hover": { backgroundColor: brand.surfaceMuted },
            "& .MuiDataGrid-footerContainer": {
              borderTop: `1px solid ${brand.border}`,
              background: brand.surface,
            },
            "& .barCode-column--cell": { color: brand.primary },
            "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
              outline: `2px solid ${brand.primary}`,
              outlineOffset: "-2px",
              boxShadow: `0 0 0 4px ${brand.focusRing}`,
            },
          }}
        >
          <DataGrid
            rows={goodsInRows}
            getRowId={(row) => row.barCode}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            checkboxSelection
            disableRowSelectionOnClick
            editMode="row"
            experimentalFeatures={{ newEditingApi: true }}
            processRowUpdate={(newRow, oldRow) => processRowUpdate(newRow, oldRow?.barCode)}
            onProcessRowUpdateError={(error) => console.error("Row update failed:", error)}
            onRowSelectionModelChange={(model) => setSelectedRows(model)}
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
          setOriginalBarcode(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 14,
            border: `1px solid ${brand.border}`,
            boxShadow: brand.shadow,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: brand.text }}>
          {activeCell && activeCell.field ? `Edit ${activeCell.field}` : "Edit Row"}
        </DialogTitle>

        <DialogContent dividers>
          {activeCell && activeCell.field && !editingRow && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ color: brand.subtext }}>
                Original Bar Code: {originalBarcode || activeCell.id}
              </Typography>
              <Box sx={{ mt: 1 }}>{renderEditInputForField(activeCell.field, editValue, setEditValue)}</Box>
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
                      label="Ingredient"
                      fullWidth
                      value={editingRow?.ingredient ?? row.ingredient ?? ""}
                      onChange={(e) => setEditingRow((prev) => ({ ...(prev || row), ingredient: e.target.value }))}
                    />
                    <TextField
                      label="Date"
                      fullWidth
                      type="date"
                      value={editingRow?.date ?? row.date ?? ""}
                      onChange={(e) => setEditingRow((prev) => ({ ...(prev || row), date: e.target.value }))}
                    />
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                      <TextField
                        label="Stock Received (base or friendly)"
                        fullWidth
                        type="text"
                        value={editingRow?.stockReceived ?? row.stockReceived ?? ""}
                        onChange={(e) => setEditingRow((prev) => ({ ...(prev || row), stockReceived: e.target.value }))}
                        helperText="Enter base (g/ml/units) or friendly like '1.5 kg', '1.2 L'"
                      />
                      <TextField
                        label="Stock Remaining (base or friendly)"
                        fullWidth
                        type="text"
                        value={editingRow?.stockRemaining ?? row.stockRemaining ?? ""}
                        onChange={(e) => setEditingRow((prev) => ({ ...(prev || row), stockRemaining: e.target.value }))}
                        helperText="Enter base (g/ml/units) or friendly like '1.5 kg', '1.2 L'"
                      />
                    </Box>

                    <FormControl fullWidth>
                      <InputLabel id="unit-edit-label">Unit (base)</InputLabel>
                      <Select
                        labelId="unit-edit-label"
                        value={editingRow?.unit ?? row.unit ?? "g"}
                        label="Unit (base)"
                        onChange={(e) => setEditingRow((prev) => ({ ...(prev || row), unit: e.target.value }))}
                      >
                        {unitOptions.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      label="Bar Code"
                      fullWidth
                      value={editingRow?.barCode ?? row.barCode ?? ""}
                      onChange={(e) => setEditingRow((prev) => ({ ...(prev || row), barCode: e.target.value }))}
                    />
                    <TextField
                      label="Expiry Date"
                      fullWidth
                      type="date"
                      value={editingRow?.expiryDate ?? row.expiryDate ?? ""}
                      onChange={(e) => setEditingRow((prev) => ({ ...(prev || row), expiryDate: e.target.value }))}
                    />
                    <TextField
                      label="Temperature (℃)"
                      fullWidth
                      value={editingRow?.temperature ?? row.temperature ?? ""}
                      onChange={(e) => setEditingRow((prev) => ({ ...(prev || row), temperature: e.target.value }))}
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
              setOriginalBarcode(null);
            }}
            sx={{ textTransform: "none" }}
            disabled={updating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmEdit}
            sx={{
              textTransform: "none",
              fontWeight: 800,
              borderRadius: 999,
              px: 2,
              color: "#fff",
              background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`,
              "&:hover": { background: brand.primaryDark },
            }}
            startIcon={updating ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : null}
            disabled={updating}
          >
            {updating ? "Updating…" : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={openConfirmDialog}
        onClose={handleCloseConfirmDialog}
        PaperProps={{
          sx: {
            borderRadius: 14,
            border: `1px solid ${brand.border}`,
            boxShadow: brand.shadow,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: brand.text }}>Confirm deletion</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: brand.subtext }}>
            Delete {selectedRows.length} selected record{selectedRows.length === 1 ? "" : "s"}?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseConfirmDialog} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteSelectedRows}
            sx={{
              textTransform: "none",
              fontWeight: 800,
              borderRadius: 999,
              px: 2,
              color: "#fff",
              background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`,
              "&:hover": { background: brand.primaryDark },
            }}
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GoodsIn;
