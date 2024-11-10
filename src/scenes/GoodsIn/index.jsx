import { Box, useTheme, IconButton, Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../themes";
import Header from "../../components/Header";
import { useData } from "../../contexts/DataContext"; 
import { useEffect, useState, useRef } from "react";
import DeleteIcon from '@mui/icons-material/Delete';

const GoodsIn = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { goodsInRows, setGoodsInRows, setIngredientInventory, updateNotifications } = useData();

  const [selectedRows, setSelectedRows] = useState([]); // Manually track selected rows
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false); // State for opening/closing the dialog
  const prevGoodsInRowsRef = useRef(goodsInRows); // To track previous goodsInRows for comparison

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
    console.log("Processing row update:", newRow);

    const updatedRow = {
      ...newRow,
    };

    const updatedRows = goodsInRows.map((row) =>
      row.barCode === updatedRow.barCode && row.ingredient === updatedRow.ingredient
        ? updatedRow
        : row
    );

    console.log("Updated rows after processing:", updatedRows);
    setGoodsInRows(updatedRows);
    updateIngredientInventory(updatedRows);
    return updatedRow;
  };

  const updateIngredientInventory = (updatedRows) => {
    console.log("Updating ingredient inventory with rows:", updatedRows);

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

  // Manually select or unselect rows
  const handleRowSelection = (row) => {
    console.log("Toggling row selection for:", row);

    setSelectedRows((prevSelectedRows) => {
      if (prevSelectedRows.includes(row.id)) {
        // If already selected, unselect it
        return prevSelectedRows.filter((id) => id !== row.id);
      } else {
        // If not selected, add it
        return [...prevSelectedRows, row.id];
      }
    });
  };

  // Delete selected rows
  const handleDeleteSelectedRows = () => {
    console.log("Deleting selected rows:", selectedRows);

    const remainingRows = goodsInRows.filter(
      (row) => !selectedRows.includes(row.id)
    );

    console.log("Remaining rows after deletion:", remainingRows);
    setGoodsInRows(remainingRows);
    setSelectedRows([]); // Clear selection after deletion
    console.log("Selection cleared after deletion.");
  };

  // Open the confirmation dialog
  const handleOpenConfirmDialog = () => {
    setOpenConfirmDialog(true);
  };

  // Close the confirmation dialog
  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
  };

  // Confirm deletion of selected rows
  const handleConfirmDelete = () => {
    handleDeleteSelectedRows();
    handleCloseConfirmDialog();
  };

  useEffect(() => {
    const interval = setInterval(() => {
      console.log("Running periodic check to update processed status and expired items");

      let updated = false;

      const updatedRows = goodsInRows.map((row) => {
        const updatedRow = {
          ...row,
          processed: row.stockRemaining === 0 ? "Yes" : "No",
        };

        // Check if processed status changed
        if (updatedRow.processed !== prevGoodsInRowsRef.current.find(r => r.barCode === row.barCode && r.ingredient === row.ingredient)?.processed) {
          updated = true;
        }

        return updatedRow;
      });

      // If there was a change in processed status, update the state
      if (updated) {
        console.log("Detected change in processed status, updating goodsInRows");
        setGoodsInRows(updatedRows);
      }

      // Check for expired items and remove them
      const currentDate = new Date();
      const nonExpiredRows = updatedRows.filter((row) => new Date(row.expiryDate) >= currentDate);

      // Update goodsInRows by removing expired rows
      if (updatedRows.length !== nonExpiredRows.length) {
        console.log("Expired items detected and removed.");
        setGoodsInRows(nonExpiredRows); // Only keep non-expired rows
      }

      // Update expired items notifications only if necessary
      const expiredItems = updatedRows.filter((row) => new Date(row.expiryDate) < currentDate);
      const notifications = expiredItems.map((item) => `Your ${item.ingredient} (${item.barCode}) has expired!`);
      
      // Only update notifications if there are any new expired items
      if (notifications.length > 0) {
        updateNotifications(notifications);
      }

      // Store the current rows in the ref for next comparison
      prevGoodsInRowsRef.current = updatedRows;
    }, 5000); // Run every 5 seconds

    // Cleanup function to clear interval when the component unmounts
    return () => clearInterval(interval);

  }, [goodsInRows, setGoodsInRows, updateNotifications]);

  return (
<Box m="20px">
  <Header title="GOODS IN" subtitle="Track the Goods coming into your Business" />
  
  {/* Trash Icon Button */}
  <Box sx={{ position: "relative", mb: 2,height: 2  }}>
    <IconButton
      onClick={handleOpenConfirmDialog}
      color="error"
      sx={{
        position: "absolute",
        top: 0,
        right: 0,
        color: colors.greenAccent[500],
        ...(selectedRows.length === 0 && { opacity: 0.5 }), // Disable button when no rows are selected
      }}
      disabled={selectedRows.length === 0}
    >
      <DeleteIcon />
    </IconButton>
  </Box>

  {/* Confirmation Dialog */}
  <Dialog open={openConfirmDialog} onClose={handleCloseConfirmDialog}>
    <DialogTitle>Confirm Deletion</DialogTitle>
    <DialogContent>Are you sure you want to delete the selected row(s)?</DialogContent>
    <DialogContent>Deleting this row(s) will remove "Stock Remaining" from the Ingredients Inventory!</DialogContent>
    <DialogActions>
      <Button onClick={handleCloseConfirmDialog} sx={{ color: colors.greenAccent[500] }}>            
        Cancel
      </Button>
      <Button onClick={handleConfirmDelete} color="error">
        Confirm
      </Button>
    </DialogActions>
  </Dialog>

  {/* DataGrid Section */}
  <Box
    m="40px 0 0 0"
    height="75vh"
    sx={{
      overflowX: 'auto',
      "& .MuiDataGrid-root": { border: "none", minWidth: "650px" },
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
        backgroundColor: colors.red[500], // Red background for expired items
      },
    }}
  >
    <DataGrid
      rows={goodsInRows.map((row) => ({
        ...row,
        id: `${row.barCode}-${row.ingredient}`,
        processed: row.processed || "No",
        rowClassName: new Date(row.expiryDate) < new Date() ? 'expired-row' : (row.id % 2 === 0 ? 'even-row' : 'odd-row'),
      }))}
      columns={columns}
      processRowUpdate={processRowUpdate}
      getRowId={(row) => `${row.barCode}-${row.ingredient}`}
      getRowClassName={(params) => {
        if (new Date(params.row.expiryDate) < new Date()) {
          return 'expired-row';
        }
        return params.indexRelativeToCurrentPage % 2 === 0 ? 'even-row' : 'odd-row';
      }}
    />
  </Box>
</Box>
  );
};

export default GoodsIn;
