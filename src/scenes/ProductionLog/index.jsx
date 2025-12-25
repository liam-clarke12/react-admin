import React, { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { DataGrid } from "@mui/x-data-grid";
import ProductionLogForm from "../form/ProductionLog";
import { useAuth } from "../../contexts/AuthContext";

/* =========================================================================================
   Brand Styles (identical to Goods In) + sidebar cards + DARK MODE
   - Reads localStorage "theme-mode" = "dark"
   - Listens for window "themeChanged" event (same as other pages)

   FIXES APPLIED:
   1) DataGrid header forced to follow dark mode via stronger selectors + !important.
   2) Modal form dropdown stacking fixed:
      - modal containers now use consistent, very high z-index
      - MUI Popover/Menu/Popper forced above modal
      - common portal roots (MuiModal/MuiDialog/MuiDrawer) also forced above
   ========================================================================================= */
const BrandStyles = ({ isDark }) => (
  <style>{`
  :root{
    --bg: ${isDark ? "#0b1220" : "#f3f4f6"};
    --card: ${isDark ? "#0f172a" : "#fff"};
    --card2: ${isDark ? "rgba(255,255,255,0.02)" : "#fff"};
    --border: ${isDark ? "#1f2a44" : "#e5e7eb"};
    --text: ${isDark ? "#e5e7eb" : "#0f172a"};
    --text2: ${isDark ? "#cbd5e1" : "#334155"};
    --muted: ${isDark ? "#94a3b8" : "#64748b"};
    --thead: ${isDark ? "rgba(255,255,255,0.03)" : "#f8fafc"};
    --hover: ${isDark ? "rgba(124,58,237,0.14)" : "#f4f1ff"};
    --chip: ${isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9"};
    --accentBg: ${isDark ? "rgba(124,58,237,0.10)" : "#f9f7ff"};
    --accentBorder: ${isDark ? "rgba(124,58,237,0.28)" : "#7C3AED66"};
    --primary: #7C3AED;
    --primary2: #5B21B6;
    --danger: #dc2626;
    --danger2: #b91c1c;
  }

  .r-wrap { padding: 16px; background: var(--bg); min-height: calc(100vh - 0px); color: var(--text); }

  .r-card{
    background:var(--card);
    border:1px solid var(--border);
    border-radius:16px;
    box-shadow:0 1px 2px rgba(16,24,40,${isDark ? "0.22" : "0.06"}),0 1px 3px rgba(16,24,40,${isDark ? "0.28" : "0.08"});
    overflow:hidden;
  }
  .r-head{
    padding:16px;
    display:flex; flex-wrap:wrap; gap:10px; align-items:center; justify-content:space-between;
    border-bottom:1px solid var(--border);
    background: var(--card2);
  }
  .r-title { margin:0; font-weight:900; color:var(--text); font-size:20px; }
  .r-sub { margin:0; color:var(--muted); font-size:12px; }
  .r-pill { font-size:12px; font-weight:900; color:var(--primary); }
  .r-flex { display:flex; align-items:center; gap:10px; }

  .r-btn-ghost{
    display:inline-flex; align-items:center; gap:8px; padding:8px 12px; font-weight:900; font-size:14px;
    color:var(--text);
    border:1px solid var(--border);
    border-radius:10px;
    background:${isDark ? "rgba(255,255,255,0.03)" : "#fff"};
    cursor:pointer;
  }
  .r-btn-ghost:hover { background: var(--hover); }
  .r-btn-ghost:disabled { opacity:.55; cursor:not-allowed; }

  .r-btn-primary{
    padding:10px 16px; font-weight:900; color:#fff; background:var(--primary);
    border:0; border-radius:10px;
    box-shadow:0 1px 2px rgba(16,24,40,${isDark ? "0.22" : "0.06"}),0 1px 3px rgba(16,24,40,${isDark ? "0.28" : "0.08"});
    cursor:pointer;
  }
  .r-btn-primary:hover { background:var(--primary2); }
  .r-btn-danger { background:var(--danger); }
  .r-btn-danger:hover { background:var(--danger2); }

  /* Toolbar */
  .r-toolbar{
    background:var(--card);
    padding:12px 16px;
    border:1px solid var(--border);
    border-radius:12px;
    box-shadow:0 1px 2px rgba(16,24,40,${isDark ? "0.22" : "0.06"});
    display:flex; flex-wrap:wrap; gap:10px; align-items:center;
    margin: 12px 16px 0;
  }
  .r-input{
    min-width:260px; flex:1;
    padding:10px 12px;
    border:1px solid var(--border);
    border-radius:10px;
    outline:none;
    background:${isDark ? "rgba(255,255,255,0.03)" : "#fff"};
    color:var(--text);
  }
  .r-input::placeholder { color:${isDark ? "rgba(148,163,184,0.85)" : "#94a3b8"}; }
  .r-input:focus { border-color:var(--primary); box-shadow:0 0 0 4px rgba(124,58,237,.18); }

  .r-select{
    padding:10px 12px;
    border:1px solid var(--border);
    border-radius:10px;
    background:${isDark ? "rgba(255,255,255,0.03)" : "#fff"};
    color:var(--text);
  }
  .r-toolbar-gap { margin-top:12px; }

  /* Footer */
  .r-footer{
    padding:12px 16px;
    border-top:1px solid var(--border);
    display:flex; align-items:center; justify-content:space-between;
    background: var(--card2);
  }
  .r-muted{ color:var(--muted); font-size:12px; }

  /* Page layout */
  .gi-layout{ display:flex; gap:24px; align-items:flex-start; }
  .gi-main{ flex:1 1 0%; min-width:0; }
  .gi-side{ width:320px; flex:0 0 320px; display:flex; flex-direction:column; gap:12px; position:sticky; top:16px; }

  /* Modal shell */
  .r-modal-dim{
    position:fixed; inset:0;
    background:rgba(0,0,0,.55);
    display:flex; align-items:center; justify-content:center;
    z-index:200000 !important;
    padding:16px;
  }
  .r-modal{
    background:var(--card);
    border:1px solid var(--border);
    border-radius:14px;
    width:100%;
    max-width:900px;
    max-height:90vh;
    overflow:hidden;
    box-shadow:0 10px 30px rgba(0,0,0,${isDark ? "0.45" : "0.22"});
    display:flex; flex-direction:column;
    z-index:200001 !important;
    position:relative;
  }
  .r-mhdr{ padding:14px 16px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; background: var(--card2); }
  .r-mbody{
    padding:16px;
    overflow-y:auto;
    overflow-x:visible;
    background:var(--card);
    flex:1;
    color: var(--text2);
  }
  .r-mfooter{ padding:12px 16px; border-top:1px solid var(--border); background:${isDark ? "rgba(255,255,255,0.02)" : "#f8fafc"}; display:flex; justify-content:flex-end; gap:10px; }

  /* Grid form bits in modal */
  .ag-grid{ display:grid; gap:12px; grid-template-columns:repeat(4, minmax(0, 1fr)); overflow:visible !important; }
  .ag-field{ grid-column: span 2; }
  .ag-field-1{ grid-column: span 1; }
  .ag-field-2{ grid-column: span 2; }
  .ag-field-4{ grid-column: span 4; }
  .ag-label{ font-size:12px; color:var(--muted); font-weight:900; margin-bottom:6px; display:block; }
  .ag-input, .ag-select{
    width:100%;
    padding:10px 12px;
    border:1px solid var(--border);
    border-radius:10px;
    outline:none;
    background:${isDark ? "rgba(255,255,255,0.03)" : "#fff"};
    color:var(--text);
  }
  .ag-input:focus, .ag-select:focus{ border-color:var(--primary); box-shadow:0 0 0 4px rgba(124,58,237,.18); }

  /* Ensure native selects / inputs inside modal aren't clipped */
  .ag-select, .ag-input, select{ position:relative; z-index:200005 !important; }

  /* DataGrid */
  .dg-wrap{ height: 70vh; min-width: 750px; }
  .dg-wrap .MuiDataGrid-root{ border:0; font-size:14px; color:var(--text2); background: transparent; }

  /* ===== FIX: FORCE HEADER ROW TO FOLLOW DARK MODE (strong selectors + !important) ===== */
  .dg-wrap .MuiDataGrid-columnHeaders,
  .dg-wrap .MuiDataGrid-columnHeadersInner,
  .dg-wrap .MuiDataGrid-columnHeader,
  .dg-wrap .MuiDataGrid-columnHeaderTitleContainer,
  .dg-wrap .MuiDataGrid-columnHeaderTitleContainerContent{
    background: var(--thead) !important;
  }
  .dg-wrap .MuiDataGrid-columnHeaders{
    border-bottom:1px solid var(--border) !important;
  }
  .dg-wrap .MuiDataGrid-columnHeaderTitle,
  .dg-wrap .MuiDataGrid-columnHeaderTitleContainerContent,
  .dg-wrap .MuiDataGrid-sortIcon,
  .dg-wrap .MuiDataGrid-menuIcon,
  .dg-wrap .MuiDataGrid-iconButtonContainer{
    color: var(--muted) !important;
    font-weight:900 !important;
    text-transform:uppercase;
    letter-spacing:.03em;
    font-size:12px;
  }

  .dg-wrap .MuiDataGrid-cell{ border-bottom:1px solid var(--border); }
  .dg-wrap .MuiDataGrid-row:nth-of-type(odd){ background: ${isDark ? "rgba(255,255,255,0.02)" : "#fff"}; }
  .dg-wrap .MuiDataGrid-row:nth-of-type(even){ background: ${isDark ? "rgba(255,255,255,0.01)" : "#f8fafc"}; }
  .dg-wrap .MuiDataGrid-row:hover{ background: var(--hover) !important; }
  .dg-wrap .MuiCheckbox-root, .dg-wrap .MuiSvgIcon-root{ color: ${isDark ? "#cbd5e1" : "#334155"}; }
  .dg-wrap .MuiDataGrid-virtualScroller{ background: transparent; }

  /* Badges like Goods In */
  .r-qty-badge{ display:inline-block; padding:2px 8px; border-radius:10px; background:var(--chip); color:var(--text); font-weight:800; }

  /* Selection chip area */
  .r-chip{
    background:${isDark ? "rgba(124,58,237,0.14)" : "#eef2ff"};
    border:1px solid ${isDark ? "rgba(124,58,237,0.25)" : "transparent"};
    padding:6px 10px;
    border-radius:10px;
    display:flex; align-items:center; gap:10px;
  }

  /* Sidebar stat cards */
  .stat-card{ padding:14px 16px; }
  .stat-title{ font-size:12px; color:var(--muted); font-weight:900; margin:0 0 6px; }
  .stat-value{ font-weight:900; color:var(--text); font-size:28px; line-height:1; margin:0; }
  .stat-row{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
  .stat-kpi{ font-size:14px; font-weight:900; color:var(--text); }
  .stat-sub{ font-size:12px; color:var(--muted); }
  .stat-accent{ border:1px dashed var(--accentBorder); background: var(--accentBg); }

  /* ===== FIX: FORCE MUI dropdowns above modal (portal stacking) ===== */
  .MuiPopover-root,
  .MuiPopover-root .MuiPaper-root,
  .MuiMenu-root,
  .MuiMenu-paper,
  .MuiPopper-root,
  .MuiAutocomplete-popper,
  .MuiPickersPopper-root{
    z-index: 400000 !important;
  }

  /* If any MUI modal/dialog/drawer exists, keep it above app shell */
  .MuiModal-root,
  .MuiDialog-root,
  .MuiDrawer-root{
    z-index: 350000 !important;
  }
`}</style>
);

/* Icons (match Goods In) */
const Svg = (p) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" {...p} />;
const EditIcon = (props) => (
  <Svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </Svg>
);
const DeleteIcon = (props) => (
  <Svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </Svg>
);

/* =========================================================================================
   Config & utils
   ========================================================================================= */
const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

const formatDateYMD = (val) => {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) {
    const s = String(val);
    const m = s.match(/\d{4}-\d{2}-\d{2}/);
    return m ? m[0] : s;
  }
  return d.toISOString().split("T")[0];
};

// Prefer batchCode as the key everywhere
const getRowKey = (row) => String(row?.batchCode ?? row?.batch_code ?? row?.id ?? "");

const makeStableId = (row) => {
  if (!row) return null;
  const key = getRowKey(row);
  if (key) return key;
  const slug = `${row.recipe || "r"}|${row.date || "d"}|${row.producer_name || row.producerName || "p"}`;
  return `gen-${slug.replace(/[^a-zA-Z0-9-_]/g, "-")}`;
};

const toNumber = (v) => (v === "" || v === null || v === undefined ? 0 : Number(v) || 0);
const nf = (n) => new Intl.NumberFormat().format(n ?? 0);

const Portal = ({ children }) => {
  if (typeof window === "undefined") return null;
  return createPortal(children, document.body);
};

/* =========================================================================================
   Component
   ========================================================================================= */
export default function ProductionLog() {
  const { cognitoId } = useAuth() || {};

  // Theme (sync with Topbar)
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme-mode") === "dark");
  useEffect(() => {
    const onThemeChanged = () => setIsDark(localStorage.getItem("theme-mode") === "dark");
    window.addEventListener("themeChanged", onThemeChanged);
    return () => window.removeEventListener("themeChanged", onThemeChanged);
  }, []);

  const [productionLogs, setProductionLogs] = useState([]);
  const [recipesMap, setRecipesMap] = useState({});
  const [selectedRows, setSelectedRows] = useState([]);
  const [fatalMsg, setFatalMsg] = useState("");

  // Search + sort (to match Goods In toolbar)
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState({ field: "date", dir: "desc" });

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [openProductionForm, setOpenProductionForm] = useState(false);

  // ===== Recipes map =====
  useEffect(() => {
    if (!cognitoId) return;
    const run = async () => {
      try {
        const res = await fetch(`${API_BASE}/recipes?cognito_id=${encodeURIComponent(cognitoId)}`);
        if (!res.ok) throw new Error("Failed to fetch recipes");
        const data = await res.json();
        const map = {};
        (Array.isArray(data) ? data : []).forEach((r) => {
          const key = r.recipe_name ?? r.recipe ?? r.name ?? "unknown";
          map[key] = Number(r.units_per_batch) || 0;
        });
        setRecipesMap(map);
      } catch (e) {
        console.error("Recipes fetch error:", e);
      }
    };
    run();
  }, [cognitoId]);

  // ===== Fetch production logs =====
  const fetchLogs = useCallback(async () => {
    if (!cognitoId) {
      setFatalMsg("Missing cognito_id.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/production-log/active?cognito_id=${encodeURIComponent(cognitoId)}`);
      if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
      const data = await res.json();
      if (!Array.isArray(data)) {
        setProductionLogs([]);
        return;
      }
      const sanitized = data.map((row) => {
        const dbId = row.id ?? row.ID ?? null;
        const batchesProduced = toNumber(row.batchesProduced ?? row.batches_produced);
        const batchRemaining = toNumber(row.batchRemaining ?? row.batch_remaining);
        const unitsOfWaste = toNumber(row.units_of_waste ?? row.unitsOfWaste);
        const upb = recipesMap[row.recipe] ?? toNumber(row.units_per_batch);
        const unitsRemaining = toNumber(row.unitsRemaining ?? batchRemaining - unitsOfWaste);
        const batchesRemaining = upb > 0 ? unitsRemaining / upb : null;
        const producerName = row.producer_name ?? row.producerName ?? "";

        const normalized = {
          id: String(dbId ?? row.batchCode ?? row.batch_code ?? makeStableId(row)),
          batchCode: row.batchCode ?? row.batch_code ?? null,
          recipe: row.recipe ?? "",
          date: formatDateYMD(row.date ?? null),
          batchesProduced,
          batchRemaining,
          unitsOfWaste,
          unitsRemaining,
          batchesRemaining,
          producerName,
          __raw: row,
        };
        normalized.id = String(normalized.batchCode ?? normalized.id);
        return normalized;
      });
      setProductionLogs(sanitized);
      setFatalMsg("");
    } catch (e) {
      console.error("Production log fetch error:", e);
      setFatalMsg(String(e?.message || e));
    }
  }, [cognitoId, recipesMap]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // ===== Grid columns =====
  const columns = useMemo(
    () => [
      { field: "date", headerName: "Date", flex: 1 },
      { field: "recipe", headerName: "Recipe Name", flex: 1 },
      { field: "batchesProduced", headerName: "Batches Produced", type: "number", flex: 1, align: "left", headerAlign: "left" },
      { field: "unitsOfWaste", headerName: "Units of Waste", type: "number", flex: 1, align: "left", headerAlign: "left" },
      { field: "unitsRemaining", headerName: "Units Remaining", type: "number", flex: 1, align: "left", headerAlign: "left" },
      { field: "producerName", headerName: "Produced by", flex: 1, align: "left", headerAlign: "left" },
      { field: "batchCode", headerName: "Batch Code", flex: 1 },
      {
        field: "actions",
        headerName: "Actions",
        width: 120,
        sortable: false,
        filterable: false,
        align: "right",
        renderCell: (params) => (
          <button
            className="r-btn-ghost"
            aria-label="Edit row"
            onClick={() => {
              setEditingRow(params.row);
              setEditOpen(true);
            }}
          >
            <EditIcon /> Edit
          </button>
        ),
      },
    ],
    []
  );

  // ===== Search + sort (client-side) =====
  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let rows = [...productionLogs];
    if (q) {
      rows = rows.filter((r) => Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(q)));
    }
    const dir = sortBy.dir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      const fa = a[sortBy.field] ?? "";
      const fb = b[sortBy.field] ?? "";
      if (typeof fa === "number" && typeof fb === "number") return (fa - fb) * dir;
      return String(fa).localeCompare(String(fb)) * dir;
    });
    return rows;
  }, [productionLogs, searchQuery, sortBy]);

  // ===== Sidebar Stats =====
  const stats = useMemo(() => {
    const totalUnitsRemaining = filteredRows.reduce((s, r) => s + toNumber(r.unitsRemaining), 0);
    const totalWaste = filteredRows.reduce((s, r) => s + toNumber(r.unitsOfWaste), 0);
    const totalBatchesProduced = filteredRows.reduce((s, r) => s + toNumber(r.batchesProduced), 0);
    const activeBatches = filteredRows.length;
    const byRecipe = filteredRows.reduce((acc, r) => {
      const k = r.recipe || "Unknown";
      acc[k] = (acc[k] || 0) + toNumber(r.unitsRemaining);
      return acc;
    }, {});
    const topRecipes = Object.entries(byRecipe)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([recipe, units]) => ({ recipe, units }));

    return { totalUnitsRemaining, totalWaste, totalBatchesProduced, activeBatches, topRecipes };
  }, [filteredRows]);

  // ===== Update row (PUT) =====
  const processRowUpdate = async (updatedRow) => {
    if (!cognitoId) throw new Error("Missing cognitoId");

    const batchCodeForPath = updatedRow.batchCode || updatedRow.batch_code;
    if (!batchCodeForPath) throw new Error("batchCode is required to update production_log");

    const dateYmd = formatDateYMD(updatedRow.date);
    const batchesProduced = toNumber(updatedRow.batchesProduced ?? updatedRow.batches_produced);
    const unitsOfWaste = toNumber(updatedRow.unitsOfWaste ?? updatedRow.units_of_waste);
    const unitsRemaining = toNumber(updatedRow.unitsRemaining);
    const batchRemaining = toNumber(updatedRow.batchRemaining ?? updatedRow.batch_remaining ?? unitsRemaining + unitsOfWaste);

    const payload = {
      date: dateYmd,
      recipe: updatedRow.recipe,
      batchesProduced,
      units_of_waste: unitsOfWaste,
      batchRemaining,
      unitsRemaining,
      producer_name: updatedRow.producerName ?? updatedRow.producer_name ?? "",
      cognito_id: cognitoId,
    };

    const url = `${API_BASE}/production-log/${encodeURIComponent(batchCodeForPath)}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(txt || `Server returned ${res.status}`);
    }

    await fetchLogs();
  };

  const handleConfirmEdit = async () => {
    if (!editingRow) {
      setEditOpen(false);
      return;
    }
    setUpdating(true);
    try {
      const patched = {
        ...editingRow,
        id: getRowKey(editingRow),
        batchCode: editingRow.batchCode ?? editingRow.batch_code,
        date: formatDateYMD(editingRow.date),
        recipe: editingRow.recipe ?? "",
        batchesProduced: toNumber(editingRow.batchesProduced),
        unitsOfWaste: toNumber(editingRow.unitsOfWaste),
        unitsRemaining: toNumber(editingRow.unitsRemaining),
        batchRemaining: toNumber(editingRow.batchRemaining ?? (toNumber(editingRow.unitsRemaining) + toNumber(editingRow.unitsOfWaste))),
        producerName: editingRow.producerName ?? "",
      };

      setProductionLogs((prev) => {
        const next = [...prev];
        const key = getRowKey(patched);
        const idx = next.findIndex((r) => getRowKey(r) === key);
        if (idx >= 0) next[idx] = { ...next[idx], ...patched };
        return next;
      });

      await processRowUpdate(patched);
      setEditOpen(false);
      setEditingRow(null);
    } catch (e) {
      console.error("Edit failed:", e);
      alert(`Update failed: ${e?.message || e}`);
    } finally {
      setUpdating(false);
    }
  };

  // ===== Delete (soft) =====
  const handleDeleteSelectedRows = async () => {
    if (!cognitoId || selectedRows.length === 0) return;
    const rowsToDelete = productionLogs.filter((r) => selectedRows.includes(getRowKey(r)));
    try {
      await Promise.all(
        rowsToDelete.map((row) =>
          fetch(`${API_BASE}/delete-production-log`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ batchCode: row.batchCode, cognito_id: cognitoId }),
          }).then(async (res) => {
            if (!res.ok) {
              const t = await res.text().catch(() => "");
              throw new Error(t || `Delete failed for ${row.batchCode}`);
            }
          })
        )
      );
      setProductionLogs((prev) => prev.filter((r) => !selectedRows.includes(getRowKey(r))));
      setSelectedRows([]);
      setDeleteOpen(false);
    } catch (err) {
      console.error("Delete failed:", err);
      alert(`Delete failed: ${err?.message || err}`);
    }
  };

  // ===== Pagination =====
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const visibleRows = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  return (
    <div className="r-wrap">
      <BrandStyles isDark={isDark} />

      {!cognitoId && (
        <div
          className="r-card"
          style={{
            borderColor: isDark ? "rgba(220,38,38,0.45)" : "#fecaca",
            background: isDark ? "rgba(220,38,38,0.10)" : "#fff1f2",
            color: isDark ? "#fecaca" : "#b91c1c",
            marginBottom: 12,
            padding: 14,
          }}
        >
          <strong>Can’t load data:</strong> No cognito_id detected.
        </div>
      )}
      {fatalMsg && (
        <div
          className="r-card"
          style={{
            borderColor: isDark ? "rgba(220,38,38,0.45)" : "#fecaca",
            background: isDark ? "rgba(220,38,38,0.10)" : "#fff1f2",
            color: isDark ? "#fecaca" : "#b91c1c",
            marginBottom: 12,
            padding: 14,
          }}
        >
          <strong>API error:</strong> {fatalMsg}
        </div>
      )}

      <div className="gi-layout">
        {/* MAIN TABLE */}
        <div className="gi-main">
          <div className="r-card">
            <div className="r-head">
              <div>
                <h2 className="r-title">Production Log</h2>
                <p className="r-sub">Track batches, waste and remaining units</p>
              </div>

              <div style={{ marginLeft: "auto" }}>
                <button className="r-btn-primary" onClick={() => setOpenProductionForm(true)}>
                  + Record Production
                </button>
              </div>

              <div className="r-flex">
                {selectedRows.length > 0 && (
                  <div className="r-chip">
                    <span className="r-pill">{selectedRows.length} selected</span>
                    <button
                      className="r-btn-ghost"
                      onClick={() => setDeleteOpen(true)}
                      title="Delete selected"
                      style={{
                        color: isDark ? "#fecaca" : "#dc2626",
                        borderColor: isDark ? "rgba(220,38,38,0.35)" : "#fecaca",
                        background: isDark ? "rgba(220,38,38,0.10)" : undefined,
                      }}
                    >
                      <DeleteIcon /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="r-toolbar">
              <input
                className="r-input"
                type="text"
                placeholder="Search by recipe, batch code, producer..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
              />

              {!openProductionForm && (
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
                  <option value="unitsRemaining:desc">Units remaining (high → low)</option>
                  <option value="unitsRemaining:asc">Units remaining (low → high)</option>
                </select>
              )}
            </div>

            <div className="r-toolbar-gap dg-wrap">
              <DataGrid
                rows={visibleRows}
                columns={columns}
                getRowId={(row) => getRowKey(row)}
                checkboxSelection
                rowSelectionModel={selectedRows}
                onRowSelectionModelChange={(model) => {
                  const arr = Array.isArray(model) ? model.map((m) => String(m)) : [];
                  setSelectedRows(arr);
                }}
                disableRowSelectionOnClick
                hideFooter
                onCellDoubleClick={(params) => {
                  setEditingRow(params.row);
                  setEditOpen(true);
                }}
                sx={{
                  border: 0,
                  "& .MuiDataGrid-columnSeparator": { display: "none" },
                  "& .MuiDataGrid-footerContainer": {
                    borderTop: `1px solid ${isDark ? "#1f2a44" : "#e5e7eb"}`,
                  },

                  /* Belt + braces: header styling in sx too */
                  "& .MuiDataGrid-columnHeaders": {
                    backgroundColor: "var(--thead)",
                    color: "var(--muted)",
                    borderBottom: "1px solid var(--border)",
                  },
                  "& .MuiDataGrid-columnHeaderTitle": {
                    color: "var(--muted)",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: ".03em",
                    fontSize: 12,
                  },
                  "& .MuiDataGrid-sortIcon, & .MuiDataGrid-menuIcon": { color: "var(--muted)" },
                }}
              />
            </div>

            <div className="r-footer">
              <span className="r-muted">
                Showing{" "}
                <strong style={{ color: isDark ? "#e5e7eb" : "#0f172a" }}>
                  {filteredRows.length === 0 ? 0 : page * rowsPerPage + 1}
                </strong>
                –
                <strong style={{ color: isDark ? "#e5e7eb" : "#0f172a" }}>
                  {Math.min((page + 1) * rowsPerPage, filteredRows.length)}
                </strong>{" "}
                of{" "}
                <strong style={{ color: isDark ? "#e5e7eb" : "#0f172a" }}>
                  {filteredRows.length}
                </strong>
              </span>

              <div className="r-flex">
                <button className="r-btn-ghost" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                  Prev
                </button>

                <span className="r-muted">Page {page + 1}</span>

                <button
                  className="r-btn-ghost"
                  onClick={() => setPage((p) => ((p + 1) * rowsPerPage < filteredRows.length ? p + 1 : p))}
                  disabled={(page + 1) * rowsPerPage >= filteredRows.length}
                >
                  Next
                </button>

                {!openProductionForm && (
                  <select
                    className="r-select"
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setPage(0);
                    }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR: QUICK STATS */}
        <aside className="gi-side">
          <div className="r-card stat-card stat-accent">
            <p className="stat-title">Total Remaining (Units)</p>
            <p className="stat-value">{nf(stats.totalUnitsRemaining)}</p>
            <p className="stat-sub">Based on current filters</p>
          </div>

          <div className="r-card stat-card">
            <div className="stat-row" style={{ marginBottom: 10 }}>
              <span className="stat-kpi">Batches Produced</span>
              <span className="stat-kpi">{nf(stats.totalBatchesProduced)}</span>
            </div>

            <div className="stat-row" style={{ marginBottom: 10 }}>
              <span className="stat-kpi">Units of Waste</span>
              <span className="stat-kpi">{nf(stats.totalWaste)}</span>
            </div>

            <div className="stat-row">
              <span className="stat-kpi">Active Batches</span>
              <span className="stat-kpi">{nf(stats.activeBatches)}</span>
            </div>
          </div>

          <div className="r-card stat-card">
            <p className="stat-title">Top Recipes by Remaining</p>

            {stats.topRecipes.length === 0 ? (
              <p className="stat-sub">No data</p>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {stats.topRecipes.map((t) => (
                  <div key={t.recipe} className="stat-row">
                    <span className="stat-sub" style={{ fontWeight: 900, color: isDark ? "#e5e7eb" : "#0f172a" }}>
                      {t.recipe}
                    </span>
                    <span className="stat-kpi">{nf(t.units)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ===================== EDIT MODAL ===================== */}
      {editOpen && editingRow && (
        <Portal>
          <div className="r-modal-dim">
            <div className="r-modal">
              <div className="r-mhdr">
                <h3 className="r-title" style={{ fontSize: 18 }}>
                  Edit Production Log
                </h3>
                <button
                  className="r-btn-ghost"
                  onClick={() => {
                    setEditOpen(false);
                    setEditingRow(null);
                  }}
                >
                  Close
                </button>
              </div>

              <div className="r-mbody">
                <div className="ag-grid">
                  <div className="ag-field ag-field-4">
                    <label className="ag-label">Recipe</label>
                    <input
                      className="ag-input"
                      type="text"
                      value={editingRow.recipe ?? ""}
                      onChange={(e) => setEditingRow((prev) => ({ ...(prev || {}), recipe: e.target.value }))}
                    />
                  </div>

                  <div className="ag-field">
                    <label className="ag-label">Date</label>
                    <input
                      className="ag-input"
                      type="date"
                      value={formatDateYMD(editingRow.date ?? "")}
                      onChange={(e) => setEditingRow((prev) => ({ ...(prev || {}), date: formatDateYMD(e.target.value) }))}
                    />
                  </div>

                  <div className="ag-field ag-field-1">
                    <label className="ag-label">Batches Produced</label>
                    <input
                      className="ag-input"
                      type="number"
                      value={editingRow.batchesProduced ?? 0}
                      onChange={(e) => setEditingRow((prev) => ({ ...(prev || {}), batchesProduced: toNumber(e.target.value) }))}
                    />
                  </div>

                  <div className="ag-field ag-field-1">
                    <label className="ag-label">Units of Waste</label>
                    <input
                      className="ag-input"
                      type="number"
                      value={editingRow.unitsOfWaste ?? 0}
                      onChange={(e) => {
                        const unitsOfWaste = toNumber(e.target.value);
                        const unitsRemaining = toNumber(editingRow.unitsRemaining);
                        setEditingRow((prev) => ({ ...(prev || {}), unitsOfWaste, batchRemaining: unitsRemaining + unitsOfWaste }));
                      }}
                    />
                  </div>

                  <div className="ag-field ag-field-4">
                    <label className="ag-label">Units Remaining</label>
                    <input
                      className="ag-input"
                      type="number"
                      value={editingRow.unitsRemaining ?? 0}
                      onChange={(e) => {
                        const unitsRemaining = toNumber(e.target.value);
                        const unitsOfWaste = toNumber(editingRow.unitsOfWaste);
                        setEditingRow((prev) => ({ ...(prev || {}), unitsRemaining, batchRemaining: unitsRemaining + unitsOfWaste }));
                      }}
                    />
                  </div>

                  <div className="ag-field ag-field-2">
                    <label className="ag-label">Produced by (Name)</label>
                    <input
                      className="ag-input"
                      type="text"
                      value={editingRow.producerName ?? ""}
                      onChange={(e) => setEditingRow((prev) => ({ ...(prev || {}), producerName: e.target.value }))}
                    />
                  </div>

                  <div className="ag-field ag-field-2">
                    <label className="ag-label">Batch Code</label>
                    <input
                      className="ag-input"
                      type="text"
                      value={editingRow.batchCode ?? ""}
                      onChange={(e) => setEditingRow((prev) => ({ ...(prev || {}), batchCode: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="r-mfooter">
                <button
                  className="r-btn-ghost"
                  onClick={() => {
                    setEditOpen(false);
                    setEditingRow(null);
                  }}
                  disabled={updating}
                >
                  Cancel
                </button>

                <button className="r-btn-primary" onClick={handleConfirmEdit} disabled={updating}>
                  {updating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ===================== DELETE CONFIRM MODAL ===================== */}
      {deleteOpen && selectedRows.length > 0 && (
        <Portal>
          <div className="r-modal-dim">
            <div className="r-modal" style={{ maxWidth: 420 }}>
              <div className="r-mhdr">
                <h3 className="r-title" style={{ fontSize: 18 }}>
                  Confirm Deletion
                </h3>
                <button className="r-btn-ghost" onClick={() => setDeleteOpen(false)}>
                  Close
                </button>
              </div>

              <div className="r-mbody" style={{ textAlign: "center" }}>
                <div
                  className="r-flex"
                  style={{
                    width: 60,
                    height: 60,
                    margin: "0 auto",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(220,38,38,0.16)",
                    color: isDark ? "#fecaca" : "#dc2626",
                    borderRadius: 999,
                    border: `1px solid ${isDark ? "rgba(220,38,38,0.35)" : "transparent"}`,
                  }}
                >
                  <DeleteIcon />
                </div>

                <h3 style={{ fontWeight: 900, color: isDark ? "#e5e7eb" : "#0f172a", marginTop: 10, fontSize: 18 }}>
                  Delete {selectedRows.length} record{selectedRows.length > 1 ? "s" : ""}?
                </h3>

                <p className="r-muted" style={{ marginTop: 6 }}>
                  This is a soft-delete action.
                </p>
              </div>

              <div className="r-mfooter" style={{ justifyContent: "flex-end" }}>
                <button className="r-btn-ghost" onClick={() => setDeleteOpen(false)}>
                  Cancel
                </button>
                <button className="r-btn-primary r-btn-danger" onClick={handleDeleteSelectedRows}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ===================== RECORD PRODUCTION MODAL ===================== */}
      {openProductionForm && (
        <Portal>
          <div className="r-modal-dim">
            <div className="r-modal">
              <div className="r-mhdr">
                <h3 className="r-title" style={{ fontSize: 18 }}>
                  Record Production
                </h3>
                <button className="r-btn-ghost" onClick={() => setOpenProductionForm(false)}>
                  Close
                </button>
              </div>

              <div className="r-mbody">
                <ProductionLogForm
                  cognitoId={cognitoId}
                  onSubmitted={() => {
                    fetchLogs();
                    setOpenProductionForm(false);
                  }}
                  formId="production-log-form"
                />
              </div>

              <div className="r-mfooter" style={{ justifyContent: "flex-end" }}>
                <button className="r-btn-primary" type="submit" form="production-log-form">
                  Record Production
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
