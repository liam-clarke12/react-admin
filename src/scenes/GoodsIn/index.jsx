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

const GoodsIn = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { goodsInRows, setGoodsInRows, ingredientInventory, setIngredientInventory, updateNotifications } = useData();

  const [selectedRows, setSelectedRows] = useState([]); // Manually track selected rows
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false); // State for opening/closing the dialog

  const columns = [
    {
      field: "select",
      headerName: "Select",
      renderCell: (params) => {
        const isSelected = selectedRows.includes(params.row.id); // Check if the row is selected
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
    {
      field: "expiryDate",
      headerName: "Expiry Date",
      flex: 1,
      editable: true,
    },
    {
      field: "barCode",
      headerName: "Bar Code",
      flex: 1,
      cellClassName: "barCode-column--cell",
      editable: true,
    },
    {
      field: "processed",
      headerName: "Processed",
      flex: 1,
      editable: false,
    },
  ];

  const processRowUpdate = (newRow) => {
    const updatedRow = {
      ...newRow,
      processed: newRow.stockRemaining === 0 ? "Yes" : "No",
    };

    setGoodsInRows((prevRows) => {
      const updatedRows = prevRows.map((row) =>
        row.id === updatedRow.id ? updatedRow : row
      );

      // Persist updated rows to localStorage
      localStorage.setItem("goodsInRows", JSON.stringify(updatedRows));

      // Update ingredient inventory
      updateIngredientInventory(updatedRows);

      return updatedRows;
    });

    return updatedRow;
  };

  const updateIngredientInventory = (updatedRows) => {
    const updatedInventory = [];
    const nextBarcodeMap = {};

    updatedRows.forEach((row) => {
      if (row.processed === "No") {
        if (!nextBarcodeMap[row.ingredient]) {
          nextBarcodeMap[row.ingredient] = row.barCode;
        }
      }
    });

    updatedRows.forEach((row) => {
      const existingIngredient = updatedInventory.find(
        (item) => item.ingredient === row.ingredient
      );

      if (existingIngredient) {
        existingIngredient.amount += row.stockReceived;
        if (row.processed === "Yes") {
          delete nextBarcodeMap[row.ingredient];
        }
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
    setSelectedRows((prevSelectedRows) => {
      if (prevSelectedRows.includes(row.id)) {
        // Unselect the row
        return prevSelectedRows.filter((id) => id !== row.id);
      } else {
        // Add to selection
        return [...prevSelectedRows, row.id];
      }
    });
  };

  const handleDeleteSelectedRows = () => {
    // Remove selected rows
    const remainingRows = goodsInRows.filter(
      (row) => !selectedRows.includes(`${row.barCode}-${row.ingredient}`)
    );

    setGoodsInRows(remainingRows);
    localStorage.setItem("goodsInRows", JSON.stringify(remainingRows));
    setSelectedRows([]); // Clear selected rows

    // Update ingredient inventory
    const updatedInventory = ingredientInventory.map((item) => {
      const matchingRow = goodsInRows.find(
        (row) =>
          selectedRows.includes(`${row.barCode}-${row.ingredient}`) &&
          row.ingredient === item.ingredient
      );
      return matchingRow
        ? { ...item, amount: Math.max(0, item.amount - matchingRow.stockRemaining) }
        : item;
    });

    setIngredientInventory(updatedInventory);
  };

  const handleOpenConfirmDialog = () => {
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
  };

  const handleConfirmDelete = () => {
    handleDeleteSelectedRows();
    handleCloseConfirmDialog();
  };

  useEffect(() => {
    const storedData = JSON.parse(localStorage.getItem("goodsInRows")) || [];
    const initializedData = storedData.map((row) => ({
      ...row,
      processed: row.processed || (row.stockRemaining === 0 ? "Yes" : "No"),
    }));
    setGoodsInRows(initializedData);
  }, [setGoodsInRows]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentDate = new Date();
      const expiredItems = goodsInRows.filter((row) => new Date(row.expiryDate) < currentDate);

      const notifications = expiredItems.map((item) => `Your ${item.ingredient} (${item.barCode}) has expired!`);
      if (notifications.length > 0) {
        updateNotifications(notifications);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [goodsInRows, updateNotifications]);

  return (
    <Box m="20px">
      <Header title="GOODS IN" subtitle="Track the Goods coming into your Business" />

      <Box sx={{ position: "relative", mb: 2, height: 2 }}>
        <IconButton
          onClick={handleOpenConfirmDialog}
          color="error"
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            color: colors.greenAccent[500],
            ...(selectedRows.length === 0 && { opacity: 0.5 }),
          }}
          disabled={selectedRows.length === 0}
        >
          <DeleteIcon />
        </IconButton>
      </Box>

      <Dialog open={openConfirmDialog} onClose={handleCloseConfirmDialog}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>Are you sure you want to delete the selected row(s)?</DialogContent>
        <DialogContent>
          Deleting this row(s) will remove "Stock Remaining" from the Ingredients Inventory!
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} sx={{ color: colors.greenAccent[500] }}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Box
        m="40px 0 0 0"
        sx={{
          height: "75vh",
          overflowX: "auto",
          "& .MuiDataGrid-root": { border: "none" },
          "& .MuiDataGrid-cell": { borderBottom: "none" },
          "& .barCode-column--cell": { color: colors.greenAccent[300] },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none",
          },
          "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.blueAccent[700],
          },
          "& .MuiCheckbox-root": {
            color: `${colors.greenAccent[200]} !important`,
          },
          "& .even-row": {
            backgroundColor: colors.primary[450],
          },
          "& .odd-row": {
            backgroundColor: colors.primary[400],
          },
          "& .expired-row": {
            backgroundColor: colors.red[500],
          },
          // Responsive breakpoints
          "@media (max-width: 600px)": {
            "& .MuiDataGrid-root": { minWidth: "100%" },
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
          processRowUpdate={processRowUpdate}
          getRowId={(row) => `${row.barCode}-${row.ingredient}`}
          getRowClassName={(params) => {
            const isExpired = new Date(params.row.expiryDate) < new Date();
            const rowIndex = goodsInRows.findIndex((row) => row.id === params.row.id);
            const isEvenRow = rowIndex % 2 === 0;
            return isExpired ? "expired-row" : isEvenRow ? "even-row" : "odd-row";
          }}
          pagination
          pageSize={10}
          rowsPerPageOptions={[5, 10, 25]}
          virtualScrolling
          experimentalFeatures={{ newEditingApi: true }}
        />
      </Box>
    </Box>
  );
};

export default GoodsIn;
