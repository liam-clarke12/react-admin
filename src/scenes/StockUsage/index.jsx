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
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
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

/* ===== Tiny toast (matches production feel) ===== */
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

/* ===== Serious confirm modal (matches Production Log) ===== */
function ConfirmModal({ open, onCancel, onProceed, rowsPreview }) {
  if (!open) return null;
  return (
    <div className="su-modal-backdrop" onClick={onCancel}>
      <div
        className="su-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="su-modal-header">
          <h3>Delete Selected Usage</h3>
        </div>
        <div className="su-modal-body">
          <p className="su-warning">
            You are about to <strong>permanently delete</strong> the selected stock usage rows.
            This cannot be undone.
          </p>

          {rowsPreview?.length ? (
            <div className="su-preview">
              {rowsPreview.map((r, i) => (
                <div key={i} className="su-preview-row">
                  <div className="left">
                    <div className="name">{r.recipeName || "—"}</div>
                    <div className="sub">
                      {r.date || "—"} &nbsp;•&nbsp; {r.batchCode || "—"}
                    </div>
                  </div>
                  <div className="right">
                    <div className="pill">{(r.ids?.length ?? 0)} IDs</div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <p className="su-callout">
            Do you want to continue? This will remove the usage records associated with the selected
            rows from your database.
          </p>
        </div>
        <div className="su-modal-footer">
          <button type="button" className="btn ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn danger" onClick={onProceed}>
            Delete Selected
          </button>
        </div>
      </div>
    </div>
  );
}

const StockUsage = () => {
  const theme = useTheme();
  const { cognitoId } = useAuth();
  const [stockUsage, setStockUsage] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerHeader, setDrawerHeader] = useState("");
  const [drawerItems, setDrawerItems] = useState([]); // array of strings
  const [drawerMode, setDrawerMode] = useState("ingredients"); // 'ingredients' | 'barcodes'

  // selection + delete
  const [selection, setSelection] = useState([]); // DataGrid row IDs
  const [confirmOpen, setConfirmOpen] = useState(false);
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
        // If your API uses another key (e.g., stock_usage_ids), adjust below.
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
            // carry along all stock_usage IDs tied to this group
            ids: Array.isArray(usageIds) ? [...usageIds] : [],
          };
        } else {
          // merge IDs if multiple items in same group
          if (Array.isArray(usageIds)) {
            groupedData[key].ids.push(...usageIds);
          }
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

      // collapse and de-dupe IDs per group
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

  // Drawer helpers (minimal style)
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

  const selectedRows = useMemo(() => {
    const map = new Map(stockUsage.map((r) => [r.id, r]));
    return selection.map((sid) => map.get(sid)).filter(Boolean);
  }, [selection, stockUsage]);

  const flatSelectedIds = useMemo(() => {
    // Flatten all underlying stock_usage IDs from selected grouped rows
    const all = [];
    for (const r of selectedRows) {
      if (Array.isArray(r?.ids)) all.push(...r.ids);
    }
    // Unique
    return Array.from(new Set(all));
  }, [selectedRows]);

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

  const onDeleteClick = () => {
    if (selection.length === 0) {
      setToastMsg("No rows selected.");
      setToastOpen(true);
      return;
    }
    if (flatSelectedIds.length === 0) {
      setToastMsg("Selected rows have no deletable IDs.");
      setToastOpen(true);
      return;
    }
    setConfirmOpen(true);
  };

  const handleCancelDelete = () => {
    setConfirmOpen(false);
  };

  const handleProceedDelete = async () => {
    setConfirmOpen(false);
    try {
      const payload = { ids: flatSelectedIds, cognito_id: cognitoId };
      const res = await axios.post(`${API_BASE}/stock-usage/delete`, payload);
      // Refresh data
      await fetchStockUsage();
      // Clear selection
      setSelection([]);
      setToastMsg(
        `Deleted ${res?.data?.deleted ?? flatSelectedIds.length} usage row(s).`
      );
      setToastOpen(true);
    } catch (err) {
      console.error("[StockUsage] Delete failed:", err);
      setToastMsg("Delete failed. Please try again.");
      setToastOpen(true);
    }
  };

  return (
    <Box m="20px">
      {/* Scoped styles to prevent theme overrides */}
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
          gap: 12px;
        }
        .su-clear {
          text-transform: none; font-weight: 800; border-radius: 999px; padding: 6px 12px;
          border: 1px solid ${brand.border}; color: ${brand.text}; background: #f1f5f9;
        }
        .su-clear:hover { background: #e2e8f0; }

        /* Gradient delete pill (matches production style) */
        .su-delete {
          display: inline-flex; align-items: center; gap: 8px;
          border-radius: 999px; padding: 10px 14px; border: 0; cursor: pointer;
          font-weight: 800; color: #fff; text-transform: none;
          background: linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark});
          box-shadow: 0 8px 16px rgba(29,78,216,0.25), 0 2px 4px rgba(15,23,42,0.06);
          transition: transform .2s ease;
        }
        .su-delete:hover { transform: scale(1.06); background: linear-gradient(180deg, ${brand.primaryDark}, ${brand.primaryDark}); }
        .su-delete:disabled { opacity: .6; cursor: not-allowed; transform: none; }

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

        /* Modal (confirm) */
        .su-modal-backdrop {
          position: fixed; inset: 0; background: rgba(15,23,42,.55);
          display: flex; align-items: center; justify-content: center; z-index: 70;
        }
        .su-modal {
          width: min(640px, 94vw); background: ${brand.surface};
          border: 1px solid ${brand.border}; border-radius: 14px; box-shadow: ${brand.shadow}; overflow: hidden;
        }
        .su-modal-header {
          padding: 14px 16px;
          background: linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark});
          color: #fff; font-weight: 800;
        }
        .su-modal-body { padding: 16px; }
        .su-modal-footer {
          padding: 12px 16px; display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid ${brand.border};
        }
        .su-warning { color: #dc2626; font-weight: 800; margin-bottom: 12px; }
        .su-callout {
          background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412;
          padding: 10px 12px; border-radius: 8px; font-weight: 700;
        }
        .su-preview { display: grid; gap: 10px; margin-bottom: 12px; }
        .su-preview-row {
          display: flex; align-items: center; justify-content: space-between;
          border: 1px solid ${brand.border}; border-radius: 10px; padding: 10px 12px; background: ${brand.surfaceMuted};
        }
        .su-preview-row .name { font-weight: 800; color: ${brand.text}; }
        .su-preview-row .sub { font-size: 12px; color: ${brand.subtext}; }
        .su-preview-row .right .pill {
          border-radius: 999px; border: 1px solid ${brand.border}; background: #f1f5f9;
          padding: 4px 10px; font-size: 12px; font-weight: 700; color: ${brand.text};
        }
        .btn { border: 0; cursor: pointer; font-weight: 800; padding: 10px 14px; border-radius: 10px; }
        .btn.ghost { background: transparent; color: ${brand.text}; border: 1px solid ${brand.border}; }
        .btn.danger { color: #fff; background: linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark}); }
        .btn.danger:hover { background: linear-gradient(180deg, ${brand.primaryDark}, ${brand.primaryDark}); }
      `}</style>

      {/* Card container */}
      <Box className="su-card" mt={2}>
        {/* Toolbar with Clear + Delete Selected */}
        <Box className="su-toolbar">
          <Typography sx={{ fontWeight: 800, color: brand.text }}>
            Stock Usage
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <button
              className="su-delete"
              onClick={onDeleteClick}
              disabled={selection.length === 0}
              aria-label="Delete selected usage rows"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M3 6h18M9 6v12m6-12v12M4 6l1 14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2l1-14M8 6l1-2h6l1 2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Delete Selected
            </button>
            <Button className="su-clear" onClick={() => setStockUsage([])}>
              Clear Stock Usage
            </Button>
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
            onRowSelectionModelChange={(m) => setSelection(m)}
            rowSelectionModel={selection}
          />
        </Box>
      </Box>

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

        {/* Body: minimal list with ticks, + qty pill if "Ingredients" */}
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

      {/* Confirm modal */}
      <ConfirmModal
        open={confirmOpen}
        rowsPreview={selectedRows}
        onCancel={handleCancelDelete}
        onProceed={handleProceedDelete}
      />

      {/* Toast */}
      <Toast open={toastOpen} onClose={() => setToastOpen(false)}>
        {toastMsg}
      </Toast>
    </Box>
  );
};

export default StockUsage;
