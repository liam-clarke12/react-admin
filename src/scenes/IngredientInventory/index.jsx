// src/scenes/IngredientInventory/index.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

/* ===================== Scoped Styles ===================== */
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

    /* Table */
    .ii-table-wrap { overflow:auto; }
    .ii-table { width:100%; border-collapse:separate; border-spacing:0; font-size:14px; }
    .ii-thead th {
      text-align:left; font-size:12px; text-transform:uppercase; letter-spacing:.02em;
      background:#fbfcfd; color:#334155; padding:10px 12px; border-bottom:1px solid #e5e7eb; font-weight:800;
      position:sticky; top:0; z-index:1;
    }
    .ii-row { border-bottom:1px solid #e5e7eb; }
    .ii-row:nth-child(odd) { background:#ffffff; }
    .ii-row:nth-child(even) { background:#f8fafc; }
    .ii-row:hover { background:#f4f1ff; }
    .ii-td { padding:12px; }
    .ii-td-strong { font-weight:700; color:#0f172a; white-space:nowrap; }
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

/* ===================== Config & helpers ===================== */
const API_BASE =
  "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

// Fallback mock so UI still renders if API fails
const mockData = [
  { ingredient: "All-Purpose Flour", unit: "kg", totalRemaining: 25, barcode: "FL-AP-123", date: "2023-10-26" },
  { ingredient: "Granulated Sugar", unit: "kg", totalRemaining: 50, barcode: "SUG-GR-456", date: "2023-10-25" },
  { ingredient: "Unsalted Butter", unit: "kg", stockOnHand: 10, barcode: "BUT-UN-789", date: "2023-10-27" },
  { ingredient: "Large Eggs", unit: "units", totalRemaining: 144, barcode: "EGG-LG-101", date: "2023-10-24" },
  { ingredient: "Baking Soda", unit: "g", totalRemaining: 500, barcode: "SOD-BK-112", date: "2023-10-20" },
  { ingredient: "Milk", unit: "L", totalRemaining: 12, barcode: "MLK-WH-113", date: "2023-10-26" },
  { ingredient: "All-Purpose Flour", unit: "g", totalRemaining: 5000, barcode: "FL-AP-124", date: "2023-10-28" },
  { ingredient: "Milk", unit: "ml", totalRemaining: 2000, barcode: "MLK-WH-114", date: "2023-10-28" },
];

const detectUnitTypeAndFactor = (rawUnit) => {
  const u = String(rawUnit || "").trim().toLowerCase();
  if (!u) return { type: "units", base: "units", factor: 1 };
  if (u.includes("kg") || u.includes("kilogram")) return { type: "mass", base: "g", factor: 1000 };
  if (u.includes("g") || u.includes("gram")) return { type: "mass", base: "g", factor: 1 };
  if ((u.includes("l") && !u.includes("ml")) || u.includes("litre") || u.includes("liter")) return { type: "volume", base: "ml", factor: 1000 };
  if (u.includes("ml") || u.includes("milliliter") || u.includes("millilitre")) return { type: "volume", base: "ml", factor: 1 };
  if (u.includes("unit") || u.includes("each") || u.includes("pcs") || u.includes("piece")) return { type: "units", base: "units", factor: 1 };
  return { type: "units", base: "units", factor: 1 };
};

const formatDisplayForGroup = (type, totalBase) => {
  if (type === "mass") {
    if (Math.abs(totalBase) >= 1000) {
      const val = +(totalBase / 1000).toFixed(3);
      return { displayValue: val, displayUnit: "kg", numericForChart: val };
    }
    return { displayValue: +(+totalBase).toFixed(3), displayUnit: "g", numericForChart: totalBase };
  }
  if (type === "volume") {
    if (Math.abs(totalBase) >= 1000) {
      const val = +(totalBase / 1000).toFixed(3);
      return { displayValue: val, displayUnit: "L", numericForChart: val };
    }
    return { displayValue: +(+totalBase).toFixed(3), displayUnit: "ml", numericForChart: totalBase };
  }
  return { displayValue: Number(totalBase), displayUnit: "units", numericForChart: totalBase };
};

// Try to get cognito id from multiple places so data loads
const resolveCognitoId = (fromAuth) => {
  if (fromAuth) return fromAuth;
  try {
    const url = new URL(window.location.href);
    const qp = url.searchParams.get("cognito_id");
    if (qp) return qp;
  } catch {}
  try {
    const ls = localStorage.getItem("cognito_id") || localStorage.getItem("CognitoId");
    if (ls) return ls;
  } catch {}
  try {
    if (window && window.__COGNITO_ID) return window.__COGNITO_ID;
  } catch {}
  return null;
};

/* ===================== Info Modal ===================== */
const InfoModal = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div className="ii-dim" onClick={onClose}>
      <div className="ii-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ii-mhead">
          <h4>About this table</h4>
        </div>
        <div className="ii-mbody">
          These rows are read-only aggregates of your active goods-in lots. To change
          stock-on-hand values you must add, delete or edit the corresponding goods-in
          entries from the "Goods In" screen. This view summarizes active inventory and
          cannot be edited directly.
        </div>
        <div className="ii-mfoot">
          <button className="ii-btn ii-btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

/* ===================== Simple inline icons (self-contained) ===================== */
const InfoIcon = ({ size = 20, color = "#334155" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

/* ===================== Processor ===================== */
function processInventory(data) {
  const groups = {};
  (data || []).forEach((r, idx) => {
    const ingredient = (r?.ingredient ?? "").trim();
    if (!ingredient) return;

    const { type, base, factor } = detectUnitTypeAndFactor(r?.unit ?? "");
    const rawAmount = Number(r?.totalRemaining ?? r?.stockOnHand ?? 0) || 0;
    const baseAmount = rawAmount * (factor || 1);
    const key = ingredient.toLowerCase();

    if (!groups[key]) {
      groups[key] = {
        ingredient,
        totalBase: baseAmount,
        type,
        baseUnit: base,
        sampleBarcode: r?.activeBarcode ?? r?.barcode ?? "",
        sampleId: r?.batchCode ?? `${ingredient}-${idx}`,
        latestDate: r?.date ?? null,
      };
    } else {
      if (groups[key].type !== type) {
        const altKey = `${key}::${type}`;
        if (!groups[altKey]) {
          groups[altKey] = {
            ingredient: `${ingredient} (${type})`,
            totalBase: baseAmount,
            type,
            baseUnit: base,
            sampleBarcode: r?.activeBarcode ?? r?.barcode ?? "",
            sampleId: r?.batchCode ?? `${ingredient}-${idx}-alt`,
            latestDate: r?.date ?? null,
          };
        } else {
          groups[altKey].totalBase += baseAmount;
          if (r?.date && (!groups[altKey].latestDate || new Date(r.date) > new Date(groups[altKey].latestDate))) {
            groups[altKey].latestDate = r.date;
          }
        }
      } else {
        groups[key].totalBase += baseAmount;
        if (r?.date && (!groups[key].latestDate || new Date(r.date) > new Date(groups[key].latestDate))) {
          groups[key].latestDate = r.date;
        }
        if (!groups[key].sampleBarcode && (r?.activeBarcode || r?.barcode)) {
          groups[key].sampleBarcode = r?.activeBarcode ?? r?.barcode;
        }
      }
    }
  });

  const processed = Object.values(groups).map((g, i) => {
    const { displayValue, displayUnit, numericForChart } = formatDisplayForGroup(g.type, g.totalBase);
    return {
      id: g.sampleId ?? `${g.ingredient}-${i}`,
      ingredient: g.ingredient,
      unitsInStock: displayValue,
      unit: displayUnit,
      _numeric: numericForChart,
      barcode: g.sampleBarcode ?? "",
      date: g.latestDate,
    };
  });

  processed.sort((a, b) => a.ingredient.localeCompare(b.ingredient));
  return processed;
}

/* ===================== Main Component ===================== */
const IngredientInventory = () => {
  // 1) Get from useAuth (your request)
  const { cognitoId } = useAuth() || {};

  const [rows, setRows] = useState([]);
  const [infoOpen, setInfoOpen] = useState(false);
  const [snack, setSnack] = useState("");

  useEffect(() => {
    const fetchActiveInventory = async () => {
      const cid = resolveCognitoId(cognitoId); // prefer useAuth(), fallback to URL/localStorage/window

      try {
        if (!cid) {
          const processed = processInventory(mockData);
          setRows(processed);
          setSnack("No Cognito ID found. Showing mock data.");
          return;
        }

        const url = `${API_BASE}/ingredient-inventory/active?cognito_id=${encodeURIComponent(cid)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        const processed = processInventory(list);
        setRows(processed);
      } catch (e) {
        console.error("Inventory load failed:", e);
        const processed = processInventory(mockData);
        setRows(processed);
        setSnack("API error — showing mock data.");
      }
    };

    fetchActiveInventory();
  }, [cognitoId]);

  const chartData = useMemo(
    () =>
      (rows || []).map((r) => ({
        ingredient: r.ingredient,
        amount: Number(r._numeric) || 0,
      })),
    [rows]
  );

  const maxAmount = useMemo(
    () => Math.max(0, ...chartData.map((d) => d.amount)),
    [chartData]
  );

  return (
    <div className="ii-page">
      <Styles />

      <div className="ii-wrap">
        {/* Header */}
        <div className="ii-header">
          <div className="ii-hgroup">
            <div className="ii-logo" aria-label="Inventory">Inv</div>
            <div>
              <h1 className="ii-title">Ingredient Inventory</h1>
              <p className="ii-sub">Read-only aggregates of active Goods-In lots</p>
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

        {/* Grid: table left, chart right */}
        <div className="ii-grid">
          {/* Table Card */}
          <div className="ii-card" style={{ minHeight: 520 }}>
            <div className="ii-card-head">
              <h3>Active Stock</h3>
              <p>Normalized into g / ml / units</p>
            </div>
            <div className="ii-table-wrap">
              <table className="ii-table">
                <thead className="ii-thead">
                  <tr>
                    <th>Ingredient</th>
                    <th>Units in Stock</th>
                    <th>Unit</th>
                    <th>Active Barcode</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr className="ii-row">
                      <td className="ii-td" colSpan={4} style={{ textAlign: "center", color: "#64748b" }}>
                        No active inventory found.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, index) => (
                      <tr key={row.id || index} className="ii-row">
                        <td className="ii-td ii-td-strong">{row.ingredient}</td>
                        <td className="ii-td">
                          <span className="ii-chip">
                            {Number.isFinite(row.unitsInStock) ? row.unitsInStock.toLocaleString() : String(row.unitsInStock)}
                          </span>
                        </td>
                        <td className="ii-td">{row.unit}</td>
                        <td className="ii-td">
                          <span className="ii-badge">{row.barcode || "-"}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Chart Card (pure CSS) */}
          <div className="ii-card" style={{ display: "flex", flexDirection: "column" }}>
            <div className="ii-chart-head">
              <h4>Inventory Levels</h4>
              <p>Normalized amounts by ingredient</p>
            </div>

            <div className="ii-chart">
              <div className="ii-chart-body">
                {chartData.length === 0 ? (
                  <div style={{ margin:'auto', color:'#64748b' }}>No data for chart.</div>
                ) : (
                  chartData.map((d, i) => {
                    const pct = maxAmount > 0 ? (d.amount / maxAmount) : 0;
                    const h = Math.max(6, Math.round(pct * 300)); // up to 300px tall
                    return (
                      <div className="ii-bar-wrap" key={`${d.ingredient}-${i}`} style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                        <div className="ii-bar" style={{ height: `${h}px` }}>
                          <div className="ii-bar-value">{Number(d.amount).toLocaleString()}</div>
                        </div>
                        <span className="ii-bar-label">{d.ingredient}</span>
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

export default IngredientInventory;
