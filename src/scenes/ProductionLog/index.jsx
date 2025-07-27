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

  // Fetch recipes to build a map of recipeName -> units_per_batch
  useEffect(() => {
    if (!cognitoId) return;
    const fetchRecipeData = async () => {
      console.log(`Fetching recipes for user ${cognitoId}`);
      try {
        const res = await fetch(
          `https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/recipes?cognito_id=${cognitoId}`
        );
        if (!res.ok) throw new Error("Failed to fetch recipes");
        const data = await res.json();
        // Assume data = [{ id, recipe_name, units_per_batch, user_id }, ...]
        const map = {};
        data.forEach((r) => {
          map[r.recipe_name] = Number(r.units_per_batch) || 0;
        });
        console.log("Built recipes map:", map);
        setRecipesMap(map);
      } catch (err) {
        console.error("Error fetching recipes:", err);
      }
    };
    fetchRecipeData();
  }, [cognitoId]);

  // Fetch production logs and compute unitsRemaining
  useEffect(() => {
    if (!cognitoId) return;
    const fetchProductionLogData = async () => {
      console.log(`Fetching production log for user: ${cognitoId}`);
      try {
        const response = await fetch(
          `https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/production-log?cognito_id=${cognitoId}`
        );
        if (!response.ok) throw new Error(`Fetch failed with status ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data)) {
          console.error("Expected array, got:", data);
          return;
        }
        // Sanitize and merge units_per_batch
        const sanitized = data.map((row, idx) => {
          const batchesProduced = Number(row.batchesProduced) || 0;
          const batchRemaining = Number(row.batchRemaining) || 0;
          const upb = recipesMap[row.recipe] || 0;
          return {
            date: row.date,
            recipe: row.recipe,
            batchesProduced,
            batchRemaining,
            unitsRemaining: batchRemaining * upb,
            batchCode: row.batchCode || `gen-${idx}`,
            id: row.batchCode || `gen-${idx}-${Date.now()}`,
          };
        });
        console.log("Sanitized logs with unitsRemaining:", sanitized);
        setProductionLogs(sanitized);
      } catch (error) {
        console.error("Error fetching production log:", error);
      }
    };
    // Only fetch logs once recipesMap is populated to ensure correct calculation
    if (Object.keys(recipesMap).length > 0) {
      fetchProductionLogData();
    }
  }, [cognitoId, recipesMap]);

  const handleRowSelection = (selectedIds) => setSelectedRows(selectedIds);

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
      console.error(err);
    }
  };

  return (
    <Box m="20px">
      <Header title="DAILY PRODUCTION" subtitle="Track daily stock produced" />
      <Box sx={{ position: "relative", mb: 2 }}>
        <IconButton
          onClick={() => setOpenConfirmDialog(true)}
          color="error"
          sx={{ position: "absolute", top: 0, right: 0, color: colors.blueAccent[500], opacity: selectedRows.length === 0 ? 0.5 : 1 }}
          disabled={selectedRows.length === 0}
        >
          <DeleteIcon />
        </IconButton>
      </Box>

      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete the selected row(s)?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)} sx={{ color: colors.blueAccent[500] }}>
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
          "& .MuiDataGrid-root": { border: "none", minWidth: "650px" },
          "& .MuiDataGrid-cell": { borderBottom: "none" },
          "& .MuiDataGrid-columnHeaders": { backgroundColor: colors.blueAccent[700], borderBottom: "none" },
          "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
          "& .MuiDataGrid-footerContainer": { borderTop: "none", backgroundColor: colors.blueAccent[700] },
        }}
      >
        <DataGrid
          rows={productionLogs}
          columns={[
            { field: "date", headerName: "Date", flex: 1, editable: true },
            { field: "recipe", headerName: "Recipe Name", flex: 1, editable: true },
            { field: "batchesProduced", headerName: "Batches Produced", type: "number", flex: 1, editable: true, align: "left" },
            { field: "unitsRemaining", headerName: "Units Remaining", type: "number", flex: 1, editable: false, align: "left" },
            { field: "batchCode", headerName: "Batch Code", flex: 1 },
          ]}
          checkboxSelection
          onRowSelectionModelChange={handleRowSelection}
          getRowId={(row) => row.id}
        />
      </Box>
    </Box>
  );
};

export default ProductionLog;
