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
  TextField,
  Stack,
  Card,
  CardContent,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import CloseIcon from "@mui/icons-material/Close";
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
  const [drawerContent, setDrawerContent] = useState([]); // array of strings for list
  const [selectedRowMeta, setSelectedRowMeta] = useState(null); // stores arrays for reset/export/search
  const [searchTerm, setSearchTerm] = useState("");

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
          const rec = (rows || []).find((r) => r.id === recipeId);
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

  // Drawer open helper: content can be an array or string list
  const handleDrawerOpen = (header, list, meta = {}) => {
    setDrawerHeader(header);

    // canonicalise list -> array of strings
    let items = [];
    if (Array.isArray(list)) {
      items = list.map((l) => (typeof l === "string" ? l : String(l)));
    } else if (typeof list === "string" && list.length) {
      items = list.split("; ").filter(Boolean);
    }

    setDrawerContent(items);
    setSelectedRowMeta(meta || null);
    setSearchTerm("");
    setDrawerOpen(true);
  };
  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setDrawerContent([]);
    setSelectedRowMeta(null);
    setSearchTerm("");
  };

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
            onClick={() =>
              handleDrawerOpen(
                "Ingredients",
                params.row.ingredients,
                {
                  recipe: params.row.recipe,
                  ingredientsArray: params.row.ingredients,
                  quantitiesArray: params.row.quantities,
                  unitsArray: params.row.units,
                }
              )
            }
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
              onClick={() =>
                handleDrawerOpen(
                  "Quantities",
                  list,
                  {
                    recipe: params.row.recipe,
                    ingredientsArray: params.row.ingredients,
                    quantitiesArray: params.row.quantities,
                    unitsArray: params.row.units,
                  }
                )
              }
            >
              Show Quantities
            </Typography>
          );
        },
      },
    ],
    []
  );

  // Drawer derived / helpers
  const filteredDrawerContent = drawerContent.filter((it) =>
    String(it).toLowerCase().includes(searchTerm.trim().toLowerCase())
  );
  const totalItemsCount = filteredDrawerContent.length;

  const resetDrawerContent = () => {
    if (!selectedRowMeta) {
      setSearchTerm("");
      return;
    }
    if (drawerHeader.toLowerCase().includes("quantit")) {
      // rebuild quantities list from meta arrays
      const { ingredientsArray = [], quantitiesArray = [], unitsArray = [] } = selectedRowMeta;
      const rebuilt = ingredientsArray.map((ing, i) => {
        const q = quantitiesArray?.[i] ?? "N/A";
        const u = unitsArray?.[i] ? ` ${unitsArray[i]}` : "";
        return `${ing}: ${q}${u}`;
      });
      setDrawerContent(rebuilt);
      setSearchTerm("");
      return;
    }
    // default: rebuild ingredients list
    if (selectedRowMeta?.ingredientsArray) {
      setDrawerContent(selectedRowMeta.ingredientsArray.slice());
      setSearchTerm("");
      return;
    }
    setSearchTerm("");
  };

  const exportDrawerCsv = () => {
    try {
      const rowsOut = [["Item", drawerHeader.includes("Quantit") ? "Quantity" : ""]];
      drawerContent.forEach((raw) => {
        if (typeof raw === "string" && raw.includes(":")) {
          const [left, right] = raw.split(":");
          rowsOut.push([left.trim(), (right || "").trim()]);
        } else {
          rowsOut.push([String(raw), ""]);
        }
      });
      const csv = rowsOut.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filenameBase = (selectedRowMeta?.recipe || "recipe").replace(/\s+/g, "-").toLowerCase();
      a.download = `${filenameBase}-${drawerHeader.toLowerCase()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed", e);
      alert("Export failed");
    }
  };

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
            getRowId={(r) => r.id}
          />
        </Box>
      </Box>

      {/* Redesigned Drawer — Ingredients & Quantities */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleDrawerClose}
        PaperProps={{
          sx: {
            width: 420,
            borderRadius: "20px 0 0 20px",
            border: `1px solid ${brand.border}`,
            boxShadow: "0 24px 48px rgba(15,23,42,0.12)",
            overflow: "hidden",
          },
        }}
      >
        {/* Header with gradient */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            px: 2,
            py: 1.25,
            color: "#fff",
            background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                background: "rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MenuOutlinedIcon sx={{ color: "#fff" }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#fff" }}>
                {drawerHeader}
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.9)" }}>
                {selectedRowMeta?.recipe ? `${selectedRowMeta.recipe}` : ""}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <IconButton
              size="small"
              onClick={exportDrawerCsv}
              sx={{
                color: "#fff",
                borderRadius: 1,
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <FileDownloadOutlinedIcon fontSize="small" />
            </IconButton>

            <IconButton onClick={handleDrawerClose} sx={{ color: "#fff" }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ background: brand.surface, p: 2, height: "calc(100% - 88px)" }}>
          {/* Meta card */}
          <Card
            variant="outlined"
            sx={{
              borderColor: brand.border,
              background: brand.surface,
              borderRadius: 2,
              mb: 2,
            }}
          >
            <CardContent sx={{ p: 1.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography sx={{ color: brand.subtext, fontSize: 12, fontWeight: 700 }}>
                    Recipe
                  </Typography>
                  <Typography sx={{ color: brand.text, fontWeight: 800 }}>
                    {selectedRowMeta?.recipe || "—"}
                  </Typography>
                  {selectedRowMeta?.upb && (
                    <Typography variant="caption" sx={{ color: brand.subtext }}>
                      Units per batch: {selectedRowMeta.upb}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography sx={{ color: "text.secondary", fontSize: 12 }}>Items</Typography>
                  <Typography sx={{ color: brand.primary, fontWeight: 900, fontSize: 22 }}>
                    {totalItemsCount}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Search + Reset */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search item or filter"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  background: "#fff",
                  borderColor: brand.border,
                },
              }}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={resetDrawerContent}
              sx={{ textTransform: "none", borderRadius: 1.5 }}
            >
              Reset
            </Button>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          {/* Items list */}
          <List disablePadding>
            {filteredDrawerContent.length === 0 ? (
              <Typography sx={{ color: brand.subtext }}>No items available.</Typography>
            ) : (
              filteredDrawerContent.map((raw, idx) => {
                let primaryText = raw;
                let qty = null;

                if (drawerHeader.toLowerCase().includes("quantit") && typeof raw === "string" && raw.includes(":")) {
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
              })
            )}
          </List>
        </Box>

        {/* Footer actions */}
        <Box
          sx={{
            p: 2,
            borderTop: `1px solid ${brand.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: brand.surface,
          }}
        >
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              onClick={handleDrawerClose}
              sx={{
                textTransform: "none",
                borderRadius: 999,
                px: 2,
                border: `1px solid ${brand.border}`,
              }}
            >
              Close
            </Button>

            <Button
              onClick={() => {
                // simple context action — close for now
                handleDrawerClose();
              }}
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
              Done
            </Button>
          </Box>

          <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
            {totalItemsCount} items
          </Typography>
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
