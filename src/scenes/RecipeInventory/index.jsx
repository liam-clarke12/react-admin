// src/scenes/inventory/RecipeInventory.jsx
"use client"

import React, { useEffect, useMemo, useState } from "react"
import { DataGrid } from "@mui/x-data-grid"
import { useAuth } from "../../contexts/AuthContext"
import { useData } from "../../contexts/DataContext"

/* =====================
   Scoped Styles + Dark mode - match IngredientInventory (Indigo SaaS)
   ===================== */
const Styles = ({ isDark }) => (
  <style>{`
    :root{
      /* Updated color palette to match goods-in with indigo/blue tones */
      --bg: ${isDark ? "#0a0f1e" : "#f8fafc"};
      --bg-card: ${isDark ? "#0f172a" : "#ffffff"};
      --text: ${isDark ? "#f1f5f9" : "#0f172a"};
      --text-muted: ${isDark ? "#94a3b8" : "#64748b"};
      --text-soft: ${isDark ? "#cbd5e1" : "#94a3b8"};

      --border: ${isDark ? "rgba(148,163,184,0.12)" : "#e2e8f0"};
      --thead-bg: ${isDark ? "rgba(99,102,241,0.05)" : "#f8fafc"};
      --row-even: ${isDark ? "rgba(255,255,255,0.02)" : "#fafbfc"};
      --row-odd: ${isDark ? "transparent" : "#ffffff"};
      --row-hover: ${isDark ? "rgba(99,102,241,0.12)" : "#f1f5f9"};

      --input-bg: ${isDark ? "rgba(15,23,42,0.6)" : "#ffffff"};
      --chip-bg: ${isDark ? "rgba(99,102,241,0.1)" : "#f0f4ff"};

      /* Updated shadow system for more depth */
      --shadow: ${
        isDark
          ? "0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -1px rgba(0,0,0,0.2)"
          : "0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px 0 rgba(0,0,0,0.04)"
      };
      --shadow-lg: ${
        isDark
          ? "0 20px 25px -5px rgba(0,0,0,0.4), 0 10px 10px -5px rgba(0,0,0,0.2)"
          : "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)"
      };

      /* Updated to indigo brand color */
      --primary: #6366f1;
      --primary-dark: #4f46e5;
      --primary-light: #818cf8;
      --primary-ring: rgba(99,102,241,0.2);

      --overlay: ${isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)"};
    }

    /* Enhanced page background with smoother transitions */
    .ii-page { 
      background:var(--bg); 
      min-height:100vh; 
      color:var(--text); 
      transition: background 0.3s ease, color 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    .ii-wrap { max-width:1280px; margin:0 auto; padding:24px 20px; }

    /* Refined header with better spacing */
    .ii-header { 
      display:flex; 
      align-items:center; 
      justify-content:space-between; 
      gap:16px; 
      flex-wrap:wrap; 
      margin-bottom:24px;
    }
    .ii-hgroup { display:flex; align-items:center; gap:16px; }
    
    /* Updated logo with indigo gradient */
    .ii-logo {
      width:56px; 
      height:56px; 
      border-radius:14px;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      box-shadow:0 4px 12px rgba(99,102,241,0.25), 0 2px 6px rgba(99,102,241,0.15);
      display:flex; 
      align-items:center; 
      justify-content:center; 
      color:#fff; 
      font-weight:800; 
      font-size:20px;
      letter-spacing:-0.02em;
    }
    
    /* Improved typography hierarchy */
    .ii-title { 
      margin:0; 
      font-weight:700; 
      font-size:24px; 
      color:var(--text);
      letter-spacing:-0.02em;
    }
    .ii-sub { 
      margin:4px 0 0; 
      color:var(--text-muted); 
      font-size:14px;
      font-weight:500;
    }
    
    /* Enhanced icon button with elevation on hover */
    .ii-iconbtn {
      width:44px; 
      height:44px; 
      border-radius:12px;
      border:1px solid var(--border); 
      background:var(--bg-card); 
      cursor:pointer;
      display:flex; 
      align-items:center; 
      justify-content:center;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      color: var(--text);
      box-shadow: var(--shadow);
    }
    .ii-iconbtn:hover { 
      background:${isDark ? "rgba(99,102,241,0.15)" : "#f8fafc"}; 
      transform: translateY(-2px); 
      box-shadow: ${isDark ? "0 6px 12px -2px rgba(0,0,0,0.4)" : "0 4px 8px -2px rgba(0,0,0,0.1)"};
      border-color: var(--primary-ring);
    }

    /* Grid */
    .ii-grid { display:grid; grid-template-columns: 1.6fr 1fr; gap:20px; }
    @media (max-width: 900px) { .ii-grid { grid-template-columns: 1fr; } }

    /* Enhanced card design with better shadows */
    .ii-card {
      background:var(--bg-card); 
      border:1px solid var(--border); 
      border-radius:16px; 
      overflow:hidden;
      box-shadow: var(--shadow);
      transition: all 0.3s ease;
    }
    .ii-card:hover {
      box-shadow: ${
        isDark
          ? "0 8px 16px -4px rgba(0,0,0,0.4), 0 4px 8px -2px rgba(0,0,0,0.2)"
          : "0 4px 12px -2px rgba(0,0,0,0.08), 0 2px 6px -1px rgba(0,0,0,0.04)"
      };
    }
    
    /* Refined card headers */
    .ii-card-head { 
      padding:16px 20px; 
      border-bottom:1px solid var(--border); 
      background:${isDark ? "rgba(99,102,241,0.03)" : "var(--bg-card)"};
    }
    .ii-card-head h3 { 
      margin:0; 
      font-weight:700; 
      font-size:16px; 
      color:var(--text);
      letter-spacing:-0.01em;
    }
    .ii-card-head p { 
      margin:4px 0 0; 
      font-size:13px; 
      color:var(--text-muted);
      font-weight:500;
    }

    /* Enhanced search toolbar */
    .ii-toolbar {
      background:var(--bg-card);
      padding:16px 20px;
      border-bottom:1px solid var(--border);
    }
    
    /* Improved input styling with better focus states */
    .ii-input {
      width:100%;
      padding:12px 16px;
      border:1px solid var(--border);
      border-radius:10px;
      outline:none;
      background: var(--input-bg);
      color: var(--text);
      font-size:14px;
      font-weight:500;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .ii-input::placeholder { 
      color: var(--text-muted); 
      font-weight:400;
    }
    .ii-input:focus {
      border-color: var(--primary);
      box-shadow:0 0 0 3px var(--primary-ring);
      background: var(--bg-card);
    }

    /* Chips / badges */
    .ii-chip {
      display:inline-flex; 
      align-items:center; 
      padding:6px 12px; 
      border-radius:8px;
      border:1px solid ${isDark ? "rgba(99,102,241,0.3)" : "#e0e7ff"}; 
      background:var(--chip-bg); 
      font-weight:600; 
      color:var(--text); 
      font-size:13px;
    }
    .ii-badge {
      display:inline-block; 
      padding:6px 12px; 
      border-radius:8px; 
      font-size:12px; 
      font-weight:600;
      background:${isDark ? "rgba(99,102,241,0.15)" : "#eef2ff"};
      color:${isDark ? "#c7d2fe" : "#4f46e5"};
      border:1px solid ${isDark ? "rgba(99,102,241,0.3)" : "#c7d2fe"};
      letter-spacing:0.02em;
    }

    /* Modal */
    .ii-dim {
      position:fixed; 
      inset:0; 
      background:var(--overlay);
      display:flex; 
      align-items:center; 
      justify-content:center; 
      z-index:50;
      animation: ii-fade 0.2s ease-out forwards;
      backdrop-filter: blur(4px);
    }
    .ii-modal {
      width:min(540px, 92vw); 
      background:var(--bg-card); 
      border:1px solid var(--border); 
      border-radius:16px;
      box-shadow:var(--shadow-lg);
      overflow:hidden;
      animation: ii-slide 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      color: var(--text);
    }
    .ii-mhead { 
      padding:20px 24px; 
      border-bottom:1px solid var(--border);
      background:${isDark ? "rgba(99,102,241,0.03)" : "var(--bg-card)"};
    }
    .ii-mhead h4 { 
      margin:0; 
      font-weight:700; 
      color: var(--text);
      font-size:18px;
      letter-spacing:-0.01em;
    }
    .ii-mbody { 
      padding:24px; 
      color:var(--text-muted);
      line-height:1.6;
      font-size:14px;
    }
    .ii-mfoot { 
      padding:16px 24px; 
      border-top:1px solid var(--border); 
      text-align:right;
      background:${isDark ? "rgba(0,0,0,0.1)" : "#fafbfc"};
    }

    /* Buttons */
    .ii-btn {
      display:inline-flex; 
      align-items:center; 
      gap:8px; 
      border:0; 
      border-radius:10px; 
      cursor:pointer;
      font-weight:600; 
      padding:10px 20px;
      font-size:14px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      letter-spacing:0.01em;
    }
    .ii-btn-ghost { 
      background:transparent; 
      border:1px solid var(--border); 
      color:var(--text);
    }
    .ii-btn-ghost:hover { 
      background:${isDark ? "rgba(255,255,255,0.05)" : "#f8fafc"};
      border-color:var(--primary-ring);
      transform: translateY(-1px);
    }
    .ii-btn-primary { 
      color:#fff; 
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      box-shadow: 0 2px 8px rgba(99,102,241,0.25);
    }
    .ii-btn-primary:hover { 
      background: linear-gradient(135deg, var(--primary-light), var(--primary));
      box-shadow: 0 4px 12px rgba(99,102,241,0.35);
      transform: translateY(-2px);
    }

    /* Snackbar */
    .ii-snack {
      position:fixed; 
      right:20px; 
      bottom:20px; 
      background:#dc2626; 
      color:#fff; 
      padding:12px 16px;
      border-radius:10px; 
      box-shadow:0 10px 25px rgba(0,0,0,0.2);
      transform: translateY(12px); 
      opacity:0; 
      animation: ii-pop 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      z-index:60;
      font-weight:600;
      font-size:14px;
    }

    /* Chart */
    .ii-chart { 
      display:flex; 
      flex-direction:column; 
      height:100%;
    }
    .ii-chart-body { 
      flex:1; 
      min-height:380px; 
      display:flex; 
      gap:12px; 
      padding:20px 16px 16px; 
      align-items:flex-end; 
      overflow:auto;
    }
    .ii-bar {
      width:40px; 
      min-width:40px; 
      border-radius:10px 10px 0 0;
      background: linear-gradient(180deg, var(--primary-light), var(--primary-dark));
      box-shadow: 0 4px 12px rgba(99,102,241,0.25);
      position:relative; 
      display:flex; 
      align-items:flex-end; 
      justify-content:center;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .ii-bar:hover { 
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(99,102,241,0.35);
    }
    .ii-bar-value {
      position:absolute; 
      top:-28px; 
      font-size:11px; 
      font-weight:700; 
      color:${isDark ? "#e0e7ff" : "var(--primary-dark)"};
      background:var(--bg-card); 
      border:1px solid var(--border); 
      padding:4px 8px; 
      border-radius:6px; 
      white-space:nowrap;
      box-shadow: var(--shadow);
    }
    .ii-bar-label {
      margin-top:8px; 
      font-size:11px; 
      color:var(--text-muted); 
      max-width:60px; 
      text-align:center;
      word-break:break-word;
      display:block;
      font-weight:600;
    }
    .ii-chart-head { 
      padding:16px 20px; 
      border-bottom:1px solid var(--border); 
      background:${isDark ? "rgba(99,102,241,0.03)" : "var(--bg-card)"};
    }
    .ii-chart-head h4 { 
      margin:0; 
      font-weight:700; 
      font-size:16px; 
      color:var(--text);
      letter-spacing:-0.01em;
    }
    .ii-chart-head p { 
      margin:4px 0 0; 
      font-size:13px; 
      color:var(--text-muted);
      font-weight:500;
    }

    /* ===== DataGrid (MUI) styling to match the table look ===== */
    .ii-table-wrap { height: 600px; }

    .ii-dg .MuiDataGrid-root {
      border:0 !important;
      color: var(--text) !important;
      background: transparent !important;
    }

    .ii-dg .MuiDataGrid-columnHeaders {
      background: var(--thead-bg) !important;
      color: var(--text-muted) !important;
      border-bottom: 1px solid var(--border) !important;
    }
    .ii-dg .MuiDataGrid-columnHeaderTitle {
      font-weight: 700 !important;
      font-size: 12px !important;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted) !important;
    }

    .ii-dg .MuiDataGrid-cell {
      border-bottom: 1px solid var(--border) !important;
      font-size: 14px;
      font-weight: 500;
      color: var(--text) !important;
    }

    .ii-dg .MuiDataGrid-row:nth-child(odd) { background: var(--row-odd) !important; }
    .ii-dg .MuiDataGrid-row:nth-child(even) { background: var(--row-even) !important; }
    .ii-dg .MuiDataGrid-row:hover { background: var(--row-hover) !important; }

    .ii-dg .MuiDataGrid-footerContainer{
      border-top:1px solid var(--border) !important;
      background: ${isDark ? "rgba(0,0,0,0.08)" : "#fafbfc"} !important;
      color: var(--text-muted) !important;
    }

    .ii-dg .MuiTablePagination-root,
    .ii-dg .MuiTablePagination-selectLabel,
    .ii-dg .MuiTablePagination-displayedRows,
    .ii-dg .MuiTablePagination-actions {
      color: var(--text-muted) !important;
    }

    .ii-dg .MuiSvgIcon-root,
    .ii-dg .MuiCheckbox-root {
      color: var(--text-muted) !important;
    }

    .ii-dg .MuiDataGrid-virtualScroller {
      background: transparent !important;
    }

    .ii-dg .MuiDataGrid-columnSeparator { display:none !important; }

    /* Smooth keyframe animations */
    @keyframes ii-fade { 
      from { opacity:0 } 
      to { opacity:1 } 
    }
    @keyframes ii-slide { 
      from { transform: translateY(20px) scale(0.96); opacity:0 } 
      to { transform:none; opacity:1 } 
    }
    @keyframes ii-pop { 
      to { transform:none; opacity:1 } 
    }
  `}</style>
)

/* ===================== Config ===================== */
const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api"

/* ===================== Info Modal ===================== */
const InfoModal = ({ open, onClose }) => {
  if (!open) return null
  return (
    <div className="ii-dim" onClick={onClose}>
      <div className="ii-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ii-mhead">
          <h4>About this table</h4>
        </div>
        <div className="ii-mbody">
          These rows are read-only aggregates built from your active Production Log. To change units in stock, add,
          delete or edit entries in the <strong>Production Log</strong> screen. This view summarizes recipe inventory
          and cannot be edited directly.
        </div>
        <div className="ii-mfoot">
          <button className="ii-btn ii-btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

/* ===================== Simple inline icon (self-contained) ===================== */
const InfoIcon = ({ size = 20, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
)

/* ===================== Main Component ===================== */
const RecipeInventory = () => {
  // Theme (sync with Topbar)
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme-mode") === "dark")
  useEffect(() => {
    const onThemeChanged = () => setIsDark(localStorage.getItem("theme-mode") === "dark")
    window.addEventListener("themeChanged", onThemeChanged)
    return () => window.removeEventListener("themeChanged", onThemeChanged)
  }, [])

  const { cognitoId } = useAuth() || {}
  const { recipeInventory, setRecipeInventory } = useData()

  const [infoOpen, setInfoOpen] = useState(false)
  const [snack, setSnack] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch & aggregate from Production Log -> recipe inventory (units)
  useEffect(() => {
    const fetchAndProcess = async () => {
      try {
        if (!cognitoId) {
          setRecipeInventory([])
          setSnack("No Cognito ID found.")
          return
        }

        const url = `${API_BASE}/production-log/active?cognito_id=${encodeURIComponent(cognitoId)}`
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Fetch failed (${res.status})`)
        const data = await res.json()
        const list = Array.isArray(data) ? data : []

        const filtered = list.filter((row) => Number(row.batchRemaining) > 0)

        const grouped = filtered.reduce((acc, row) => {
          const rec = row.recipe || "Unknown"
          const rem = Number(row.batchRemaining) || 0
          const waste = Number(row.units_of_waste) || 0
          const available = Math.max(0, rem - waste)

          if (!acc[rec]) {
            acc[rec] = { recipe: rec, totalUnits: available, batchCode: row.batchCode }
          } else {
            acc[rec].totalUnits += available
          }
          return acc
        }, {})

        const processed = Object.values(grouped).map((g, idx) => ({
          id: `${g.recipe}-${idx}`,
          recipe: g.recipe,
          unitsInStock: g.totalUnits,
          batchCode: g.batchCode || "-",
        }))

        setRecipeInventory(processed)
      } catch (e) {
        console.error("Recipe inventory load failed:", e)
        setRecipeInventory([])
        setSnack("API error — could not load recipe inventory.")
      }
    }

    fetchAndProcess()
  }, [cognitoId, setRecipeInventory])

  // Search / filter rows
  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return recipeInventory || []
    return (recipeInventory || []).filter((r) =>
      [r.recipe, r.batchCode, r.unitsInStock].some((field) =>
        String(field ?? "")
          .toLowerCase()
          .includes(q),
      ),
    )
  }, [recipeInventory, searchQuery])

  // DataGrid columns (same functionality)
  const columns = useMemo(
    () => [
      { field: "recipe", headerName: "Recipe", flex: 1, minWidth: 180 },
      {
        field: "unitsInStock",
        headerName: "Units in Stock",
        type: "number",
        flex: 0.6,
        minWidth: 160,
        renderCell: (params) => <span className="ii-chip">{Number(params.value ?? 0).toLocaleString()}</span>,
        sortComparator: (a, b) => Number(a) - Number(b),
      },
      {
        field: "batchCode",
        headerName: "Sample Batch",
        flex: 0.8,
        minWidth: 180,
        renderCell: (params) => <span className="ii-badge">{params.value || "-"}</span>,
      },
    ],
    [],
  )

  // Chart data
  const chartData = useMemo(
    () =>
      (filteredRows || []).map((r) => ({
        name: r.recipe,
        amount: Number(r.unitsInStock) || 0,
      })),
    [filteredRows],
  )

  const maxAmount = useMemo(() => Math.max(0, ...chartData.map((d) => d.amount)), [chartData])

  return (
    <div className="ii-page">
      <Styles isDark={isDark} />

      <div className="ii-wrap">
        <div className="ii-header">
          <div className="ii-hgroup">
            <div className="ii-logo" aria-label="Recipe Inventory">
              Rec
            </div>
            <div>
              <h1 className="ii-title">Recipe Inventory</h1>
              <p className="ii-sub">Read-only aggregates of active Production Log entries</p>
            </div>
          </div>

          <button
            className="ii-iconbtn"
            onClick={() => setInfoOpen(true)}
            aria-label="About this table"
            title="About this table"
          >
            <InfoIcon />
          </button>
        </div>

        <div className="ii-grid">
          {/* Table Card */}
          <div className="ii-card" style={{ minHeight: 520 }}>
            <div className="ii-card-head">
              <h3>Active Recipes</h3>
              <p>Total units in stock by recipe</p>
            </div>

            <div className="ii-toolbar">
              <input
                className="ii-input"
                type="text"
                placeholder="Search by recipe, batch code, units..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="ii-table-wrap ii-dg">
              <DataGrid
                rows={filteredRows}
                columns={columns}
                getRowId={(row) => row.id}
                autoHeight={false}
                disableRowSelectionOnClick
                pagination
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { page: 0, pageSize: 10 } },
                  sorting: { sortModel: [{ field: "unitsInStock", sort: "desc" }] },
                }}
                sx={{
                  border: 0,
                  backgroundColor: "transparent",
                  "& .MuiDataGrid-overlay": {
                    color: "var(--text-muted)",
                    background: "transparent",
                  },

                  // Keep this in sx too so it wins, but still mirrors CSS vars
                  "& .MuiDataGrid-columnHeaders": {
                    backgroundColor: "var(--thead-bg)",
                    borderBottom: "1px solid var(--border)",
                  },
                  "& .MuiDataGrid-columnHeaderTitle": {
                    color: "var(--text-muted)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    fontSize: 12,
                  },
                  "& .MuiDataGrid-cell": {
                    borderBottom: "1px solid var(--border)",
                    color: "var(--text)",
                  },
                  "& .MuiDataGrid-footerContainer": {
                    borderTop: "1px solid var(--border)",
                    backgroundColor: "transparent",
                  },
                  "& .MuiDataGrid-columnSeparator": { display: "none" },
                }}
              />
            </div>
          </div>

          {/* Chart Card */}
          <div className="ii-card" style={{ display: "flex", flexDirection: "column" }}>
            <div className="ii-chart-head">
              <h4>Inventory Levels</h4>
              <p>Units in stock by recipe</p>
            </div>

            <div className="ii-chart">
              <div className="ii-chart-body">
                {chartData.length === 0 ? (
                  <div style={{ margin: "auto", color: "var(--text-soft)" }}>No data for chart.</div>
                ) : (
                  chartData.map((d, i) => {
                    const pct = maxAmount > 0 ? d.amount / maxAmount : 0
                    const h = Math.max(6, Math.round(pct * 300))
                    return (
                      <div
                        className="ii-bar-wrap"
                        key={`${d.name}-${i}`}
                        style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
                      >
                        <div className="ii-bar" style={{ height: `${h}px` }}>
                          <div className="ii-bar-value">{Number(d.amount).toLocaleString()}</div>
                        </div>
                        <span className="ii-bar-label">{d.name}</span>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <InfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
      {snack && (
        <div className="ii-snack" onAnimationEnd={() => setTimeout(() => setSnack(""), 2500)}>
          {snack}
        </div>
      )}
    </div>
  )
}

export default RecipeInventory
