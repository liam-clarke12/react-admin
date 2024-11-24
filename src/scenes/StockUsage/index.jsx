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
  const { stockUsage, clearStockUsage } = useData();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerHeader, setDrawerHeader] = useState("");
  const [drawerContent, setDrawerContent] = useState([]);

  const handleDrawerOpen = (header, content) => {
    let formattedContent;
  
    // If header is "Barcodes", we need to show both the previous and current barcodes (if different)
    if (header === "Barcodes") {
      formattedContent = content.length
        ? content.map((item, index) => {
            const prevBarcode = item.prevBarcode || "No previous barcode";
            const currentBarcode = item.currentBarcode || "No current barcode";
  
            // If the previous and current barcodes are the same, only display ingredient: currentBarcode
            if (prevBarcode === currentBarcode) {
              return (
                <div key={index}>
                  {item.ingredient}: {currentBarcode}
                </div>
              );
            }
  
            // Otherwise, show both the previous and current barcodes
            return (
              <div key={index}>
                {item.ingredient}: {prevBarcode}, {currentBarcode}
              </div>
            );
          })
        : ["No data available"];
    } 
    // If header is "Ingredients", show the ingredient details as usual
    else if (header === "Ingredients") {
      formattedContent = content.length
        ? content.map((ingredient, index) => (
            <div key={index}>
              {ingredient.ingredient}: {ingredient.quantity}
            </div>
          ))
        : ["No ingredients available"];
    }
  
    setDrawerHeader(header);
    setDrawerContent(formattedContent);
    setDrawerOpen(true);
  };
  
  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

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
        // Initialize empty objects for barcode tracking
        let previousBarcodes = {};
        let barcodesAfterRemoval = {};
    
        // Assuming you have the logic to extract the previous and current barcodes
        params.row.ingredients.forEach((ingredient) => {
          const normalizedIngredient = ingredient.ingredient.toLowerCase().trim();
          previousBarcodes[normalizedIngredient] = ingredient.prevBarcode || "No previous barcode";
          barcodesAfterRemoval[normalizedIngredient] = ingredient.currentBarcode || "No current barcode";
        });
    
        // Create the barcode display for each ingredient
        const barcodes = params.row.ingredients.map((ingredient) => {
          const normalizedIngredient = ingredient.ingredient.toLowerCase().trim();
          return {
            ingredient: ingredient.ingredient || "Unknown ingredient",
            prevBarcode: previousBarcodes[normalizedIngredient] || "No previous barcode",
            currentBarcode: barcodesAfterRemoval[normalizedIngredient] || "No current barcode"
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

  return (
    <Box m="20px">
      <Header title="STOCK USAGE" subtitle="Keep Track of Your Stock Usage" />
      <Button
        onClick={clearStockUsage}
        sx={{ color: colors.greenAccent[500], border: `1px solid ${colors.greenAccent[500]}` }}
      >
        Clear Stock Usage
      </Button>

      <Box
        m="40px 0 0 0"
        height="75vh"
        sx={{
          overflowX: "auto",
          "& .MuiDataGrid-root": { border: "none", minWidth: "650px" },
          "& .MuiDataGrid-cell": { borderBottom: "none" },
          "& .MuiDataGrid-columnHeaders": { backgroundColor: colors.blueAccent[700], borderBottom: "none" },
          "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
          "& .MuiDataGrid-footerContainer": { borderTop: "none", backgroundColor: colors.blueAccent[700] },
        }}
      >
        <DataGrid
          rows={stockUsage}
          columns={columns}
          getRowId={(row) => `${row.recipeName}-${row.date}-${row.batchCode}`} // Create unique ID for each row
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
