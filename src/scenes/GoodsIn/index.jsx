import {
  Box,
  useTheme,
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../themes";
import Header from "../../components/Header";
import { useData } from "../../contexts/DataContext";
import { useEffect, useState } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAuth } from "../../contexts/AuthContext"; // Import the useAuth hook

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
        if (!response.ok) throw new Error('Failed to fetch Goods In data');
        const data = await response.json();
        setGoodsInRows(
          data.map(row => ({
            ...row,
            processed: row.processed || (row.stockRemaining === 0 ? "Yes" : "No"),
          }))
        );
      } catch (error) {
        console.error('Error fetching Goods In data:', error);
      }
    };
    if (cognitoId) fetchGoodsInData();
  }, [cognitoId, setGoodsInRows]);

  const columns = [
    {
      field: "select",
      headerName: "Select",
      renderCell: (params) => {
        const isSelected = selectedRows.includes(params.row.id);
        return (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => handleRowSelection(params.row)}
          />
        );
      },
      width: 100,
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
      editable: false, // barCode should not be edited
    },
    { field: "processed", headerName: "Processed", flex: 1, editable: false },
    {
      field: "fileAttachment",
      headerName: "File Attachment",
      renderCell: (params) => {
        const file = params.row.file;
        return (
          <Box>
            {file ? (
              <Button variant="outlined" onClick={() => handleFileOpen(file)}>
                View File
              </Button>
            ) : (
              "No File"
            )}
          </Box>
        );
      },
      flex: 1,
      align: "center",
    },
  ];

  // Persist both frontend and backend update
  const processRowUpdate = async (newRow) => {
    const updatedRow = {
      ...newRow,
      processed: newRow.stockRemaining === 0 ? "Yes" : "No",
    };

    // Send to backend
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
        throw new Error('Failed to update on server');
      }
    } catch (error) {
      console.error('Backend update error:', error);
      // Optionally: rollback local change or show notification
      throw error; // Let DataGrid know update failed
    }

    // Update local state
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
      const existing = updatedInventory.find(
        (i) => i.ingredient === row.ingredient
      );
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
      prev.includes(row.id)
        ? prev.filter((id) => id !== row.id)
        : [...prev, row.id]
    );
  };

  const handleDeleteSelectedRows = async () => {
    // ...existing delete logic...
  };

  const handleOpenConfirmDialog = () => setOpenConfirmDialog(true);
  const handleCloseConfirmDialog = () => setOpenConfirmDialog(false);
  const handleFileOpen = (fileUrl) => window.open(fileUrl, "_blank");

  return (
    <Box m="20px">
      <Header title="GOODS IN" subtitle="Track the Goods coming into your Business" />

      {/* Delete button and confirmation dialog */}
      {/* ...omitted for brevity; unchanged... */}

      <Box
        m="40px 0 0 0"
        sx={{
          height: "75vh",
          overflowX: "auto",
          "& .MuiDataGrid-root": { border: "none" },
          "& .MuiDataGrid-cell": { borderBottom: "none" },
          "& .barCode-column--cell": { color: colors.blueAccent[300] },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none",
          },
          "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
          "& .MuiDataGrid-footerContainer": {
            backgroundColor: colors.blueAccent[700],
            borderTop: "none",
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
          checkboxSelection
          onSelectionModelChange={(newSelection) =>
            setSelectedRows(newSelection.selectionModel)
          }
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={(error) =>
            console.error('Row update failed:', error)
          }
        />
      </Box>
    </Box>
  );
};

export default GoodsIn;
