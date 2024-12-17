import { Box, useTheme, Button, Drawer, Typography, IconButton, Snackbar, useMediaQuery } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../themes";
import Header from "../../components/Header";
import { useData } from "../../contexts/DataContext";
import BarChart from "../../components/BarChart"; // Use BarChart instead of PieChart
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined"; // Import Menu Icon
import { useState, useEffect } from "react";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";

const IngredientsInventory = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { ingredientInventory, setIngredientInventory } = useData(); // Use setIngredientInventory from context
  const [drawerOpen, setDrawerOpen] = useState(false); // State to handle drawer visibility
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Load from localStorage on initial render
  useEffect(() => {
    try {
      const storedData = localStorage.getItem("ingredientInventory");
      if (storedData) {
        setIngredientInventory(JSON.parse(storedData));
      }
    } catch (error) {
      console.error("Error reading localStorage:", error);
    }
  }, [setIngredientInventory]);

  // Sync state with localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("ingredientInventory", JSON.stringify(ingredientInventory));
  }, [ingredientInventory]);

  const columns = [
    { field: "ingredient", headerName: "Ingredient Name", flex: 1, editable: true },
    { field: "amount", headerName: "Stock on Hand (kg)", flex: 1, editable: true },
    {
      field: "barcode",
      headerName: "Barcode",
      flex: 1,
      headerAlign: "left",
      align: "left",
      cellClassName: "barCode-column--cell", // Style barcode column
      editable: true,
    },
  ];

  const handleClearStorage = () => {
    localStorage.removeItem("ingredientInventory");
    setIngredientInventory([]); // Reset the state
    setSnackbarMessage("Data cleared successfully!");
    setOpenSnackbar(true); // Show Snackbar confirmation
  };

  const handleRowEdit = (newRow, oldRow) => {
    const updatedRows = ingredientInventory.map((row) =>
      row.ingredient === oldRow.ingredient ? newRow : row
    );

    setIngredientInventory(updatedRows); // Update context

    // Also store updated data in localStorage
    localStorage.setItem("ingredientInventory", JSON.stringify(updatedRows));

    return newRow; // Return the new row for display
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
          aria-label="Open Bar Chart"
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
          overflowX: 'auto',
          "& .MuiDataGrid-root": { 
            border: "none", minWidth: "650px" 
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
          "& .even-row": {
            backgroundColor: colors.primary[450], // Color for even rows (adjust per mode)
          },
          "& .odd-row": {
            backgroundColor: colors.primary[400], // Color for odd rows (adjust per mode)
          },
        }}
      >
        <DataGrid
          autoHeight
          checkboxSelection
          rows={ingredientInventory.map((row, index) => ({
            ...row,
            id: row.ingredient, // Use ingredient as unique ID
            rowClassName: index % 2 === 0 ? 'even-row' : 'odd-row', // Apply alternating row classes
          }))}
          columns={columns}
          pageSize={10}  // Enable pagination
          rowsPerPageOptions={[5, 10, 20]}  // Allow users to select page size
          processRowUpdate={handleRowEdit}
          getRowClassName={(params) => 
            params.indexRelativeToCurrentPage % 2 === 0 ? 'even-row' : 'odd-row'
          }
        />
      </Box>

      {/* Drawer for Bar Chart */}
      <Drawer
        anchor={isMobile ? "bottom" : "right"} // Adjust position on mobile
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: isMobile ? "100%" : "90%",
            borderRadius: "20px 0 0 20px",
            overflow: "hidden",
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

      {/* Snackbar for Clear Storage */}
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
