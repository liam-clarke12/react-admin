import { Box, Button, useTheme } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../themes";
import Header from "../../components/Header";
import { useData } from "../../contexts/DataContext";

const GoodsOut = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { GoodsOut, clearGoodsOut, loading, updateProductionLog } = useData();

  const columns = [
    { field: "date", headerName: "Date", flex: 1, editable: false },
    { field: "recipe", headerName: "Recipe Name", flex: 1, editable: false },
    {
      field: "amount",
      headerName: "Amount",
      type: "number",
      flex: 1,
      headerAlign: "left",
      align: "left",
      editable: false,
    },
    {
      field: "batchCode",
      headerName: "Batch Code",
      flex: 1,
    },
    {
        field: "recipient",
        headerName: "Recipient",
        flex: 1,
      },
    {
        field: "processed",
        headerName: "Processed",
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
      <Header title="GOODS OUT" subtitle="Track Goods Out Information" />

      <Button 
        variant="contained" 
        color="secondary" 
        onClick={clearGoodsOut} 
        sx={{ mb: 2 }}
      >
        Clear Data
      </Button>

      <Box
        m="40px 0 0 0"
        height="75vh"
        sx={{
          overflowX: 'auto',
          "& .MuiDataGrid-root": { border: "none", minWidth: "650px" },
          "& .MuiDataGrid-cell": { borderBottom: "none" },
          "& .MuiDataGrid-columnHeaders": { backgroundColor: colors.blueAccent[700], borderBottom: "none" },
          "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
          "& .MuiDataGrid-footerContainer": { borderTop: "none", backgroundColor: colors.blueAccent[700] },
          "& .even-row": {
            backgroundColor: colors.primary[450], // Color for even rows (adjust per mode)
          },
          "& .odd-row": {
            backgroundColor: colors.primary[400], // Color for odd rows (adjust per mode)
          },
        }}
      >
        <DataGrid
          rows={GoodsOut.map((row, index) => ({
            ...row,
            id: row.batchCode, // Ensure a unique ID for each row
            rowClassName: index % 2 === 0 ? 'even-row' : 'odd-row', // Apply alternating row classes
          }))}
          columns={columns}
          processRowUpdate={processRowUpdate}
          getRowId={(row) => row.batchCode} // Ensure a unique ID for rows
          disableSelectionOnClick
          getRowClassName={(params) =>
            params.indexRelativeToCurrentPage % 2 === 0 ? 'even-row' : 'odd-row'
          }
        />
      </Box>
    </Box>
  );
};

export default GoodsOut;
