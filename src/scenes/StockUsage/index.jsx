import React, { useState, useEffect } from "react";
import { Box, useTheme, Button, Drawer, Typography, IconButton } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../themes";
import Header from "../../components/Header";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";

const StockUsage = () => {
  const { cognitoId } = useAuth();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [stockUsage, setStockUsage] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerHeader, setDrawerHeader] = useState("");
  const [drawerContent, setDrawerContent] = useState([]);

  // Fetch stock usage when cognitoId is available
  useEffect(() => {
    if (!cognitoId) {
      console.warn("Cognito ID is not available, skipping fetch.");
      return;
    }

    const fetchStockUsage = async () => {
      try {
        const response = await axios.get(`https://612wy8dkj5.execute-api.eu-west-1.amazonaws.com/dev/api/stock-usage/${cognitoId}`);
        
        const groupedData = {};

        response.data.forEach((item) => {
          const key = `${item.recipe_name}-${item.production_log_date}-${item.batchCode}`;
          if (!groupedData[key]) {
            groupedData[key] = {
              id: key,
              date: item.production_log_date,
              recipeName: item.recipe_name,
              batchCode: item.batchCode,
              batchesProduced: item.batchesProduced, // Add batchesProduced
              ingredients: [],
              barcodes: [],
            };
          }

          item.ingredients.forEach((ingredient) => {
            const totalQuantity = ingredient.quantity * item.batchesProduced; // Calculate total quantity
            groupedData[key].ingredients.push(`${ingredient.ingredient_name}: ${totalQuantity}`);
            groupedData[key].barcodes.push(`${ingredient.ingredient_name}: ${ingredient.ingredient_barcodes}`);
          });
        });

        const formattedData = Object.values(groupedData).map((entry) => ({
          ...entry,
          ingredients: entry.ingredients.join("; "), // Use "; " as the delimiter
          barcodes: entry.barcodes.join("; "), // Use "; " as the delimiter
        }));

        setStockUsage(formattedData);
      } catch (error) {
        console.error("Error fetching stock usage:", error);
      }
    };

    fetchStockUsage();
  }, [cognitoId]);

  // Open the drawer with proper content
  const handleDrawerOpen = (header, content) => {
    setDrawerHeader(header);
    console.log(`Drawer Header: ${header}, Content:`, content);

    if (header === "Barcodes") {
      // Ensure content is an array before processing
      if (content && Array.isArray(content)) {
        // Display ingredient-barcode associations in the format "Test1: T1, T2"
        setDrawerContent(
          content.length ? (
            <ul>
              {content.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>No data available</p>
          )
        );
      } else {
        // Handle case where content is invalid or not an array
        console.error("Invalid content passed to Barcodes drawer:", content);
        setDrawerContent(<p>Error: Invalid data</p>);
      }
    } else if (header === "Ingredients") {
      // Handling Ingredients
      if (Array.isArray(content)) {
        // Display ingredient names and calculated quantities
        setDrawerContent(
          content.length ? (
            <ul>
              {content.map((item, index) => {
                const [ingredientName, quantity] = item.split(": ");
                return (
                  <li key={index}>
                    {ingredientName}: {quantity}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>No data available</p>
          )
        );
      } else {
        console.error("Invalid content passed to Ingredients drawer:", content);
        setDrawerContent(<p>Error: Invalid data</p>);
      }
    }

    setDrawerOpen(true);
  };

  // Close the drawer
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
          style={{ cursor: "pointer", color: colors.blueAccent[500] }}
          onClick={() => {
            console.log("Ingredients Content:", params.row.ingredients);
            handleDrawerOpen("Ingredients", params.row.ingredients.split("; ")); // Use "; " for splitting
          }}
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
      renderCell: (params) => (
        <span
          style={{ cursor: "pointer", color: colors.blueAccent[500] }}
          onClick={() => {
            console.log("Barcodes Content:", params.row.barcodes);
            handleDrawerOpen("Barcodes", params.row.barcodes.split("; ")); // Use "; " for splitting
          }}
        >
          Show Barcodes
        </span>
      ),
    },
  ];

  return (
    <Box m="20px">
      <Header title="STOCK USAGE" subtitle="Keep Track of Your Stock Usage" />
      <Button
        onClick={() => setStockUsage([])}
        sx={{ color: colors.blueAccent[500], border: `1px solid ${colors.blueAccent[500]}` }}
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
        <DataGrid rows={stockUsage} columns={columns} getRowId={(row) => row.id} />
      </Box>
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleDrawerClose}
        sx={{ "& .MuiDrawer-paper": { borderRadius: "20px 0 0 20px", overflow: "hidden" } }}
      >
        <Box width="300px" p={0}>
          <Box
            sx={{
              width: "100%",
              backgroundColor: colors.blueAccent[500],
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
          <Box p={2}>{drawerContent}</Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default StockUsage;