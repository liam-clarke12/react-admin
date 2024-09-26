import { Box, useTheme, Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../themes";
import Header from "../../components/Header";
import { useData } from "../../contexts/DataContext";

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
      field: "barCode",
      headerName: "Bar Code",
      flex: 1,
      cellClassName: "barCode-column--cell",
      editable: true,
    },
  ];

  // Handle row update
  const processRowUpdate = (newRow) => {
    const updatedRows = goodsInRows.map((row) => (row.id === newRow.id ? newRow : row));
    setGoodsInRows(updatedRows);
    updateIngredientInventory(updatedRows);
    return newRow;
  };

  const updateIngredientInventory = (updatedRows) => {
    const updatedInventory = [];

    updatedRows.forEach((row) => {
      const existingIngredient = updatedInventory.find(item => item.ingredient === row.ingredient);

      if (existingIngredient) {
        existingIngredient.amount += row.stockReceived; // Accumulate stock for the same ingredient
      } else {
        updatedInventory.push({
          ingredient: row.ingredient,
          amount: row.stockReceived,
          barcode: row.barCode,
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
