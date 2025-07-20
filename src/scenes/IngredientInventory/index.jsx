// src/scenes/inventory/IngredientsInventory.jsx
import { 
  Box, 
  useTheme, 
  Drawer, 
  Typography, 
  IconButton, 
  Snackbar, 
  useMediaQuery 
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../themes";
import Header from "../../components/Header";
import { useData } from "../../contexts/DataContext";
import BarChart from "../../components/BarChart";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import { useState, useEffect } from "react";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import { useAuth } from "../../contexts/AuthContext";

const IngredientsInventory = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { ingredientInventory, setIngredientInventory } = useData();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage] = useState('');
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { cognitoId } = useAuth();

  useEffect(() => {
    if (!cognitoId) return;
    const fetchGoodsInData = async () => {
      try {
        const response = await fetch(
          `https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/goods-in?cognito_id=${cognitoId}`
        );
        if (!response.ok) throw new Error("Failed to fetch Goods In data");
        const data = await response.json();
        const aggregated = aggregateByIngredient(data);
        setIngredientInventory(aggregated);
      } catch (err) {
        console.error("Error fetching Goods In data:", err);
      }
    };
    fetchGoodsInData();
  }, [cognitoId, setIngredientInventory]);

  // Aggregates raw goods-in rows into per-ingredient totals
  const aggregateByIngredient = (rows) => {
    const map = {};
    rows.forEach(({ ingredient, stockRemaining, barCode, unit, id }) => {
      if (stockRemaining <= 0) return;
      if (!map[ingredient]) {
        map[ingredient] = { ingredient, stockOnHand: 0, barcode: barCode, unit, firstId: id };
      }
      map[ingredient].stockOnHand += Number(stockRemaining);
      if (id < map[ingredient].firstId) {
        map[ingredient].firstId = id;
        map[ingredient].barcode = barCode;
        map[ingredient].unit = unit;
      }
    });
    return Object.values(map).map(({ firstId, ...item }) => item);
  };

  const columns = [
    { field: "ingredient", headerName: "Ingredient", flex: 1, editable: false },
    { field: "stockOnHand", headerName: "Stock on Hand", flex: 1, editable: false },
    { field: "unit", headerName: "Unit", flex: 1, editable: false },
    { 
      field: "barcode", 
      headerName: "Barcode", 
      flex: 1, 
      cellClassName: "barCode-column--cell", 
      editable: false 
    },
  ];

  const barChartData = ingredientInventory.map(item => ({
    ingredient: item.ingredient,
    amount: item.stockOnHand
  }));

  return (
    <Box m="20px">
      <Header title="INGREDIENT INVENTORY" subtitle="Stay on Top of your Stock Levels" />

      {/* Bar Chart toggle */}
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <IconButton
          onClick={() => setDrawerOpen(true)}
          aria-label="Open Bar Chart"
          sx={{
            color: colors.blueAccent[300],
            "&:hover": { backgroundColor: "transparent", color: colors.blueAccent[700] }
          }}
        >
          <BarChartOutlinedIcon />
        </IconButton>
      </Box>

      {/* Styled DataGrid */}
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
          autoHeight
          checkboxSelection={false}
          getRowId={(row) => row.ingredient}
          rows={ingredientInventory}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[5, 10, 20]}
        />
      </Box>

      {/* Drawer for Bar Chart */}
      <Drawer
        anchor={isMobile ? "bottom" : "right"}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: { width: isMobile ? "100%" : "90%", borderRadius: "20px 0 0 20px" },
        }}
      >
        <Box sx={{ backgroundColor: colors.primary[400], height: "100%" }}>
          <Box
            sx={{
              width: "100%",
              height: "50px",
              backgroundColor: colors.greenAccent[500],
              color: colors.grey[100],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              padding: "0 10px",
            }}
          >
            <IconButton 
              onClick={() => setDrawerOpen(false)} 
              sx={{ color: "white", position: "absolute", left: 10 }}
            >
              <MenuOutlinedIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "white" }}>
              Bar Chart
            </Typography>
          </Box>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{ width: "100%", height: "70%", mt: 2 }}
          >
            <BarChart
              data={barChartData}
              keys={["amount"]}
              indexBy="ingredient"
              height="500px"
              width="90%"
            />
          </Box>
        </Box>
      </Drawer>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default IngredientsInventory;
