import React, { useState } from "react";
import { Box, useTheme, Button, Drawer, Typography, IconButton } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useData } from "../../contexts/DataContext";
import { tokens } from "../../themes";
import Header from "../../components/Header";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";

const StockUsage = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { stockUsage, clearStockUsage, ingredientInventory } = useData(); // Access ingredientInventory here
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerHeader, setDrawerHeader] = useState("");
  const [drawerContent, setDrawerContent] = useState([]);

  const columns = [
    { field: "date", headerName: "Date", flex: 1 },
    { field: "recipeName", headerName: "Recipe Name", flex: 1 },
    {
      field: "ingredients",
      headerName: "Ingredients",
      flex: 1,
      renderCell: (params) => (
        <span
          style={{ cursor: "pointer", color: colors.greenAccent[500] }}
          onClick={() => handleDrawerOpen("Ingredients", params.row.ingredients)}
        >
          Show Ingredients
        </span>
      ),
    },
    { field: "batchCode", headerName: "Batch Code", flex: 1 },
    {
      field: "barcodes",
      headerName: "Barcodes",
      flex: 1,
      renderCell: (params) => {
        const barcodes = (params.row.ingredients || []).map((ingredient) => {
          const found = ingredientInventory.find(
            (item) => item.name === ingredient.ingredient
          );
          return {
            ingredient: ingredient.ingredient,
            barcode: found ? found.barcode : "No barcode found",
          };
        });
  
        return (
          <span
            style={{ cursor: "pointer", color: colors.greenAccent[500] }}
            onClick={() => handleDrawerOpen("Barcodes", barcodes)}
          >
            Show Barcodes
          </span>
        );
      },
    },
  ];
  

  const handleDrawerOpen = (header, content) => {
    console.log("Opening drawer with header:", header);
    console.log("Original content passed:", content);
  
    if (header === "Barcodes") {
      console.log("Retrieving barcodes for ingredients...");
      console.log("Ingredient Inventory:", ingredientInventory);
  
      const formattedContent = Array.isArray(content) && content.length
        ? content.map(item => {
            console.log(`Processing ingredient: ${item.ingredient}`);
  
            // Look up barcode for the ingredient in the ingredientInventory
            const ingredientBarcode = ingredientInventory.find(
              inventoryItem => {
                console.log(`Looking for barcode for ingredient "${item.ingredient}"`);
                console.log(`Checking against inventory item:`, inventoryItem);
  
                // Check for matching names
                const normalizedIngredient = item.ingredient.trim().toLowerCase();
                const normalizedInventoryItemName = inventoryItem.ingredient.trim().toLowerCase();
  
                if (normalizedInventoryItemName === normalizedIngredient) {
                  console.log(`Found barcode for ${item.ingredient}: ${inventoryItem.barcode}`);
                  return true;
                } else {
                  console.log(`No match for ingredient "${item.ingredient}" in inventory item "${inventoryItem.name}"`);
                  return false;
                }
              }
            );
  
            if (ingredientBarcode) {
              console.log(`Found barcode for ingredient "${item.ingredient}": ${ingredientBarcode.barcode}`);
              return `${item.ingredient}: ${ingredientBarcode.barcode}`;
            } else {
              console.log(`No barcode found for ingredient "${item.ingredient}"`);
              return `${item.ingredient}: No barcode found`;
            }
          })
        : ["No data available"];
  
      console.log("Final formatted content for Barcodes Drawer:", formattedContent);
      setDrawerHeader(header);
      setDrawerContent(formattedContent);
  
      // Set drawer state to true to open it
      setDrawerOpen(true);
  
    } else if (header === "Ingredients") {
      console.log("Showing ingredients list...");
  
      // For Ingredients, display both the ingredient name and quantity
      const formattedContent = content && content.length
        ? content.map((ingredient, index) => {
            return `${ingredient.ingredient}: ${ingredient.quantity}`; // Assuming you have a `quantity` and an optional `unit` field
          })
        : ["No ingredients available"];
  
      console.log("Final formatted content for Ingredients Drawer:", formattedContent);
      setDrawerHeader(header);
      setDrawerContent(formattedContent);
  
      // Set drawer state to true to open it
      setDrawerOpen(true);
    }
  };
  
  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  return (
    <Box m="20px">
      <Header title="STOCK USAGE" subtitle="Keep Track of Your Stock Usage" />
      <Button
        onClick={clearStockUsage}
        sx={{ color: colors.greenAccent[500], border: `1px solid ${colors.greenAccent[500]}` }}
      >
        Clear Stock Usage
      </Button>

      <Box m="40px 0 0 0"
        height="75vh" sx={{
        overflowX: 'auto',
        "& .MuiDataGrid-root": { border: "none", minWidth: "650px"},
        "& .MuiDataGrid-cell": { borderBottom: "none" },
        "& .MuiDataGrid-columnHeaders": { backgroundColor: colors.blueAccent[700], borderBottom: "none" },
        "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
        "& .MuiDataGrid-footerContainer": { borderTop: "none", backgroundColor: colors.blueAccent[700] },
      }}>
        <DataGrid
          rows={stockUsage}
          columns={columns}
        />
      </Box>

      {/* Drawer for displaying Ingredients or Barcodes */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleDrawerClose}
        sx={{
          "& .MuiDrawer-paper": {
            borderRadius: "20px 0 0 20px",
            overflow: "hidden",
          },
        }}
      >
        <Box width="300px" p={0}>
          {/* Drawer Header */}
          <Box
            sx={{
              width: "100%",
              backgroundColor: colors.greenAccent[500],
              color: colors.grey[100],
              padding: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconButton onClick={handleDrawerClose} sx={{ color: "white", position: "absolute", left: 10 }}>
              <MenuOutlinedIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "white" }}>
              {drawerHeader}
            </Typography>
          </Box>

          {/* Drawer Content */}
          <Box p={2}>
            <ul>
              {drawerContent.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default StockUsage;
