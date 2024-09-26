import { Box, useTheme, Button, Drawer, Typography, IconButton } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../themes";
import Header from "../../components/Header";
import { useData } from "../../contexts/DataContext";
import BarChart from "../../components/BarChart"; // Use BarChart instead of PieChart
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined"; // Import Menu Icon
import { useState } from "react";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";


const IngredientsInventory = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { ingredientInventory, setIngredientInventory } = useData(); // Use setIngredientInventory from context
  const [drawerOpen, setDrawerOpen] = useState(false); // State to handle drawer visibility

  const columns = [
    { field: "ingredient", headerName: "Ingredient Name", flex: 1 },
    { field: "amount", headerName: "Stock on Hand", flex: 1 },
    {
      field: "barcode",
      headerName: "Barcode",
      flex: 1,
      headerAlign: "left",
      align: "left",
      cellClassName: "barCode-column--cell", // Style barcode column
    },
  ];

  const handleClearStorage = () => {
    localStorage.removeItem("ingredientInventory"); // Remove specific item
    setIngredientInventory([]); // Reset the state
  };

  // Prepare the data for the bar chart
  const barChartData = ingredientInventory.map((item) => ({
    ingredient: item.ingredient, // Use ingredient as the index
    amount: item.amount, // Key for value
  }));

  return (
    <Box m="20px">
      <Header title="INGREDIENT INVENTORY" subtitle="Stay on Top of your Stock Levels" />
      <Button onClick={handleClearStorage} color="error" variant="contained" sx={{ mb: 2 }}>
        Clear Data
      </Button>

      {/* Bar Chart Icon Button - Positioned above the table */}
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <IconButton
          onClick={() => setDrawerOpen(true)}
          sx={{
            color: colors.greenAccent[300], // No background, only color change
            "&:hover": {
              backgroundColor: "transparent", // Transparent background on hover
              color: colors.blueAccent[700], // Color change on hover
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
          "& .MuiDataGrid-root": {
            border: "none",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
          },
          "& .barCode-column--cell": {
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
        <DataGrid
          checkboxSelection
          rows={ingredientInventory}
          columns={columns}
          getRowId={(row) => row.ingredient} // Use ingredient name as the unique identifier for the rows
        />
      </Box>

      {/* Drawer for Bar Chart */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: "90%", // Increased width of the drawer
            borderRadius: "20px 0 0 20px", // Rounded top-left and bottom-left corners
            overflow: "hidden", // Ensure content fits inside the curved drawer
          },
        }}
      >
        <Box
          sx={{
            backgroundColor: colors.primary[400],
            height: "100%",
          }}
        >
          {/* Drawer Header */}
          <Box
            sx={{
              width: "100%",
              height: "50px", // Reduced height for a thinner header
              backgroundColor: colors.greenAccent[500], // Same background color as the Recipes drawer
              color: colors.grey[100],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative", // To position the close icon correctly
              top: 0, // Fill the top of the drawer
              padding: "0 10px", // Added padding for left/right
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

          {/* BarChart inside the Drawer */}
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{
              width: "100%", // Full width
              height: "70%", // Height for the bar chart
              mt: 2, // Added margin-top for spacing between header and chart
            }}
          >
            <BarChart
              data={barChartData}
              keys={["amount"]}
              indexBy="ingredient"
              height="500px" // Height for the bar chart
              width="90%"    // Adjust width for a better fit
            />
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default IngredientsInventory;
