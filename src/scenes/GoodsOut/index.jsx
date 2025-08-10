// src/scenes/goodsout/GoodsOut.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { useAuth } from "../../contexts/AuthContext";

/** Nory-like brand tokens (scoped so theme overrides won’t fight these) */
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

const GoodsOut = () => {
  const { cognitoId } = useAuth();

  const [goodsOut, setGoodsOut] = useState([]);
  const [recipesMap, setRecipesMap] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerHeader, setDrawerHeader] = useState("");
  const [drawerItems, setDrawerItems] = useState([]); // array of "CODE: 1,234 units"

  // 1) Fetch recipes → build recipeName → units_per_batch map
  useEffect(() => {
    if (!cognitoId) return;
    const fetchRecipes = async () => {
      try {
        const res = await fetch(
          `https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/recipes?cognito_id=${cognitoId}`
        );
        if (!res.ok) throw new Error("Failed to fetch recipes");
        const data = await res.json();
        const map = {};
        data.forEach((r, idx) => {
          const key = r.recipe_name ?? r.recipe ?? r.name ?? `unknown_${idx}`;
          map[key] = Number(r.units_per_batch) || 0;
        });
        setRecipesMap(map);
      } catch (err) {
        console.error("Error fetching recipes:", err);
      }
    };
    fetchRecipes();
  }, [cognitoId]);

  // 2) Fetch goods-out data
  useEffect(() => {
    if (!cognitoId) return;
    const fetchGoodsOutData = async () => {
      try {
        const response = await fetch(
          `https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/goods-out?cognito_id=${cognitoId}`
        );
        if (!response.ok) throw new Error("Failed to fetch goods out");
        const data = await response.json();
        setGoodsOut(data);
      } catch (error) {
        console.error("Error fetching goods out:", error);
      }
    };
    fetchGoodsOutData();
  }, [cognitoId]);

  const handleDrawerOpen = (header, content) => {
    if (header === "Batchcodes") {
      const { batchcodes, quantitiesUsed, recipe } = content;
      const upb = recipesMap[recipe] || 0;

      const items = (batchcodes || []).map((batchCode, idx) => {
        const batches = (quantitiesUsed || [])[idx] || 0;
        const units = batches * upb;
        return `${batchCode}: ${units.toLocaleString()} units`;
      });

      setDrawerHeader(header);
      setDrawerItems(items);
      setDrawerOpen(true);
      return;
    }

    setDrawerHeader(header);
    setDrawerItems([]);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => setDrawerOpen(false);

  const columns = useMemo(
    () => [
      { field: "date", headerName: "Date", flex: 1 },
      { field: "recipe", headerName: "Recipe Name", flex: 1 },
      {
        field: "stockAmount",
        headerName: "Units Going Out",
        type: "number",
        flex: 1,
        headerAlign: "left",
        align: "left",
      },
      {
        field: "batchcodes",
        headerName: "Batchcodes",
        flex: 1,
        renderCell: (params) => {
          let batchcodes = [];
          let quantitiesUsed = [];
          try {
            batchcodes = Array.isArray(params.row.batchcodes)
              ? params.row.batchcodes
              : JSON.parse(params.row.batchcodes || "[]");
            quantitiesUsed = Array.isArray(params.row.quantitiesUsed)
              ? params.row.quantitiesUsed
              : JSON.parse(params.row.quantitiesUsed || "[]");
          } catch (e) {
            console.error("Failed to parse batchcodes:", e);
          }

          return (
            <Typography
              sx={{
                cursor: "pointer",
                color: brand.primary,
                fontWeight: 600,
                "&:hover": { color: brand.primaryDark },
              }}
              onClick={() =>
                handleDrawerOpen("Batchcodes", {
                  batchcodes,
                  quantitiesUsed,
                  recipe: params.row.recipe,
                })
              }
            >
              Show Batchcodes
            </Typography>
          );
        },
      },
      {
        field: "recipients",
        headerName: "Recipients",
        flex: 1,
        headerAlign: "left",
        align: "left",
      },
    ],
    [recipesMap]
  );

  return (
    <Box m="20px">
      {/* Scoped styles to lock in the Nory look */}
      <style>{`
        .go-card {
          border: 1px solid ${brand.border};
          background: ${brand.surface};
          border-radius: 16px;
          box-shadow: ${brand.shadow};
          overflow: hidden;
        }
        .go-toolbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px; border-bottom: 1px solid ${brand.border};
          background: ${brand.surface};
        }
      `}</style>

      <Box className="go-card" mt={2}>
        {/* Toolbar */}
        <Box className="go-toolbar">
          <Typography sx={{ fontWeight: 800, color: brand.text }}>
            Goods Out
          </Typography>
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
            rows={
              Array.isArray(goodsOut)
                ? goodsOut.map((row, idx) => ({
                    ...row,
                    id: row.id || `${row.recipe}-${idx}`,
                  }))
                : []
            }
            columns={columns}
            getRowId={(row) => row.id}
            disableSelectionOnClick
          />
        </Box>
      </Box>

      {/* Drawer — minimal style checklist with units pill */}
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

        {/* Drawer content: zebra rows, tick icon, units pill on the right */}
        <Box sx={{ background: brand.surface, p: 2 }}>
          {drawerItems.length === 0 ? (
            <Typography sx={{ color: brand.subtext, px: 1 }}>
              No data available
            </Typography>
          ) : (
            <List disablePadding>
              {drawerItems.map((raw, idx) => {
                let code = raw;
                let pill = null;
                if (typeof raw === "string" && raw.includes(":")) {
                  const [left, right] = raw.split(":");
                  code = left.trim();
                  pill = (right || "").trim();
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
                              maxWidth: 180,
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
                        primary={code}
                        primaryTypographyProps={{
                          sx: { color: brand.text, fontWeight: 600 },
                        }}
                      />
                    </ListItem>
                  </Box>
                );
              })}
            </List>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};

export default GoodsOut;
