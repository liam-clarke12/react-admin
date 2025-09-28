// src/scenes/inventory/IngredientsInventory.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  Snackbar,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import BarChart from "../../components/BarChart";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";

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

/**
 * Unit normalization helpers
 *
 * - mass base: grams (g)  — kg -> *1000
 * - volume base: milliliters (ml) — l -> *1000
 * - count base: units (no conversion)
 *
 * If unit text is unknown we treat as 'units' fallback.
 */
const detectUnitTypeAndFactor = (rawUnit) => {
  const u = String(rawUnit || "").trim().toLowerCase();
  if (!u) return { type: "units", base: "units", factor: 1 };

  // Mass
  if (u.includes("kg") || u.includes("kilogram")) return { type: "mass", base: "g", factor: 1000 };
  if (u.includes("g") || u.includes("gram")) return { type: "mass", base: "g", factor: 1 };

  // Volume
  if ((u.includes("l") && !u.includes("ml")) || u.includes("litre") || u.includes("liter")) return { type: "volume", base: "ml", factor: 1000 };
  if (u.includes("ml") || u.includes("milliliter") || u.includes("millilitre")) return { type: "volume", base: "ml", factor: 1 };

  // Count-ish
  if (u.includes("unit") || u.includes("each") || u.includes("pcs") || u.includes("pieces")) return { type: "units", base: "units", factor: 1 };

  // Fallback — treat as units
  return { type: "units", base: "units", factor: 1 };
};

const formatDisplayForGroup = ({ type, totalBase }) => {
  if (type === "mass") {
    // base is grams; show kg if >= 1000g
    if (Math.abs(totalBase) >= 1000) {
      const val = +(totalBase / 1000).toFixed(3);
      // trim unnecessary zeros
      return { displayValue: Number.isInteger(val) ? val : parseFloat(val.toString()), displayUnit: "kg", numericForChart: val };
    }
    return { displayValue: Number.isInteger(totalBase) ? totalBase : parseFloat(totalBase.toFixed(3)), displayUnit: "g", numericForChart: totalBase };
  }
  if (type === "volume") {
    // base is ml; show L if >= 1000ml
    if (Math.abs(totalBase) >= 1000) {
      const val = +(totalBase / 1000).toFixed(3);
      return { displayValue: Number.isInteger(val) ? val : parseFloat(val.toString()), displayUnit: "L", numericForChart: val };
    }
    return { displayValue: Number.isInteger(totalBase) ? totalBase : parseFloat(totalBase.toFixed(3)), displayUnit: "ml", numericForChart: totalBase };
  }
  // units / fallback
  return { displayValue: Number.isInteger(totalBase) ? totalBase : parseFloat(totalBase.toFixed(3)), displayUnit: "units", numericForChart: totalBase };
};

const IngredientsInventory = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { ingredientInventory, setIngredientInventory } = useData();
  const { cognitoId } = useAuth();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);

  // Fetch ACTIVE inventory (soft-deleted/zero-remaining excluded)
  useEffect(() => {
    const fetchActiveInventory = async () => {
      if (!cognitoId) return;
      try {
        const res = await fetch(
          `https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/ingredient-inventory/active?cognito_id=${cognitoId}`
        );
        if (!res.ok) throw new Error(`Failed to fetch active inventory (${res.status})`);
        const data = await res.json();

        // Defensive: ensure array
        const rows = Array.isArray(data) ? data : [];

        // Normalize & aggregate
        const groups = {}; // key: normalized ingredient name
        rows.forEach((r, idx) => {
          const ingredient = (r?.ingredient ?? "").trim();
          if (!ingredient) return; // skip empty names

          const rawUnit = r?.unit ?? "";
          const { type, base, factor } = detectUnitTypeAndFactor(rawUnit);

          // Parse numeric totalRemaining (fallback 0)
          const rawAmount = Number(r?.totalRemaining ?? r?.stockOnHand ?? 0) || 0;
          const baseAmount = rawAmount * (Number(factor) || 1);

          const key = ingredient.toLowerCase(); // case-insensitive grouping
          if (!groups[key]) {
            groups[key] = {
              ingredient,
              totalBase: baseAmount,
              type,
              baseUnit: base,
              sampleBarcode: r?.activeBarcode ?? r?.barcode ?? "",
              // keep a sample batchCode/id for row id (prefer existing batchCode if present)
              sampleId: r?.batchCode ?? `${ingredient}-${idx}`,
              latestDate: r?.date ?? null,
            };
          } else {
            // If type mismatch (e.g., some rows recorded in mass and some in volume) — treat conservatively:
            if (groups[key].type !== type) {
              // fallback: don't try to coerce; append unit label to ingredient name to avoid silent weird sums
              // convert current group's data into a compound key so both remain visible
              const altKey = `${key}::${type}`;
              if (!groups[altKey]) {
                groups[altKey] = {
                  ingredient: `${ingredient} (${type === "mass" ? "mass" : type === "volume" ? "volume" : "units"})`,
                  totalBase: baseAmount,
                  type,
                  baseUnit: base,
                  sampleBarcode: r?.activeBarcode ?? r?.barcode ?? "",
                  sampleId: r?.batchCode ?? `${ingredient}-${idx}-alt`,
                  latestDate: r?.date ?? null,
                };
              } else {
                groups[altKey].totalBase += baseAmount;
                if (r?.date && (!groups[altKey].latestDate || new Date(r.date) > new Date(groups[altKey].latestDate))) {
                  groups[altKey].latestDate = r.date;
                }
              }
            } else {
              groups[key].totalBase += baseAmount;
              // prefer the newest date for the group (useful for display if needed)
              if (r?.date && (!groups[key].latestDate || new Date(r.date) > new Date(groups[key].latestDate))) {
                groups[key].latestDate = r.date;
              }
              // pick first non-empty barcode (keep whatever we had)
              if (!groups[key].sampleBarcode && (r?.activeBarcode || r?.barcode)) {
                groups[key].sampleBarcode = r?.activeBarcode ?? r?.barcode;
              }
            }
          }
        });

        // Convert groups object into array for grid, formatting human-friendly units
        const processed = Object.values(groups).map((g, idx) => {
          const { displayValue, displayUnit, numericForChart } = formatDisplayForGroup({
            type: g.type,
            totalBase: g.totalBase,
          });

          return {
            // ensure stable unique id per row
            id: g.sampleId ?? `${g.ingredient}-${idx}`,
            ingredient: g.ingredient,
            unitsInStock: displayValue,
            unit: displayUnit,
            // keep raw numeric value for charts
            _numeric: numericForChart,
            barcode: g.sampleBarcode ?? "",
            date: g.latestDate,
          };
        });

        // sort alphabetically for UX
        processed.sort((a, b) => a.ingredient.localeCompare(b.ingredient));

        setIngredientInventory(processed);
      } catch (err) {
        console.error("Error fetching active ingredient inventory:", err);
        setSnackbarMessage("Failed to load ingredient inventory");
        setOpenSnackbar(true);
        setIngredientInventory([]);
      }
    };

    fetchActiveInventory();
  }, [cognitoId, setIngredientInventory]);

  // Columns (no expiry column)
  const columns = useMemo(
    () => [
      {
        field: "ingredient",
        headerName: "Ingredient",
        flex: 1,
        editable: false,
      },
      {
        field: "unitsInStock",
        headerName: "Units in Stock",
        type: "number",
        flex: 1,
        editable: false,
        // defensive: guard params might be undefined
        valueGetter: (params) => (params && params.row ? params.row.unitsInStock ?? 0 : params?.value ?? 0),
        renderCell: (params) => {
          const v = params && params.row ? params.row.unitsInStock : params?.value;
          if (typeof v === "number") return Number.isFinite(v) ? v.toLocaleString() : String(v);
          return String(v ?? "");
        },
      },
      {
        field: "unit",
        headerName: "Unit",
        flex: 0.7,
        editable: false,
      },
      {
        field: "barcode",
        headerName: "Active Barcode",
        flex: 1,
        editable: false,
        cellClassName: "barCode-column--cell",
      },
    ],
    []
  );

  // Bar chart data
  const barChartData = useMemo(
    () =>
      (ingredientInventory || []).map((item) => ({
        ingredient: item.ingredient,
        amount: Number(item._numeric) || 0,
      })),
    [ingredientInventory]
  );

  return (
    <Box m="20px">
      {/* Scoped refinements */}
      <style>{`
        .inv-card {
          border: 1px solid ${brand.border};
          background: ${brand.surface};
          border-radius: 16px;
          box-shadow: ${brand.shadow};
          overflow: hidden;
        }
        .inv-toolbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px; border-bottom: 1px solid ${brand.border}; background: ${brand.surface};
        }
        .pill-icon {
          background: #f1f5f9;
          border: 1px solid ${brand.border};
          width: 40px; height: 40px; border-radius: 999px;
        }
        .pill-icon:hover { background: #e2e8f0; }
        .toolbar-right { display:flex; gap:8px; align-items:center; }
        .barCode-column--cell { color: ${brand.primary}; }
      `}</style>

      <Box className="inv-card" mt={2}>
        {/* Toolbar with Bar Chart toggle and Info button */}
        <Box className="inv-toolbar">
          <Typography sx={{ fontWeight: 800, color: brand.text }}>
            Ingredient Inventory
          </Typography>

          <Box className="toolbar-right">
            <IconButton
              aria-label="Info about goods in / editability"
              onClick={() => setInfoOpen(true)}
              className="pill-icon"
              sx={{ color: brand.text }}
            >
              <InfoOutlinedIcon />
            </IconButton>

            <IconButton
              onClick={() => setDrawerOpen(true)}
              aria-label="Open Bar Chart"
              className="pill-icon"
              sx={{ color: brand.text }}
            >
              <BarChartOutlinedIcon />
            </IconButton>
          </Box>
        </Box>

        {/* DataGrid */}
        <Box
          sx={{
            height: "70vh",
            "& .MuiDataGrid-root": { border: "none", borderRadius: 0 },
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
            "& .barCode-column--cell": { color: brand.primary },
          }}
        >
          <DataGrid
            autoHeight={false}
            getRowId={(row) => row.id || `${row.ingredient}`}
            rows={ingredientInventory || []}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[5, 10, 20]}
            disableSelectionOnClick
          />
        </Box>
      </Box>

      {/* Drawer with Bar Chart */}
      <Drawer
        anchor={isMobile ? "bottom" : "right"}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: isMobile ? "100%" : "88%",
            borderRadius: isMobile ? "20px 20px 0 0" : "20px 0 0 20px",
            border: `1px solid ${brand.border}`,
            boxShadow: brand.shadow,
            overflow: "hidden",
          },
        }}
      >
        {/* Drawer header */}
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
          <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: "#fff" }}>
            <MenuOutlinedIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#fff" }}>
            Bar Chart
          </Typography>
        </Box>

        {/* Drawer body */}
        <Box
          sx={{
            background: brand.surface,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            px: 2,
            py: 3,
          }}
        >
          <BarChart
            data={barChartData}
            keys={["amount"]}
            indexBy="ingredient"
            height="500px"
            width="95%"
          />
        </Box>
      </Drawer>

      {/* Info dialog */}
      <Dialog open={infoOpen} onClose={() => setInfoOpen(false)}>
        <DialogTitle sx={{ fontWeight: 800 }}>About this table</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: brand.subtext }}>
            These rows are read-only aggregates of your active goods-in lots.
            To change stock-on-hand values you must add, delete or edit the corresponding
            goods-in entries from the "Goods In" screen. This view only summarizes active
            inventory and cannot be edited directly.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1 }}>
          <Button onClick={() => setInfoOpen(false)} sx={{ textTransform: "none" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default IngredientsInventory;
