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

  const [selectedRows, setSelectedRows] = useState([]); // Manually track selected rows
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false); // State for opening/closing the dialog
  const { cognitoId } = useAuth(); // Get cognitoId from context

  useEffect(() => {
    const fetchGoodsInData = async () => {
      try {
        console.log('Fetching Goods In data for cognitoId from component state:', cognitoId);
        
        if (!cognitoId) {
          console.error('cognitoId is not available in the component state.');
          return;
        }

        const response = await fetch(`https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/goods-in?cognito_id=${cognitoId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch Goods In data');
        }
        
        const data = await response.json();
        console.log('Goods In data fetched:', data);

        setGoodsInRows(data.map(row => ({
          ...row,
          processed: row.processed || (row.stockRemaining === 0 ? "Yes" : "No"),
        }))); // Ensure data is set to the goodsInRows state
      } catch (error) {
        console.error('Error fetching Goods In data:', error);
      }
    };

    if (cognitoId) {
      fetchGoodsInData(); // Fetch data only if cognitoId is available
    }
  }, [cognitoId, setGoodsInRows]); // Runs when cognitoId is available or updated

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
    { 
      field: "unit",
      headerName: "Unit",
      flex: 1,
      editable: true 
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
    {
      field: "fileAttachment", // New column for the uploaded file
      headerName: "File Attachment",
      renderCell: (params) => {
        const file = params.row.file; // Use the row's file
        return (
          <Box>
            {file ? (
              <Button variant="outlined" color="primary" onClick={() => handleFileOpen(file)}>
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
        console.log(`Unselecting row with id: ${row.id}`); // Log when unselecting
        return prevSelectedRows.filter((id) => id !== row.id);
      } else {
        // Add to selection
        console.log(`Selecting row with id: ${row.id}`); // Log when selecting
        return [...prevSelectedRows, row.id];
      }
    });
  };

  const handleDeleteSelectedRows = async () => {
    try {
      if (!cognitoId) {
        console.error("Cognito ID is missing.");
        return;
      }
  
      // Log selected rows for debugging
      console.log("Selected rows for deletion:", selectedRows);
  
      // Ensure we are working with the latest goodsInRows state
      const rowsToDelete = goodsInRows.filter((row) =>
        selectedRows.includes(`${row.barCode}-${row.ingredient}`)
      );
      
      if (rowsToDelete.length === 0) {
        console.error("No rows selected for deletion.");
        return;
      }
  
      await Promise.all(
        rowsToDelete.map(async (row) => {
          const { barCode } = row;
          const response = await fetch("https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/delete-row", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ barCode, cognito_id: cognitoId }),
          });
  
          if (!response.ok) {
            throw new Error(`Failed to delete row with Bar Code ${barCode}`);
          }
        })
      );
  
      // Remove the selected rows from the frontend state after deletion
      const updatedRows = goodsInRows.filter((row) =>
        !selectedRows.includes(`${row.barCode}-${row.ingredient}`)
      );
      setGoodsInRows(updatedRows);
      localStorage.setItem("goodsInRows", JSON.stringify(updatedRows));
      setSelectedRows([]); // Clear selection
      handleCloseConfirmDialog();
    } catch (error) {
      console.error("Error deleting rows:", error);
    }
  };
  

  const handleOpenConfirmDialog = () => {
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
  };

  const handleFileOpen = (fileUrl) => {
    window.open(fileUrl, "_blank");
  };

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
            color: colors.blueAccent[500],
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
          <Button onClick={handleCloseConfirmDialog} sx={{ color: colors.blueAccent[500] }}>
            Cancel
          </Button>
          <Button onClick={handleDeleteSelectedRows} color="error">
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
          onSelectionModelChange={(newSelection) => {
            console.log("New selection:", newSelection.selectionModel); // Log selected rows
            setSelectedRows(newSelection.selectionModel);
          }}
          processRowUpdate={processRowUpdate}
        />
      </Box>
    </Box>
  );
};

export default GoodsIn;
