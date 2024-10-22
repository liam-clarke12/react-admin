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
    const updatedRows = goodsInRows.map((row) => (row.barCode === newRow.barCode ? newRow : row));
    setGoodsInRows(updatedRows);

    // Update inventory whenever rows are updated
    updateIngredientInventory(updatedRows);
    
    return newRow;
  };

  const updateIngredientInventory = (updatedRows) => {
    const updatedInventory = [];
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

      if (existingIngredient) {
        existingIngredient.amount += row.stockReceived; // Accumulate stock
        if (row.processed === "Yes") {
          delete nextBarcodeMap[row.ingredient]; // Remove processed ingredient from map
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

    // Update the state only if there are changes
    if (JSON.stringify(updatedRows) !== JSON.stringify(goodsInRows)) {
      setGoodsInRows(updatedRows);
    }
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
          rows={goodsInRows.map((row) => ({
            ...row,
            id: row.barCode, // Use barCode as id
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
