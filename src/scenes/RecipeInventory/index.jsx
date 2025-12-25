// src/scenes/inventory/RecipeInventory.jsx
import React, { useEffect, useMemo, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";

/* ===================== Scoped Styles (Light + Dark) ===================== */
const Styles = ({ isDark }) => (
  <style>{`
    :root{
      --bg: ${isDark ? "#0b1220" : "#f1f5f9"};
      --card: ${isDark ? "#0f172a" : "#ffffff"};
      --card2: ${isDark ? "#0b1220" : "#ffffff"};
      --border: ${isDark ? "#1f2a44" : "#e5e7eb"};
      --text: ${isDark ? "#e5e7eb" : "#0f172a"};
      --text2: ${isDark ? "#cbd5e1" : "#334155"};
      --muted: ${isDark ? "#94a3b8" : "#64748b"};
      --thead: ${isDark ? "rgba(255,255,255,0.03)" : "#fbfcfd"};
      --rowOdd: ${isDark ? "rgba(255,255,255,0.01)" : "#ffffff"};
      --rowEven: ${isDark ? "rgba(255,255,255,0.03)" : "#f8fafc"};
      --hover: ${isDark ? "rgba(124,58,237,0.14)" : "#f4f1ff"};
      --chipBg: ${isDark ? "rgba(255,255,255,0.06)" : "#f8fafc"};
      --chipBorder: ${isDark ? "rgba(255,255,255,0.10)" : "#e5e7eb"};
      --badgeBg: ${isDark ? "rgba(124,58,237,0.14)" : "#f9f5ff"};
      --badgeBorder: ${isDark ? "rgba(124,58,237,0.25)" : "#eee"};
      --badgeText: ${isDark ? "#e5e7eb" : "#7C3AED"};
      --shadow: ${isDark ? "0 10px 30px rgba(0,0,0,0.45)" : "0 10px 30px rgba(2,6,23,.22)"};
      --primary: #7C3AED;
      --primary2: #5B21B6;
      --danger: #dc2626;
    }

    .ii-page { background:var(--bg); min-height:100vh; color:var(--text); }
    .ii-wrap { max-width:1200px; margin:0 auto; padding:16px; }

    /* Header */
    .ii-header { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:16px; }
    .ii-hgroup { display:flex; align-items:center; gap:12px; }
    .ii-logo {
      width:52px; height:52px; border-radius:12px;
      background: linear-gradient(180deg, #7C3AED, #5B21B6);
      box-shadow:0 8px 20px rgba(124,58,237,0.12);
      display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800; font-size:18px;
    }
    .ii-title { margin:0; font-weight:800; font-size:20px; color: var(--text); }
    .ii-sub { margin:0; color:var(--text2); font-size:12px; }

    .ii-iconbtn {
      width:40px; height:40px; border-radius:999px;
      border:1px solid var(--border);
      background: ${isDark ? "rgba(255,255,255,0.03)" : "#ffffff"};
      cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      transition: background .15s ease, transform .08s ease;
    }
    .ii-iconbtn:hover { background: ${isDark ? "rgba(124,58,237,0.12)" : "#f1f5f9"}; transform: translateY(-1px); }

    /* Grid */
    .ii-grid { display:grid; grid-template-columns: 1.6fr 1fr; gap:16px; }
    @media (max-width: 900px) { .ii-grid { grid-template-columns: 1fr; } }

    /* Cards */
    .ii-card {
      background:var(--card);
      border:1px solid var(--border);
      border-radius:16px; overflow:hidden;
      box-shadow:0 1px 2px rgba(16,24,40,${isDark ? "0.22" : "0.06"}), 0 1px 3px rgba(16,24,40,${isDark ? "0.28" : "0.08"});
      color: var(--text2);
    }
    .ii-card-head { padding:12px 14px; border-bottom:1px solid var(--border); background:var(--card2); }
    .ii-card-head h3 { margin:0; font-weight:800; font-size:14px; color: var(--text); }
    .ii-card-head p { margin:2px 0 0; font-size:12px; color:var(--text2); }

    /* Search toolbar */
    .ii-toolbar {
      background:var(--card);
      padding:12px 14px;
      border-bottom:1px solid var(--border);
    }
    .ii-input {
      width:100%;
      padding:10px 12px;
      border:1px solid var(--border);
      border-radius:10px;
      outline:none;
      background: ${isDark ? "rgba(255,255,255,0.03)" : "#fff"};
      color: var(--text);
      font-size:14px;
    }
    .ii-input::placeholder { color: ${isDark ? "rgba(148,163,184,0.8)" : "#94a3b8"}; }
    .ii-input:focus {
      border-color:var(--primary);
      box-shadow:0 0 0 3px rgba(124,58,237,.18);
    }

    /* DataGrid to mimic table styling */
    .ii-table-wrap { height: 520px; }

    .ii-dg .MuiDataGrid-cell {
      border-bottom:1px solid var(--border);
      font-size:14px;
      color: var(--text2);
    }
    .ii-dg .MuiDataGrid-row:nth-child(odd) { background:var(--rowOdd); }
    .ii-dg .MuiDataGrid-row:nth-child(even) { background:var(--rowEven); }
    .ii-dg .MuiDataGrid-row:hover { background:var(--hover); }
    .ii-dg .MuiDataGrid-footerContainer {
      border-top:1px solid var(--border);
      background:var(--card2);
      color: var(--text2);
    }

    /* === FORCE DataGrid header dark mode (wins vs MUI injected styles) === */
    .ii-dg .MuiDataGrid-columnHeaders,
    .ii-dg .MuiDataGrid-columnHeadersInner,
    .ii-dg .MuiDataGrid-columnHeader,
    .ii-dg .MuiDataGrid-columnHeaderTitleContainer {
      background: var(--thead) !important;
    }
    .ii-dg .MuiDataGrid-columnHeaders {
      border-bottom: 1px solid var(--border) !important;
    }
    .ii-dg .MuiDataGrid-columnHeaderTitle,
    .ii-dg .MuiDataGrid-columnHeaderTitleContainerContent,
    .ii-dg .MuiDataGrid-sortIcon,
    .ii-dg .MuiDataGrid-menuIcon,
    .ii-dg .MuiDataGrid-iconButtonContainer {
      color: var(--muted) !important;
    }

    /* Chips / badges */
    .ii-chip {
      display:inline-flex; align-items:center; padding:4px 8px; border-radius:8px;
      border:1px solid var(--chipBorder);
      background:var(--chipBg);
      font-weight:800; color:var(--text);
      font-size:12px;
    }
    .ii-badge {
      display:inline-block; padding:4px 8px; border-radius:999px; font-size:12px; font-weight:800;
      background:var(--badgeBg);
      color:var(--badgeText);
      border:1px solid var(--badgeBorder);
    }

    /* Modal */
    .ii-dim {
      position:fixed; inset:0; background:rgba(0,0,0,.55);
      display:flex; align-items:center; justify-content:center; z-index:50;
      animation: ii-fade .18s ease-out forwards;
    }
    .ii-modal {
      width:min(540px, 92vw);
      background:var(--card);
      border:1px solid var(--border);
      border-radius:14px;
      box-shadow: var(--shadow);
      overflow:hidden;
      animation: ii-slide .22s ease-out forwards;
      color: var(--text2);
    }
    .ii-mhead { padding:12px 14px; border-bottom:1px solid var(--border); }
    .ii-mhead h4 { margin:0; font-weight:900; color: var(--text); }
    .ii-mbody { padding:14px; color:var(--text2); }
    .ii-mfoot { padding:12px 14px; border-top:1px solid var(--border); text-align:right; background: ${isDark ? "rgba(255,255,255,0.02)" : "#fff"}; }

    .ii-btn {
      display:inline-flex; align-items:center; gap:8px; border:0; border-radius:10px; cursor:pointer;
      font-weight:900; padding:10px 14px;
    }
    .ii-btn-ghost {
      background:${isDark ? "rgba(255,255,255,0.03)" : "#fff"};
      border:1px solid var(--border);
      color:var(--text);
    }
    .ii-btn-ghost:hover { background:${isDark ? "rgba(124,58,237,0.12)" : "#f1f5f9"}; }
    .ii-btn-primary { color:#fff; background: linear-gradient(180deg, #7C3AED, #5B21B6); }
    .ii-btn-primary:hover { background: linear-gradient(180deg, #5B21B6, #5B21B6); }

    /* Snackbar */
    .ii-snack {
      position:fixed; right:16px; bottom:16px; background:var(--danger); color:#fff; padding:10px 12px;
      border-radius:10px; box-shadow:0 10px 20px rgba(0,0,0,.15);
      transform: translateY(12px); opacity:0; animation: ii-pop .25s ease-out forwards;
      z-index:60;
    }

    /* Pure CSS Bar Chart */
    .ii-chart { display:flex; flex-direction:column; height:100%; }
    .ii-chart-body { flex:1; min-height:380px; display:flex; gap:10px; padding:8px 12px 12px; align-items:flex-end; overflow:auto; }
    .ii-bar {
      width:36px; min-width:36px; border-radius:8px 8px 0 0;
      background: linear-gradient(180deg, #8b5cf6, #5B21B6);
      box-shadow: 0 6px 14px rgba(124,58,237,.18);
      position:relative; display:flex; align-items:flex-end; justify-content:center;
      transition: transform .12s ease;
    }
    .ii-bar:hover { transform: translateY(-2px); }
    .ii-bar-value {
      position:absolute; top:-24px; font-size:11px; font-weight:900;
      color:${isDark ? "#e5e7eb" : "#5B21B6"};
      background:${isDark ? "rgba(15,23,42,0.92)" : "#fff"};
      border:1px solid var(--border);
      padding:2px 6px; border-radius:999px; white-space:nowrap;
      transform: translateY(-2px);
    }
    .ii-bar-label {
      margin-top:6px; font-size:11px; color:var(--text2); max-width:60px; text-align:center;
      word-break:break-word;
      display:block;
    }
    .ii-chart-head { padding:8px 12px; border-bottom:1px solid var(--border); background: var(--card2); }
    .ii-chart-head h4 { margin:0; font-weight:900; font-size:14px; color: var(--text); }
    .ii-chart-head p { margin:2px 0 0; font-size:12px; color:var(--text2); }

    /* MUI DataGrid - dark mode polish */
    .ii-dg .MuiDataGrid-root { color: var(--text2); }
    .ii-dg .MuiDataGrid-iconButtonContainer,
    .ii-dg .MuiDataGrid-menuIcon,
    .ii-dg .MuiDataGrid-sortIcon,
    .ii-dg .MuiDataGrid-filterIcon,
    .ii-dg .MuiDataGrid-columnHeaderTitle { color: var(--muted); }
    .ii-dg .MuiTablePagination-root,
    .ii-dg .MuiTablePagination-selectLabel,
    .ii-dg .MuiTablePagination-displayedRows,
    .ii-dg .MuiTablePagination-actions { color: var(--muted); }
    .ii-dg .MuiSvgIcon-root { color: var(--muted); }
    .ii-dg .MuiCheckbox-root { color: var(--muted); }
    .ii-dg .MuiDataGrid-virtualScroller { background: var(--card); }

    /* keyframes */
    @keyframes ii-fade { from { opacity:0 } to { opacity:1 } }
    @keyframes ii-slide { from { transform: translateY(12px) scale(.98); opacity:0 } to { transform:none; opacity:1 } }
    @keyframes ii-pop { to { transform:none; opacity:1 } }
  `}</style>
);

/* ===================== Info Modal (same UX) ===================== */
const InfoModal = ({ open, onClose }) => {
  if (!open) return null;
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
  );
};

/* ===================== Component ===================== */
const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

const RecipeInventory = () => {
  // Theme (sync with Topbar)
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme-mode") === "dark");
  useEffect(() => {
    const onThemeChanged = () => setIsDark(localStorage.getItem("theme-mode") === "dark");
    window.addEventListener("themeChanged", onThemeChanged);
    return () => window.removeEventListener("themeChanged", onThemeChanged);
  }, []);

  const { cognitoId } = useAuth() || {};
  const { recipeInventory, setRecipeInventory } = useData();
  const [infoOpen, setInfoOpen] = useState(false);
  const [snack, setSnack] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch & aggregate from Production Log -> recipe inventory (units)
  useEffect(() => {
    const fetchAndProcess = async () => {
      try {
        if (!cognitoId) {
          setRecipeInventory([]);
          setSnack("No Cognito ID found.");
          return;
        }

        const url = `${API_BASE}/production-log/active?cognito_id=${encodeURIComponent(cognitoId)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];

        const filtered = list.filter((row) => Number(row.batchRemaining) > 0);

        const grouped = filtered.reduce((acc, row) => {
          const rec = row.recipe || "Unknown";
          const rem = Number(row.batchRemaining) || 0;
          const waste = Number(row.units_of_waste) || 0;
          const available = Math.max(0, rem - waste);

          if (!acc[rec]) {
            acc[rec] = { recipe: rec, totalUnits: available, batchCode: row.batchCode };
          } else {
            acc[rec].totalUnits += available;
          }
          return acc;
        }, {});

        const processed = Object.values(grouped).map((g, idx) => ({
          id: `${g.recipe}-${idx}`,
          recipe: g.recipe,
          unitsInStock: g.totalUnits,
          batchCode: g.batchCode || "-",
        }));

        setRecipeInventory(processed);
      } catch (e) {
        console.error("Recipe inventory load failed:", e);
        setRecipeInventory([]);
        setSnack("API error — could not load recipe inventory.");
      }
    };

    fetchAndProcess();
  }, [cognitoId, setRecipeInventory]);

  // Search / filter rows
  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return recipeInventory || [];
    return (recipeInventory || []).filter((r) =>
      [r.recipe, r.batchCode, r.unitsInStock].some((field) => String(field ?? "").toLowerCase().includes(q))
    );
  }, [recipeInventory, searchQuery]);

  // DataGrid columns
  const columns = useMemo(
    () => [
      { field: "recipe", headerName: "Recipe", flex: 1, minWidth: 180 },
      {
        field: "unitsInStock",
        headerName: "Units in Stock",
        type: "number",
        flex: 0.6,
        minWidth: 150,
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
    []
  );

  // Chart data
  const chartData = useMemo(
    () =>
      (filteredRows || []).map((r) => ({
        name: r.recipe,
        amount: Number(r.unitsInStock) || 0,
      })),
    [filteredRows]
  );

  const maxAmount = useMemo(() => Math.max(0, ...chartData.map((d) => d.amount)), [chartData]);

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
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={isDark ? "#94a3b8" : "#334155"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </button>
        </div>

        <div className="ii-grid">
          {/* Table Card */}
          <div className="ii-card">
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
                  "& .MuiDataGrid-columnSeparator": { display: "none" },
                  "& .MuiDataGrid-virtualScroller": { backgroundColor: "transparent" },
                  "& .MuiDataGrid-overlay": {
                    color: isDark ? "#94a3b8" : "#64748b",
                    background: "transparent",
                  },

                  /* Belt + braces: force header bg in sx too */
                  "& .MuiDataGrid-columnHeaders": {
                    backgroundColor: "var(--thead)",
                    color: "var(--muted)",
                    borderBottom: "1px solid var(--border)",
                  },
                  "& .MuiDataGrid-columnHeaderTitle": { color: "var(--muted)", fontWeight: 900 },
                  "& .MuiDataGrid-sortIcon, & .MuiDataGrid-menuIcon": { color: "var(--muted)" },
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
                  <div style={{ margin: "auto", color: isDark ? "#94a3b8" : "#64748b" }}>No data for chart.</div>
                ) : (
                  chartData.map((d, i) => {
                    const pct = maxAmount > 0 ? d.amount / maxAmount : 0;
                    const h = Math.max(6, Math.round(pct * 300));
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
                    );
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
  );
};

export default RecipeInventory;
