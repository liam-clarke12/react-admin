import { Box, useTheme, Button, Drawer, Typography, IconButton } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../themes";
import Header from "../../components/Header";
import { useData } from "../../contexts/DataContext";
import BarChart from "../../components/BarChart"; // Import BarChart
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined"; // Import Menu Icon
import { useState } from "react";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";

const RecipeInventory = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { recipeInventory, clearRecipeInventory } = useData(); // Access the recipe inventory and clear function from context
  const [drawerOpen, setDrawerOpen] = useState(false); // State to handle drawer visibility

  // Safeguard: Ensure recipeInventory is an array
  const rows = recipeInventory && recipeInventory.length > 0 ? recipeInventory : [];

  const columns = [
    { field: "date", headerName: "Date", flex: 1 },
    { field: "recipe", headerName: "Recipe Name", flex: 1 },
    { field: "quantity", headerName: "Quantity", headerAlign: "left", align: "left", type: "number", flex: 1 },
    { field: "batchCode", headerName: "Batch Code", flex: 1 },
  ];

  // Prepare the data for the bar chart
  const barChartData = recipeInventory.map((item) => ({
    recipe: item.recipe, // Use recipe as the index
    quantity: item.quantity, // Key for value
  }));

  const handleClearStorage = () => {
    localStorage.removeItem("recipeInventory"); // Remove specific item
    clearRecipeInventory(); // Reset the state
  };

  return (
    <Box m="20px">
      <Header title="STOCK INVENTORY" subtitle="Track Your Stock Based on Production" />
      <Button 
        variant="contained" 
        color="error" 
        onClick={handleClearStorage}
        sx={{ mb: 2 }} // Add some margin below the button
      >
        Clear Logs
      </Button>

      {/* Bar Chart Icon Button - Positioned above the table */}
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <IconButton
          onClick={() => setDrawerOpen(true)}
          sx={{
            color: colors.blueAccent[300], // No background, only color change
            "&:hover": {
              backgroundColor: "transparent", // Transparent background on hover
              color: colors.blueAccent[700], // Color change on hover
            },
          }}
        >
          <BarChartOutlinedIcon />
        </IconButton>
      </Box>

      {/* DataGrid (Recipe Table) */}
      <Box
        m="40px 0 0 0"
        height="75vh"
        sx={{
          overflowX: 'auto',
          "& .MuiDataGrid-root": {border: "none", minWidth: "650px"},
          "& .MuiDataGrid-cell": { borderBottom: "none" },
          "& .MuiDataGrid-columnHeaders": { backgroundColor: colors.blueAccent[700], borderBottom: "none" },
          "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
          "& .MuiDataGrid-footerContainer": { borderTop: "none", backgroundColor: colors.blueAccent[700] },
          "& .MuiCheckbox-root": { color: `${colors.blueAccent[200]} !important` },

          // Alternating row colors
          "& .even-row": {
            backgroundColor: colors.primary[450], // Color for even rows
          },
          "& .odd-row": {
            backgroundColor: colors.primary[400], // Color for odd rows
          },
        }}
      >
        <DataGrid
          rows={rows.map((row, index) => ({ ...row, id: row.batchCode, rowClassName: index % 2 === 0 ? 'even-row' : 'odd-row' }))} // Add id to rows and class name
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          getRowClassName={(params) => 
            params.indexRelativeToCurrentPage % 2 === 0 ? 'even-row' : 'odd-row' // Apply alternating row classes
          }
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
              backgroundColor: colors.blueAccent[500], // Same background color as the Recipes drawer
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
              keys={["quantity"]} // Change this key based on your bar chart data
              indexBy="recipe" // Change this to match your data structure
              height="500px" // Height for the bar chart
              width="90%"    // Adjust width for a better fit
            />
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default RecipeInventory;
