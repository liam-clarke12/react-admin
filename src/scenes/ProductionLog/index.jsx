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
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

  useEffect(() => {
    if (!cognitoId) {
      console.log("ProductionLog: No cognitoId available, skipping fetch.");
      return;
    }

    const fetchProductionLogData = async () => {
      console.log(`Fetching production log for user: ${cognitoId}`);
      try {
        const response = await fetch(
          `https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/production-log?cognito_id=${cognitoId}`
        );
        console.log("Fetch status:", response.status);
        if (!response.ok) throw new Error(`Fetch failed with status ${response.status}`);

        const data = await response.json();
        console.log("Raw production log data:", data);

        if (!Array.isArray(data)) {
          console.error("Expected an array of production logs, got:", data);
          return;
        }

        // Sanitize and enforce fields
        const sanitized = data.map((row, idx) => ({
          date: row.date,
          recipe: row.recipe,
          batchesProduced: Number(row.batchesProduced) || 0,
          batchRemaining: Number(row.batchRemaining) || 0,
          batchCode: row.batchCode || `gen-${idx}`,
          id: row.batchCode || `gen-${idx}-${Date.now()}`,
        }));
        console.log("Sanitized production logs:", sanitized);
        setProductionLogs(sanitized);
        console.log("Set productionLogs state with sanitized data.");
      } catch (error) {
        console.error("Error fetching production log:", error);
      }
    };

    fetchProductionLogData();
  }, [cognitoId]);

  const handleRowSelection = (selectedIds) => {
    console.log("Selected rows:", selectedIds);
    setSelectedRows(selectedIds);
  };

  const handleDeleteSelectedRows = async () => {
    console.log("Attempting to delete selected rows:", selectedRows);
    if (!cognitoId) return;

    const rowsToDelete = productionLogs.filter((row) =>
      selectedRows.includes(row.batchCode)
    );

    if (rowsToDelete.length === 0) {
      console.warn("No rows found to delete for selected codes.");
      return;
    }

    try {
      await Promise.all(
        rowsToDelete.map(async (row) => {
          console.log("Deleting row with batchCode:", row.batchCode);
          const response = await fetch(
            "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/delete-production-log",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ batchCode: row.batchCode, cognito_id: cognitoId }),
            }
          );
          if (!response.ok) throw new Error(`Failed to delete ${row.batchCode}`);
        })
      );

      setProductionLogs((prev) =>
        prev.filter((row) => !selectedRows.includes(row.batchCode))
      );
      setSelectedRows([]);
      setOpenConfirmDialog(false);
    } catch (err) {
      console.error("Error deleting rows:", err);
    }
  };

  return (
    <Box m="20px">
      <Header title="DAILY PRODUCTION" subtitle="Track daily stock produced" />

      <Box sx={{ position: "relative", mb: 2, height: 2 }}>
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
            { field: "batchRemaining", headerName: "Units Remaining", type: "number", flex: 1, editable: true, align: "left" },
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
