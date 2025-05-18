import { Box, useTheme, Drawer, Typography, IconButton, Snackbar, useMediaQuery } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../themes";
import Header from "../../components/Header";
import { useData } from "../../contexts/DataContext";
import BarChart from "../../components/BarChart"; // Use BarChart instead of PieChart
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined"; // Import Menu Icon
import { useState, useEffect } from "react";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import { useAuth } from "../../contexts/AuthContext"; // Import the useAuth hook


const IngredientsInventory = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { ingredientInventory, setIngredientInventory } = useData(); // Use setIngredientInventory from context
  const [drawerOpen, setDrawerOpen] = useState(false); // State to handle drawer visibility
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage] = useState('');
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { cognitoId } = useAuth(); // Get cognitoId from context
  

  useEffect(() => {
    if (cognitoId) {
      const fetchGoodsInData = async () => {
        try {
          console.log("Fetching Goods In data...");
          const response = await fetch(`https://612wy8dkj5.execute-api.eu-west-1.amazonaws.com/dev/api/goods-in?cognito_id=${cognitoId}`);
          if (!response.ok) {
            throw new Error("Failed to fetch Goods In data");
          }
          const data = await response.json();
          console.log("Goods In data fetched:", data);
  
          const processedData = processInventoryData(data);
          setIngredientInventory(processedData);
        } catch (error) {
          console.error("Error fetching Goods In data:", error);
        }
      };
  
      fetchGoodsInData();
    }
  }, [cognitoId, setIngredientInventory]); // Added setIngredientInventory
  
  

  // Function to process the fetched data
  const processInventoryData = (data) => {
    // Step 1: Filter out rows with stockRemaining === 0
    const filteredData = data.filter(row => row.stockRemaining > 0);

    // Step 2: Group by 'ingredient' and process each group
    const groupedData = filteredData.reduce((acc, row) => {
      const existingGroup = acc[row.ingredient];

      if (existingGroup) {
        // Step 3: Sum the stockRemaining
        existingGroup.stockOnHand += row.stockRemaining;

        // Step 4: Assign the barcode from the row with the smallest ID
        if (row.id < existingGroup.minId) {
          existingGroup.minId = row.id;
          existingGroup.barcode = row.barCode;
        }
      } else {
        // Initialize the group
        acc[row.ingredient] = {
          id: row.ingredient, // Use ingredient as unique ID for DataGrid
          ingredient: row.ingredient,
          stockOnHand: row.stockRemaining,
          barcode: row.barCode,
          minId: row.id // Track min ID for barcode selection
        };
      }

      return acc;
    }, {});

    // Convert grouped object back into an array
    return Object.values(groupedData).map(({ minId, ...row }) => row);
  };

  const columns = [
    { field: "ingredient", headerName: "Ingredient Name", flex: 1, editable: true },
    { field: "stockOnHand", headerName: "Stock on Hand (kg)", flex: 1, editable: true },
    {
      field: "barcode",
      headerName: "Barcode",
      flex: 1,
      headerAlign: "left",
      align: "left",
      cellClassName: "barCode-column--cell",
      editable: true,
    },
  ];

  // Prepare data for the bar chart
  const barChartData = ingredientInventory.map((item) => ({
    ingredient: item.ingredient,
    amount: item.stockOnHand, // Key for value
  }));

  return (
    <Box m="20px">
      <Header title="INGREDIENT INVENTORY" subtitle="Stay on Top of your Stock Levels" />
      {/* Bar Chart Icon Button */}
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <IconButton
          onClick={() => setDrawerOpen(true)}
          aria-label="Open Bar Chart"
          sx={{
            color: colors.blueAccent[300],
            "&:hover": {
              backgroundColor: "transparent",
              color: colors.blueAccent[700],
            },
          }}
        >
          <BarChartOutlinedIcon />
        </IconButton>
      </Box>

      {/* DataGrid (Ingredients Table) */}
      <Box
        m="40px 0 0 0"
        height="75vh"
        sx={{
          overflowX: "auto",
          "& .MuiDataGrid-root": { border: "none", minWidth: "650px" },
          "& .MuiDataGrid-cell": { borderBottom: "none" },
          "& .barCode-column--cell": { color: colors.blueAccent[300] },
          "& .MuiDataGrid-columnHeaders": { backgroundColor: colors.blueAccent[700] },
          "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
          "& .MuiDataGrid-footerContainer": { backgroundColor: colors.blueAccent[700] },
        }}
      >
        <DataGrid
          autoHeight
          checkboxSelection
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
              top: 0,
              padding: "0 10px",
            }}
          >
            <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: "white", position: "absolute", left: 10 }}>
              <MenuOutlinedIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "white" }}>
              Bar Chart
            </Typography>
          </Box>

          {/* BarChart inside the Drawer */}
          <Box display="flex" justifyContent="center" alignItems="center" sx={{ width: "100%", height: "70%", mt: 2 }}>
            <BarChart data={barChartData} keys={["amount"]} indexBy="ingredient" height="500px" width="90%" />
          </Box>
        </Box>
      </Drawer>

      {/* Snackbar for Clear Storage */}
      <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={() => setOpenSnackbar(false)} message={snackbarMessage} />
    </Box>
  );
};

export default IngredientsInventory;
