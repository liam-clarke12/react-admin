// src/scenes/goodsout/GoodsOut.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { Box, Drawer, Typography, IconButton, TextField, Divider, Stack, Card, CardContent, Button, List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { useAuth } from "../../contexts/AuthContext";

/* =========================================================================================
   Brand Styles (ported from ProductionLog for unified look)
   ========================================================================================= */
const BrandStyles = () => (
  <style>{`
  .r-wrap { padding: 16px; }
  .r-card {
    background:#fff; border:1px solid #e5e7eb; border-radius:16px;
    box-shadow:0 1px 2px rgba(16,24,40,0.06),0 1px 3px rgba(16,24,40,0.08);
    overflow:hidden;
  }
  .r-head { padding:16px; display:flex; flex-wrap:wrap; gap:10px; align-items:center; justify-content:space-between; border-bottom:1px solid #e5e7eb; }
  .r-title { margin:0; font-weight:900; color:#0f172a; font-size:20px; }
  .r-sub { margin:0; color:#64748b; font-size:12px; }
  .r-pill { font-size:12px; font-weight:800; color:#7C3AED; }
  .r-flex { display:flex; align-items:center; gap:10px; }
  .r-btn-ghost {
    display:inline-flex; align-items:center; gap:8px; padding:8px 12px; font-weight:800; font-size:14px;
    color:#0f172a; border:1px solid #e5e7eb; border-radius:10px; background:#fff; cursor:pointer;
  }
  .r-btn-ghost:hover { background:#f4f1ff; }
  .r-btn-primary {
    padding:10px 16px; font-weight:800; color:#fff; background:#7C3AED; border:0; border-radius:10px;
    box-shadow:0 1px 2px rgba(16,24,40,0.06),0 1px 3px rgba(16,24,40,0.08); cursor:pointer;
  }
  .r-btn-primary:hover { background:#5B21B6; }
  .r-btn-danger { background:#dc2626; }
  .r-btn-danger:hover { background:#b91c1c; }

  /* Toolbar */
  .r-toolbar { background:#fff; padding:12px 16px; border:1px solid #e5e7eb; border-radius:12px; box-shadow:0 1px 2px rgba(16,24,40,0.06); display:flex; flex-wrap:wrap; gap:10px; align-items:center; }
  .r-input {
    min-width:260px; flex:1; padding:10px 12px; border:1px solid #e5e7eb; border-radius:10px; outline:none;
  }
  .r-input:focus { border-color:#7C3AED; box-shadow:0 0 0 4px rgba(124,58,237,.18); }
  .r-select { padding:10px 12px; border:1px solid #e5e7eb; border-radius:10px; background:#fff; }
  .r-toolbar-gap { margin-top:12px; }

  /* Footer */
  .r-footer { padding:12px 16px; border-top:1px solid #e5e7eb; display:flex; align-items:center; justify-content:space-between; background:#fff; }
  .r-muted { color:#64748b; font-size:12px; }

  /* Page layout */
  .gi-layout { display:flex; gap:24px; align-items:flex-start; }
  .gi-main { flex:1 1 0%; min-width:0; }
  .gi-side {
    width:320px; flex:0 0 320px; display:flex; flex-direction:column; gap:12px; position:sticky; top:16px;
  }

  /* Modal shell (delete confirm) */
  .r-modal-dim { position:fixed; inset:0; background:rgba(0,0,0,.55); display:flex; align-items:center; justify-content:center; z-index:9999; padding:16px;}
  .r-modal { background:#fff; border-radius:14px; width:100%; max-width:420px; max-height:90vh; overflow:hidden; box-shadow:0 10px 30px rgba(2,6,23,.22); display:flex; flex-direction:column; z-index:10000; }
  .r-mhdr { padding:14px 16px; border-bottom:1px solid #e5e7eb; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
  .r-mbody { padding:16px; overflow:auto; background:#fff; text-align:center; }
  .r-mfooter { padding:12px 16px; border-top:1px solid #e5e7eb; background:#f8fafc; display:flex; justify-content:flex-end; gap:10px; }

  /* DataGrid look */
  .dg-wrap { height: 70vh; min-width: 750px; }
  .dg-wrap .MuiDataGrid-root { border:0; font-size:14px; color:#334155; }
  .dg-wrap .MuiDataGrid-row:nth-of-type(odd) { background:#fff; }
  .dg-wrap .MuiDataGrid-row:nth-of-type(even) { background:#f8fafc; }
  .dg-wrap .MuiDataGrid-row:hover { background:#f4f1ff !important; }

  /* Sidebar stat cards */
  .stat-card { padding:14px 16px; }
  .stat-title { font-size:12px; color:#64748b; font-weight:800; margin:0 0 6px; }
  .stat-value { font-weight:900; color:#0f172a; font-size:28px; line-height:1; margin:0; }
  .stat-row { display:flex; align-items:center; justify-content:space-between; }
  .stat-kpi { font-size:14px; font-weight:800; color:#0f172a; }
  .stat-sub { font-size:12px; color:#64748b; }
  .stat-accent { border:1px dashed #7C3AED66; background: #f9f7ff; }
  `}</style>
);

/* Simple SVG for delete badge in modal */
const Svg = (p) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" {...p} />;
const TrashLg = (props) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </Svg>
);

/* =========================================================================================
   Config & helpers (from your current GoodsOut, with minor tweaks)
   ========================================================================================= */
const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

const brand = {
  text: "#0f172a",
  subtext: "#334155",
  border: "#e5e7eb",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  danger: "#dc2626",
  primary: "#7C3AED",
  primaryDark: "#5B21B6",
};

const nf = (n) => new Intl.NumberFormat().format(n ?? 0);

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

// format date to YYYY-MM-DD (robust)
const formatToYYYYMMDD = (val) => {
  if (val === undefined || val === null || val === "") return "";
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toISOString().slice(0, 10);
    }
  } catch (_) {}
  const s = String(val);
  const m = s.match(/\d{4}-\d{2}-\d{2}/);
  if (m) return m[0];
  return s.slice(0, 10);
};

// Normalize drawer pairs from row data -> [{ code, units }]
const normalizeRowPairs = (row) => {
  const rawCodes = row.batchcodes ?? row.batchCodes ?? row.codes ?? row.batch_codes ?? null;
  const rawQuantities = row.quantitiesUsed ?? row.quantities ?? row.batchesUsed ?? row.quantities_used ?? null;

  const codesParsed = safeParse(rawCodes, []);
  const qtyParsed = safeParse(rawQuantities, []);

  const pairs = [];

  if (Array.isArray(codesParsed) && codesParsed.length) {
    codesParsed.forEach((c, i) => {
      if (typeof c === "string") {
        const units = (Array.isArray(qtyParsed) ? qtyParsed[i] : qtyParsed?.[c]) ?? 0;
        pairs.push({ code: c, units: Number(units) || 0 });
      } else if (c && typeof c === "object") {
        const code = c.code ?? c.batchCode ?? c.id ?? String(i);
        const unitsFromObj = c.units ?? c.qty ?? c.quantity ?? c.count ?? 0;
        const unitsFallback = (Array.isArray(qtyParsed) ? qtyParsed[i] : qtyParsed?.[code]) ?? 0;
        pairs.push({ code, units: Number(unitsFromObj || unitsFallback) || 0 });
      }
    });
    return pairs;
  }

  if (codesParsed && typeof codesParsed === "object") {
    Object.entries(codesParsed).forEach(([code, maybeUnits]) => {
      const override = (Array.isArray(qtyParsed) ? undefined : qtyParsed?.[code]) ?? undefined;
      pairs.push({ code, units: Number(override ?? maybeUnits) || 0 });
    });
    return pairs;
  }

  if (Array.isArray(qtyParsed)) {
    return qtyParsed.map((q, i) => ({ code: `Batch ${i + 1}`, units: Number(q) || 0 }));
  }

  return [];
};

const buildDrawerItems = (row) => {
  const pairs = normalizeRowPairs(row);
  return pairs.map(({ code, units }) => ({
    code,
    units,
    unitsLabel: `${Number(units || 0).toLocaleString()} units`,
  }));
};

const Portal = ({ children }) => {
  if (typeof window === "undefined") return null;
  return createPortal(children, document.body);
};

/* =========================================================================================
   Component
   ========================================================================================= */
export default function GoodsOut() {
  const { cognitoId } = useAuth();

  // Core data
  const [goodsOut, setGoodsOut] = useState([]);

  // Selection + delete
  const [selectedRows, setSelectedRows] = useState([]);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerHeader, setDrawerHeader] = useState("Batchcodes");
  const [drawerItems, setDrawerItems] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Search + sort + pagination (match ProductionLog UX)
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState({ field: "date", dir: "desc" });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Error
  const [fatalMsg, setFatalMsg] = useState("");

  // ===== Fetch goods-out =====
  const fetchGoodsOut = useCallback(async () => {
    if (!cognitoId) { setFatalMsg("Missing cognito_id."); return; }
    try {
      const response = await fetch(`${API_BASE}/goods-out?cognito_id=${encodeURIComponent(cognitoId)}`);
      if (!response.ok) throw new Error("Failed to fetch goods out");
      const data = await response.json();
      const arr = Array.isArray(data) ? data : [];
      const normalized = arr.map((row, idx) => {
        const sourceDate = row.date ?? row.production_log_date ?? row.created_at ?? row.createdAt ?? "";

        // normalize core fields coming from snake_case / alternate names
        const stockAmount =
          Number(
            row.stockAmount ??
            row.stock_amount ??
            row.unitsOut ??
            row.units_out ??
            row.units ??
            row.quantity ??
            row.qty ??
            row.amount ??
            0
          ) || 0;

        const recipe =
          row.recipe ??
          row.recipe_name ??
          row.product ??
          row.product_name ??
          row.sku ??
          "Unknown";

        const recipients =
          row.recipients ??
          row.customer ??
          row.client ??
          row.destination ??
          row.to ??
          "";

        return {
          ...row,
          id: row.id ?? `${recipe}-` + idx,
          date: formatToYYYYMMDD(sourceDate),
          stockAmount,
          recipe,
          recipients,
        };
      });
      setGoodsOut(normalized);
      setFatalMsg("");
    } catch (e) {
      console.error("[GoodsOut] fetch error:", e);
      setFatalMsg(String(e?.message || e));
    }
  }, [cognitoId]);

  useEffect(() => { fetchGoodsOut(); }, [fetchGoodsOut]);

  // ===== Open Drawer =====
  const handleDrawerOpenForRow = (row) => {
    const rowWithDate = { ...row, date: formatToYYYYMMDD(row.date ?? row.production_log_date ?? row.created_at ?? "") };
    setDrawerHeader("Batchcodes");
    setDrawerItems(buildDrawerItems(rowWithDate));
    setSelectedRow(rowWithDate);
    setSearchTerm("");
    setDrawerOpen(true);
  };
  const handleDrawerClose = () => { setDrawerOpen(false); setSelectedRow(null); setDrawerItems([]); };

  // ===== Delete selected (soft) =====
  const handleDeleteSelectedRows = async () => {
    try {
      // Map selected grid IDs back to DB numeric IDs
      const map = new Map((Array.isArray(goodsOut) ? goodsOut : []).map((r) => [String(r.id ?? ""), r]));
      const dbIds = selectedRows
        .map((rid) => map.get(String(rid)))
        .filter(Boolean)
        .map((r) => r.id)
        .filter((id) => typeof id === "number" || /^\d+$/.test(String(id)))
        .map((id) => Number(id));

      if (!cognitoId || dbIds.length === 0) {
        setDeleteOpen(false);
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

      await fetchGoodsOut();
      setSelectedRows([]);
      setDeleteOpen(false);
    } catch (err) {
      console.error("[GoodsOut] Delete failed:", err);
      setDeleteOpen(false);
    }
  };

  // ===== Columns (keep your Batchcodes Drawer behavior) =====
  const columns = useMemo(() => ([
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
    { field: "recipients", headerName: "Recipients", flex: 1, headerAlign: "left", align: "left" },
  ]), []);

  // ===== Search + sort + pagination (client-side, like ProductionLog) =====
  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let rows = [...(goodsOut || [])];
    if (q) {
      rows = rows.filter((r) => Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(q)));
    }
    const dir = sortBy.dir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      const fa = a[sortBy.field] ?? "";
      const fb = b[sortBy.field] ?? "";
      if (typeof fa === "number" || typeof fb === "number") return ((Number(fa) || 0) - (Number(fb) || 0)) * dir;
      return String(fa).localeCompare(String(fb)) * dir;
    });
    return rows;
  }, [goodsOut, searchQuery, sortBy]);

  const visibleRows = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  // ===== Sidebar Stats (based on filtered rows) =====
  const stats = useMemo(() => {
    const totalUnitsOut = filteredRows.reduce((s, r) => s + (Number(r.stockAmount ?? 0) || 0), 0);
    const shipments = filteredRows.length;
    const uniq = (arr) => Array.from(new Set(arr.filter(Boolean)));
    const uniqueRecipes = uniq(filteredRows.map((r) => r.recipe)).length;
    const uniqueRecipients = uniq(filteredRows.map((r) => r.recipients)).length;

    // Top recipes by units
    const byRecipe = filteredRows.reduce((acc, r) => {
      const key = r.recipe || "Unknown";
      acc[key] = (acc[key] || 0) + (Number(r.stockAmount ?? 0) || 0);
      return acc;
    }, {});
    const topRecipes = Object.entries(byRecipe)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([recipe, units]) => ({ recipe, units }));

    return { totalUnitsOut, shipments, uniqueRecipes, uniqueRecipients, topRecipes };
  }, [filteredRows]);

  return (
    <div className="r-wrap">
      <BrandStyles />

      {/* Errors / Missing Cognito */}
      {!cognitoId && (
        <div className="r-card" style={{ borderColor:"#fecaca", background:"#fff1f2", color:"#b91c1c", marginBottom:12 }}>
          <strong>Can’t load data:</strong> No cognito_id detected.
        </div>
      )}
      {fatalMsg && (
        <div className="r-card" style={{ borderColor:"#fecaca", background:"#fff1f2", color:"#b91c1c", marginBottom:12 }}>
          <strong>API error:</strong> {fatalMsg}
        </div>
      )}

      <div className="gi-layout">
        {/* MAIN TABLE */}
        <div className="gi-main">
          <div className="r-card">
            {/* Header */}
            <div className="r-head">
              <div>
                <h2 className="r-title">Goods Out</h2>
                <p className="r-sub">Log of units dispatched with quick batchcode drill-down</p>
              </div>

              <div className="r-flex">
                {selectedRows.length > 0 && (
                  <div className="r-flex">
                    <span className="r-pill">{selectedRows.length} selected</span>
                    <button
                      className="r-btn-ghost"
                      onClick={() => setDeleteOpen(true)}
                      title="Delete selected"
                      style={{ color:"#dc2626", borderColor:"#fecaca" }}
                    >
                      <DeleteIcon fontSize="small" /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Toolbar */}
            <div className="r-toolbar">
              <input
                className="r-input"
                type="text"
                placeholder="Search by recipe, recipients, batch code..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
              />
              <select
                className="r-select"
                value={`${sortBy.field}:${sortBy.dir}`}
                onChange={(e) => {
                  const [field, dir] = e.target.value.split(":");
                  setSortBy({ field, dir });
                  setPage(0);
                }}
              >
                <option value="date:desc">Date (new → old)</option>
                <option value="date:asc">Date (old → new)</option>
                <option value="recipe:asc">Recipe A→Z</option>
                <option value="recipe:desc">Recipe Z→A</option>
                <option value="stockAmount:desc">Units out (high → low)</option>
                <option value="stockAmount:asc">Units out (low → high)</option>
                <option value="recipients:asc">Recipients A→Z</option>
                <option value="recipients:desc">Recipients Z→A</option>
              </select>
            </div>

            {/* DataGrid */}
            <div className="r-toolbar-gap dg-wrap">
              <DataGrid
                rows={visibleRows}
                columns={columns}
                getRowId={(row) => row.id}
                checkboxSelection
                rowSelectionModel={selectedRows}
                onRowSelectionModelChange={(model) => setSelectedRows(Array.isArray(model) ? model.map(String) : [])}
                disableRowSelectionOnClick
              />
            </div>

            {/* Footer / pagination */}
            <div className="r-footer">
              <span className="r-muted">
                Showing <strong>{filteredRows.length === 0 ? 0 : page * rowsPerPage + 1}</strong>–
                <strong>{Math.min((page + 1) * rowsPerPage, filteredRows.length)}</strong> of{" "}
                <strong>{filteredRows.length}</strong>
              </span>
              <div className="r-flex">
                <button
                  className="r-btn-ghost"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >Prev</button>
                <span className="r-muted">Page {page + 1}</span>
                <button
                  className="r-btn-ghost"
                  onClick={() => setPage((p) => ((p + 1) * rowsPerPage < filteredRows.length) ? p + 1 : p)}
                  disabled={(page + 1) * rowsPerPage >= filteredRows.length}
                >Next</button>
                <select
                  className="r-select"
                  value={rowsPerPage}
                  onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR: QUICK STATS */}
        <aside className="gi-side">
          {/* Total Units Out highlight */}
          <div className="r-card stat-card stat-accent">
            <p className="stat-title">Total Units Out</p>
            <p className="stat-value">{nf(stats.totalUnitsOut)}</p>
            <p className="stat-sub">Based on current filters</p>
          </div>

          {/* Core KPIs */}
          <div className="r-card stat-card">
            <div className="stat-row" style={{ marginBottom:10 }}>
              <span className="stat-kpi">Shipments</span>
              <span className="stat-kpi">{nf(stats.shipments)}</span>
            </div>
            <div className="stat-row" style={{ marginBottom:10 }}>
              <span className="stat-kpi">Unique Recipes</span>
              <span className="stat-kpi">{nf(stats.uniqueRecipes)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-kpi">Unique Recipients</span>
              <span className="stat-kpi">{nf(stats.uniqueRecipients)}</span>
            </div>
          </div>

          {/* Top recipes by units */}
          <div className="r-card stat-card">
            <p className="stat-title">Top Recipes by Units</p>
            {stats.topRecipes.length === 0 ? (
              <p className="stat-sub">No data</p>
            ) : (
              <div style={{ display:"grid", gap:8 }}>
                {stats.topRecipes.map((t) => (
                  <div key={t.recipe} className="stat-row">
                    <span className="stat-sub" style={{ fontWeight:800, color:"#0f172a" }}>{t.recipe}</span>
                    <span className="stat-kpi">{nf(t.units)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ===================== DELETE CONFIRM MODAL ===================== */}
      {deleteOpen && selectedRows.length > 0 && (
        <Portal>
          <div className="r-modal-dim">
            <div className="r-modal">
              <div className="r-mhdr">
                <h3 className="r-title" style={{ fontSize: 18 }}>Confirm Deletion</h3>
                <button className="r-btn-ghost" onClick={() => setDeleteOpen(false)}>Close</button>
              </div>
              <div className="r-mbody">
                <div className="r-flex" style={{ width: 60, height: 60, margin:"0 auto", alignItems:"center", justifyContent:"center", background:"#fee2e2", color:"#dc2626", borderRadius:999 }}>
                  <TrashLg />
                </div>
                <h3 style={{ fontWeight: 900, color:"#0f172a", marginTop: 10, fontSize:18 }}>
                  Delete {selectedRows.length} record{selectedRows.length>1 ? "s" : ""}?
                </h3>
                <p className="r-muted" style={{ marginTop: 6 }}>This is a soft-delete action.</p>
              </div>
              <div className="r-mfooter" style={{ justifyContent:"flex-end" }}>
                <button className="r-btn-ghost" onClick={() => setDeleteOpen(false)}>Cancel</button>
                <button className="r-btn-primary r-btn-danger" onClick={handleDeleteSelectedRows}>Delete</button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ===================== DRAWER (kept from your GoodsOut) ===================== */}
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
                try {
                  const csv = [
                    ["Batch code", "Units"],
                    ...drawerItems.map((i) => [i.code, i.units || 0]),
                  ]
                    .map((r) => r.map((c) => `"${String(c).replace(/\\"/g, '""')}"`).join(","))
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
                    {drawerItems.reduce((s, it) => s + (it.units || 0), 0).toLocaleString()}
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
                if (selectedRow) setDrawerItems(buildDrawerItems(selectedRow));
              }}
              sx={{ textTransform: "none", borderRadius: 1.5 }}
            >
              Reset
            </Button>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          {/* Items list */}
          {drawerItems.filter((it) => it.code.toLowerCase().includes(searchTerm.trim().toLowerCase())).length === 0 ? (
            <Typography sx={{ color: brand.subtext }}>No batchcodes available.</Typography>
          ) : (
            <List disablePadding>
              {drawerItems
                .filter((it) => it.code.toLowerCase().includes(searchTerm.trim().toLowerCase()))
                .map(({ code, unitsLabel }, idx) => (
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

        {/* Drawer Footer */}
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
              onClick={handleDrawerClose}
              sx={{
                textTransform: "none",
                fontWeight: 800,
                borderRadius: 999,
                px: 2,
                color: "#fff",
                background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`,
                "&:hover": { background: brand.primaryDark },
              }}
            >
              Confirm & Close
            </Button>
          </Box>

          <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
            {drawerItems.length} items
          </Typography>
        </Box>
      </Drawer>
    </div>
  );
}
