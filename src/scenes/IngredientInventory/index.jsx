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

        // 🔎 Debug: confirm what API returns
        console.log("[IngredientsInventory] /ingredient-inventory/active response:", data);

        // Map API -> grid rows (defensive)
        const mapped = (Array.isArray(data) ? data : []).map((r, idx) => {
          const stockNum = Number(r?.totalRemaining);
          return {
            ingredient: r?.ingredient ?? "",
            unit: r?.unit ?? "",
            stockOnHand: Number.isFinite(stockNum) ? stockNum : 0,
            barcode: r?.activeBarcode ?? "",
            _id: `${r?.ingredient ?? "row"}-${r?.unit ?? "unit"}-${idx}`,
          };
        });

        console.log("[IngredientsInventory] mapped rows:", mapped);
        setIngredientInventory(mapped);
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
        field: "stockOnHand",
        headerName: "Stock on Hand",
        type: "number",
        flex: 1,
        editable: false,
        renderCell: (params) => {
          const v = Number(params.row?.stockOnHand ?? params.value ?? 0);
          return Number.isFinite(v) ? v.toLocaleString() : "";
        },
      },
      {
        field: "unit",
        headerName: "Unit",
        flex: 1,
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
        amount: Number(item.stockOnHand) || 0,
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
            getRowId={(row) => row._id || `${row.ingredient}-${row.unit}`}
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
