// src/scenes/dashboard/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

/* ===========================
   Inline CSS (no Tailwind)
   =========================== */
const DashboardStyles = () => (
  <style>{`
    :root{
      --bg: #f3f4f6; --bg-card: #ffffff; --text: #111827; --text-muted: #6b7280; --text-muted-2: #374151;
      --indigo: #6366f1; --shadow: 0 4px 16px rgba(0,0,0,0.08); --shadow-strong: 0 10px 30px rgba(0,0,0,0.18);
      --g50: #f9fafb; --g200: #e5e7eb; --g700: #374151; --green: #10b981; --green-100: #d1fae5; --green-900: #064e3b; --green-300: #86efac;
      --red: #ef4444; --red-100: #fee2e2; --red-900: #7f1d1d; --red-300: #fca5a5; --yellow: #f59e0b;
      --overlay: rgba(0,0,0,0.2); --overlay-dark: rgba(0,0,0,0.4); --radius-xl: 14px; --radius-full: 999px; --pad: 24px; --gap: 24px;
    }
    @media (prefers-color-scheme: dark) {
      :root{ --bg:#111827; --bg-card:#1f2937; --text:#f9fafb; --text-muted:#9ca3af; --text-muted-2:#e5e7eb; --g50:rgba(55,65,81,0.5); --g200:#374151; --g700:#374151; --shadow:0 6px 22px rgba(0,0,0,0.35); --shadow-strong:0 16px 40px rgba(0,0,0,0.55); }
    }
    .dash { min-height: 100vh; background: var(--bg); padding: 24px 16px; }
    .container { max-width: 1120px; margin: 0 auto; }
    .header { margin-bottom: 24px; }
    .h1 { font-size: 28px; font-weight: 800; color: var(--text); margin: 0 0 6px 0; }
    @media (min-width:768px){ .h1{ font-size:34px; } }
    .sub { color: var(--text-muted); font-size: 14px; margin: 0; }

    .grid { display: grid; gap: var(--gap); }
    .grid-3 { grid-template-columns: 1fr; }
    @media (min-width:640px){ .grid-3{ grid-template-columns: repeat(2,1fr); } }
    @media (min-width:1024px){ .grid-3{ grid-template-columns: repeat(3,1fr); } }

    .main-grid { grid-template-columns: 1fr; }
    .subgrid-2 { grid-template-columns: 1fr; }
    @media (min-width:1024px){ .subgrid-2{ grid-template-columns: repeat(2,1fr); } }

    .card { background: var(--bg-card); border-radius: var(--radius-xl); box-shadow: var(--shadow); padding: var(--pad); display: flex; flex-direction: column; min-width: 0; }
    .card-header { display: flex; align-items: center; margin-bottom: 16px; }
    .card-title { font-size: 20px; font-weight: 600; color: var(--text-muted-2); margin: 0; }
    .card-body { flex: 1 1 auto; min-height: 0; }

    .kpi { font-size: 32px; font-weight: 800; color: var(--text); }

    .list { display: flex; flex-direction: column; gap: 12px; height: 100%; overflow-y: auto; padding-right: 8px; }
    .list-empty { color: var(--text-muted); height: 100%; display: flex; align-items: center; justify-content: center; text-align: center; }
    .list-item { display: flex; justify-content: space-between; align-items: center; font-size: 14px; }
    .list-item-title { font-weight: 600; color: var(--text); margin: 0 0 4px 0; }
    .list-item-sub { color: var(--text-muted); margin: 0; }

    .badge { font-weight: 700; border-radius: var(--radius-full); padding: 6px 12px; font-size: 16px; }
    .badge-green { background: var(--green-100); color: #065f46; }
    .badge-red { background: var(--red-100); color: #b91c1c; }
    @media (prefers-color-scheme: dark){ .badge-green{ background: var(--green-900); color: var(--green-300);} .badge-red{ background: var(--red-900); color: var(--red-300);} }

    .muted-box { background: var(--g50); border-radius: 10px; padding: 12px; display: flex; justify-content: space-between; align-items: center; }

    .progress-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 14px; }
    .progress-row .name { font-weight: 500; color: var(--text); }
    .progress-row .qty { color: var(--text-muted); }
    .progress { width: 100%; height: 10px; background: var(--g200); border-radius: var(--radius-full); overflow: hidden; }
    @media (prefers-color-scheme: dark){ .progress{ background: var(--g700); } }
    .bar { height: 100%; border-radius: var(--radius-full); transition: width .3s ease; }
    .bar.green { background: #10b981; } .bar.yellow { background: #f59e0b; } .bar.red { background: #ef4444; }

    .chart { width: 100%; height: 290px; }

    .veil { position: fixed; inset: 0; background: var(--overlay); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 50; }
    @media (prefers-color-scheme: dark){ .veil{ background: var(--overlay-dark); } }
    .veil-box { background: var(--bg-card); color: var(--text); border-radius: var(--radius-xl); box-shadow: var(--shadow-strong); padding: 16px 24px; font-weight: 600; }
  `}</style>
);

/* ==========================================
   Unit helpers (normalize amounts)
   ========================================== */

const UnitGroup = Object.freeze({ GRAMS: "grams_group", ML: "ml_group", UNITS: "units_group" });

function detectUnitGroup(unit) {
  const u = String(unit || "").toLowerCase();
  if (u === "kg" || u === "g" || u === "grams") return UnitGroup.GRAMS;
  if (u === "l" || u === "litre" || u === "litres" || u === "liter" || u === "liters" || u === "ml") return UnitGroup.ML;
  return UnitGroup.UNITS;
}

function toBaseAmount(amount, unit) {
  const val = Number(amount || 0);
  const u = String(unit || "").toLowerCase();
  if (u === "kg") return val * 1000;            // grams base
  if (u === "g" || u === "grams") return val;   // grams base
  if (u === "l" || u === "litre" || u === "litres" || u === "liter" || u === "liters") return val * 1000; // ml base
  if (u === "ml") return val;                   // ml base
  return val;                                   // units base (no change)
}

function formatDisplayAmount(baseAmount, group) {
  const n = Number(baseAmount || 0);
  if (group === UnitGroup.GRAMS) {
    if (Math.abs(n) >= 1000) return { amount: Number((n / 1000).toFixed(2)), unit: "kg" };
    return { amount: Math.round(n), unit: "g" };
  }
  if (group === UnitGroup.ML) {
    if (Math.abs(n) >= 1000) return { amount: Number((n / 1000).toFixed(2)), unit: "L" };
    return { amount: Math.round(n), unit: "ml" };
  }
  return { amount: Math.round(n), unit: "units" };
}

/* ==========================================
   Inline components (no Tailwind classes)
   ========================================== */

const DashboardCard = ({ title, icon, children, className = "" }) => (
  <div className={`card ${className}`}>
    <div className="card-header">
      {icon && <span className="card-icon">{icon}</span>}
      <h2 className="card-title">{title}</h2>
    </div>
    <div className="card-body">{children}</div>
  </div>
);

// Expiring ingredients (from ACTIVE inventory)
const ExpiringIngredients = ({ ingredients }) => {
  const list = Array.isArray(ingredients) ? ingredients : [];
  if (list.length === 0) return <div className="list-empty">No ingredients expiring soon. Good job!</div>;

  const getDaysRemaining = (date) => {
    if (!date) return 0;
    const today = new Date(); today.setHours(0,0,0,0);
    const expiry = new Date(date); expiry.setHours(0,0,0,0);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000*60*60*24));
  };

  return (
    <div className="list" style={{height: 320}}>
      {list.map((ing) => {
        const daysRemaining = getDaysRemaining(ing.expiryDate);
        const urgencyStyle =
          daysRemaining <= 1 ? { color: "#ef4444" } :
          daysRemaining <= 3 ? { color: "#f59e0b" } :
          { color: "var(--text-muted)" };
        return (
          <div key={ing.id} className="list-item">
            <div>
              <p className="list-item-title">{ing.name}</p>
              <p className="list-item-sub">
                {ing.display.amount} {ing.display.unit}
              </p>
            </div>
            <span className="badge" style={urgencyStyle}>
              {daysRemaining <= 0 ? "Today" : `${daysRemaining}d`}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// Ingredient stock bars (normalized; label shows nice display)
const IngredientStock = ({ ingredients }) => {
  const list = Array.isArray(ingredients) ? ingredients : [];
  if (list.length === 0) return <p className="list-item-sub">No ingredients in stock.</p>;

  const sorted = [...list].sort((a, b) => (a.stockBase / a.maxBase) - (b.stockBase / b.maxBase));

  return (
    <div className="list" style={{height: 320}}>
      {sorted.map((ing) => {
        const pct = Math.max(0, Math.min(100, (ing.stockBase / ing.maxBase) * 100));
        const color = pct < 25 ? "red" : pct < 50 ? "yellow" : "green";
        return (
          <div key={ing.id}>
            <div className="progress-row">
              <span className="name">{ing.name}</span>
              <span className="qty">{ing.display.amount} {ing.display.unit}</span>
            </div>
            <div className="progress">
              <div className={`bar ${color}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Recipe availability tiles (NOW: total units produced this ISO week, per recipe, from production-log/active)
const RecipeInventory = ({ weeklyRecipeUnits }) => {
  const entries = Object.entries(weeklyRecipeUnits || {}).sort((a,b) => b[1]-a[1]);
  if (entries.length === 0) return <p className="list-item-sub">No recipes produced this week.</p>;

  return (
    <div className="list">
      {entries.map(([name, units]) => (
        <div key={name} className="muted-box">
          <span className="name" style={{ color: "var(--text)" }}>{name}</span>
          <span className={`badge ${units > 0 ? "badge-green" : "badge-red"}`}>
            x{units}
          </span>
        </div>
      ))}
    </div>
  );
};

// Weekly usage chart wrapper (NOW: batches per day for current ISO week, from production log)
const WeeklyUsageChart = ({ data }) => (
  <div className="chart">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
        <XAxis dataKey="day" tick={{ fill: "#9CA3AF" }} />
        <YAxis tick={{ fill: "#9CA3AF" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(31, 41, 55, 0.85)",
            borderColor: "#4B5563",
            borderRadius: "8px",
          }}
          labelStyle={{ color: "#F9FAFB" }}
        />
        <Legend />
        <Bar dataKey="batches" fill="#6366F1" name="Batches" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

/* ===========================
   Helpers
   =========================== */

const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

function startOfISOWeek(d = new Date()) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Mon=0 .. Sun=6
  date.setHours(0,0,0,0);
  date.setDate(date.getDate() - day);
  return date;
}
function endOfISOWeek(d = new Date()) {
  const start = startOfISOWeek(d);
  const end = new Date(start);
  end.setDate(start.getDate() + 7); // exclusive
  return end;
}

/* ===========================
   Dashboard container
   =========================== */

const Dashboard = () => {
  const { cognitoId } = useAuth() || {};
  const [loading, setLoading] = useState(true);

  // data
  const [inventoryRaw, setInventoryRaw] = useState([]);
  const [prodLogs, setProdLogs] = useState([]);           // full production-log (for batches chart)
  const [prodLogsActive, setProdLogsActive] = useState([]); // production-log/active (for recipe availability)
  const [goodsInRaw, setGoodsInRaw] = useState([]);       // kept if you want elsewhere later

  useEffect(() => {
    if (!cognitoId) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [invRes, plRes, plaRes, giRes] = await Promise.all([
          fetch(`${API_BASE}/ingredient-inventory/active?cognito_id=${encodeURIComponent(cognitoId)}`),
          fetch(`${API_BASE}/production-log?cognito_id=${encodeURIComponent(cognitoId)}`),
          fetch(`${API_BASE}/production-log/active?cognito_id=${encodeURIComponent(cognitoId)}`),
          fetch(`${API_BASE}/goods-in?cognito_id=${encodeURIComponent(cognitoId)}`),
        ]);
        const [invJson, plJson, plaJson, giJson] = await Promise.all([
          invRes.ok ? invRes.json() : [],
          plRes.ok ? plRes.json() : [],
          plaRes.ok ? plaRes.json() : [],
          giRes.ok ? giRes.json() : [],
        ]);
        if (!mounted) return;
        setInventoryRaw(Array.isArray(invJson) ? invJson : []);
        setProdLogs(Array.isArray(plJson) ? plJson : []);
        setProdLogsActive(Array.isArray(plaJson) ? plaJson : []);
        setGoodsInRaw(Array.isArray(giJson) ? giJson : []);
      } catch (e) {
        console.error("Dashboard load error:", e);
        if (!mounted) return;
        setInventoryRaw([]); setProdLogs([]); setProdLogsActive([]); setGoodsInRaw([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [cognitoId]);

  const {
    kpiStockoutsCount,
    kpiLowStockCount,
    ingredientStockList,
    expiringSoonList,
    weeklyBatchesData,       // ISO week: batches per day
    weeklyRecipeUnits,       // ISO week: units per recipe (from production-log/active)
  } = useMemo(() => {
    // --- Active inventory mapping (normalize amounts) ---
    const mapped = (inventoryRaw || []).map((r, i) => {
      const name = r.ingredient || "Unknown";
      const unit = r.unit || "";
      const group = detectUnitGroup(unit);
      const stockBase = toBaseAmount(r.totalRemaining, unit); // g or ml (or units)
      // Display in a nice unit (kg/L if big)
      const display = formatDisplayAmount(stockBase, group);

      // Expiry normalization
      const rawExpiry =
        r.expiryDate || r.expiry || r.bestBefore || r.best_before || r.activeExpiry || r.batchExpiry;
      const d = rawExpiry ? new Date(rawExpiry) : null;
      const expiryDate = d && !Number.isNaN(d.getTime()) ? d : undefined;

      return {
        id: `${name}-${i}`,
        name,
        group,
        stockBase,        // normalized numeric for math
        display,          // {amount, unit} for labels
        expiryDate,
      };
    });

    // Heuristic max per item (in base units) for bar visuals
    const meanBase = mapped.reduce((s, it) => s + (it.stockBase || 0), 0) / Math.max(mapped.length, 1);
    const ingredientStockList = mapped
      .map((it) => {
        const maxBase = Math.max(it.stockBase, Math.round(meanBase * 1.25), 1);
        return { ...it, maxBase };
      })
      .sort((a, b) => (a.stockBase / a.maxBase) - (b.stockBase / b.maxBase));

    // Expiring soon (next 7 days) — FROM ACTIVE INVENTORY ONLY
    const now = new Date();
    const soonCut = new Date(startOfISOWeek(now)); // start of week baseline
    soonCut.setDate(soonCut.getDate() + 7);
    const expiringSoonList = ingredientStockList
      .filter((r) => r.expiryDate && r.expiryDate <= soonCut)
      .sort((a, b) => (a.expiryDate?.getTime() || 0) - (b.expiryDate?.getTime() || 0))
      .slice(0, 30);

    // KPIs
    const kpiStockoutsCount = ingredientStockList.filter((it) => (it.stockBase || 0) <= 0).length;

    // Low stock: percentage-based to be unit-agnostic (<= 25% of max)
    const kpiLowStockCount = ingredientStockList.filter((it) => {
      const pct = (it.stockBase / it.maxBase) * 100;
      return pct <= 25 && it.stockBase > 0; // exclude stockouts from low-stock
    }).length;

    // --- Weekly batches per day (ISO week) from production-log ---
    const weekStart = startOfISOWeek(new Date());
    const weekEnd = endOfISOWeek(new Date());
    const withinWeek = (d) => d >= weekStart && d < weekEnd;

    const dayMap = new Map(DAYS.map((d) => [d, 0]));
    let weeklyBatchSum = 0;

    (prodLogs || []).forEach((row) => {
      const d = new Date(row?.date || row?.production_log_date || row?.createdAt || row?.created_at || "");
      if (Number.isNaN(d.getTime()) || !withinWeek(d)) return;
      const dow = (d.getDay() + 6) % 7; // Mon=0..Sun=6
      const key = DAYS[dow];
      const batches = Number(row.batchesProduced ?? row.batches ?? row.batch_count ?? 0);
      dayMap.set(key, (dayMap.get(key) || 0) + batches);
      weeklyBatchSum += batches;
    });

    const weeklyBatchesData = DAYS.map((day) => ({ day, batches: dayMap.get(day) || 0 }));
    const kpiRecentProduction = weeklyBatchSum;

    // --- Weekly recipe units (ISO week) from production-log/active ---
    const recipeUnits = {};
    (prodLogsActive || []).forEach((row) => {
      const d = new Date(row?.date || row?.production_log_date || row?.createdAt || row?.created_at || "");
      if (Number.isNaN(d.getTime()) || !withinWeek(d)) return;
      const name = row.recipe || row.recipe_name || row.product || "Unknown";
      const units = Number(row.unitsProduced ?? row.units ?? row.output_units ?? 0);
      recipeUnits[name] = (recipeUnits[name] || 0) + units;
    });

    return {
      kpiStockoutsCount,
      kpiLowStockCount,
      ingredientStockList,
      expiringSoonList,
      weeklyBatchesData,
      weeklyRecipeUnits: recipeUnits,
    };
  }, [inventoryRaw, prodLogs, prodLogsActive]);

  return (
    <div className="dash">
      <DashboardStyles />
      <div className="container header">
        <h1 className="h1">Inventory & Production Dashboard</h1>
        <p className="sub">Current ISO week (Mon–Sun): production & inventory at a glance.</p>
      </div>

      {/* KPI Row */}
      <div className="container grid grid-3" style={{ marginBottom: 24 }}>
        <DashboardCard title="Stockouts (0 qty)">
          <div className="kpi">{kpiStockoutsCount}</div>
        </DashboardCard>
        <DashboardCard title="Low Stock (≤ 25% of max)">
          <div className="kpi">{kpiLowStockCount}</div>
        </DashboardCard>
        <DashboardCard title="Batches Produced (This Week)">
          <div className="kpi">{weeklyBatchesData.reduce((s, d) => s + (d.batches || 0), 0)}</div>
        </DashboardCard>
      </div>

      {/* Main Grid */}
      <div className="container grid main-grid">
        <div className="grid subgrid-2" style={{ gap: "24px" }}>
          <DashboardCard title="Ingredient Stock Levels">
            <IngredientStock ingredients={ingredientStockList} />
          </DashboardCard>

          <DashboardCard title="Expiring Soon (next 7 days)">
            <ExpiringIngredients ingredients={expiringSoonList} />
          </DashboardCard>

          <DashboardCard title="Batches per Day (This Week)">
            <WeeklyUsageChart data={weeklyBatchesData} />
          </DashboardCard>

          <DashboardCard title="Recipe Availability (Units made this week)">
            <RecipeInventory weeklyRecipeUnits={weeklyRecipeUnits} />
          </DashboardCard>
        </div>
      </div>

      {loading && (
        <div className="veil">
          <div className="veil-box">Loading…</div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
