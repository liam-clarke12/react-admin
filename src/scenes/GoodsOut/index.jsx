// src/scenes/goodsout/GoodsOut.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  Divider,
  Stack,
  Card,
  CardContent,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
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

const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

/** Toggle verbose logging */
const DEBUG = true;
const dlog = (...a) => DEBUG && console.log("[GoodsOut]", ...a);
const dgroup = (l) => DEBUG && console.groupCollapsed(l);
const dgroupEnd = () => DEBUG && console.groupEnd();

const GoodsOut = () => {
  const { cognitoId } = useAuth();

  const [goodsOut, setGoodsOut] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerHeader, setDrawerHeader] = useState("");
  const [drawerItems, setDrawerItems] = useState([]); // [{ code, unitsLabel }]
  const [selectedRow, setSelectedRow] = useState(null);

  // Selection + delete prompt
  const [selectedRows, setSelectedRows] = useState([]); // DataGrid row IDs
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  // Drawer local UI state
  const [searchTerm, setSearchTerm] = useState("");

  // ---- helpers --------------------------------------------------------------

  const safeParse = (val, fallback) => {
    if (val == null) return fallback;
    if (Array.isArray(val) || typeof val === "object") return val;
    try {
      const parsed = JSON.parse(val);
      return parsed == null ? fallback : parsed;
    } catch {
      return fallback;
    }
  };

  // Normalize into [{ code, units }] — interpret quantities as UNITS
  const normalizeRowPairs = (row) => {
    dgroup("normalizeRowPairs()");
    dlog("Raw row snippet:", {
      date: row?.date,
      recipe: row?.recipe,
      stockAmount: row?.stockAmount,
      batchcodes: row?.batchcodes,
      quantitiesUsed: row?.quantitiesUsed,
    });

    const rawCodes =
      row.batchcodes ?? row.batchCodes ?? row.codes ?? row.batch_codes ?? null;
    const rawQuantities =
      row.quantitiesUsed ??
      row.quantities ??
      row.batchesUsed ??
      row.quantities_used ??
      null;

    dlog("Raw codes field:", rawCodes);
    dlog("Raw quantities field:", rawQuantities);

    const codesParsed = safeParse(rawCodes, []);
    const qtyParsed = safeParse(rawQuantities, []);

    dlog("Parsed codes:", codesParsed);
    dlog("Parsed quantities:", qtyParsed);

    const pairs = [];

    if (Array.isArray(codesParsed) && codesParsed.length) {
      dlog("Branch: codesParsed is Array");
      codesParsed.forEach((c, i) => {
        if (typeof c === "string") {
          const units =
            (Array.isArray(qtyParsed) ? qtyParsed[i] : qtyParsed?.[c]) ?? 0;
          pairs.push({ code: c, units: Number(units) || 0 });
        } else if (c && typeof c === "object") {
          const code = c.code ?? c.batchCode ?? c.id ?? String(i);
          const unitsFromObj =
            c.units ?? c.qty ?? c.quantity ?? c.count ?? 0; // accept common keys
          const unitsFallback =
            (Array.isArray(qtyParsed) ? qtyParsed[i] : qtyParsed?.[code]) ?? 0;
          pairs.push({ code, units: Number(unitsFromObj || unitsFallback) || 0 });
        }
      });
      dlog("Normalized pairs (array branch):", pairs);
      dgroupEnd();
      return pairs;
    }

    if (codesParsed && typeof codesParsed === "object") {
      dlog("Branch: codesParsed is Object map");
      Object.entries(codesParsed).forEach(([code, maybeUnits]) => {
        const override =
          (Array.isArray(qtyParsed) ? undefined : qtyParsed?.[code]) ?? undefined;
        pairs.push({
          code,
          units: Number(override ?? maybeUnits) || 0,
        });
      });
      dlog("Normalized pairs (object map branch):", pairs);
      dgroupEnd();
      return pairs;
    }

    if (Array.isArray(qtyParsed)) {
      dlog("Branch: only quantities array present, synthesizing codes");
      const synthesized = qtyParsed.map((q, i) => ({
        code: `Batch ${i + 1}`,
        units: Number(q) || 0,
      }));
      dlog("Normalized pairs (synthesized):", synthesized);
      dgroupEnd();
      return synthesized;
    }

    dlog("No recognizable codes/quantities; returning empty array.");
    dgroupEnd();
    return [];
  };

  // Build final drawer items using UNITS directly (no UPB multiply)
  const buildDrawerItems = (row) => {
    dgroup("buildDrawerItems()");
    const pairs = normalizeRowPairs(row);
    const items = pairs.map(({ code, units }) => ({
      code,
      unitsLabel: `${Number(units || 0).toLocaleString()} units`,
      units: Number(units || 0),
    }));
    const sumUnits = pairs.reduce((t, p) => t + (Number(p.units) || 0), 0);
    const stockAmountNum = Number(row?.stockAmount ?? 0);
    dlog("Sum of units from drawer:", sumUnits, "Row stockAmount:", stockAmountNum);
    dlog("Drawer items to render:", items);
    dgroupEnd();
    return items;
  };

  // ---- effects --------------------------------------------------------------

  useEffect(() => {
    if (!cognitoId) return;
    const fetchGoodsOutData = async () => {
      dgroup("fetchGoodsOutData()");
      try {
        const response = await fetch(
          `${API_BASE}/goods-out?cognito_id=${encodeURIComponent(cognitoId)}`
        );
        dlog("HTTP status:", response.status);
        if (!response.ok) throw new Error("Failed to fetch goods out");
        const data = await response.json();
        const arr = Array.isArray(data) ? data : [];
        dlog("Goods-out rows:", arr.length);
        dlog("Preview first 3 rows:", arr.slice(0, 3));
        setGoodsOut(arr);
      } catch (error) {
        console.error("[GoodsOut] Error fetching goods out:", error);
      } finally {
        dgroupEnd();
      }
    };
    fetchGoodsOutData();
  }, [cognitoId]);

  // ---- drawer handlers ------------------------------------------------------

  const handleDrawerOpenForRow = (row) => {
    dgroup("handleDrawerOpenForRow()");
    dlog("Clicked row:", row);
    const items = buildDrawerItems(row);
    setDrawerHeader("Batchcodes");
    setDrawerItems(items);
    setSelectedRow(row ?? null);
    setSearchTerm("");
    setDrawerOpen(true);
    dgroupEnd();
  };

  const handleDrawerClose = () => {
    dlog("Drawer closed");
    setDrawerOpen(false);
    setSelectedRow(null);
    setDrawerItems([]);
  };

  // ---- deletion -------------------------------------------------------------

  const openDeletePrompt = () => {
    if (selectedRows.length === 0) return;
    setOpenConfirmDialog(true);
  };

  const handleDeleteSelectedRows = async () => {
    try {
      // Map selected grid IDs back to DB IDs
      const map = new Map(
        (Array.isArray(goodsOut) ? goodsOut : []).map((r) => [String(r.id ?? ""), r])
      );
      const dbIds = selectedRows
        .map((rid) => map.get(String(rid)))
        .filter(Boolean)
        .map((r) => r.id)
        .filter((id) => typeof id === "number" || /^\d+$/.test(String(id))) // ensure numeric
        .map((id) => Number(id));

      if (!cognitoId || dbIds.length === 0) {
        setOpenConfirmDialog(false);
        return;
      }

      const res = await fetch(`${API_BASE}/goods-out/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: dbIds, cognito_id: cognitoId }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Delete failed: ${res.status} ${t}`);
      }

      // refetch table
      const refreshed = await fetch(
        `${API_BASE}/goods-out?cognito_id=${encodeURIComponent(cognitoId)}`
      );
      const rows = refreshed.ok ? await refreshed.json() : [];
      setGoodsOut(Array.isArray(rows) ? rows : []);
      setSelectedRows([]);
      setOpenConfirmDialog(false);
    } catch (err) {
      console.error("[GoodsOut] Delete failed:", err);
      setOpenConfirmDialog(false);
    }
  };

  // ---- table columns --------------------------------------------------------

  const columns = useMemo(
    () => [
      { field: "date", headerName: "Date", flex: 1 },
      { field: "recipe", headerName: "Recipe Name", flex: 1 },
      {
        field: "stockAmount",
        headerName: "Units Going Out",
        type: "number",
        flex: 1,
        headerAlign: "left",
        align: "left",
      },
      {
        field: "batchcodes",
        headerName: "Batchcodes",
        flex: 1,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Typography
            sx={{
              cursor: "pointer",
              color: brand.primary,
              fontWeight: 600,
              "&:hover": { color: brand.primaryDark },
            }}
            onClick={() => handleDrawerOpenForRow(params.row)}
          >
            Show Batchcodes
          </Typography>
        ),
      },
      {
        field: "recipients",
        headerName: "Recipients",
        flex: 1,
        headerAlign: "left",
        align: "left",
      },
    ],
    []
  );

  // ---- derived for drawer UI ------------------------------------------------

  const totalUnitsInDrawer = drawerItems.reduce((s, it) => s + (it.units || 0), 0);
  const filteredDrawerItems = drawerItems.filter((it) =>
    it.code.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  // ---- render ---------------------------------------------------------------

  return (
    <Box m="20px">
      <style>{`
        .go-card {
          border: 1px solid ${brand.border};
          background: ${brand.surface};
          border-radius: 16px;
          box-shadow: ${brand.shadow};
          overflow: hidden;
        }
        .go-toolbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px; border-bottom: 1px solid ${brand.border};
          background: ${brand.surface};
        }

        /* alternating DataGrid rows */
        .even-row { background-color: ${brand.surfaceMuted} !important; }
        .odd-row { background-color: ${brand.surface} !important; }
      `}</style>

      <Box className="go-card" mt={2}>
        <Box className="go-toolbar">
          <Typography sx={{ fontWeight: 800, color: brand.text }}>
            Goods Out
          </Typography>

          {/* Gradient circular delete icon — same style as your other pages */}
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
            rows={
              Array.isArray(goodsOut)
                ? goodsOut.map((row, idx) => ({
                    ...row,
                    id: row.id ?? `${row.recipe}-${idx}`, // prefer DB id; fallback keeps grid happy (but won't be deletable)
                  }))
                : []
            }
            columns={columns}
            getRowId={(row) => row.id}
            checkboxSelection
            disableRowSelectionOnClick
            onRowSelectionModelChange={(model) => setSelectedRows(model)}
            rowSelectionModel={selectedRows}
            getRowClassName={(params) =>
              (params.indexRelativeToCurrentPage % 2 === 0) ? "even-row" : "odd-row"
            }
          />
        </Box>
      </Box>

      {/* Redesigned Drawer (professional) — Clear button removed */}
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
                {selectedRow?.recipe ? `${selectedRow.recipe} · ${selectedRow?.date ?? ""}` : ""}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <IconButton
              size="small"
              onClick={() => {
                // rudimentary export: build csv and download
                try {
                  const csv = [
                    ["Batch code", "Units"],
                    ...drawerItems.map((i) => [i.code, i.units || 0]),
                  ]
                    .map((r) => r.map((c) => `"${String(c).replace(/\"/g, '""')}"`).join(","))
                    .join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${selectedRow?.recipe ?? "batchcodes"}-batchcodes.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                } catch (e) {
                  console.error("Export failed", e);
                }
              }}
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
                    Recipients
                  </Typography>
                  <Typography sx={{ color: brand.text, fontWeight: 800 }}>
                    {selectedRow?.recipients ?? "—"}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography sx={{ color: "text.secondary", fontSize: 12 }}>Total units</Typography>
                  <Typography sx={{ color: brand.primary, fontWeight: 900, fontSize: 22 }}>
                    {totalUnitsInDrawer.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Search + Reset */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search batch code or filter"
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
                // reset items to original selectedRow content
                if (selectedRow) {
                  setDrawerItems(buildDrawerItems(selectedRow));
                }
              }}
              sx={{ textTransform: "none", borderRadius: 1.5 }}
            >
              Reset
            </Button>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          {/* Items list */}
          {filteredDrawerItems.length === 0 ? (
            <Typography sx={{ color: brand.subtext }}>No batchcodes available.</Typography>
          ) : (
            <List disablePadding>
              {filteredDrawerItems.map(({ code, unitsLabel }, idx) => (
                <Box
                  key={`${code}-${idx}`}
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
                          maxWidth: 180,
                          textAlign: "right",
                        }}
                      >
                        {unitsLabel}
                      </Box>
                    }
                    sx={{ py: 1 }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CheckRoundedIcon sx={{ color: brand.primary }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={code}
                      primaryTypographyProps={{
                        sx: { color: brand.text, fontWeight: 600 },
                      }}
                    />
                  </ListItem>
                </Box>
              ))}
            </List>
          )}
        </Box>

        {/* Footer actions (note: Clear button removed as requested) */}
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
                // example confirm action — simply close for now
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
            {filteredDrawerItems.length} items
          </Typography>
        </Box>
      </Drawer>

      {/* Delete confirmation dialog — same styling as others */}
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

export default GoodsOut;
