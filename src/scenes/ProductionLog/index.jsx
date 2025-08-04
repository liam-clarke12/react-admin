import React, { useState, useEffect } from "react";
import {
  Box,
  useTheme,
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import { tokens } from "../../themes";
import Header from "../../components/Header";
import { useAuth } from "../../contexts/AuthContext";

const ProductionLog = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { cognitoId } = useAuth();
  const [productionLogs, setProductionLogs] = useState([]);
  const [recipesMap, setRecipesMap] = useState({});
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

  // Fetch recipe data
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

  // Fetch production logs and compute updated fields
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
          const unitsOfWaste = Number(row.unitsOfWaste) || 0;
          const upb = recipesMap[row.recipe] ?? 0;
          const unitsRemaining = (batchRemaining * upb) - unitsOfWaste;

          return {
            date: row.date,
            recipe: row.recipe,
            batchesProduced,
            batchRemaining,
            unitsOfWaste,
            unitsRemaining,
            batchCode: row.batchCode || `gen-${idx}`,
            id: row.batchCode || `gen-${idx}-${Date.now()}`
          };
        });

        setProductionLogs(sanitized);
      } catch (error) {
        console.error("Error fetching production log:", error);
      }
    };

    fetchProductionLogData();
  }, [cognitoId, recipesMap]);

  const handleRowSelection = (selectedIds) => {
    setSelectedRows(selectedIds);
  };

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
              body: JSON.stringify({ batchCode: row.batchCode, cognito_id: cognitoId })
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

  return (
    <Box m="20px">
      <Header title="DAILY PRODUCTION" subtitle="Track daily stock produced" />

      <Box sx={{ position: "relative", mb: 2 }}>
        <IconButton
          onClick={() => setOpenConfirmDialog(true)}
          color="error"
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            color: colors.blueAccent[500],
            opacity: selectedRows.length === 0 ? 0.5 : 1
          }}
          disabled={selectedRows.length === 0}
        >
          <DeleteIcon />
        </IconButton>
      </Box>

      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the selected row(s)?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenConfirmDialog(false)}
            sx={{ color: colors.blueAccent[500] }}
          >
            Cancel
          </Button>
          <Button onClick={handleDeleteSelectedRows} color="error">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Box
        m="40px 0 0 0"
        height="75vh"
        sx={{
          overflowX: "auto",
          "& .MuiDataGrid-root": { border: "none", minWidth: "750px" },
          "& .MuiDataGrid-cell": { borderBottom: "none" },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none"
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400]
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.blueAccent[700]
          }
        }}
      >
        <DataGrid
          rows={productionLogs}
          getRowId={(row) => row.id}
          checkboxSelection
          onRowSelectionModelChange={handleRowSelection}
          columns={[
            { field: "date", headerName: "Date", flex: 1 },
            { field: "recipe", headerName: "Recipe Name", flex: 1 },
            {
              field: "batchesProduced",
              headerName: "Batches Produced",
              type: "number",
              flex: 1,
              align: "left",
              headerAlign: "left"
            },
            {
              field: "unitsOfWaste",
              headerName: "Units of Waste",
              type: "number",
              flex: 1,
              align: "left",
              headerAlign: "left"
            },
            {
              field: "unitsRemaining",
              headerName: "Units Remaining",
              type: "number",
              flex: 1,
              align: "left",
              headerAlign: "left"
            },
            { field: "batchCode", headerName: "Batch Code", flex: 1 }
          ]}
        />
      </Box>
    </Box>
  );
};

export default ProductionLog;
