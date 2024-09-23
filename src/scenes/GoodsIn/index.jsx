import { Box, useTheme, Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../themes";
import Header from "../../components/Header";
import { useData } from "../../contexts/DataContext";

const GoodsIn = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { rows, setRows } = useData(); // Make sure setRows is included here

  const columns = [
    { field: "date", headerName: "Date", flex: 1 },
    { field: "ingredient", headerName: "Ingredient", flex: 1 },
    {
      field: "stockReceived",
      headerName: "Stock Received (g)",
      type: "number",
      flex: 1,
      headerAlign: "left",
      align: "left",
    },
    {
      field: "barCode",
      headerName: "Bar Code",
      flex: 1,
      cellClassName: "barCode-column--cell",
    },
  ];

  const handleClearStorage = () => {
    localStorage.removeItem('rows');
    setRows([]); // Reset rows
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
        <DataGrid checkboxSelection rows={rows} columns={columns} />
      </Box>
    </Box>
  );
};

export default GoodsIn;
