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

/** Toggle verbose logging */
const DEBUG = true;
const dlog = (...a) => DEBUG && console.log("[GoodsOut]", ...a);
const dgroup = (l) => DEBUG && console.groupCollapsed(l);
const dgroupEnd = () => DEBUG && console.groupEnd();

const GoodsOut = () => {
  const { cognitoId } = useAuth();

  const [goodsOut, setGoodsOut] = useState([]);
  const [recipesMap, setRecipesMap] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerHeader, setDrawerHeader] = useState("");
  const [drawerItems, setDrawerItems] = useState([]); // [{ code, unitsLabel }]

  // ---- helpers --------------------------------------------------------------

  const safeParse = (val, fallback) => {
    if (val == null) return fallback;
    if (Array.isArray(val) || typeof val === "object") return val;
    try {
      const parsed = JSON.parse(val);
      return parsed == null ? fallback : parsed;
    } catch {
      return fallback;
    }
  };

  // Normalize into [{ code, units }] —> IMPORTANT: interpret quantities as UNITS
  const normalizeRowPairs = (row) => {
    dgroup("normalizeRowPairs()");
    dlog("Raw row snippet:", {
      date: row?.date,
      recipe: row?.recipe,
      stockAmount: row?.stockAmount,
      batchcodes: row?.batchcodes,
      quantitiesUsed: row?.quantitiesUsed,
    });

    const rawCodes =
      row.batchcodes ?? row.batchCodes ?? row.codes ?? row.batch_codes ?? null;
    const rawQuantities =
      row.quantitiesUsed ??
      row.quantities ??
      row.batchesUsed ??
      row.quantities_used ??
      null;

    dlog("Raw codes field:", rawCodes);
    dlog("Raw quantities field:", rawQuantities);

    const codesParsed = safeParse(rawCodes, []);
    const qtyParsed = safeParse(rawQuantities, []);

    dlog("Parsed codes:", codesParsed);
    dlog("Parsed quantities:", qtyParsed);

    const pairs = [];

    if (Array.isArray(codesParsed) && codesParsed.length) {
      dlog("Branch: codesParsed is Array");
      codesParsed.forEach((c, i) => {
        if (typeof c === "string") {
          const units =
            (Array.isArray(qtyParsed) ? qtyParsed[i] : qtyParsed?.[c]) ?? 0;
          pairs.push({ code: c, units: Number(units) || 0 });
        } else if (c && typeof c === "object") {
          const code = c.code ?? c.batchCode ?? c.id ?? String(i);
          const unitsFromObj =
            c.units ?? c.qty ?? c.quantity ?? c.count ?? 0; // accept common keys
          const unitsFallback =
            (Array.isArray(qtyParsed) ? qtyParsed[i] : qtyParsed?.[code]) ?? 0;
          pairs.push({ code, units: Number(unitsFromObj || unitsFallback) || 0 });
        }
      });
      dlog("Normalized pairs (array branch):", pairs);
      dgroupEnd();
      return pairs;
    }

    if (codesParsed && typeof codesParsed === "object") {
      dlog("Branch: codesParsed is Object map");
      Object.entries(codesParsed).forEach(([code, maybeUnits]) => {
        const override =
          (Array.isArray(qtyParsed) ? undefined : qtyParsed?.[code]) ?? undefined;
        pairs.push({
          code,
          units: Number(override ?? maybeUnits) || 0,
        });
      });
      dlog("Normalized pairs (object map branch):", pairs);
      dgroupEnd();
      return pairs;
    }

    if (Array.isArray(qtyParsed)) {
      dlog("Branch: only quantities array present, synthesizing codes");
      const synthesized = qtyParsed.map((q, i) => ({
        code: `Batch ${i + 1}`,
        units: Number(q) || 0,
      }));
      dlog("Normalized pairs (synthesized):", synthesized);
      dgroupEnd();
      return synthesized;
    }

    dlog("No recognizable codes/quantities; returning empty array.");
    dgroupEnd();
    return [];
  };

  // Build final drawer items using UNITS directly (no UPB multiply)
  const buildDrawerItems = (row) => {
    dgroup("buildDrawerItems()");
    const pairs = normalizeRowPairs(row);
    const items = pairs.map(({ code, units }) => ({
      code,
      unitsLabel: `${Number(units || 0).toLocaleString()} units`,
    }));
    const sumUnits = pairs.reduce((t, p) => t + (Number(p.units) || 0), 0);
    const stockAmountNum = Number(row?.stockAmount ?? 0);
    dlog("Sum of units from drawer:", sumUnits, "Row stockAmount:", stockAmountNum);
    dlog("Drawer items to render:", items);
    dgroupEnd();
    return items;
  };

  // ---- effects --------------------------------------------------------------

  useEffect(() => {
    if (!cognitoId) return;
    const fetchRecipes = async () => {
      dgroup("fetchRecipes()");
      try {
        const res = await fetch(
          `https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/recipes?cognito_id=${cognitoId}`
        );
        dlog("HTTP status:", res.status);
        if (!res.ok) throw new Error("Failed to fetch recipes");
        const data = await res.json();
        dlog("Raw recipes length:", Array.isArray(data) ? data.length : "n/a");

        const map = {};
        (Array.isArray(data) ? data : []).forEach((r, idx) => {
          const key = r.recipe_name ?? r.recipe ?? r.name ?? `unknown_${idx}`;
          map[String(key)] = Number(r.units_per_batch) || 0;
        });

        dlog("units_per_batch map (kept for reference):", map);
        setRecipesMap(map);
      } catch (err) {
        console.error("[GoodsOut] Error fetching recipes:", err);
      } finally {
        dgroupEnd();
      }
    };
    fetchRecipes();
  }, [cognitoId]);

  useEffect(() => {
    if (!cognitoId) return;
    const fetchGoodsOutData = async () => {
      dgroup("fetchGoodsOutData()");
      try {
        const response = await fetch(
          `https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/goods-out?cognito_id=${cognitoId}`
        );
        dlog("HTTP status:", response.status);
        if (!response.ok) throw new Error("Failed to fetch goods out");
        const data = await response.json();
        const arr = Array.isArray(data) ? data : [];
        dlog("Goods-out rows:", arr.length);
        dlog("Preview first 3 rows:", arr.slice(0, 3));
        setGoodsOut(arr);
      } catch (error) {
        console.error("[GoodsOut] Error fetching goods out:", error);
      } finally {
        dgroupEnd();
      }
    };
    fetchGoodsOutData();
  }, [cognitoId]);

  // ---- drawer handlers ------------------------------------------------------

  const handleDrawerOpenForRow = (row) => {
    dgroup("handleDrawerOpenForRow()");
    dlog("Clicked row:", row);
    const items = buildDrawerItems(row); // <- now uses UNITS directly
    setDrawerHeader("Batchcodes");
    setDrawerItems(items);
    setDrawerOpen(true);
    dgroupEnd();
  };

  const handleDrawerClose = () => {
    dlog("Drawer closed");
    setDrawerOpen(false);
  };

  // ---- table columns --------------------------------------------------------

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
            onClick={() => handleDrawerOpenForRow(params.row)}
          >
            Show Batchcodes
          </Typography>
        ),
      },
      {
        field: "recipients",
        headerName: "Recipients",
        flex: 1,
        headerAlign: "left",
        align: "left",
      },
    ],
    []
  );

  // ---- render ---------------------------------------------------------------

  return (
    <Box m="20px">
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
        <Box className="go-toolbar">
          <Typography sx={{ fontWeight: 800, color: brand.text }}>
            Goods Out
          </Typography>
        </Box>

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

        <Box sx={{ background: brand.surface, p: 2 }}>
          {drawerItems.length === 0 ? (
            <Typography sx={{ color: brand.subtext, px: 1 }}>
              No data available
            </Typography>
          ) : (
            <List disablePadding>
              {drawerItems.map(({ code, unitsLabel }, idx) => (
                <Box
                  key={`${code}-${idx}`}
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
                        {unitsLabel}
                      </Box>
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
              ))}
            </List>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};

export default GoodsOut;
