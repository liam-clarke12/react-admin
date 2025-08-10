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
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
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

const StockUsage = () => {
  const theme = useTheme();
  const { cognitoId } = useAuth();
  const [stockUsage, setStockUsage] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerHeader, setDrawerHeader] = useState("");
  const [drawerItems, setDrawerItems] = useState([]); // array of strings
  const [drawerMode, setDrawerMode] = useState("ingredients"); // 'ingredients' | 'barcodes'

  useEffect(() => {
    if (!cognitoId) return;

    const fetchStockUsage = async () => {
      try {
        const url = `https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/stock-usage/${cognitoId}`;
        const response = await axios.get(url);
        if (!Array.isArray(response.data)) return;

        const groupedData = {};
        response.data.forEach((item) => {
          const key = `${item.recipe_name}-${item.production_log_date}-${item.batchCode}`;
          if (!groupedData[key]) {
            groupedData[key] = {
              id: key,
              date: item.production_log_date,
              recipeName: item.recipe_name,
              batchCode: item.batchCode,
              batchesProduced: item.batchesProduced,
              ingredients: [],
              barcodes: [],
            };
          }
          if (!Array.isArray(item.ingredients)) return;
          item.ingredients.forEach((ingredient) => {
            const totalQuantity = ingredient.quantity * item.batchesProduced;
            groupedData[key].ingredients.push(
              `${ingredient.ingredient_name}: ${totalQuantity}`
            );
            groupedData[key].barcodes.push(
              `${ingredient.ingredient_name}: ${ingredient.ingredient_barcodes}`
            );
          });
        });

        const formattedData = Object.values(groupedData).map((entry) => ({
          ...entry,
          ingredients: entry.ingredients.join("; "),
          barcodes: entry.barcodes.join("; "),
        }));

        setStockUsage(formattedData);
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
      {/* Scoped styles to prevent theme overrides */}
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
        .su-clear {
          text-transform: none; font-weight: 800; border-radius: 999px; padding: 6px 12px;
          border: 1px solid ${brand.border}; color: ${brand.text}; background: #f1f5f9;
        }
        .su-clear:hover { background: #e2e8f0; }
      `}</style>

      {/* Card container */}
      <Box className="su-card" mt={2}>
        {/* Toolbar with Clear button */}
        <Box className="su-toolbar">
          <Typography sx={{ fontWeight: 800, color: brand.text }}>
            Stock Usage
          </Typography>
          <Button className="su-clear" onClick={() => setStockUsage([])}>
            Clear Stock Usage
          </Button>
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
          <DataGrid rows={stockUsage} columns={columns} getRowId={(row) => row.id} />
        </Box>
      </Box>

      {/* Drawer — minimal style */}
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

        {/* Body: minimal list with ticks, + qty pill if "Ingredients" */}
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
    </Box>
  );
};

export default StockUsage;
