// IngredientsInventory.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart as RBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
    .ii-card-head {
      padding:12px 14px; border-bottom:1px solid #e5e7eb; background:#ffffff;
    }
    .ii-card-head h3 { margin:0; font-weight:800; font-size:14px; }
    .ii-card-head p { margin:2px 0 0; font-size:12px; color:#334155; }

    /* Table (no libs) */
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

    @keyframes ii-fade { from { opacity:0 } to { opacity:1 } }
    @keyframes ii-slide { from { transform: translateY(12px) scale(.98); opacity:0 } to { transform:none; opacity:1 } }
    @keyframes ii-pop { to { transform:none; opacity:1 } }
  `}</style>
);

/* ===================== Helpers (unchanged logic) ===================== */
const API_BASE =
  "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

const detectUnitTypeAndFactor = (rawUnit) => {
  const u = String(rawUnit || "").trim().toLowerCase();
  if (!u) return { type: "units", base: "units", factor: 1 };

  // mass
  if (u.includes("kg") || u.includes("kilogram"))
    return { type: "mass", base: "g", factor: 1000 };
  if (u.includes("g") || u.includes("gram"))
    return { type: "mass", base: "g", factor: 1 };

  // volume
  if ((u.includes("l") && !u.includes("ml")) || u.includes("litre") || u.includes("liter"))
    return { type: "volume", base: "ml", factor: 1000 };
  if (u.includes("ml") || u.includes("milliliter") || u.includes("millilitre"))
    return { type: "volume", base: "ml", factor: 1 };

  // count
  if (u.includes("unit") || u.includes("each") || u.includes("pcs") || u.includes("pieces"))
    return { type: "units", base: "units", factor: 1 };

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

/* ===================== Main Component ===================== */
const IngredientsInventory = () => {
  const [rows, setRows] = useState([]);
  const [infoOpen, setInfoOpen] = useState(false);
  const [snack, setSnack] = useState("");

  // Fetch ACTIVE inventory (same endpoint/flow you had)
  useEffect(() => {
    const fetchActiveInventory = async () => {
      try {
        // If you need cognito_id, plug it here:
        const res = await fetch(`${API_BASE}/ingredient-inventory/active?cognito_id=mock-cognito-id`);
        if (!res.ok) throw new Error(`Failed to fetch (${res.status})`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];

        // group & normalize to base units
        const groups = {};
        list.forEach((r, idx) => {
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
            // if type changes (e.g., ml vs g), split into a separate group
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
                if (
                  r?.date &&
                  (!groups[altKey].latestDate ||
                    new Date(r.date) > new Date(groups[altKey].latestDate))
                ) {
                  groups[altKey].latestDate = r.date;
                }
              }
            } else {
              groups[key].totalBase += baseAmount;
              if (
                r?.date &&
                (!groups[key].latestDate ||
                  new Date(r.date) > new Date(groups[key].latestDate))
              ) {
                groups[key].latestDate = r.date;
              }
              if (!groups[key].sampleBarcode && (r?.activeBarcode || r?.barcode)) {
                groups[key].sampleBarcode = r?.activeBarcode ?? r?.barcode;
              }
            }
          }
        });

        const processed = Object.values(groups).map((g, i) => {
          const { displayValue, displayUnit, numericForChart } = formatDisplayForGroup(
            g.type,
            g.totalBase
          );
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
        setRows(processed);
      } catch (e) {
        console.error(e);
        setSnack("Failed to load ingredient inventory");
        setRows([]);
      }
    };

    fetchActiveInventory();
  }, []);

  const chartData = useMemo(
    () =>
      (rows || []).map((r) => ({
        ingredient: r.ingredient,
        amount: Number(r._numeric) || 0,
      })),
    [rows]
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

          <button className="ii-iconbtn" onClick={() => setInfoOpen(true)} aria-label="About this table">
            {/* Info icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
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

          {/* Chart Card */}
          <div className="ii-card" style={{ display: "flex", flexDirection: "column" }}>
            <div className="ii-card-head">
              <h3>Inventory Levels</h3>
              <p>Normalized amounts by ingredient</p>
            </div>
            <div style={{ flex: 1, minHeight: 420, padding: 8 }}>
              {chartData.length === 0 ? (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                  No data for chart.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RBarChart
                    data={chartData}
                    margin={{ top: 5, right: 20, left: 10, bottom: 100 }}
                  >
                    <defs>
                      <linearGradient id="iiColorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#5B21B6" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                      dataKey="ingredient"
                      angle={-45}
                      textAnchor="end"
                      interval={0}
                      height={90}
                      tick={{ fontSize: 12, fill: '#334155' }}
                      stroke="#e5e7eb"
                    />
                    <YAxis tick={{ fontSize: 12, fill: '#334155' }} stroke="#e5e7eb" />
                    <Tooltip
                      cursor={{ fill: 'rgba(124, 58, 237, 0.08)' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div style={{
                              background:'#fff', border:'1px solid #e5e7eb',
                              borderRadius:8, padding:8, boxShadow:'0 10px 20px rgba(0,0,0,.08)'
                            }}>
                              <div style={{ fontWeight:800, color:'#0f172a' }}>{label}</div>
                              <div style={{ fontSize:12, color:'#5B21B6', fontWeight:700 }}>
                                Amount: {Number(payload[0].value).toLocaleString()}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="amount" fill="url(#iiColorAmount)" radius={[4,4,0,0]} />
                  </RBarChart>
                </ResponsiveContainer>
              )}
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

export default IngredientsInventory;
