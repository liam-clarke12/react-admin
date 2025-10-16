// src/scenes/inventory/RecipeInventory.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Drawer,
  Typography,
  IconButton,
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
  inputBg: "#ffffff",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  primary: "#A3CDD5",
  primaryDark: "#82A4AA",
  focusRing: "rgba(163,205,213,0.35)",
  shadow: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)",
};

const RecipeInventory = () => {
  const theme = useTheme();
  const { cognitoId } = useAuth();
  const { recipeInventory, setRecipeInventory } = useData();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  // Fetch and process production log
  useEffect(() => {
    if (!cognitoId) return;

    const fetchAndProcess = async () => {
      try {
        const response = await fetch(
          `https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/production-log/active?cognito_id=${cognitoId}`
        );
        if (!response.ok) throw new Error("Failed to fetch production-log");
        const data = await response.json();
        if (!Array.isArray(data)) return;

        // Filter active lots with positive batchRemaining (stored as units) and compute units in stock per recipe
        const filtered = data.filter((row) => Number(row.batchRemaining) > 0);

        const grouped = filtered.reduce((acc, row) => {
          const rec = row.recipe;
          const rem = Number(row.batchRemaining) || 0; // stored units
          const waste = Number(row.units_of_waste) || 0;
          const available = Math.max(0, rem - waste);

          if (!acc[rec]) {
            acc[rec] = {
              recipe: rec,
              totalUnits: available,
              batchCode: row.batchCode,
            };
          } else {
            acc[rec].totalUnits += available;
          }
          return acc;
        }, {});

        const processed = Object.values(grouped).map((g, idx) => ({
          id: `${g.recipe}-${idx}`,
          recipe: g.recipe,
          unitsInStock: g.totalUnits,
          batchCode: g.batchCode,
        }));

        setRecipeInventory(processed);
      } catch (err) {
        console.error("Error processing recipe inventory:", err);
      }
    };

    fetchAndProcess();
  }, [cognitoId, setRecipeInventory]);

  const columns = useMemo(
    () => [
      // Date column removed per request
      { field: "recipe", headerName: "Recipe Name", flex: 1 },
      {
        field: "unitsInStock",
        headerName: "Units in Stock",
        type: "number",
        align: "left",
        headerAlign: "left",
        flex: 1,
      },
      { field: "batchCode", headerName: "Batch Code", flex: 1 },
    ],
    []
  );

  const barChartData = recipeInventory.map((item) => ({
    recipe: item.recipe,
    units: item.unitsInStock,
  }));

  return (
    <Box m="20px">
      {/* Scoped styling to prevent theme overrides */}
      <style>{`
        .ri-card {
          border: 1px solid ${brand.border};
          background: ${brand.surface};
          border-radius: 16px;
          box-shadow: ${brand.shadow};
          overflow: hidden;
        }
        .ri-toolbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px; border-bottom: 1px solid ${brand.border};
          background: ${brand.surface};
        }
        .pill-icon {
          background: #f1f5f9;
          border: 1px solid ${brand.border};
          width: 40px; height: 40px; border-radius: 999px;
        }
        .pill-icon:hover { background: #e2e8f0; }
        .toolbar-right { display: flex; gap: 8px; align-items: center; }

        /* Alternating row colors */
        .ri-even-row { background-color: ${brand.surface} !important; }
        .ri-odd-row  { background-color: ${brand.surfaceMuted} !important; }

        /* Keep hover consistent and readable */
        .MuiDataGrid-row:hover { background-color: ${brand.surfaceMuted} !important; }
      `}</style>

      {/* Card container */}
      <Box className="ri-card" mt={2}>
        {/* Toolbar with Bar Chart toggle and Info button */}
        <Box className="ri-toolbar">
          <Typography sx={{ fontWeight: 800, color: brand.text }}>
            Recipe Inventory
          </Typography>

          <Box className="toolbar-right">
            <IconButton
              aria-label="Info about editability"
              onClick={() => setInfoOpen(true)}
              className="pill-icon"
              sx={{ color: brand.text }}
            >
              <InfoOutlinedIcon />
            </IconButton>

            <IconButton
              onClick={() => setDrawerOpen(true)}
              aria-label="Open bar chart"
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
            "& .MuiDataGrid-row:hover": {
              backgroundColor: brand.surfaceMuted,
            },
            "& .MuiDataGrid-footerContainer": {
              borderTop: `1px solid ${brand.border}`,
              background: brand.surface,
            },
          }}
        >
          <DataGrid
            rows={recipeInventory}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            getRowId={(row) => row.id}
            disableSelectionOnClick
            getRowClassName={(params) =>
              (params.indexRelativeToCurrentPage % 2 === 0) ? "ri-even-row" : "ri-odd-row"
            }
          />
        </Box>
      </Box>

      {/* Drawer with Bar Chart */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: "88%",
            borderRadius: "20px 0 0 20px",
            border: `1px solid ${brand.border}`,
            boxShadow: brand.shadow,
            overflow: "hidden",
          },
        }}
      >
        {/* Drawer header (gradient) */}
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
            Units in Stock Chart
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
            keys={["units"]}
            indexBy="recipe"
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
            These rows are not directly editable from this view. If you need to change
            the units in stock for a recipe, please add, delete or edit the corresponding
            production log rows in the Production Log screen. This view is an aggregate
            read-only summary computed from active production log entries.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1 }}>
          <Button onClick={() => setInfoOpen(false)} sx={{ textTransform: "none" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RecipeInventory;
