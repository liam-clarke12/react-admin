// src/scenes/data/GoodsIn/index.jsx
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
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../themes";
import { useData } from "../../contexts/DataContext";
import { useEffect, useMemo, useState } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAuth } from "../../contexts/AuthContext";

const brand = {
  text: "#0f172a",
  subtext: "#334155",
  border: "#e5e7eb",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  primary: "#2563eb",
  primaryDark: "#1d4ed8",
  focusRing: "rgba(37, 99, 235, 0.35)",
  danger: "#dc2626",
  shadow: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)",
};

const GoodsIn = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { goodsInRows, setGoodsInRows, setIngredientInventory } = useData();

  const [selectedRows, setSelectedRows] = useState([]);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const { cognitoId } = useAuth();

  useEffect(() => {
    const fetchGoodsInData = async () => {
      try {
        if (!cognitoId) return;
        const response = await fetch(
          `https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/goods-in?cognito_id=${cognitoId}`
        );
        if (!response.ok) throw new Error("Failed to fetch Goods In data");
        const data = await response.json();
        setGoodsInRows(
          data.map((row) => ({
            ...row,
            processed: row.processed || (row.stockRemaining === 0 ? "Yes" : "No"),
          }))
        );
      } catch (error) {
        console.error("Error fetching Goods In data:", error);
      }
    };
    if (cognitoId) fetchGoodsInData();
  }, [cognitoId, setGoodsInRows]);

  const handleDeleteIconClick = (row) => {
    // Select only this row and open the confirm dialog
    setSelectedRows([row.id]);
    setOpenConfirmDialog(true);
  };

  const columns = useMemo(
    () => [
      {
        field: "select",
        headerName: "Select",
        sortable: false,
        filterable: false,
        width: 90,
        renderCell: (params) => {
          const isSelected = selectedRows.includes(params.row.id);
          return (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleRowSelection(params.row)}
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                cursor: "pointer",
                accentColor: brand.primary,
              }}
            />
          );
        },
      },
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
      // NEW: per-row delete icon
      {
        field: "actions",
        headerName: "",
        width: 64,
        sortable: false,
        filterable: false,
        align: "center",
        renderCell: (params) => (
          <IconButton
            aria-label="Delete row"
            onClick={() => handleDeleteIconClick(params.row)}
            sx={{
              color: brand.danger,
              "&:hover": { background: brand.surfaceMuted },
            }}
          >
            <DeleteIcon />
          </IconButton>
        ),
      },
    ],
    [selectedRows]
  );

  const processRowUpdate = async (newRow) => {
    const updatedRow = {
      ...newRow,
      processed: newRow.stockRemaining === 0 ? "Yes" : "No",
    };

    try {
      const response = await fetch(
        `https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/goods-in/${encodeURIComponent(
          updatedRow.barCode
        )}`,
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
      if (!response.ok) {
        throw new Error("Failed to update on server");
      }
    } catch (error) {
      console.error("Backend update error:", error);
      throw error;
    }

    setGoodsInRows((prevRows) => {
      const updatedRows = prevRows.map((row) =>
        row.id === updatedRow.id ? updatedRow : row
      );
      localStorage.setItem("goodsInRows", JSON.stringify(updatedRows));
      updateIngredientInventory(updatedRows);
      return updatedRows;
    });

    return updatedRow;
  };

  const updateIngredientInventory = (updatedRows) => {
    const updatedInventory = [];
    const nextBarcodeMap = {};

    updatedRows.forEach((row) => {
      if (row.processed === "No" && !nextBarcodeMap[row.ingredient]) {
        nextBarcodeMap[row.ingredient] = row.barCode;
      }
    });

    updatedRows.forEach((row) => {
      const existing = updatedInventory.find((i) => i.ingredient === row.ingredient);
      if (existing) {
        existing.amount += row.stockReceived;
        if (row.processed === "Yes") delete nextBarcodeMap[row.ingredient];
      } else {
        updatedInventory.push({
          ingredient: row.ingredient,
          amount: row.stockReceived,
          barcode: nextBarcodeMap[row.ingredient] || row.barCode,
        });
      }
    });

    setIngredientInventory(updatedInventory);
  };

  const handleRowSelection = (row) => {
    setSelectedRows((prev) =>
      prev.includes(row.id) ? prev.filter((id) => id !== row.id) : [...prev, row.id]
    );
  };

  const handleDeleteSelectedRows = async () => {
    // Your existing delete logic here (batch delete using selectedRows).
    // If you want me to wire this to your API, tell me the endpoint and payload shape.
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
        {/* Toolbar with Delete icon */}
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
          <Typography sx={{ fontWeight: 800, color: brand.text }}>
            Goods In
          </Typography>

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
              id: `${row.barCode}-${row.ingredient}`,
              processed: row.processed || "No",
            }))}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5]}
            editMode="row"
            experimentalFeatures={{ newEditingApi: true }}
            processRowUpdate={processRowUpdate}
            onProcessRowUpdateError={(error) =>
              console.error("Row update failed:", error)
            }
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
