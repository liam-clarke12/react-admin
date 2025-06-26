import React, { useState, useEffect } from "react";
import {
  Box,
  useTheme,
  Button,
  Drawer,
  Typography,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../themes";
import Header from "../../components/Header";
import { useData } from "../../contexts/DataContext";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import { useAuth } from "../../contexts/AuthContext";
import DeleteIcon from "@mui/icons-material/Delete";

const Recipes = () => {
  const { cognitoId } = useAuth();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { rows, setRows } = useData();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerHeader, setDrawerHeader] = useState("");
  const [drawerContent, setDrawerContent] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

  useEffect(() => {
    const fetchRecipeData = async () => {
      try {
        if (!cognitoId) return;
        const response = await fetch(`https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/recipes?cognito_id=${cognitoId}`);
        if (!response.ok) throw new Error("Failed to fetch Recipe data");
        const data = await response.json();

        const formattedData = data.reduce((acc, row) => {
          let existingRecipe = acc.find((r) => r.id === row.recipe_id);
          if (existingRecipe) {
            existingRecipe.ingredients.push(row.ingredient);
            existingRecipe.quantities.push(row.quantity);
          } else {
            acc.push({
              id: row.recipe_id,
              recipe: row.recipe,
              upb: row.units_per_batch,
              ingredients: [row.ingredient],
              quantities: [row.quantity],
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

  const handleDeleteRecipe = async () => {
    if (!selectedRows.length || !cognitoId) return;

    try {
      await Promise.all(
        selectedRows.map(async (rowId) => {
          const recipeToDelete = rows.find((row) => row.id === rowId);
          if (recipeToDelete) {
            const response = await fetch(
              "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/delete-recipe",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  recipeName: recipeToDelete.recipe,
                  cognito_id: cognitoId,
                }),
              }
            );

            if (response.ok) {
              setRows((prevRows) => prevRows.filter((row) => row.id !== rowId));
            }
          }
        })
      );
      setSelectedRows([]);
      setOpenDialog(false);
    } catch (error) {
      console.error("Error deleting selected recipes:", error);
      alert("Error deleting selected recipes");
    }
  };

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
          onClick={() =>
            handleDrawerOpen("Ingredients", params.row.ingredients || [])
          }
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
              (params.row.ingredients || []).map(
                (ingredient, index) =>
                  `${ingredient}: ${(params.row.quantities || [])[index] || "N/A"}`
              )
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

  const handleRowSelection = (selection) => {
    setSelectedRows(selection); // Correctly track selected rows
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);

  return (
    <Box m="20px">
      <Header title="RECIPES" subtitle="Keep Track of your Recipes" />

      <Box sx={{ position: "relative", mb: 2, height: "40px" }}>
        <IconButton
          onClick={handleOpenDialog}
          sx={{
            position: "absolute",
            top: "50%",
            right: "10px",
            transform: "translateY(-50%)",
            color: selectedRows.length ? "red" : colors.blueAccent[500],
            opacity: selectedRows.length ? 1 : 0.5,
          }}
          disabled={selectedRows.length === 0}
        >
          <DeleteIcon />
        </IconButton>
      </Box>

      <Box
        m="40px 0 0 0"
        height="75vh"
        sx={{
          overflowX: "auto",
          "& .MuiDataGrid-root": { border: "none", minWidth: "650px" },
          "& .MuiDataGrid-cell": { borderBottom: "none" },
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
        }}
      >
        <DataGrid
          rows={rows || []}
          columns={columns}
          checkboxSelection
          onRowSelectionModelChange={handleRowSelection}
        />
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
            <IconButton
              onClick={handleDrawerClose}
              sx={{ color: "white", position: "absolute", left: 10 }}
            >
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

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          Are you sure you want to delete the selected recipes?
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleDeleteRecipe} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Recipes;
