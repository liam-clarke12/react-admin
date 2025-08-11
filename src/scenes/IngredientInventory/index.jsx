// src/scenes/inventory/IngredientsInventory.jsx
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  Snackbar,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import { useData } from "../../contexts/DataContext";
import BarChart from "../../components/BarChart";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";

const API_BASE =
  "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

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

const IngredientsInventory = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { ingredientInventory, setIngredientInventory } = useData();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage] = useState("");
  const { cognitoId } = useAuth();

  // Fetch ACTIVE ingredient inventory from backend (already aggregates & filters)
  useEffect(() => {
    if (!cognitoId) return;

    const fetchInventory = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/ingredient-inventory/active?cognito_id=${encodeURIComponent(
            cognitoId
          )}`
        );
        if (!res.ok) throw new Error("Failed to fetch active ingredient inventory");
        const data = await res.json();

        // Map API fields → UI shape
        const rows = (Array.isArray(data) ? data : []).map((r) => ({
          ingredient: r.ingredient,
          unit: r.unit,
          stockOnHand: Number(r.totalRemaining) || 0,
          barcode: r.activeBarcode || "",
          expiryDate: r.activeExpiry || "",
        }));

        setIngredientInventory(rows);
      } catch (err) {
        console.error("Error fetching ingredient inventory:", err);
      }
    };

    fetchInventory();
  }, [cognitoId, setIngredientInventory]);

  const columns = useMemo(
    () => [
      { field: "ingredient", headerName: "Ingredient", flex: 1, editable: false },
      {
        field: "stockOnHand",
        headerName: "Stock on Hand",
        flex: 1,
        type: "number",
        editable: false,
      },
      { field: "unit", headerName: "Unit", flex: 1, editable: false },
      {
        field: "barcode",
        headerName: "Active Barcode",
        flex: 1,
        cellClassName: "barCode-column--cell",
        editable: false,
      },
      {
        field: "expiryDate",
        headerName: "Active Expiry",
        flex: 1,
        editable: false,
        valueFormatter: (params) => {
          const v = params.value;
          if (!v) return "";
          // format as YYYY-MM-DD if possible
          const d = new Date(v);
          if (isNaN(d.getTime())) return v;
          return d.toISOString().slice(0, 10);
        },
      },
    ],
    []
  );

  // Chart data (separate bars per ingredient+unit to avoid merging)
  const barChartData = ingredientInventory.map((item) => ({
    ingredientLabel: item.unit ? `${item.ingredient} (${item.unit})` : item.ingredient,
    amount: item.stockOnHand,
  }));

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
      `}</style>

      <Box className="inv-card" mt={2}>
        {/* Toolbar with Bar Chart toggle */}
        <Box className="inv-toolbar">
          <Typography sx={{ fontWeight: 800, color: brand.text }}>
            Ingredient Inventory
          </Typography>
          <IconButton
            onClick={() => setDrawerOpen(true)}
            aria-label="Open Bar Chart"
            className="pill-icon"
            sx={{ color: brand.text }}
          >
            <BarChartOutlinedIcon />
          </IconButton>
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
            "& .MuiDataGrid-row:hover": {
              backgroundColor: brand.surfaceMuted,
            },
            "& .MuiDataGrid-footerContainer": {
              borderTop: `1px solid ${brand.border}`,
              background: brand.surface,
            },
            "& .barCode-column--cell": { color: brand.primary },
          }}
        >
          <DataGrid
            autoHeight={false}
            getRowId={(row) => `${row.ingredient}__${row.unit || ""}`}
            rows={ingredientInventory}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[5, 10, 20]}
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
            Stock on Hand Chart
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
            indexBy="ingredientLabel"
            height="500px"
            width="95%"
          />
        </Box>
      </Drawer>

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
