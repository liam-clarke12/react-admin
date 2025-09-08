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
  TextField,
  Divider,
  Stack,
  Card,
  CardContent,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import CloseIcon from "@mui/icons-material/Close";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRowMeta, setSelectedRowMeta] = useState(null);

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
  const handleDrawerOpen = (header, content, meta = null) => {
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
    setSelectedRowMeta(meta);
    setSearchTerm("");
    setDrawerOpen(true);
  };
  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedRowMeta(null);
    setDrawerItems([]);
    setSearchTerm("");
  };

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
              handleDrawerOpen("Ingredients", params.row.ingredients, {
                recipe: params.row.recipeName,
                date: params.row.date,
                batchCode: params.row.batchCode,
                recipients: params.row.recipeName,
              })
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
            onClick={() =>
              handleDrawerOpen("Barcodes", params.row.barcodes, {
                recipe: params.row.recipeName,
                date: params.row.date,
                batchCode: params.row.batchCode,
                recipients: params.row.recipeName,
              })
            }
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

  // Drawer derived values
  const filteredDrawerItems = drawerItems.filter((it) =>
    String(it).toLowerCase().includes(searchTerm.trim().toLowerCase())
  );
  const totalItemsCount = filteredDrawerItems.length;

  // Export helper (CSV)
  const exportDrawerCsv = () => {
    try {
      const rows = [["Item", "Value"]];
      drawerItems.forEach((raw) => {
        if (typeof raw === "string" && raw.includes(":")) {
          const [left, right] = raw.split(":");
          rows.push([left.trim(), (right || "").trim()]);
        } else {
          rows.push([String(raw), ""]);
        }
      });
      const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filenameBase = (selectedRowMeta?.recipe || selectedRowMeta?.batchCode || "stock-usage")
        .replace(/\s+/g, "-")
        .toLowerCase();
      a.download = `${filenameBase}-${drawerHeader.toLowerCase()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed", e);
      setToastMsg("Export failed");
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

      {/* Redesigned Drawer (supports both Ingredients & Barcodes) */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleDrawerClose}
        PaperProps={{
          sx: {
            width: 420,
            borderRadius: "20px 0 0 20px",
            border: `1px solid ${brand.border}`,
            boxShadow: "0 24px 48px rgba(15,23,42,0.12)",
            overflow: "hidden",
          },
        }}
      >
        {/* Header with gradient */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            px: 2,
            py: 1.25,
            color: "#fff",
            background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                background: "rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MenuOutlinedIcon sx={{ color: "#fff" }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#fff" }}>
                {drawerHeader}
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.9)" }}>
                {selectedRowMeta?.recipe ? `${selectedRowMeta.recipe} · ${selectedRowMeta?.date ?? ""}` : selectedRowMeta?.batchCode ?? ""}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <IconButton
              size="small"
              onClick={exportDrawerCsv}
              sx={{
                color: "#fff",
                borderRadius: 1,
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <FileDownloadOutlinedIcon fontSize="small" />
            </IconButton>

            <IconButton onClick={handleDrawerClose} sx={{ color: "#fff" }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ background: brand.surface, p: 2, height: "calc(100% - 88px)" }}>
          {/* Meta card */}
          <Card
            variant="outlined"
            sx={{
              borderColor: brand.border,
              background: brand.surface,
              borderRadius: 2,
              mb: 2,
            }}
          >
            <CardContent sx={{ p: 1.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography sx={{ color: brand.subtext, fontSize: 12, fontWeight: 700 }}>
                    Source
                  </Typography>
                  <Typography sx={{ color: brand.text, fontWeight: 800 }}>
                    {selectedRowMeta?.recipe || "—"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: brand.subtext }}>
                    Batch: {selectedRowMeta?.batchCode ?? "—"}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography sx={{ color: "text.secondary", fontSize: 12 }}>Items</Typography>
                  <Typography sx={{ color: brand.primary, fontWeight: 900, fontSize: 22 }}>
                    {totalItemsCount}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Search + Reset */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search item or filter"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  background: "#fff",
                  borderColor: brand.border,
                },
              }}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setSearchTerm("");
                // reset drawer items to original content (best-effort)
                // if selectedRowMeta exists, we can attempt to re-open to rebuild items
                // (but we keep it simple: do nothing else)
              }}
              sx={{ textTransform: "none", borderRadius: 1.5 }}
            >
              Reset
            </Button>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          {/* Items list */}
          {filteredDrawerItems.length === 0 ? (
            <Typography sx={{ color: brand.subtext }}>No items available.</Typography>
          ) : (
            <List disablePadding>
              {filteredDrawerItems.map((raw, idx) => {
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
                              maxWidth: 220,
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
              })}
            </List>
          )}
        </Box>

        {/* Footer actions */}
        <Box
          sx={{
            p: 2,
            borderTop: `1px solid ${brand.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: brand.surface,
          }}
        >
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              onClick={handleDrawerClose}
              sx={{
                textTransform: "none",
                borderRadius: 999,
                px: 2,
                border: `1px solid ${brand.border}`,
              }}
            >
              Close
            </Button>

            <Button
              onClick={() => {
                // context-specific confirm action (example: close for now)
                handleDrawerClose();
              }}
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
              Confirm & Close
            </Button>
          </Box>

          <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
            {totalItemsCount} items
          </Typography>
        </Box>
      </Drawer>
    </Box>
  );
};

export default StockUsage;
