// src/scenes/usage/StockUsage.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";

/** Nory-like brand tokens */
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

const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

const StockUsage = () => {
  const theme = useTheme();
  const { cognitoId } = useAuth();

  const [stockUsage, setStockUsage] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]); // DataGrid selection model (ids = batchCode)

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerHeader, setDrawerHeader] = useState("");
  const [drawerItems, setDrawerItems] = useState([]); // array of strings
  const [drawerMode, setDrawerMode] = useState("ingredients"); // 'ingredients' | 'barcodes'

  // Confirm dialog state
  const [openConfirm, setOpenConfirm] = useState(false);

  useEffect(() => {
    if (!cognitoId) return;

    const fetchStockUsage = async () => {
      try {
        const url = `${API_BASE}/stock-usage/${cognitoId}`;
        const response = await axios.get(url);
        if (!Array.isArray(response.data)) return;

        // Group by batchCode so each row corresponds to a production log entry (delete target)
        const grouped = {};
        response.data.forEach((item) => {
          const key = item.batchCode; // make this the row id to match delete endpoint
          if (!grouped[key]) {
            grouped[key] = {
              id: key, // DataGrid id (equals batchCode)
              batchCode: item.batchCode,
              date: item.production_log_date,
              recipeName: item.recipe_name,
              batchesProduced: item.batchesProduced,
              ingredients: [],
              barcodes: [],
            };
          }
          if (Array.isArray(item.ingredients)) {
            item.ingredients.forEach((ingredient) => {
              const totalQuantity = ingredient.quantity * item.batchesProduced;
              grouped[key].ingredients.push(
                `${ingredient.ingredient_name}: ${totalQuantity}`
              );
              grouped[key].barcodes.push(
                `${ingredient.ingredient_name}: ${ingredient.ingredient_barcodes}`
              );
            });
          }
        });

        const formatted = Object.values(grouped).map((entry) => ({
          ...entry,
          ingredients: entry.ingredients.join("; "),
          barcodes: entry.barcodes.join("; "),
        }));

        setStockUsage(formatted);
      } catch (error) {
        console.error("[StockUsage] Error fetching stock usage:", error.message);
      }
    };

    fetchStockUsage();
  }, [cognitoId]);

  // Drawer helpers (minimal style)
  const handleDrawerOpen = (header, content) => {
    const mode = header.toLowerCase().includes("barcode")
      ? "barcodes"
      : "ingredients";
    setDrawerMode(mode);
    setDrawerHeader(header);

    let items = [];
    if (Array.isArray(content)) {
      items = content;
    } else if (typeof content === "string" && content.length) {
      items = content.split("; ").filter(Boolean);
    }
    setDrawerItems(items);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => setDrawerOpen(false);

  // Delete selected rows (soft-delete the underlying production logs by batchCode)
  const handleDeleteSelected = async () => {
    if (!cognitoId || selectedIds.length === 0) return;
    try {
      // For each selected id (which == batchCode), call delete-production-log
      await Promise.all(
        selectedIds.map(async (batchCode) => {
          const res = await fetch(`${API_BASE}/delete-production-log`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ batchCode, cognito_id: cognitoId }),
          });
          if (!res.ok) {
            const t = await res.text().catch(() => "");
            throw new Error(`Failed to delete ${batchCode} (${res.status}) ${t}`);
          }
        })
      );

      // Remove from the table
      setStockUsage((prev) => prev.filter((row) => !selectedIds.includes(row.id)));
      setSelectedIds([]);
      setOpenConfirm(false);
      setDrawerOpen(false); // close drawer if open
    } catch (err) {
      console.error("[StockUsage] Error deleting rows:", err);
      // keep dialog open so user can retry or cancel
    }
  };

  const columns = useMemo(
    () => [
      { field: "date", headerName: "Date", flex: 1 },
      { field: "recipeName", headerName: "Recipe Name", flex: 1 },
      {
        field: "ingredients",
        headerName: "Ingredients",
        flex: 1,
        renderCell: (params) => (
          <Typography
            sx={{
              cursor: "pointer",
              color: brand.primary,
              fontWeight: 600,
              "&:hover": { color: brand.primaryDark },
            }}
            onClick={() =>
              handleDrawerOpen("Ingredients", params.row.ingredients)
            }
          >
            Show Ingredients
          </Typography>
        ),
      },
      { field: "batchCode", headerName: "Batch Code", flex: 1 },
      {
        field: "barcodes",
        headerName: "Barcodes",
        flex: 1,
        renderCell: (params) => (
          <Typography
            sx={{
              cursor: "pointer",
              color: brand.primary,
              fontWeight: 600,
              "&:hover": { color: brand.primaryDark },
            }}
            onClick={() => handleDrawerOpen("Barcodes", params.row.barcodes)}
          >
            Show Barcodes
          </Typography>
        ),
      },
    ],
    []
  );

  return (
    <Box m="20px">
      {/* Scoped styles */}
      <style>{`
        .su-card {
          border: 1px solid ${brand.border};
          background: ${brand.surface};
          border-radius: 16px;
          box-shadow: ${brand.shadow};
          overflow: hidden;
        }
        .su-toolbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px; border-bottom: 1px solid ${brand.border};
          background: ${brand.surface};
        }
      `}</style>

      {/* Card container */}
      <Box className="su-card" mt={2}>
        {/* Toolbar with gradient delete icon (matches Production Log) */}
        <Box className="su-toolbar">
          <Typography sx={{ fontWeight: 800, color: brand.text }}>
            Stock Usage
          </Typography>

          <IconButton
            aria-label="Delete selected"
            onClick={() => setOpenConfirm(true)}
            disabled={selectedIds.length === 0}
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
              opacity: selectedIds.length === 0 ? 0.5 : 1,
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>

        {/* DataGrid */}
        <Box
          sx={{
            height: "70vh",
            "& .MuiDataGrid-root": { border: "none", minWidth: "750px" },
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
            rows={stockUsage}
            columns={columns}
            getRowId={(row) => row.id} // id === batchCode
            checkboxSelection
            onRowSelectionModelChange={(model) => setSelectedIds(model)}
            rowSelectionModel={selectedIds}
          />
        </Box>
      </Box>

      {/* Drawer */}
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

        {/* Body */}
        <Box sx={{ background: brand.surface, p: 2 }}>
          <List disablePadding>
            {drawerItems.length === 0 ? (
              <Typography sx={{ color: brand.subtext, px: 1 }}>
                No data available
              </Typography>
            ) : (
              drawerItems.map((raw, idx) => {
                let primaryText = raw;
                let secondary = null;
                let pill = null;

                if (drawerMode === "ingredients" && typeof raw === "string" && raw.includes(":")) {
                  const [name, qty] = raw.split(":");
                  primaryText = name.trim();
                  pill = (qty || "").trim();
                } else if (drawerMode === "barcodes" && typeof raw === "string" && raw.includes(":")) {
                  const [name, codes] = raw.split(":");
                  primaryText = name.trim();
                  secondary = (codes || "").trim();
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
                        pill ? (
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
                              maxWidth: 160,
                              textAlign: "right",
                            }}
                          >
                            {pill}
                          </Box>
                        ) : null
                      }
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <CheckRoundedIcon sx={{ color: brand.primary }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={primaryText}
                        secondary={secondary}
                        primaryTypographyProps={{ sx: { color: brand.text, fontWeight: 600 } }}
                        secondaryTypographyProps={{ sx: { color: brand.subtext, mt: 0.5, wordBreak: "break-word" } }}
                      />
                    </ListItem>
                  </Box>
                );
              })
            )}
          </List>
        </Box>
      </Drawer>

      {/* Confirm Deletion Dialog (matches Production Log) */}
      <Dialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        PaperProps={{
          sx: {
            borderRadius: 14,
            border: `1px solid ${brand.border}`,
            boxShadow: brand.shadow,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: brand.text }}>
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: brand.subtext }}>
            Are you sure you want to delete the selected row(s)?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenConfirm(false)} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteSelected}
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
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StockUsage;
