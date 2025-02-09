import React, { useState, useEffect } from "react";
import { Box, useTheme, Button, Drawer, Typography, IconButton } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../themes";
import Header from "../../components/Header";
import { useData } from "../../contexts/DataContext";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import { useAuth } from "../../contexts/AuthContext";

const Recipes = () => {
  const { cognitoId } = useAuth();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { rows, setRows } = useData();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerHeader, setDrawerHeader] = useState("");
  const [drawerContent, setDrawerContent] = useState([]);

  useEffect(() => {
    const fetchRecipeData = async () => {
      try {
        if (!cognitoId) return;
        const url = `http://localhost:5000/api/recipes?cognito_id=${cognitoId}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch Recipe data");
        const data = await response.json();
        
        const formattedData = data.reduce((acc, row) => {
          let existingRecipe = acc.find(r => r.id === row.recipe_id);
          if (existingRecipe) {
            existingRecipe.ingredients.push(row.ingredient);
            existingRecipe.quantities.push(row.quantity);
          } else {
            acc.push({
              id: row.recipe_id,
              recipe: row.recipe,
              upb: row.units_per_batch,
              ingredients: [row.ingredient],
              quantities: [row.quantity]
            });
          }
          return acc;
        }, []);
        
        setRows(formattedData);
      } catch (error) {
        console.error("Error fetching Recipe data:", error);
      }
    };
    
    if (cognitoId) {
      fetchRecipeData();
    }
  }, [cognitoId, setRows]);

  const columns = [
    { field: "recipe", headerName: "Recipe", flex: 1 },
    { field: "upb", headerName: "Units per Batch", flex: 1 },
    {
      field: "ingredients",
      headerName: "Ingredients",
      flex: 1,
      renderCell: (params) => (
        <span
          style={{ cursor: "pointer", color: colors.blueAccent[500] }}
          onClick={() => handleDrawerOpen("Ingredients", params.row.ingredients || [])}
        >
          Show Ingredients
        </span>
      ),
    },
    {
      field: "quantities",
      headerName: "Quantities",
      flex: 1,
      renderCell: (params) => (
        <span
          style={{ cursor: "pointer", color: colors.blueAccent[500] }}
          onClick={() =>
            handleDrawerOpen(
              "Quantities",
              (params.row.ingredients || []).map((ingredient, index) => `${ingredient}: ${(params.row.quantities || [])[index] || "N/A"}`)
            )
          }
        >
          Show Quantities
        </span>
      ),
    },
  ];

  const handleDrawerOpen = (header, content) => {
    setDrawerHeader(header);
    setDrawerContent(Array.isArray(content) ? content : [content]);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  return (
    <Box m="20px">
      <Header title="RECIPES" subtitle="Keep Track of your Recipes" />
      <Button
        onClick={() => {
          localStorage.removeItem("rows");
          setRows([]);
        }}
        color="error"
        variant="contained"
        sx={{ mb: 2 }}
      >
        Clear Data
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
        <DataGrid checkboxSelection rows={rows || []} columns={columns} />
      </Box>

      <Drawer anchor="right" open={drawerOpen} onClose={handleDrawerClose}>
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
          <Box p={2}>
            <ul>
              {drawerContent.map((content, index) => (
                <li key={index}>{content}</li>
              ))}
            </ul>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default Recipes;
