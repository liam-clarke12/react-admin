import { Box, useTheme, Drawer, Typography, IconButton, Snackbar, useMediaQuery } from "@mui/material";
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
    { field: "ingredient", headerName: "Ingredient", flex: 1 },
    { field: "stockOnHand", headerName: "Stock on Hand", flex: 1 },
    { field: "unit", headerName: "Unit", flex: 1 },
    { field: "barcode", headerName: "Barcode", flex: 1, cellClassName: "barCode-column--cell" },
  ];

  const barChartData = ingredientInventory.map(item => ({
    ingredient: item.ingredient,
    amount: item.stockOnHand
  }));

  return (
    <Box m="20px">
      <Header title="INGREDIENT INVENTORY" subtitle="Stay on Top of your Stock Levels" />
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: colors.blueAccent[300], '&:hover': { backgroundColor: 'transparent', color: colors.blueAccent[700] } }}>
          <BarChartOutlinedIcon />
        </IconButton>
      </Box>

      <Box m="40px 0 0 0" height="75vh" sx={{ overflowX: 'auto' }}>
        <DataGrid
          autoHeight
          checkboxSelection
          getRowId={(row) => row.ingredient}
          rows={ingredientInventory}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[5, 10, 20]}
        />
      </Box>

      <Drawer
        anchor={isMobile ? 'bottom' : 'right'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: isMobile ? '100%' : '90%', borderRadius: '20px 0 0 20px' } }}
      >
        <Box sx={{ backgroundColor: colors.primary[400], height: '100%' }}>
          <Box sx={{ width: '100%', height: '50px', backgroundColor: colors.greenAccent[500], display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: 'white', position: 'absolute', left: 10 }}><MenuOutlinedIcon /></IconButton>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>Bar Chart</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70%', mt: 2 }}>
            <BarChart data={barChartData} keys={["amount"]} indexBy="ingredient" height="500px" width="90%" />
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
