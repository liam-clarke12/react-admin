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
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useData } from "../../contexts/DataContext";
import { useEffect, useMemo, useState } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
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

const GoodsIn = () => {
  const { goodsInRows, setGoodsInRows, setIngredientInventory } = useData();
  const [selectedRows, setSelectedRows] = useState([]); // array of row ids
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const { cognitoId } = useAuth();

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

        // Normalize + compute processed flag from stockRemaining
        const normalized = (Array.isArray(data) ? data : []).map((row) => ({
          ...row,
          processed: Number(row.stockRemaining) === 0 ? "Yes" : "No",
        }));

        setGoodsInRows(normalized);
        updateIngredientInventory(normalized);
      } catch (error) {
        console.error("Error fetching Goods In data:", error);
      }
    };
    if (cognitoId) fetchGoodsInData();
  }, [cognitoId, setGoodsInRows]);

  // Columns (no row-level delete column; use checkboxSelection)
  const columns = useMemo(
    () => [
      { field: "date", headerName: "Date", flex: 1, editable: true },
      { field: "ingredient", headerName: "Ingredient", flex: 1, editable: true },
      { field: "temperature", headerName: "Temperature", flex: 1, editable: true },
      {
        field: "stockReceived",
        headerName: "Stock Received (kg)",
        type: "number",
        flex: 1,
        headerAlign: "left",
        align: "left",
        editable: true,
      },
      {
        field: "stockRemaining",
        headerName: "Stock Remaining (kg)",
        type: "number",
        flex: 1,
        headerAlign: "left",
        align: "left",
        editable: true,
      },
      { field: "unit", headerName: "Unit", flex: 1, editable: true },
      { field: "expiryDate", headerName: "Expiry Date", flex: 1, editable: true },
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
    ],
    []
  );

  // Save edits (still allowed for active rows)
  const processRowUpdate = async (newRow) => {
    const updatedRow = {
      ...newRow,
      processed: Number(newRow.stockRemaining) === 0 ? "Yes" : "No",
    };

    try {
      const response = await fetch(
        `${API_BASE}/goods-in/${encodeURIComponent(updatedRow.barCode)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: updatedRow.date,
            ingredient: updatedRow.ingredient,
            temperature: updatedRow.temperature,
            stockReceived: updatedRow.stockReceived,
            stockRemaining: updatedRow.stockRemaining,
            unit: updatedRow.unit,
            expiryDate: updatedRow.expiryDate,
            cognito_id: cognitoId,
          }),
        }
      );
      if (!response.ok) throw new Error("Failed to update on server");
    } catch (error) {
      console.error("Backend update error:", error);
      throw error;
    }

    // Update local rows + inventory
    const nextRows = goodsInRows.map((r) => (r.id === updatedRow.id ? updatedRow : r));
    setGoodsInRows(nextRows);
    updateIngredientInventory(nextRows);

    return updatedRow;
  };

  // Inventory: sum ACTIVE stockRemaining; earliest active barcode per ingredient
  const updateIngredientInventory = (rows) => {
    const active = rows.filter((r) => Number(r.stockRemaining) > 0);

    const map = new Map();
    for (const r of active) {
      const key = r.ingredient;
      const prev = map.get(key) || { ingredient: key, amount: 0, barcode: r.barCode, _date: r.date };
      const amount = prev.amount + Number(r.stockRemaining || 0);

      // choose earliest date as the "next" barcode
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
        // if dates are malformed, keep existing
      }

      map.set(key, { ingredient: key, amount, barcode: nextBarcode, _date: nextDate });
    }

    const inventory = Array.from(map.values()).map(({ _date, ...rest }) => rest);
    setIngredientInventory(inventory);
  };

  // Bulk soft delete (Production Log style)
  const handleDeleteSelectedRows = async () => {
    if (!cognitoId || selectedRows.length === 0) return;

    try {
      // Map selected row ids → barCodes for API payload
      const rowsToDelete = goodsInRows.filter((r) => selectedRows.includes(r.id));
      const barCodes = rowsToDelete.map((r) => r.barCode);

      const resp = await fetch(`${API_BASE}/delete-row`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barCodes, cognito_id: cognitoId }),
      });
      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        throw new Error(txt || "Soft delete failed");
      }

      // Remove from local state and refresh inventory
      const remaining = goodsInRows.filter((r) => !selectedRows.includes(r.id));
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
        {/* Toolbar with bulk Delete */}
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
              boxShadow:
                "0 8px 16px rgba(29,78,216,0.25), 0 2px 4px rgba(15,23,42,0.06)",
              "&:hover": {
                background: `linear-gradient(180deg, ${brand.primaryDark}, ${brand.primaryDark})`,
              },
              opacity: selectedRows.length === 0 ? 0.5 : 1,
            }}
          >
            <DeleteIcon />
          </IconButton>
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
            rows={goodsInRows.map((row) => ({
              ...row,
              // ensure a stable numeric/string id for selection
              id: row.id ?? `${row.barCode}-${row.ingredient}`,
              processed: row.processed || (Number(row.stockRemaining) === 0 ? "Yes" : "No"),
            }))}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            checkboxSelection
            disableRowSelectionOnClick
            editMode="row"
            experimentalFeatures={{ newEditingApi: true }}
            processRowUpdate={processRowUpdate}
            onProcessRowUpdateError={(error) => console.error("Row update failed:", error)}
            onRowSelectionModelChange={(model) => setSelectedRows(model)}
          />
        </Box>
      </Box>

      {/* Delete confirmation dialog */}
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
        <DialogTitle sx={{ fontWeight: 800, color: brand.text }}>
          Confirm deletion
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: brand.subtext }}>
            Delete {selectedRows.length} selected record
            {selectedRows.length === 1 ? "" : "s"}?
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
