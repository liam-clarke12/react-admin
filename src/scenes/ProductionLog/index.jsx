import {
  Box,
  useTheme,
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import { tokens } from "../../themes";
import Header from "../../components/Header";
import { useAuth } from "../../contexts/AuthContext";
import { useEffect, useState } from "react";

const ProductionLog = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { cognitoId } = useAuth();
  const [productionLogs, setProductionLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

  useEffect(() => {
    const fetchProductionLogData = async () => {
      try {
        if (!cognitoId) return;
        const response = await fetch(`http://localhost:5000/api/production-log?cognito_id=${cognitoId}`);
        if (!response.ok) throw new Error("Failed to fetch data");
        const data = await response.json();
        setProductionLogs(data);
      } catch (error) {
        console.error("Error fetching production log:", error);
      } finally {
        setLoading(false);
      }
    };
    if (cognitoId) fetchProductionLogData();
  }, [cognitoId]);

  const handleRowSelection = (selectedIds) => {
    setSelectedRows(selectedIds);
  };

  const handleDeleteSelectedRows = async () => {
    try {
      if (!cognitoId) {
        console.error("Cognito ID is missing.");
        return;
      }
  
      console.log("Selected rows for deletion:", selectedRows);
  
      const rowsToDelete = productionLogs.filter((row) =>
        selectedRows.includes(row.batchCode) // Ensure correct identifier
      );
  
      if (rowsToDelete.length === 0) {
        console.error("No rows selected for deletion.");
        return;
      }
  
      await Promise.all(
        rowsToDelete.map(async (row) => {
          const response = await fetch("http://localhost:5000/api/delete-production-log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ batchCode: row.batchCode, cognito_id: cognitoId }), // Use batchCode
          });
  
          if (!response.ok) {
            throw new Error(`Failed to delete row with batchCode ${row.batchCode}`);
          }
        })
      );
  
      // Update state after successful deletion
      const updatedRows = productionLogs.filter(
        (row) => !selectedRows.includes(row.batchCode)
      );
      setProductionLogs(updatedRows);
      setSelectedRows([]); // Clear selection
      handleCloseConfirmDialog();
    } catch (error) {
      console.error("Error deleting rows:", error);
    }
  };
  
  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
  };

  if (loading) return <div>Loading...</div>;

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
        <DialogContent>Are you sure you want to delete the selected row(s)?</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)} sx={{ color: colors.blueAccent[500] }}>Cancel</Button>
          <Button onClick={handleDeleteSelectedRows} color="error">Confirm</Button>
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
          rows={productionLogs.map((row, index) => ({ ...row, id: row.batchCode || `generated-${index}-${Date.now()}` }))}
          columns={[
            { field: "date", headerName: "Date", flex: 1, editable: true },
            { field: "recipe", headerName: "Recipe Name", flex: 1, editable: true },
            { field: "batchesProduced", headerName: "Batches Produced", type: "number", flex: 1, editable: true, align: "left" },
            { field: "batchRemaining", headerName: "Units Remaining", type: "number", flex: 1, editable: true, align: "left" },
            { field: "batchCode", headerName: "Batch Code", flex: 1 },
          ]}
          checkboxSelection
          onRowSelectionModelChange={(newSelection) => handleRowSelection(newSelection)}
          getRowId={(row) => row.id}
        />
      </Box>
    </Box>
  );
};

export default ProductionLog;
