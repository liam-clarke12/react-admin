// src/scenes/inventory/RecipeInventory.jsx
import React, { useEffect, useMemo, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";

/* ===================== Scoped Styles (identical to Ingredient Inventory) ===================== */
const Styles = () => (
  <style>{`
    .ii-page { background:#f1f5f9; min-height:100vh; color:#0f172a; }
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
    .ii-title { margin:0; font-weight:800; font-size:20px; }
    .ii-sub { margin:0; color:#334155; font-size:12px; }
    .ii-iconbtn {
      width:40px; height:40px; border-radius:999px;
      border:1px solid #e5e7eb; background:#ffffff; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      transition: background .15s ease, transform .08s ease;
    }
    .ii-iconbtn:hover { background:#f1f5f9; transform: translateY(-1px); }

    /* Grid */
    .ii-grid { display:grid; grid-template-columns: 1.6fr 1fr; gap:16px; }
    @media (max-width: 900px) { .ii-grid { grid-template-columns: 1fr; } }

    /* Cards */
    .ii-card {
      background:#fff; border:1px solid #e5e7eb; border-radius:16px; overflow:hidden;
      box-shadow:0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08);
    }
    .ii-card-head { padding:12px 14px; border-bottom:1px solid #e5e7eb; background:#ffffff; }
    .ii-card-head h3 { margin:0; font-weight:800; font-size:14px; }
    .ii-card-head p { margin:2px 0 0; font-size:12px; color:#334155; }

    /* DataGrid to mimic table styling */
    .ii-table-wrap { height: 520px; }
    .ii-dg .MuiDataGrid-columnHeaders {
      background:#fbfcfd; color:#334155; border-bottom:1px solid #e5e7eb; font-weight:800;
      text-transform:uppercase; letter-spacing:.02em; font-size:12px;
    }
    .ii-dg .MuiDataGrid-cell { border-bottom:1px solid #e5e7eb; font-size:14px; }
    .ii-dg .MuiDataGrid-row:nth-child(odd) { background:#ffffff; }
    .ii-dg .MuiDataGrid-row:nth-child(even) { background:#f8fafc; }
    .ii-dg .MuiDataGrid-row:hover { background:#f4f1ff; }
    .ii-dg .MuiDataGrid-footerContainer { border-top:1px solid #e5e7eb; background:#ffffff; }
    .ii-chip {
      display:inline-flex; align-items:center; padding:4px 8px; border-radius:8px;
      border:1px solid #e5e7eb; background:#f8fafc; font-weight:700; color:#0f172a; font-size:12px;
    }
    .ii-badge {
      display:inline-block; padding:4px 8px; border-radius:999px; font-size:12px; font-weight:700;
      background:#f9f5ff; color:#7C3AED; border:1px solid #eee;
    }

    /* Modal */
    .ii-dim {
      position:fixed; inset:0; background:rgba(0,0,0,.48);
      display:flex; align-items:center; justify-content:center; z-index:50;
      animation: ii-fade .18s ease-out forwards;
    }
    .ii-modal {
      width:min(540px, 92vw); background:#fff; border:1px solid #e5e7eb; border-radius:14px;
      box-shadow:0 10px 30px rgba(2,6,23,.22); overflow:hidden;
      animation: ii-slide .22s ease-out forwards;
    }
    .ii-mhead { padding:12px 14px; border-bottom:1px solid #e5e7eb; }
    .ii-mhead h4 { margin:0; font-weight:800; }
    .ii-mbody { padding:14px; color:#334155; }
    .ii-mfoot { padding:12px 14px; border-top:1px solid #e5e7eb; text-align:right; }
    .ii-btn {
      display:inline-flex; align-items:center; gap:8px; border:0; border-radius:10px; cursor:pointer;
      font-weight:800; padding:10px 14px;
    }
    .ii-btn-ghost { background:#fff; border:1px solid #e5e7eb; color:#0f172a; }
    .ii-btn-ghost:hover { background:#f1f5f9; }
    .ii-btn-primary { color:#fff; background: linear-gradient(180deg, #7C3AED, #5B21B6); }
    .ii-btn-primary:hover { background: linear-gradient(180deg, #5B21B6, #5B21B6); }

    /* Snackbar */
    .ii-snack {
      position:fixed; right:16px; bottom:16px; background:#dc2626; color:#fff; padding:10px 12px;
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
      position:absolute; top:-24px; font-size:11px; font-weight:800; color:#5B21B6;
      background:#fff; border:1px solid #e5e7eb; padding:2px 6px; border-radius:999px; white-space:nowrap;
      transform: translateY(-2px);
    }
    .ii-bar-label {
      margin-top:6px; font-size:11px; color:#334155; max-width:60px; text-align:center;
      word-break:break-word;
      display:block;
    }
    .ii-chart-head { padding:8px 12px; border-bottom:1px solid #e5e7eb; }
    .ii-chart-head h4 { margin:0; font-weight:800; font-size:14px; }
    .ii-chart-head p { margin:2px 0 0; font-size:12px; color:#334155; }

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
          These rows are read-only aggregates built from your active Production Log. To change
          units in stock, add, delete or edit entries in the <strong>Production Log</strong> screen.
          This view summarizes recipe inventory and cannot be edited directly.
        </div>
        <div className="ii-mfoot">
          <button className="ii-btn ii-btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

/* ===================== Component ===================== */
const API_BASE =
  "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

const RecipeInventory = () => {
  const { cognitoId } = useAuth() || {};
  const { recipeInventory, setRecipeInventory } = useData();
  const [infoOpen, setInfoOpen] = useState(false);
  const [snack, setSnack] = useState("");

  // Fetch & aggregate from Production Log -> recipe inventory (units)
  useEffect(() => {
    const fetchAndProcess = async () => {
      try {
        if (!cognitoId) {
          // still render an empty table gracefully
          setRecipeInventory([]);
          setSnack("No Cognito ID found.");
          return;
        }

        const url = `${API_BASE}/production-log/active?cognito_id=${encodeURIComponent(
          cognitoId
        )}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];

        // Filter active lots with positive batchRemaining (units), subtract waste
        const filtered = list.filter((row) => Number(row.batchRemaining) > 0);

        const grouped = filtered.reduce((acc, row) => {
          const rec = row.recipe || "Unknown";
          const rem = Number(row.batchRemaining) || 0; // stored units
          const waste = Number(row.units_of_waste) || 0;
          const available = Math.max(0, rem - waste);

          if (!acc[rec]) {
            acc[rec] = {
              recipe: rec,
              totalUnits: available,
              batchCode: row.batchCode,
            };
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

  // DataGrid columns (keeps pagination)
  const columns = useMemo(
    () => [
      { field: "recipe", headerName: "Recipe", flex: 1, minWidth: 180 },
      {
        field: "unitsInStock",
        headerName: "Units in Stock",
        type: "number",
        flex: 0.6,
        minWidth: 150,
        renderCell: (params) => (
          <span className="ii-chip">
            {Number(params.value ?? 0).toLocaleString()}
          </span>
        ),
        sortComparator: (a, b) => Number(a) - Number(b),
      },
      {
        field: "batchCode",
        headerName: "Sample Batch",
        flex: 0.8,
        minWidth: 180,
        renderCell: (params) => (
          <span className="ii-badge">{params.value || "-"}</span>
        ),
      },
    ],
    []
  );

  // Chart data (right card) using recipeInventory
  const chartData = useMemo(
    () =>
      (recipeInventory || []).map((r) => ({
        name: r.recipe,
        amount: Number(r.unitsInStock) || 0,
      })),
    [recipeInventory]
  );

  const maxAmount = useMemo(
    () => Math.max(0, ...chartData.map((d) => d.amount)),
    [chartData]
  );

  return (
    <div className="ii-page">
      <Styles />

      <div className="ii-wrap">
        {/* Header — identical structure */}
        <div className="ii-header">
          <div className="ii-hgroup">
            <div className="ii-logo" aria-label="Recipe Inventory">Rec</div>
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
            {/* Simple “i” icon to avoid extra deps */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </button>
        </div>

        {/* Grid: table left (DataGrid w/ pagination), chart right */}
        <div className="ii-grid">
          {/* Table Card */}
          <div className="ii-card">
            <div className="ii-card-head">
              <h3>Active Recipes</h3>
              <p>Total units in stock by recipe</p>
            </div>

            <div className="ii-table-wrap ii-dg">
              <DataGrid
                rows={recipeInventory}
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
                  "& .MuiDataGrid-columnSeparator": { display: "none" },
                  "& .MuiDataGrid-virtualScroller": { background: "#fff" },
                }}
              />
            </div>
          </div>

          {/* Chart Card (same position & style as Ingredient Inventory) */}
          <div className="ii-card" style={{ display: "flex", flexDirection: "column" }}>
            <div className="ii-chart-head">
              <h4>Inventory Levels</h4>
              <p>Units in stock by recipe</p>
            </div>

            <div className="ii-chart">
              <div className="ii-chart-body">
                {chartData.length === 0 ? (
                  <div style={{ margin:'auto', color:'#64748b' }}>No data for chart.</div>
                ) : (
                  chartData.map((d, i) => {
                    const pct = maxAmount > 0 ? (d.amount / maxAmount) : 0;
                    const h = Math.max(6, Math.round(pct * 300)); // up to ~300px
                    return (
                      <div className="ii-bar-wrap" key={`${d.name}-${i}`} style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
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

      {/* Info modal & snackbar */}
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
