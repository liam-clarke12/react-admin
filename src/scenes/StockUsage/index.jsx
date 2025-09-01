// src/scenes/usage/StockUsage.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";

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

const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

/* ===== Tiny toast (optional) ===== */
function Toast({ open, onClose, children }) {
  React.useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [open, onClose]);
  return (
    <div aria-live="polite" className={`su-toast ${open ? "show" : ""}`} role="status">
      <div className="su-toast-inner">{children}</div>
    </div>
  );
}

const StockUsage = () => {
  const theme = useTheme();
  const { cognitoId } = useAuth();
  const [stockUsage, setStockUsage] = useState([]);

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerHeader, setDrawerHeader] = useState("");
  const [drawerItems, setDrawerItems] = useState([]); // array of strings
  const [drawerMode, setDrawerMode] = useState("ingredients"); // 'ingredients' | 'barcodes'

  // Selection + delete prompt
  const [selectedRows, setSelectedRows] = useState([]); // DataGrid row IDs
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  // Toast
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const fetchStockUsage = useCallback(async () => {
    if (!cognitoId) return;

    try {
      const url = `${API_BASE}/stock-usage/${encodeURIComponent(cognitoId)}`;
      const response = await axios.get(url);
      if (!Array.isArray(response.data)) return;

      const groupedData = {};
      response.data.forEach((item) => {
        // Expect API to provide a list of underlying stock_usage IDs for this usage group
        const usageIds = item?.ids || item?.stock_usage_ids || [];

        const key = `${item.recipe_name}-${item.production_log_date}-${item.batchCode}`;
        if (!groupedData[key]) {
          groupedData[key] = {
            id: key,
            date: item.production_log_date,
            recipeName: item.recipe_name,
            batchCode: item.batchCode,
            batchesProduced: item.batchesProduced,
            ingredients: [],
            barcodes: [],
            ids: Array.isArray(usageIds) ? [...usageIds] : [],
          };
        } else {
          if (Array.isArray(usageIds)) groupedData[key].ids.push(...usageIds);
        }

        if (!Array.isArray(item.ingredients)) return;
        item.ingredients.forEach((ingredient) => {
          const totalQuantity = ingredient.quantity * item.batchesProduced;
          groupedData[key].ingredients.push(
            `${ingredient.ingredient_name}: ${totalQuantity}`
          );
          groupedData[key].barcodes.push(
            `${ingredient.ingredient_name}: ${ingredient.ingredient_barcodes}`
          );
        });
      });

      // collapse + de-dupe IDs per group
      const formattedData = Object.values(groupedData).map((entry) => ({
        ...entry,
        ids: Array.from(new Set(entry.ids)),
        ingredients: entry.ingredients.join("; "),
        barcodes: entry.barcodes.join("; "),
      }));

      setStockUsage(formattedData);
    } catch (error) {
      console.error("[StockUsage] Error fetching stock usage:", error.message);
    }
  }, [cognitoId]);

  useEffect(() => {
    fetchStockUsage();
  }, [fetchStockUsage]);

  // Drawer helpers
  const handleDrawerOpen = (header, content) => {
    const mode = header.toLowerCase().includes("barcode")
      ? "barcodes"
      : "ingredients";
    setDrawerMode(mode);
    setDrawerHeader(header);

    let items = [];
    if (Array.isArray(content)) {
      items = content;
    } else if (typeof content === "string" && content.length) {
      items = content.split("; ").filter(Boolean);
    }
    setDrawerItems(items);
    setDrawerOpen(true);
  };
  const handleDrawerClose = () => setDrawerOpen(false);

  // Selected row objects
  const selectedRowObjs = useMemo(() => {
    const map = new Map(stockUsage.map((r) => [r.id, r]));
    return selectedRows.map((sid) => map.get(sid)).filter(Boolean);
  }, [selectedRows, stockUsage]);

  // Flatten all underlying stock_usage IDs from selected grouped rows
  const flatSelectedIds = useMemo(() => {
    const all = [];
    for (const r of selectedRowObjs) if (Array.isArray(r?.ids)) all.push(...r.ids);
    return Array.from(new Set(all));
  }, [selectedRowObjs]);

  const columns = useMemo(
    () => [
      { field: "date", headerName: "Date", flex: 1 },
      { field: "recipeName", headerName: "Recipe Name", flex: 1 },
      {
        field: "ingredients",
        headerName: "Ingredients",
        flex: 1,
        renderCell: (params) => (
          <Typography
            sx={{
              cursor: "pointer",
              color: brand.primary,
              fontWeight: 600,
              "&:hover": { color: brand.primaryDark },
            }}
            onClick={() =>
              handleDrawerOpen("Ingredients", params.row.ingredients)
            }
          >
            Show Ingredients
          </Typography>
        ),
      },
      { field: "batchCode", headerName: "Batch Code", flex: 1 },
      {
        field: "barcodes",
        headerName: "Barcodes",
        flex: 1,
        renderCell: (params) => (
          <Typography
            sx={{
              cursor: "pointer",
              color: brand.primary,
              fontWeight: 600,
              "&:hover": { color: brand.primaryDark },
            }}
            onClick={() => handleDrawerOpen("Barcodes", params.row.barcodes)}
          >
            Show Barcodes
          </Typography>
        ),
      },
    ],
    []
  );

  /* === Delete flow (matches Production Log) === */
  const openDeletePrompt = () => {
    if (selectedRows.length === 0) return;
    setOpenConfirmDialog(true);
  };

  const handleDeleteSelectedRows = async () => {
    if (!cognitoId || flatSelectedIds.length === 0) {
      setOpenConfirmDialog(false);
      setToastMsg(flatSelectedIds.length === 0 ? "Selected rows have no deletable IDs." : "No user id.");
      setToastOpen(true);
      return;
    }

    // Debug visibility
    console.log("[StockUsage] selected rows:", selectedRowObjs);
    console.log("[StockUsage] sending delete ids:", flatSelectedIds, "cognito_id:", cognitoId);

    try {
      const payload = { ids: flatSelectedIds, cognito_id: cognitoId };
      const res = await axios.post(`${API_BASE}/stock-usage/delete`, payload);
      await fetchStockUsage();
      setSelectedRows([]);
      setOpenConfirmDialog(false);
      setToastMsg(`Deleted ${res?.data?.deleted ?? flatSelectedIds.length} usage row(s).`);
      setToastOpen(true);
    } catch (err) {
      console.error("[StockUsage] Delete failed:", err);
      setOpenConfirmDialog(false);
      setToastMsg("Delete failed. Please try again.");
      setToastOpen(true);
    }
  };

  return (
    <Box m="20px">
      {/* Scoped styles */}
      <style>{`
        .su-card {
          border: 1px solid ${brand.border};
          background: ${brand.surface};
          border-radius: 16px;
          box-shadow: ${brand.shadow};
          overflow: hidden;
        }
        .su-toolbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px; border-bottom: 1px solid ${brand.border};
          background: ${brand.surface};
        }

        /* Toast */
        .su-toast {
          position: fixed; top: 16px; right: 16px; transform: translateY(-20px); opacity: 0;
          transition: all .2s ease; z-index: 60; pointer-events: none;
        }
        .su-toast.show { transform: translateY(0); opacity: 1; }
        .su-toast-inner {
          background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46;
          padding: 10px 12px; border-radius: 10px; font-weight: 700; box-shadow: ${brand.shadow};
        }
      `}</style>

      {/* Card */}
      <Box className="su-card" mt={2}>
        {/* Toolbar with gradient circular delete icon (exact look) */}
        <Box className="su-toolbar">
          <Typography sx={{ fontWeight: 800, color: brand.text }}>
            Stock Usage
          </Typography>

          <IconButton
            aria-label="Delete selected"
            onClick={openDeletePrompt}
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
            rows={stockUsage}
            columns={columns}
            getRowId={(row) => row.id}
            checkboxSelection
            disableRowSelectionOnClick
            onRowSelectionModelChange={(model) => setSelectedRows(model)}
            rowSelectionModel={selectedRows}
          />
        </Box>
      </Box>

      {/* Delete confirmation dialog (matches Production Log) */}
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

      {/* Toast */}
      <Toast open={toastOpen} onClose={() => setToastOpen(false)}>
        {toastMsg}
      </Toast>

      {/* Drawer — minimal style */}
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
        {/* Gradient header */}
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

        {/* Body */}
        <Box sx={{ background: brand.surface, p: 2 }}>
          <List disablePadding>
            {drawerItems.length === 0 ? (
              <Typography sx={{ color: brand.subtext, px: 1 }}>
                No data available
              </Typography>
            ) : (
              drawerItems.map((raw, idx) => {
                let primaryText = raw;
                let secondary = null;
                let pill = null;

                if (drawerMode === "ingredients" && typeof raw === "string" && raw.includes(":")) {
                  const [name, qty] = raw.split(":");
                  primaryText = name.trim();
                  pill = (qty || "").trim();
                } else if (drawerMode === "barcodes" && typeof raw === "string" && raw.includes(":")) {
                  const [name, codes] = raw.split(":");
                  primaryText = name.trim();
                  secondary = (codes || "").trim();
                }

                return (
                  <Box
                    key={idx}
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
                        pill ? (
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
                              maxWidth: 160,
                              textAlign: "right",
                            }}
                          >
                            {pill}
                          </Box>
                        ) : null
                      }
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <CheckRoundedIcon sx={{ color: brand.primary }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={primaryText}
                        secondary={secondary}
                        primaryTypographyProps={{ sx: { color: brand.text, fontWeight: 600 } }}
                        secondaryTypographyProps={{ sx: { color: brand.subtext, mt: 0.5, wordBreak: "break-word" } }}
                      />
                    </ListItem>
                  </Box>
                );
              })
            )}
          </List>
        </Box>
      </Drawer>
    </Box>
  );
};

export default StockUsage;
