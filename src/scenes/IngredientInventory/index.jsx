import { Box, useTheme, Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../themes";
import Header from "../../components/Header";
import { useData } from "../../contexts/DataContext";

const IngredientsInventory = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { rows, setRows } = useData(); // Use setRows from context

  const columns = [
    { field: "ingredient", headerName: "Ingredient Name", flex: 1 },
    { field: "amount", headerName: "Stock on Hand", flex: 1 },
    {
      field: "barcode",
      headerName: "Barcode",
      flex: 1,
      headerAlign: "left",
      align: "left",
      cellClassName: "barCode-column--cell" // Add this line

    },
  ];

  const handleClearStorage = () => {
    localStorage.removeItem('rows'); // Remove specific item
    setRows([]); // Reset the state
  };

  return (
    <Box m="20px">
      <Header title="INGREDIENT INVENTORY" subtitle="Stay on Top of your Stock Levels" />
      <Button 
        onClick={handleClearStorage} 
        color="error" 
        variant="contained"
        sx={{ mb: 2 }}
      >
        Clear Data
      </Button>
      <Box
        m="40px 0 0 0"
        height="75vh"
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
          },
          "& .barCode-column--cell": { // Update this line
            color: colors.greenAccent[300], // Set color for barcode
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.blueAccent[700],
          },
          "& .MuiCheckbox-root": {
            color: `${colors.greenAccent[200]} !important`,
          },
        }}
      >
        <DataGrid checkboxSelection rows={rows} columns={columns} />
      </Box>
    </Box>
  );
};

export default IngredientsInventory;
