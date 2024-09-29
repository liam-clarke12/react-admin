import { Box, useTheme, Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../themes";
import Header from "../../components/Header";
import { useData } from "../../contexts/DataContext";

const RecipeInventory = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { recipeInventory, clearRecipeInventory } = useData(); // Access the recipe inventory and clear function from context

  // Safeguard: Ensure recipeInventory is an array
  const rows = recipeInventory && recipeInventory.length > 0 ? recipeInventory : [];

  const columns = [
    { field: "date", headerName: "Date", flex: 1 },
    { field: "recipe", headerName: "Recipe Name", flex: 1 },
    { field: "quantity", headerName: "Quantity", type: "number", flex: 1 },
    { field: "batchCode", headerName: "Batch Code", flex: 1 },
  ];

  return (
    <Box m="20px">
      <Header title="RECIPE INVENTORY" subtitle="Track Your Recipe Stock Based on Production" />
      <Button 
        variant="contained" 
        color="error" 
        onClick={clearRecipeInventory}
        sx={{ mb: 2 }} // Add some margin below the button
      >
        Clear Logs
      </Button>
      <Box
        m="40px 0 0 0"
        height="75vh"
        sx={{
          "& .MuiDataGrid-root": { border: "none" },
          "& .MuiDataGrid-cell": { borderBottom: "none" },
          "& .MuiDataGrid-columnHeaders": { backgroundColor: colors.blueAccent[700], borderBottom: "none" },
          "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
          "& .MuiDataGrid-footerContainer": { borderTop: "none", backgroundColor: colors.blueAccent[700] },
          "& .MuiCheckbox-root": { color: `${colors.greenAccent[200]} !important` },
        }}
      >
        <DataGrid
          rows={rows.map((row, index) => ({ ...row, id: index }))}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Box>
    </Box>
  );
};

export default RecipeInventory;
