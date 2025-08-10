// src/scenes/production/ProductionLog.jsx  (adjust the path/name to your project)
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  useTheme,
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
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

const ProductionLog = () => {
  const theme = useTheme();
  const { cognitoId } = useAuth();

  const [productionLogs, setProductionLogs] = useState([]);
  const [recipesMap, setRecipesMap] = useState({});
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

  // Fetch recipe data (unchanged behavior)
  useEffect(() => {
    if (!cognitoId) return;
    const fetchRecipeData = async () => {
      try {
        const res = await fetch(
          `https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/recipes?cognito_id=${cognitoId}`
        );
        if (!res.ok) throw new Error("Failed to fetch recipes");
        const data = await res.json();
        const map = {};
        data.forEach((r, idx) => {
          const key = r.recipe_name ?? r.recipe ?? r.name ?? `unknown_${idx}`;
          const upb = Number(r.units_per_batch) || 0;
          map[key] = upb;
        });
        setRecipesMap(map);
      } catch (err) {
        console.error("Error fetching recipes:", err);
      }
    };
    fetchRecipeData();
  }, [cognitoId]);

  // Fetch production logs and compute fields (same logic)
  useEffect(() => {
    if (!cognitoId || Object.keys(recipesMap).length === 0) return;
    const fetchProductionLogData = async () => {
      try {
        const response = await fetch(
          `https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/production-log?cognito_id=${cognitoId}`
        );
        if (!response.ok) throw new Error(`Fetch failed with status ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data)) return;

        const sanitized = data.map((row, idx) => {
          const batchesProduced = Number(row.batchesProduced) || 0;
          const batchRemaining = Number(row.batchRemaining) || 0;
          const unitsOfWaste = Number(row.units_of_waste) || 0;
          const upb = recipesMap[row.recipe] ?? 0;
          const unitsRemaining = Number(row.batchRemaining) - unitsOfWaste;
          return {
            date: row.date,
            recipe: row.recipe,
            batchesProduced,
            batchRemaining,
            unitsOfWaste,
            unitsRemaining,
            batchCode: row.batchCode || `gen-${idx}`,
            id: row.batchCode || `gen-${idx}-${Date.now()}`,
          };
        });

        setProductionLogs(sanitized);
      } catch (error) {
        console.error("Error fetching production log:", error);
      }
    };

    fetchProductionLogData();
  }, [cognitoId, recipesMap]);

  const handleDeleteSelectedRows = async () => {
    if (!cognitoId || selectedRows.length === 0) return;
    const rowsToDelete = productionLogs.filter((row) => selectedRows.includes(row.batchCode));
    if (rowsToDelete.length === 0) return;

    try {
      await Promise.all(
        rowsToDelete.map(async (row) => {
          const res = await fetch(
            "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/delete-production-log",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ batchCode: row.batchCode, cognito_id: cognitoId }),
            }
          );
          if (!res.ok) throw new Error(`Failed to delete ${row.batchCode}`);
        })
      );
      setProductionLogs((prev) => prev.filter((row) => !selectedRows.includes(row.batchCode)));
      setSelectedRows([]);
      setOpenConfirmDialog(false);
    } catch (err) {
      console.error("Error deleting rows:", err);
    }
  };

  // Columns (unchanged semantics)
  const columns = useMemo(
    () => [
      { field: "date", headerName: "Date", flex: 1 },
      { field: "recipe", headerName: "Recipe Name", flex: 1 },
      {
        field: "batchesProduced",
        headerName: "Batches Produced",
        type: "number",
        flex: 1,
        align: "left",
        headerAlign: "left",
      },
      {
        field: "unitsOfWaste",
        headerName: "Units of Waste",
        type: "number",
        flex: 1,
        align: "left",
        headerAlign: "left",
      },
      {
        field: "unitsRemaining",
        headerName: "Units Remaining",
        type: "number",
        flex: 1,
        align: "left",
        headerAlign: "left",
      },
      { field: "batchCode", headerName: "Batch Code", flex: 1 },
    ],
    []
  );

  return (
    <Box m="20px">
      {/* Local scoped styles so global theme can't override */}
      <style>{`
        .pl-card {
          border: 1px solid ${brand.border};
          background: ${brand.surface};
          border-radius: 16px;
          box-shadow: ${brand.shadow};
          overflow: hidden;
        }
        .pl-toolbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px; border-bottom: 1px solid ${brand.border};
          background: ${brand.surface};
        }
      `}</style>
      <Box className="pl-card" mt={2}>
        {/* Toolbar with gradient delete icon */}
        <Box className="pl-toolbar">
          <Typography sx={{ fontWeight: 800, color: brand.text }}>
            Production Log
          </Typography>

          <IconButton
            aria-label="Delete selected"
            onClick={() => setOpenConfirmDialog(true)}
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
            rows={productionLogs}
            getRowId={(row) => row.id}
            checkboxSelection
            // DataGrid returns an array of selected ids:
            onRowSelectionModelChange={(model) => setSelectedRows(model)}
            columns={columns}
          />
        </Box>
      </Box>

      {/* Delete confirmation dialog */}
      <Dialog
        open={openConfirmDialog}
        onClose={() => setOpenConfirmDialog(false)}
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
          <Button onClick={() => setOpenConfirmDialog(false)} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteSelectedRows}
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

export default ProductionLog;
