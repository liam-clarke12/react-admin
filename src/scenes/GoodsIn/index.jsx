import { Box, useTheme, Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../themes";
import Header from "../../components/Header";
import { useData } from "../../contexts/DataContext";
import { useEffect } from "react";

const GoodsIn = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { goodsInRows, setGoodsInRows, setIngredientInventory } = useData();

  const columns = [
    { field: "date", headerName: "Date", flex: 1, editable: true },
    { field: "ingredient", headerName: "Ingredient", flex: 1, editable: true },
    {
      field: "stockReceived",
      headerName: "Stock Received (g)",
      type: "number",
      flex: 1,
      headerAlign: "left",
      align: "left",
      editable: true,
    },
    {
      field: "stockRemaining",
      headerName: "Stock Remaining (g)",
      type: "number",
      flex: 1,
      headerAlign: "left",
      align: "left",
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
      editable: false, // Making this non-editable
    },
  ];

  // Handle row update
  const processRowUpdate = (newRow) => {
    const updatedRows = goodsInRows.map((row) => (row.id === newRow.id ? newRow : row));
    setGoodsInRows(updatedRows);
    
    // Update inventory whenever rows are updated
    updateIngredientInventory(updatedRows);
    
    return newRow;
  };

  const updateIngredientInventory = (updatedRows) => {
    const updatedInventory = [];

    // Create a map to store the next unprocessed barcode for each ingredient
    const nextBarcodeMap = {};

    // First pass: Track barcodes of unprocessed ingredients
    updatedRows.forEach((row) => {
      if (row.processed === "No") {
        if (!nextBarcodeMap[row.ingredient]) {
          nextBarcodeMap[row.ingredient] = row.barCode; // Set the first unprocessed barcode
        }
      }
    });

    // Second pass: Update inventory and adjust barcodes as needed
    updatedRows.forEach((row) => {
      const existingIngredient = updatedInventory.find(item => item.ingredient === row.ingredient);

      // If the ingredient is already in the inventory
      if (existingIngredient) {
        existingIngredient.amount += row.stockReceived; // Accumulate stock
        // Check if the row is processed
        if (row.processed === "Yes") {
          // No barcode updates to existing ingredients
          // Remove this barcode from the map so it isn't reused
          delete nextBarcodeMap[row.ingredient];
        }
      } else {
        // If it's a new ingredient, add it to the inventory
        updatedInventory.push({
          ingredient: row.ingredient,
          amount: row.stockReceived,
          // Do not add/update barcode in inventory
          barcode: nextBarcodeMap[row.ingredient] || row.barCode, // Use the tracked barcode or current barcode
        });
      }
    });

    // Update the ingredient inventory in context
    setIngredientInventory(updatedInventory);
  };

  // Clear the localStorage for Goods In data
  const handleClearStorage = () => {
    localStorage.removeItem("goodsInRows");
    setGoodsInRows([]); // Reset rows
  };

  // Automatically update processed status based on stock remaining
  useEffect(() => {
    const updatedRows = goodsInRows.map((row) => ({
      ...row,
      processed: row.stockRemaining === 0 ? "Yes" : "No",
    }));
    setGoodsInRows(updatedRows);
  }, [goodsInRows, setGoodsInRows]); // Runs whenever goodsInRows changes

  return (
    <Box m="20px">
      <Header title="GOODS IN" subtitle="Track the Goods coming into your Business" />
      <Button onClick={handleClearStorage} color="error" variant="contained" sx={{ mb: 2 }}>
        Clear Data
      </Button>
      <Box
        m="40px 0 0 0"
        height="75vh"
        sx={{
          "& .MuiDataGrid-root": { border: "none" },
          "& .MuiDataGrid-cell": { borderBottom: "none" },
          "& .barCode-column--cell": { color: colors.greenAccent[300] },
          "& .MuiDataGrid-columnHeaders": { backgroundColor: colors.blueAccent[700], borderBottom: "none" },
          "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
          "& .MuiDataGrid-footerContainer": { borderTop: "none", backgroundColor: colors.blueAccent[700] },
          "& .MuiCheckbox-root": { color: `${colors.greenAccent[200]} !important` },
        }}
      >
        <DataGrid
          checkboxSelection
          rows={goodsInRows.map((row, index) => ({
            ...row,
            id: row.barCode || index, // Use barCode as id, or index as a fallback
            processed: row.processed || "No", // Default to "No" if processed is not set
          }))}
          columns={columns}
          processRowUpdate={processRowUpdate} // Enable cell edits to trigger updates
          getRowId={(row) => row.barCode} // Set the unique id for the row
        />
      </Box>
    </Box>
  );
};

export default GoodsIn;
