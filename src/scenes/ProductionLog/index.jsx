import { Box, Button, useTheme } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../themes";
import Header from "../../components/Header";
import { useData } from "../../contexts/DataContext";

const ProductionLog = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { productionLogs, clearProductionLogs, loading, updateProductionLog } = useData();

  const columns = [
    { field: "date", headerName: "Date", flex: 1, editable: true },
    { field: "recipe", headerName: "Recipe Name", flex: 1, editable: true },
    {
      field: "batchesProduced",
      headerName: "Batches Produced",
      type: "number",
      flex: 1,
      headerAlign: "left",
      align: "left",
      editable: true,
    },
    {
      field: "batchCode",
      headerName: "Batch Code",
      flex: 1,
    },
  ];

  const processRowUpdate = (newRow) => {
    // Call the function to update the production log
    updateProductionLog(newRow); 
    return newRow; // Return the updated row for DataGrid
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Box m="20px">
      <Header title="PRODUCTION LOG" subtitle="Track the Recipes you have Produced" />
      
      <Button 
        variant="contained" 
        color="secondary" 
        onClick={clearProductionLogs} 
        sx={{ mb: 2 }}
      >
        Clear All Logs
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
        }}
      >
        <DataGrid
          rows={productionLogs} // Ensure you're using the correct state
          columns={columns}
          processRowUpdate={processRowUpdate}
          getRowId={(row) => row.id}
          disableSelectionOnClick
        />
      </Box>
    </Box>
  );
};

export default ProductionLog;
