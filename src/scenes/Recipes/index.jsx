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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { useData } from "../../contexts/DataContext";
import { useAuth } from "../../contexts/AuthContext";

const brand = {
  text: "#0f172a",
  subtext: "#334155",
  border: "#e5e7eb",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  danger: "#dc2626",
  primary: "#7C3AED",
  primaryDark: "#5B21B6",
  focusRing: "rgba(124,58,237,0.18)",
  shadow: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)",
  inputBg: "#ffffff"
};

const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

const unitOptions = [
  { value: "grams", label: "Grams (g)" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "kg", label: "Kilograms (Kg)" },
  { value: "l", label: "Litres (L)" },
  { value: "units", label: "Units" },
];

const Recipes = () => {
  const { cognitoId } = useAuth();
  const theme = useTheme();
  const { rows, setRows } = useData();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerHeader, setDrawerHeader] = useState("");
  const [drawerContent, setDrawerContent] = useState([]); // array of strings for list
  const [selectedRowMeta, setSelectedRowMeta] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

  // === Editor state ===
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null); // { id, recipe, upb, ingredients: [{ name, quantity, unit, recipeIngredientId? }] }
  const [editingLoading, setEditingLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!cognitoId) return;
    const fetchRecipeData = async () => {
      try {
        const res = await fetch(`${API_BASE}/recipes?cognito_id=${encodeURIComponent(cognitoId)}`);
        if (!res.ok) throw new Error("Failed to fetch Recipe data");
        const data = await res.json();

        // Group by recipe_id
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

  // Drawer helpers
  const handleDrawerOpen = (header, list, meta = {}) => {
    setDrawerHeader(header);
    let items = [];
    if (Array.isArray(list)) {
      // Keep raw array but ensure strings
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

  // Columns with Actions: include Edit button
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
              handleDrawerOpen("Ingredients", params.row.ingredients, {
                recipe: params.row.recipe,
                ingredientsArray: params.row.ingredients,
                quantitiesArray: params.row.quantities,
                unitsArray: params.row.units,
                upb: params.row.upb,
              })
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
                handleDrawerOpen("Quantities", list, {
                  recipe: params.row.recipe,
                  ingredientsArray: params.row.ingredients,
                  quantitiesArray: params.row.quantities,
                  unitsArray: params.row.units,
                  upb: params.row.upb,
                })
              }
            >
              Show Quantities
            </Typography>
          );
        },
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 96,
        sortable: false,
        filterable: false,
        align: "center",
        renderCell: (params) => {
          return (
            <IconButton
              size="small"
              aria-label="Edit recipe"
              onClick={async () => {
                // fetch full recipe details and open editor
                try {
                  setEditingLoading(true);
                  const id = params.row.id;
                  const url = `${API_BASE}/recipes/${encodeURIComponent(id)}?cognito_id=${encodeURIComponent(cognitoId)}`;
                  const r = await fetch(url);
                  if (!r.ok) throw new Error(`Failed to fetch recipe ${id}`);
                  const payload = await r.json();
                  // payload shape: { recipe_id, recipe_name, units_per_batch, ingredients: [{ ingredient_name, quantity, unit, recipe_ingredient_id}] }
                  setEditingRecipe({
                    id: payload.recipe_id,
                    recipe: payload.recipe_name,
                    upb: payload.units_per_batch,
                    items:
                      Array.isArray(payload.ingredients) && payload.ingredients.length
                        ? payload.ingredients.map((ing) => ({
                            name: ing.ingredient_name,
                            quantity: ing.quantity,
                            unit: ing.unit,
                            recipeIngredientId: ing.id,
                          }))
                        : [],
                  });
                  setEditDialogOpen(true);
                } catch (err) {
                  console.error("Failed to open editor:", err);
                  alert("Could not open recipe editor. See console.");
                } finally {
                  setEditingLoading(false);
                }
              }}
            >
              <EditOutlinedIcon sx={{ color: brand.primary }} />
            </IconButton>
          );
        },
      },
    ],
    [cognitoId]
  );

  // Build displayItems (now robustly extracts unit for both structured and string inputs)
  const buildDisplayItems = () => {
    const isQuantities = drawerHeader.toLowerCase().includes("quantit");

    // If it's the Quantities drawer and we have structured arrays in selectedRowMeta, use them (preferred)
    if (isQuantities && selectedRowMeta?.ingredientsArray) {
      const ingArr = selectedRowMeta.ingredientsArray || [];
      const qtyArr = selectedRowMeta.quantitiesArray || [];
      const unitArr = selectedRowMeta.unitsArray || [];
      return ingArr.map((ing, i) => {
        const rawQty = qtyArr?.[i] ?? "";
        const unitRaw = unitArr?.[i] ?? "";
        const qty = rawQty !== null && rawQty !== undefined ? String(rawQty) : "";
        const unit = unitRaw !== null && unitRaw !== undefined ? String(unitRaw).trim() : "";
        return {
          raw: `${ing}: ${qty}${unit ? " " + unit : ""}`,
          name: ing,
          qty,
          unit,
        };
      });
    }

    // Fallback: parse the stored drawerContent strings into { name, qty, unit }
    return (drawerContent || []).map((raw) => {
      const str = String(raw);
      const parts = str.split(":");
      const left = parts[0] ? parts[0].trim() : str;
      const right = parts.slice(1).join(":").trim(); // preserve ":" inside values if any
      if (!right) {
        return { raw: str, name: left, qty: "", unit: "" };
      }
      // Attempt to split right into quantity and unit (first token numeric-ish = qty)
      const tokens = right.split(/\s+/).filter(Boolean);
      // If first token looks like a number (or fraction), treat as qty
      let qty = right;
      let unit = "";
      if (tokens.length > 0) {
        const first = tokens[0];
        // allow numbers, decimals, fractions (e.g. "1/2"), or numeric-like
        if (/^[\d,.\/]+$/.test(first)) {
          qty = first;
          unit = tokens.slice(1).join(" ");
        } else {
          // otherwise assume whole right is qty (e.g., "200g" or "to taste")
          // try to split trailing letters from numbers
          const m = right.match(/^([\d.,\/]+)([a-zA-Z%µμ]*)\s*(.*)$/);
          if (m) {
            qty = m[1];
            unit = (m[2] || "").trim() + (m[3] ? " " + m[3].trim() : "");
          } else {
            qty = right;
            unit = "";
          }
        }
      }
      return {
        raw: str,
        name: left,
        qty: qty,
        unit: unit,
      };
    });
  };

  const displayItems = buildDisplayItems();
  const filteredDisplayItems = displayItems.filter((it) =>
    (it.raw || it.name).toLowerCase().includes(searchTerm.trim().toLowerCase())
  );
  const totalItemsCount = filteredDisplayItems.length;

  const resetDrawerContent = () => {
    if (!selectedRowMeta) {
      setSearchTerm("");
      return;
    }
    if (drawerHeader.toLowerCase().includes("quantit")) {
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
    if (selectedRowMeta?.ingredientsArray) {
      setDrawerContent(selectedRowMeta.ingredientsArray.slice());
      setSearchTerm("");
      return;
    }
    setSearchTerm("");
  };

  const exportDrawerCsv = () => {
    try {
      const rowsOut = [["Item", drawerHeader.includes("Quantit") ? "Quantity" : "Value"]];
      displayItems.forEach((it) => {
        rowsOut.push([it.name, (it.qty || "") + (it.unit ? ` ${it.unit}` : "")]);
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

  // Save edited recipe -> PUT /api/recipes/:id
  const handleSaveRecipe = async () => {
    if (!editingRecipe || !cognitoId) return;
    setSaving(true);
    try {
      // Prepare arrays
      const ingredients = (editingRecipe.items || []).map((it) => it.name);
      const quantities = (editingRecipe.items || []).map((it) => it.quantity);
      const units = (editingRecipe.items || []).map((it) => it.unit);

      const payload = {
        recipe: editingRecipe.recipe,
        upb: editingRecipe.upb,
        ingredients,
        quantities,
        units,
        cognito_id: cognitoId,
      };

      const resp = await fetch(`${API_BASE}/recipes/${encodeURIComponent(editingRecipe.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        throw new Error(txt || `Update failed (${resp.status})`);
      }

      // refresh the recipe list
      const refetch = await fetch(`${API_BASE}/recipes?cognito_id=${encodeURIComponent(cognitoId)}`);
      if (!refetch.ok) throw new Error("Failed to refresh recipes");
      const newData = await refetch.json();
      const formatted = newData.reduce((acc, row) => {
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

      setEditDialogOpen(false);
      setEditingRecipe(null);
    } catch (err) {
      console.error("Save recipe failed:", err);
      alert("Save failed. See console for details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box m="20px">
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

        /* Alternating row colors for recipes DataGrid */
        .recipes-even-row { background-color: ${brand.surface} !important; }
        .recipes-odd-row  { background-color: ${brand.surfaceMuted} !important; }
        /* preserve hover visibility (hover will override briefly) */
        .MuiDataGrid-row:hover { background-color: ${brand.surfaceMuted} !important; }
      `}</style>

      <Box className="recipes-card" mt={2}>
        <Box className="recipes-toolbar">
          <Typography sx={{ fontWeight: 800, color: brand.text }}>Recipes</Typography>

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
              boxShadow: "0 8px 16px rgba(29,78,216,0.25), 0 2px 4px rgba(15,23,42,0.06)",
              "&:hover": { background: `linear-gradient(180deg, ${brand.primaryDark}, ${brand.primaryDark})` },
              opacity: selectedRows.length === 0 ? 0.5 : 1,
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>

        <Box sx={{ height: "70vh", "& .MuiDataGrid-root": { border: "none", minWidth: "650px" } }}>
          <DataGrid
            rows={rows || []}
            columns={columns}
            checkboxSelection
            onRowSelectionModelChange={(model) => setSelectedRows(model)}
            getRowId={(r) => r.id}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            getRowClassName={(params) =>
              (params.indexRelativeToCurrentPage % 2 === 0) ? "recipes-even-row" : "recipes-odd-row"
            }
          />
        </Box>
      </Box>

      {/* Drawer (ingredients/quantities) */}
      <Drawer anchor="right" open={drawerOpen} onClose={handleDrawerClose}
        PaperProps={{ sx: { width: 420, borderRadius: "20px 0 0 20px", border: `1px solid ${brand.border}`, boxShadow: "0 24px 48px rgba(15,23,42,0.12)", overflow: "hidden" } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, px: 2, py: 1.25, color: "#fff", background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})` }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: 2, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MenuOutlinedIcon sx={{ color: "#fff" }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#fff" }}>{drawerHeader}</Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.9)" }}>{selectedRowMeta?.recipe ? `${selectedRowMeta.recipe}` : ""}</Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <IconButton size="small" onClick={exportDrawerCsv} sx={{ color: "#fff", borderRadius: 1, border: "1px solid rgba(255,255,255,0.12)" }}>
              <FileDownloadOutlinedIcon fontSize="small" />
            </IconButton>
            <IconButton onClick={handleDrawerClose} sx={{ color: "#fff" }}><CloseIcon /></IconButton>
          </Box>
        </Box>

        <Box sx={{ background: brand.surface, p: 2, height: "calc(100% - 88px)" }}>
          <Card variant="outlined" sx={{ borderColor: brand.border, background: brand.surface, borderRadius: 2, mb: 2 }}>
            <CardContent sx={{ p: 1.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography sx={{ color: brand.subtext, fontSize: 12, fontWeight: 700 }}>Recipe</Typography>
                  <Typography sx={{ color: brand.text, fontWeight: 800 }}>{selectedRowMeta?.recipe || "—"}</Typography>
                  {selectedRowMeta?.upb && <Typography variant="caption" sx={{ color: brand.subtext }}>Units per batch: {selectedRowMeta.upb}</Typography>}
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography sx={{ color: "text.secondary", fontSize: 12 }}>Items</Typography>
                  <Typography sx={{ color: brand.primary, fontWeight: 900, fontSize: 22 }}>{totalItemsCount}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <TextField size="small" placeholder="Search item or filter" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} fullWidth
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5, background: "#fff", borderColor: brand.border } }} />
            <Button variant="outlined" size="small" onClick={resetDrawerContent} sx={{ textTransform: "none", borderRadius: 1.5 }}>Reset</Button>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <List disablePadding>
            {filteredDisplayItems.length === 0 ? (
              <Typography sx={{ color: brand.subtext }}>No items available.</Typography>
            ) : (
              filteredDisplayItems.map((it, idx) => {
                const primaryText = it.name;
                const qtyText = it.qty ? String(it.qty) : "";
                const unitText = it.unit ? String(it.unit) : "";
                const pill = qtyText ? `${qtyText}${unitText ? " " + unitText : ""}` : null;

                return (
                  <Box key={idx} sx={{ borderRadius: 2, border: `1px solid ${brand.border}`, backgroundColor: idx % 2 ? brand.surfaceMuted : brand.surface, mb: 1, overflow: "hidden" }}>
                    <ListItem secondaryAction={pill ? (
                      <Box component="span" sx={{ borderRadius: 999, border: `1px solid ${brand.border}`, background: "#f1f5f9", px: 1.25, py: 0.25, fontSize: 12, fontWeight: 700, color: brand.text }}>{pill}</Box>
                    ) : null}>
                      <ListItemIcon sx={{ minWidth: 36 }}><CheckRoundedIcon sx={{ color: brand.primary }} /></ListItemIcon>
                      <ListItemText primary={primaryText} primaryTypographyProps={{ sx: { color: brand.text, fontWeight: 600 } }} />
                    </ListItem>
                  </Box>
                );
              })
            )}
          </List>
        </Box>

        <Box sx={{ p: 2, borderTop: `1px solid ${brand.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: brand.surface }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button onClick={handleDrawerClose} sx={{ textTransform: "none", borderRadius: 999, px: 2, border: `1px solid ${brand.border}` }}>Close</Button>
            <Button onClick={() => { handleDrawerClose(); }} sx={{ textTransform: "none", fontWeight: 800, borderRadius: 999, px: 2, color: "#fff", background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`, "&:hover": { background: brand.primaryDark } }} startIcon={<DeleteIcon />}>Done</Button>
          </Box>
          <Typography sx={{ color: "text.secondary", fontSize: 13 }}>{totalItemsCount} items</Typography>
        </Box>
      </Drawer>

      {/* Delete confirmation dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} PaperProps={{ sx: { borderRadius: 14, border: `1px solid ${brand.border}`, boxShadow: brand.shadow } }}>
        <DialogTitle sx={{ fontWeight: 800, color: brand.text }}>Confirm deletion</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: brand.subtext }}>Delete {selectedRows.length} selected recipe{selectedRows.length === 1 ? "" : "s"}?</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button onClick={async () => {
              // handleDeleteRecipe logic kept similar to your earlier implementation
              if (!selectedRows.length || !cognitoId) return;
              try {
                await Promise.all(selectedRows.map(async (recipeId) => {
                  const rec = (rows || []).find((r) => r.id === recipeId);
                  if (!rec) return;
                  const resp = await fetch(`${API_BASE}/delete-recipe`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ recipeName: rec.recipe, cognito_id: cognitoId }),
                  });
                  if (resp.ok) {
                    setRows((prev) => prev.filter((r) => r.id !== recipeId));
                  }
                }));
                setSelectedRows([]);
                setOpenDialog(false);
              } catch (err) {
                console.error("Error deleting recipes:", err);
                alert("Could not delete recipes");
              }
            }} sx={{ textTransform: "none", fontWeight: 800, borderRadius: 999, px: 2, color: "#fff", background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`, "&:hover": { background: brand.primaryDark } }} startIcon={<DeleteIcon />}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Edit recipe dialog */}
      <Dialog open={editDialogOpen} onClose={() => { setEditDialogOpen(false); setEditingRecipe(null); }} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 14, border: `1px solid ${brand.border}`, boxShadow: brand.shadow } }}>
        <DialogTitle sx={{ fontWeight: 800, color: brand.text }}>{editingRecipe ? `Edit Recipe: ${editingRecipe.recipe}` : "Edit Recipe"}</DialogTitle>
        <DialogContent dividers>
          {!editingRecipe ? (
            <Typography sx={{ color: brand.subtext }}>Loading…</Typography>
          ) : (
            <Box sx={{ display: "grid", gap: 2 }}>
              <TextField label="Recipe name" fullWidth value={editingRecipe.recipe} onChange={(e) => setEditingRecipe((p) => ({ ...p, recipe: e.target.value }))} />
              <TextField label="Units per batch" fullWidth value={editingRecipe.upb} onChange={(e) => setEditingRecipe((p) => ({ ...p, upb: e.target.value }))} />

              <Box>
                <Typography sx={{ fontWeight: 800, mb: 1 }}>Ingredients</Typography>
                <Stack spacing={1}>
                  {(editingRecipe.items || []).map((it, idx) => (
                    <Paper key={idx} sx={{ p: 1, display: "grid", gridTemplateColumns: "2fr 1fr 1fr 40px", gap: 8, alignItems: "center" }}>
                      <TextField label="Ingredient" value={it.name} onChange={(e) => {
                        const copy = (editingRecipe.items || []).slice();
                        copy[idx] = { ...copy[idx], name: e.target.value };
                        setEditingRecipe((p) => ({ ...p, items: copy }));
                      }} />
                      <TextField label="Quantity" type="number" value={it.quantity} onChange={(e) => {
                        const copy = (editingRecipe.items || []).slice();
                        copy[idx] = { ...copy[idx], quantity: e.target.value };
                        setEditingRecipe((p) => ({ ...p, items: copy }));
                      }} />
                      <FormControl fullWidth>
                        <InputLabel id={`unit-label-${idx}`}>Unit</InputLabel>
                        <Select labelId={`unit-label-${idx}`} value={it.unit || ""} label="Unit" onChange={(e) => {
                          const copy = (editingRecipe.items || []).slice();
                          copy[idx] = { ...copy[idx], unit: e.target.value };
                          setEditingRecipe((p) => ({ ...p, items: copy }));
                        }}>
                          {unitOptions.map((u) => (<MenuItem key={u.value} value={u.value}>{u.label}</MenuItem>))}
                        </Select>
                      </FormControl>
                      <IconButton size="small" onClick={() => {
                        const copy = (editingRecipe.items || []).slice();
                        copy.splice(idx, 1);
                        setEditingRecipe((p) => ({ ...p, items: copy }));
                      }}><CloseIcon /></IconButton>
                    </Paper>
                  ))}
                </Stack>

                <Box mt={1} textAlign="right">
                  <Button startIcon={<AddOutlinedIcon />} onClick={() => {
                    const copy = (editingRecipe.items || []).slice();
                    copy.push({ name: "", quantity: "", unit: unitOptions[0].value });
                    setEditingRecipe((p) => ({ ...p, items: copy }));
                  }} sx={{ textTransform: "none" }}>Add ingredient</Button>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setEditDialogOpen(false); setEditingRecipe(null); }} sx={{ textTransform: "none" }} disabled={saving}>Cancel</Button>
          <Button onClick={handleSaveRecipe} sx={{ textTransform: "none", fontWeight: 800, borderRadius: 999, px: 2, color: "#fff", background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`, "&:hover": { background: brand.primaryDark } }} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Recipes;
