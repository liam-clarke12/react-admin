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
    if (!cognitoId) return;
    const fetchRecipeData = async () => {
      try {
        console.log(`Fetching recipes for user ${cognitoId}`);
        const res = await fetch(
          `https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/recipes?cognito_id=${cognitoId}`
        );
        console.log("Fetch status:", res.status);
        if (!res.ok) throw new Error("Failed to fetch Recipe data");
        const data = await res.json();
        console.log("Raw recipe data:", data);

        const formatted = data.reduce((acc, row) => {
          console.log("Processing row:", row);
          let entry = acc.find(r => r.id === row.recipe_id);
          if (entry) {
            entry.ingredients.push(row.ingredient);
            entry.quantities.push(row.quantity);
            entry.units.push(row.unit);
            console.log(`Appended to recipe ${row.recipe_id}:`, row.unit);
          } else {
            acc.push({
              id:          row.recipe_id,
              recipe:      row.recipe,
              upb:         row.units_per_batch,
              ingredients: [row.ingredient],
              quantities:  [row.quantity],
              units:       [row.unit],
            });
            console.log("Created recipe entry:", acc[acc.length-1]);
          }
          return acc;
        }, []);

        console.log("Formatted data:", formatted);
        setRows(formatted);
      } catch (err) {
        console.error("Error fetching recipes:", err);
      }
    };
    fetchRecipeData();
  }, [cognitoId, setRows]);

  const handleRowSelection = selection => {
    console.log("Selected recipes:", selection);
    setSelectedRows(selection);
  };
  const handleOpenDialog = () => {
    console.log("Opening delete dialog");
    setOpenDialog(true);
  };
  const handleCloseDialog = () => {
    console.log("Closing delete dialog");
    setOpenDialog(false);
  };

  const handleDeleteRecipe = async () => {
    console.log("Deleting recipes:", selectedRows);
    if (!selectedRows.length || !cognitoId) return;
    try {
      await Promise.all(
        selectedRows.map(async recipeId => {
          const rec = rows.find(r => r.id === recipeId);
          console.log("Deleting recipe entry:", rec);
          if (!rec) return;
          const resp = await fetch(
            "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/delete-recipe",
            {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body:    JSON.stringify({ recipeName: rec.recipe, cognito_id: cognitoId }),
            }
          );
          console.log(`Delete response for ${recipeId}:`, resp.status);
          if (resp.ok) {
            setRows(prev => prev.filter(r => r.id !== recipeId));
            console.log(`Removed recipe ${recipeId}`);
          }
        })
      );
      setSelectedRows([]);
      setOpenDialog(false);
    } catch (err) {
      console.error("Error deleting recipes:", err);
      alert("Could not delete recipes");
    }
  };

  const handleDrawerOpen = (header, list) => {
    console.log(`Opening drawer ${header}:`, list);
    setDrawerHeader(header);
    setDrawerContent(Array.isArray(list) ? list : [list]);
    setDrawerOpen(true);
  };
  const handleDrawerClose = () => {
    console.log("Closing drawer");
    setDrawerOpen(false);
  };

  const columns = [
    { field: "recipe", headerName: "Recipe", flex: 1 },
    { field: "upb", headerName: "Units per Batch", flex: 1 },
    {
      field: "ingredients",
      headerName: "Ingredients",
      flex: 1,
      renderCell: params => (
        <Typography
          sx={{ cursor: "pointer", color: colors.blueAccent[500] }}
          onClick={() => handleDrawerOpen("Ingredients", params.row.ingredients)}
        >
          Show Ingredients
        </Typography>
      ),
    },
    {
      field: "quantities",
      headerName: "Quantities",
      flex: 1,
      renderCell: params => {
        const { ingredients = [], quantities = [], units = [] } = params.row;
        const list = ingredients.map((ing, i) => {
          const q = quantities[i] ?? "N/A";
          const u = units[i] ? ` ${units[i]}` : "";
          return `${ing}: ${q}${u}`;
        });
        return (
          <Typography
            sx={{ cursor: "pointer", color: colors.blueAccent[500] }}
            onClick={() => handleDrawerOpen("Quantities", list)}
          >
            Show Quantities
          </Typography>
        );
      },
    },
  ];

  return (
    <Box m="20px">
      <Header title="RECIPES" subtitle="Keep Track of your Recipes" />

      <Box sx={{ position: "relative", mb: 2, height: "40px" }}>
        <IconButton
          onClick={handleOpenDialog}
          sx={{
            position:  "absolute",
            top:       "50%",
            right:     "10px",
            transform: "translateY(-50%)",
            color:     selectedRows.length ? "red" : colors.blueAccent[500],
            opacity:   selectedRows.length ? 1 : 0.5,
          }}
          disabled={!selectedRows.length}
        >
          <DeleteIcon />
        </IconButton>
      </Box>

      <Box
        m="40px 0 0 0"
        height="75vh"
        sx={{
          overflowX:                         "auto",
          "& .MuiDataGrid-root":            { border: "none", minWidth: "650px" },
          "& .MuiDataGrid-cell":            { borderBottom: "none" },
          "& .MuiDataGrid-columnHeaders":   {
            backgroundColor: colors.blueAccent[700],
            borderBottom:     "none",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop:       "none",
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
        <Box width="300px">
          <Box
            sx={{
              width:           "100%", 
              backgroundColor: colors.blueAccent[500],
              color:           colors.grey[100],
              p:               1,
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              position:        "relative",
            }}
          >
            <IconButton
              onClick={handleDrawerClose}
              sx={{ color: "white", position: "absolute", left: 8 }}
            >
              <MenuOutlinedIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              {drawerHeader}
            </Typography>
          </Box>
          <Box p={2}>
            <ul>
              {drawerContent.map((item, idx) => (
                <li key={idx}>{item}</li>
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
