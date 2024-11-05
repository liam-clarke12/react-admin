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
      ...newRow,// Ensure this is a Date object
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

  const handleClearStorage = () => {
    console.log("Clearing localStorage data for goodsInRows");
    localStorage.removeItem("goodsInRows");
    setGoodsInRows([]);
  };

  useEffect(() => {
    console.log("Running useEffect to check and update processed status");

    const updatedRows = goodsInRows.map((row) => ({
      ...row,
      processed: row.stockRemaining === 0 ? "Yes" : "No",
    }));

    console.log("Checking expiryDates in goodsInRows:", goodsInRows.map(row => row.expiryDate)); // Log expiryDates

    if (JSON.stringify(updatedRows) !== JSON.stringify(goodsInRows)) {
      console.log("Detected change in processed status, updating goodsInRows");
      setGoodsInRows(updatedRows);
    }
  }, [goodsInRows, setGoodsInRows]);

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
        }}
      >
        <DataGrid
          checkboxSelection
          rows={goodsInRows.map((row, index) => ({
            ...row,
            id: `${row.barCode}-${row.ingredient}`,
            processed: row.processed || "No",
            rowClassName: index % 2 === 0 ? 'even-row' : 'odd-row',
          }))}
          columns={columns}
          processRowUpdate={processRowUpdate}
          getRowId={(row) => `${row.barCode}-${row.ingredient}`}
          getRowClassName={(params) => (params.indexRelativeToCurrentPage % 2 === 0 ? 'even-row' : 'odd-row')}
        />
      </Box>
    </Box>
  );
};

export default GoodsIn;
