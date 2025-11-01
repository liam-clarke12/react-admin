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
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useData } from "../../contexts/DataContext";
import { useEffect, useMemo, useState } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { useAuth } from "../../contexts/AuthContext";
import { useLocation } from "react-router-dom";

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
  inputBg: "#ffffff"
};

// unit options that match the GoodsIn form exactly
const unitOptions = [
  { value: "grams", label: "Grams (g)" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "kg", label: "Kilograms (Kg)" },
  { value: "l", label: "Litres (L)" },
  { value: "units", label: "Units" },
];

const GoodsIn = () => {
  const { goodsInRows, setGoodsInRows, setIngredientInventory } = useData();
  const [selectedRows, setSelectedRows] = useState([]); // array of selected _id's
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const { cognitoId } = useAuth();
  const location = useLocation();

  // Editing state
  const [activeCell, setActiveCell] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [editingRow, setEditingRow] = useState(null); // when editing full row
  const [originalBarcode, setOriginalBarcode] = useState(null); // server identifier
  const [originalId, setOriginalId] = useState(null); // internal _id
  const [updating, setUpdating] = useState(false);

  // Fetch ACTIVE goods-in rows (soft-deleted filtered out by the API)
  useEffect(() => {
    const fetchGoodsInData = async () => {
      try {
        if (!cognitoId) return;
        const response = await fetch(
          `${API_BASE}/goods-in/active?cognito_id=${encodeURIComponent(cognitoId)}`
        );
        if (!response.ok) throw new Error("Failed to fetch Goods In data");
        const data = await response.json();

        const normalized = (Array.isArray(data) ? data : []).map((row, idx) => {
          const date = row.date ? String(row.date).slice(0, 10) : row.date;
          const expiryDate = row.expiryDate ? String(row.expiryDate).slice(0, 10) : row.expiryDate;

          const stockReceived = Number(row.stockReceived || 0);
          const stockRemaining = Number(row.stockRemaining || 0);

          // stable internal id: combine barcode (if exists) + index
          const serverBar = row.barCode ? String(row.barCode) : null;
          const _id = serverBar
            ? `${serverBar}-${idx}`
            : `gen-${idx}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

          // invoice may be returned as invoice_number (snake) or invoiceNumber (camel)
          const invoiceNumber = row.invoice_number ?? row.invoiceNumber ?? null;

          // normalize unit: prefer explicit field, fallback to empty string
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

  // columns — note: unit column is intentionally NOT included, so user doesn't see it.
  const columns = useMemo(
    () => [
      { field: "date", headerName: "Date", flex: 1, editable: false },
      { field: "ingredient", headerName: "Ingredient", flex: 1, editable: false },
      { field: "temperature", headerName: "Temperature", flex: 1, editable: false },
      {
        field: "stockReceived",
        headerName: "Stock Received",
        type: "number",
        flex: 1,
        headerAlign: "left",
        align: "left",
        editable: false,
        // show unit after value (same style as stockRemaining)
        renderCell: (params) => {
          const val = params.row?.stockReceived ?? params.value ?? 0;
          const unit = params.row?.unit ?? "";
          return (
            <Box sx={{ width: "100%", display: "flex", alignItems: "center" }}>
              <Typography variant="body2" sx={{ color: brand.text }}>
                {`${val}${unit ? ` ${unit}` : ""}`}
              </Typography>
            </Box>
          );
        },
      },
      {
        field: "stockRemaining",
        headerName: "Stock Remaining",
        type: "number",
        flex: 1,
        headerAlign: "center",
        align: "center",
        editable: false,
        // Render numeric value and append unit; center the content and use same typography as other cells
        renderCell: (params) => {
          const val = params.row?.stockRemaining ?? params.value ?? 0;
          const unit = params.row?.unit ?? "";
          return (
            <Box sx={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Typography variant="body2" sx={{ color: brand.text }}>
                {`${val}${unit ? ` ${unit}` : ""}`}
              </Typography>
            </Box>
          );
        },
      },
      // Invoice column
      { field: "invoiceNumber", headerName: "Invoice #", flex: 1, editable: false },
      { field: "expiryDate", headerName: "Expiry Date", flex: 1, editable: false },
      {
        field: "barCode",
        headerName: "Batch Code",
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
        renderCell: (params) => {
          return (
            <IconButton
              size="small"
              aria-label="Edit row"
              onClick={() => {
                setEditingRow(params.row);
                setOriginalBarcode(params.row.barCode);
                setOriginalId(params.row._id);
                setActiveCell({ id: params.row.barCode, field: null, value: null, row: params.row });
                setEditValue(null);
                setEditDialogOpen(true);
              }}
            >
              <EditOutlinedIcon sx={{ color: brand.primary }} />
            </IconButton>
          );
        },
      },
    ],
    []
  );

  // helper: compute ingredient inventory from rows and set it
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

  // processRowUpdate - robust immutable updater, accepts both newRow & oldRow
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
      // send invoice using snake_case to match backend column
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
        // prefer server-provided invoice (snake or camel), otherwise use newRow value
        invoiceNumber: (serverRow && (serverRow.invoice_number ?? serverRow.invoiceNumber)) ?? newRow.invoiceNumber ?? null,
        // normalize unit returned from server (if any)
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

  // Bulk soft delete — selectedRows contain _id values
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
      setOpenConfirmDialog(false);
    } catch (err) {
      console.error("Soft delete error:", err);
      alert("Could not delete selected records. Check console for details.");
    }
  };

  const handleOpenConfirmDialog = () => setOpenConfirmDialog(true);
  const handleCloseConfirmDialog = () => setOpenConfirmDialog(false);
  const handleFileOpen = (fileUrl) => window.open(fileUrl, "_blank");

  const handleCellClick = (params) => {
    if (params.field === "__check__") return;
    setActiveCell({
      id: params.row.barCode,
      field: params.field,
      value: params.value,
      row: params.row,
    });
  };

  const openEditForActiveCell = () => {
    if (!activeCell) return;
    setEditValue(activeCell.value ?? "");
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
          [activeCell.field]:
            activeCell.field === "stockRemaining" || activeCell.field === "stockReceived"
              ? Number(editValue || 0)
              : editValue,
        };
        if (patched.stockRemaining !== undefined) patched.processed = Number(patched.stockRemaining) === 0 ? "Yes" : "No";

        result = await processRowUpdate(patched, { barCode: originalBarcode || activeCell.id, _id: originalId || row._id });
      } else {
        const patched = { ...editingRow };
        if (activeCell && activeCell.field) patched[activeCell.field] = editValue;
        patched.stockReceived = Number(patched.stockReceived || 0);
        patched.stockRemaining = Number(patched.stockRemaining || 0);
        patched.processed = Number(patched.stockRemaining) === 0 ? "Yes" : "No";

        result = await processRowUpdate(patched, { barCode: originalBarcode, _id: originalId });
      }

      setEditDialogOpen(false);
      setEditingRow(null);
      setActiveCell(null);
      setEditValue("");
      setOriginalBarcode(null);
      setOriginalId(null);
    } catch (err) {
      console.error("Confirm edit failed:", err);
      alert("Update failed. See console for details.");
    } finally {
      setUpdating(false);
    }
  };

  const renderEditInputForField = (fieldName, value, onChange) => {
    if (fieldName === "unit") {
      return (
        <FormControl fullWidth>
          <InputLabel id="unit-edit-label">Unit</InputLabel>
          <Select
            labelId="unit-edit-label"
            value={value ?? ""}
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
      return <TextField fullWidth type="number" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
    }

    // invoiceNumber is a plain text input (falls through to default)
    return <TextField fullWidth value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
  };

  // NEW: focus & highlight flow — reacts to location.state.focusBar or ?focusBar=...
  useEffect(() => {
    const focusBar =
      (location && location.state && location.state.focusBar) ||
      new URLSearchParams(window.location.search).get("focusBar");
    if (!focusBar) return;
    if (!goodsInRows || goodsInRows.length === 0) return;

    const target = goodsInRows.find((r) => r.barCode === focusBar);
    if (!target) return;
    const targetId = target._id;

    // set selection (controlled)
    try {
      setSelectedRows([targetId]);
    } catch (e) {}

    // scroll + highlight after grid rendered rows
    setTimeout(() => {
      // MUI DataGrid renders a row element with data-id attribute equal to row id
      const el = document.querySelector(`[data-id="${targetId}"]`);
      if (el) {
        try {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        } catch {}
        el.classList.add("plf-row-highlight");
        setTimeout(() => el.classList.remove("plf-row-highlight"), 2500);
      }
    }, 250);

    // clear location state so this doesn't run repeatedly on back/forward
    try {
      if (window && window.history && window.history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.delete("focusBar");
        window.history.replaceState({}, document.title, url.pathname + url.search);
      }
    } catch (e) {
      // ignore
    }
  }, [goodsInRows, location]);

  return (
    <Box m="20px">
      <style>{`
        .plf-row-highlight {
          animation: plfHighlight 2.4s ease forwards;
        }
        @keyframes plfHighlight {
          0% { background-color: rgba(255, 239, 213, 0.95); }
          10% { background-color: rgba(255, 239, 213, 0.95); }
          90% { background-color: transparent; }
          100% { background-color: transparent; }
        }

        /* alternating row coloring */
        .even-row {
          background-color: ${brand.surfaceMuted} !important;
        }
        .odd-row {
          background-color: ${brand.surface} !important;
        }

        /* keep barCode colored */
        .barCode-column--cell {
          color: ${brand.primary};
        }
      `}</style>

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
                "&:hover": { background: `linear-gradient(180deg, ${brand.primaryDark}, ${brand.primaryDark})` },
                opacity: selectedRows.length === 0 ? 0.5 : 1,
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>

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
            "& .MuiDataGrid-cell": { borderBottom: `1px solid ${brand.border}`, color: brand.text },
            "& .MuiDataGrid-row:hover": { backgroundColor: brand.surfaceMuted },
            "& .MuiDataGrid-footerContainer": { borderTop: `1px solid ${brand.border}`, background: brand.surface },
            "& .barCode-column--cell": { color: brand.primary },
            "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
              outline: `2px solid ${brand.primary}`,
              outlineOffset: "-2px",
              boxShadow: `0 0 0 4px ${brand.focusRing}`,
            },
          }}
        >
          <DataGrid
            rows={goodsInRows || []}
            getRowId={(row) => row._id}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            checkboxSelection
            rowSelectionModel={selectedRows}
            onRowSelectionModelChange={(model) => setSelectedRows(Array.isArray(model) ? model : [])}
            disableRowSelectionOnClick
            editMode="row"
            experimentalFeatures={{ newEditingApi: true }}
            processRowUpdate={(newRow, oldRow) => processRowUpdate(newRow, oldRow)}
            onProcessRowUpdateError={(error) => console.error("Row update failed:", error)}
            onCellClick={handleCellClick}
            /* <-- ADD alternating row classes here */
            getRowClassName={(params) => (params.indexRelativeToCurrentPage % 2 === 0 ? "even-row" : "odd-row")}
          />
        </Box>
      </Box>

      <Dialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingRow(null);
          setActiveCell(null);
          setEditValue("");
          setOriginalBarcode(null);
          setOriginalId(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 14, border: `1px solid ${brand.border}`, boxShadow: brand.shadow },
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
                        label="Stock Received"
                        fullWidth
                        type="number"
                        value={editingRow?.stockReceived ?? row.stockReceived ?? ""}
                        onChange={(e) => setEditingRow((prev) => ({ ...(prev || row), stockReceived: e.target.value }))}
                      />
                      <TextField
                        label="Stock Remaining"
                        fullWidth
                        type="number"
                        value={editingRow?.stockRemaining ?? row.stockRemaining ?? ""}
                        onChange={(e) => setEditingRow((prev) => ({ ...(prev || row), stockRemaining: e.target.value }))}
                      />
                    </Box>
                    <FormControl fullWidth>
                      <InputLabel id="unit-edit-label">Unit</InputLabel>
                      <Select
                        labelId="unit-edit-label"
                        value={editingRow?.unit ?? row.unit ?? ""}
                        label="Unit"
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
                      label="Batch Code"
                      fullWidth
                      value={editingRow?.barCode ?? row.barCode ?? ""}
                      onChange={(e) => setEditingRow((prev) => ({ ...(prev || row), barCode: e.target.value }))}
                    />
                    {/* Invoice Number field added to edit dialog */}
                    <TextField
                      label="Invoice Number"
                      fullWidth
                      value={editingRow?.invoiceNumber ?? row.invoiceNumber ?? ""}
                      onChange={(e) => setEditingRow((prev) => ({ ...(prev || row), invoiceNumber: e.target.value }))}
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
              setOriginalId(null);
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

      <Dialog
        open={openConfirmDialog}
        onClose={handleCloseConfirmDialog}
        PaperProps={{ sx: { borderRadius: 14, border: `1px solid ${brand.border}`, boxShadow: brand.shadow } }}
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
