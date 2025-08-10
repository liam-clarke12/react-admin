// src/scenes/recipes/Recipes.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  useTheme,
  IconButton,
  Button,
  Drawer,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { useData } from "../../contexts/DataContext";
import { useAuth } from "../../contexts/AuthContext";

/** Nory-like brand tokens (Ruby / Rose) */
const brand = {
  text: "#0f172a",
  subtext: "#334155",
  border: "#e5e7eb",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  primary: "#e11d48",
  primaryDark: "#be123c",
  focusRing: "rgba(225, 29, 72, 0.35)",
  shadow: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)",
};

const Recipes = () => {
  const { cognitoId } = useAuth();
  const theme = useTheme();
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
        const res = await fetch(
          `https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/recipes?cognito_id=${cognitoId}`
        );
        if (!res.ok) throw new Error("Failed to fetch Recipe data");
        const data = await res.json();

        // Group rows by recipe_id to combine ingredients/quantities/units
        const formatted = data.reduce((acc, row) => {
          let entry = acc.find((r) => r.id === row.recipe_id);
          if (entry) {
            entry.ingredients.push(row.ingredient);
            entry.quantities.push(row.quantity);
            entry.units.push(row.unit);
          } else {
            acc.push({
              id: row.recipe_id,
              recipe: row.recipe,
              upb: row.units_per_batch,
              ingredients: [row.ingredient],
              quantities: [row.quantity],
              units: [row.unit],
            });
          }
          return acc;
        }, []);
        setRows(formatted);
      } catch (err) {
        console.error("Error fetching recipes:", err);
      }
    };
    fetchRecipeData();
  }, [cognitoId, setRows]);

  const handleDeleteRecipe = async () => {
    if (!selectedRows.length || !cognitoId) return;
    try {
      await Promise.all(
        selectedRows.map(async (recipeId) => {
          const rec = rows.find((r) => r.id === recipeId);
          if (!rec) return;
          const resp = await fetch(
            "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/delete-recipe",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ recipeName: rec.recipe, cognito_id: cognitoId }),
            }
          );
          if (resp.ok) {
            setRows((prev) => prev.filter((r) => r.id !== recipeId));
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
    setDrawerHeader(header);
    setDrawerContent(Array.isArray(list) ? list : [list]);
    setDrawerOpen(true);
  };
  const handleDrawerClose = () => setDrawerOpen(false);

  const columns = useMemo(
    () => [
      { field: "recipe", headerName: "Recipe", flex: 1 },
      { field: "upb", headerName: "Units per Batch", flex: 1 },
      {
        field: "ingredients",
        headerName: "Ingredients",
        flex: 1,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Typography
            sx={{
              cursor: "pointer",
              color: brand.primary,
              fontWeight: 600,
              "&:hover": { color: brand.primaryDark },
            }}
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
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const { ingredients = [], quantities = [], units = [] } = params.row;
          const list = ingredients.map((ing, i) => {
            const q = quantities[i] ?? "N/A";
            const u = units[i] ? ` ${units[i]}` : "";
            return `${ing}: ${q}${u}`;
          });
          return (
            <Typography
              sx={{
                cursor: "pointer",
                color: brand.primary,
                fontWeight: 600,
                "&:hover": { color: brand.primaryDark },
              }}
              onClick={() => handleDrawerOpen("Quantities", list)}
            >
              Show Quantities
            </Typography>
          );
        },
      },
    ],
    []
  );

  return (
    <Box m="20px">
      {/* Local styles to keep theme overrides from interfering */}
      <style>{`
        .recipes-card {
          border: 1px solid ${brand.border};
          background: ${brand.surface};
          border-radius: 16px;
          box-shadow: ${brand.shadow};
          overflow: hidden;
        }
        .recipes-toolbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px; border-bottom: 1px solid ${brand.border};
          background: ${brand.surface};
        }
      `}</style>

      <Box className="recipes-card" mt={2}>
        {/* Toolbar with delete button */}
        <Box className="recipes-toolbar">
          <Typography sx={{ fontWeight: 800, color: brand.text }}>
            Recipes
          </Typography>

          <IconButton
            aria-label="Delete selected"
            onClick={() => setOpenDialog(true)}
            disabled={selectedRows.length === 0}
            sx={{
              color: "#fff",
              borderRadius: 999,
              width: 40,
              height: 40,
              background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`,
              boxShadow:
                "0 8px 16px rgba(29,78,216,0.25), 0 2px 4px rgba(15,23,42,0.06)",
              "&:hover": {
                background: `linear-gradient(180deg, ${brand.primaryDark}, ${brand.primaryDark})`,
              },
              opacity: selectedRows.length === 0 ? 0.5 : 1,
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>

        {/* DataGrid */}
        <Box
          sx={{
            height: "70vh",
            "& .MuiDataGrid-root": { border: "none", minWidth: "650px" },
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#fbfcfd",
              color: brand.subtext,
              borderBottom: `1px solid ${brand.border}`,
              fontWeight: 800,
            },
            "& .MuiDataGrid-columnSeparator": { display: "none" },
            "& .MuiDataGrid-cell": {
              borderBottom: `1px solid ${brand.border}`,
              color: brand.text,
            },
            "& .MuiDataGrid-row:hover": { backgroundColor: brand.surfaceMuted },
            "& .MuiDataGrid-footerContainer": {
              borderTop: `1px solid ${brand.border}`,
              background: brand.surface,
            },
          }}
        >
          <DataGrid
            rows={rows || []}
            columns={columns}
            checkboxSelection
            onRowSelectionModelChange={(model) => setSelectedRows(model)}
          />
        </Box>
      </Box>

      {/* Drawer — Minimal style for both Ingredients & Quantities */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleDrawerClose}
        PaperProps={{
          sx: {
            width: 360,
            borderRadius: "20px 0 0 20px",
            border: `1px solid ${brand.border}`,
            boxShadow: brand.shadow,
            overflow: "hidden",
          },
        }}
      >
        {/* Gradient header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 2,
            py: 1.25,
            color: "#fff",
            background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`,
          }}
        >
          <IconButton onClick={handleDrawerClose} sx={{ color: "#fff" }}>
            <MenuOutlinedIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#fff" }}>
            {drawerHeader}
          </Typography>
        </Box>

        {/* Body: minimal list with subtle zebra, ticks & quantity pill */}
        <Box sx={{ background: brand.surface, p: 2 }}>
          <List disablePadding>
            {drawerContent.map((raw, idx) => {
              // If Quantities, format "Name: value" into pill on the right
              const isQty = drawerHeader.toLowerCase().includes("quantit");
              let primaryText = raw;
              let qty = null;

              if (isQty && typeof raw === "string" && raw.includes(":")) {
                const [name, rest] = raw.split(":");
                primaryText = name.trim();
                qty = (rest || "").trim();
              }

              return (
                <Box
                  key={idx}
                  sx={{
                    borderRadius: 2,
                    border: `1px solid ${brand.border}`,
                    backgroundColor: idx % 2 ? brand.surfaceMuted : brand.surface,
                    mb: 1,
                    overflow: "hidden",
                  }}
                >
                  <ListItem
                    secondaryAction={
                      qty ? (
                        <Box
                          component="span"
                          sx={{
                            borderRadius: 999,
                            border: `1px solid ${brand.border}`,
                            background: "#f1f5f9",
                            px: 1.25,
                            py: 0.25,
                            fontSize: 12,
                            fontWeight: 700,
                            color: brand.text,
                          }}
                        >
                          {qty}
                        </Box>
                      ) : null
                    }
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CheckRoundedIcon sx={{ color: brand.primary }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={primaryText}
                      primaryTypographyProps={{ sx: { color: brand.text, fontWeight: 600 } }}
                    />
                  </ListItem>
                </Box>
              );
            })}
          </List>
        </Box>
      </Drawer>

      {/* Delete confirmation dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 14,
            border: `1px solid ${brand.border}`,
            boxShadow: brand.shadow,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: brand.text }}>
          Confirm deletion
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: brand.subtext }}>
            Delete {selectedRows.length} selected recipe
            {selectedRows.length === 1 ? "" : "s"}?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteRecipe}
            sx={{
              textTransform: "none",
              fontWeight: 800,
              borderRadius: 999,
              px: 2,
              color: "#fff",
              background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`,
              "&:hover": { background: brand.primaryDark },
            }}
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Recipes;
