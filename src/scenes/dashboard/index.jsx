// src/scenes/dashboard/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

/* ===========================
   Dynamic CSS with Dark Mode
   =========================== */
const DashboardStyles = ({ isDark }) => (
  <style>{`
    :root {
      /* Dynamic Variables */
      --bg: ${isDark ? "#0f172a" : "#f3f4f6"};
      --bg-card: ${isDark ? "#1e293b" : "#ffffff"};
      --text: ${isDark ? "#f1f5f9" : "#111827"};
      --text-muted: ${isDark ? "#94a3b8" : "#6b7280"};
      --text-muted-2: ${isDark ? "#cbd5e1" : "#374151"};
      --border: ${isDark ? "#334155" : "#e5e7eb"};
      --g50: ${isDark ? "#334155" : "#f9fafb"};
      --g200: ${isDark ? "#475569" : "#e5e7eb"};
      
      /* Static Variables */
      --indigo: #6366f1; 
      --shadow: ${isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 16px rgba(0,0,0,0.08)"};
      --green-100: ${isDark ? "rgba(16, 185, 129, 0.2)" : "#d1fae5"};
      --red-100: ${isDark ? "rgba(239, 68, 68, 0.2)" : "#fee2e2"};
      --radius-xl: 14px; --radius-full: 999px; --pad: 24px; --gap: 24px;
    }

    .dash { min-height: 100vh; background: var(--bg); padding: 24px 16px; transition: background 0.3s ease; }
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

    .card { background: var(--bg-card); border-radius: var(--radius-xl); box-shadow: var(--shadow); padding: var(--pad); border: 1px solid var(--border); display: flex; flex-direction: column; transition: all 0.3s ease; }
    .card-title { font-size: 20px; font-weight: 600; color: var(--text-muted-2); margin: 0; }

    .kpi { font-size: 32px; font-weight: 800; color: var(--text); }

    .list-item-title { font-weight: 600; color: var(--text); margin: 0 0 4px 0; }
    .list-item-sub { color: var(--text-muted); margin: 0; }

    .badge-green { background: var(--green-100); color: #10b981; }
    .badge-red { background: var(--red-100); color: #ef4444; }

    .progress-row .name { font-weight: 500; color: var(--text); }
    .progress { width: 100%; height: 10px; background: var(--g200); border-radius: var(--radius-full); overflow: hidden; }

    .veil { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 50; }
    .veil-box { background: var(--bg-card); color: var(--text); border-radius: var(--radius-xl); padding: 16px 24px; }
  `}</style>
);

/* ==========================================
   Logic Helpers (Same as before)
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
  if (u === "kg") return val * 1000;
  if (u === "g" || u === "grams") return val;
  if (u === "l" || u === "litre" || u === "litres" || u === "liter" || u === "liters") return val * 1000;
  if (u === "ml") return val;
  return val;
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

/* ===========================
   Component Components
   =========================== */

const DashboardCard = ({ title, icon, children, className = "" }) => (
  <div className={`card ${className}`}>
    <div className="card-header">
      <h2 className="card-title">{title}</h2>
    </div>
    <div className="card-body">{children}</div>
  </div>
);

const ExpiringIngredients = ({ ingredients }) => {
  const list = Array.isArray(ingredients) ? ingredients : [];
  if (list.length === 0) return <div className="list-empty">No ingredients expiring soon.</div>;
  const getDaysRemaining = (date) => {
    const today = new Date(); today.setHours(0,0,0,0);
    const expiry = new Date(date); expiry.setHours(0,0,0,0);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000*60*60*24));
  };
  return (
    <div className="list" style={{height: 320}}>
      {list.map((ing) => {
        const days = getDaysRemaining(ing.expiryDate);
        return (
          <div key={ing.id} className="list-item" style={{display:'flex', justifyContent:'space-between', marginBottom:'12px'}}>
            <div>
              <p className="list-item-title">{ing.name}</p>
              <p className="list-item-sub">{ing.display.amount} {ing.display.unit}</p>
            </div>
            <span style={{ fontWeight: 700, color: days <= 1 ? '#ef4444' : '#f59e0b' }}>{days <= 0 ? "Today" : `${days}d`}</span>
          </div>
        );
      })}
    </div>
  );
};

const IngredientStock = ({ ingredients }) => {
  if (!ingredients.length) return <p className="list-item-sub">No ingredients in stock.</p>;
  return (
    <div className="list" style={{height: 320}}>
      {ingredients.map((ing) => {
        const pct = Math.max(0, Math.min(100, (ing.stockBase / ing.maxBase) * 100));
        const colorClass = pct < 25 ? "red" : pct < 50 ? "yellow" : "green";
        return (
          <div key={ing.id} style={{marginBottom:'12px'}}>
            <div className="progress-row" style={{display:'flex', justifyContent:'space-between', fontSize:'14px'}}>
              <span className="name">{ing.name}</span>
              <span className="qty">{ing.display.amount} {ing.display.unit}</span>
            </div>
            <div className="progress"><div className={`bar ${colorClass}`} style={{ width: `${pct}%`, height:'10px', background: pct < 25 ? '#ef4444' : pct < 50 ? '#f59e0b' : '#10b981' }} /></div>
          </div>
        );
      })}
    </div>
  );
};

const RecipeStock = ({ recipes }) => {
    if (!recipes.length) return <p className="list-item-sub">No recipes in stock.</p>;
    return (
      <div className="list" style={{height: 320}}>
        {recipes.map((rec) => {
          const pct = Math.max(0, Math.min(100, (rec.stockBase / rec.maxBase) * 100));
          return (
            <div key={rec.id} style={{marginBottom:'12px'}}>
              <div className="progress-row" style={{display:'flex', justifyContent:'space-between', fontSize:'14px'}}>
                <span className="name">{rec.name}</span>
                <span className="qty">{rec.display.amount} units</span>
              </div>
              <div className="progress"><div style={{ width: `${pct}%`, height:'10px', background: '#6366f1' }} /></div>
            </div>
          );
        })}
      </div>
    );
  };

const WeeklyUsageChart = ({ data, isDark }) => (
  <div className="chart">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} />
        <XAxis dataKey="day" tick={{ fill: isDark ? "#94a3b8" : "#6b7280" }} />
        <YAxis tick={{ fill: isDark ? "#94a3b8" : "#6b7280" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: isDark ? "#1e293b" : "#ffffff",
            borderColor: isDark ? "#334155" : "#e5e7eb",
            color: isDark ? "#f1f5f9" : "#111827"
          }}
        />
        <Legend />
        <Bar dataKey="batches" fill="#6366F1" name="Batches" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

/* ===========================
   Dashboard Main Component
   =========================== */

const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const Dashboard = () => {
  const { cognitoId } = useAuth() || {};
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme-mode") === "dark");

  // Sync with Global Theme Toggle
  useEffect(() => {
    const handleThemeChange = () => setIsDark(localStorage.getItem("theme-mode") === "dark");
    window.addEventListener("themeChanged", handleThemeChange);
    return () => window.removeEventListener("themeChanged", handleThemeChange);
  }, []);

  // Data States
  const [inventoryRaw, setInventoryRaw] = useState([]);
  const [prodLogs, setProdLogs] = useState([]);
  const [prodLogsActive, setProdLogsActive] = useState([]);
  const [goodsInRaw, setGoodsInRaw] = useState([]);

  useEffect(() => {
    if (!cognitoId) return;
    (async () => {
      setLoading(true);
      try {
        const [invRes, plRes, plaRes, giRes] = await Promise.all([
          fetch(`${API_BASE}/ingredient-inventory/active?cognito_id=${encodeURIComponent(cognitoId)}`),
          fetch(`${API_BASE}/production-log?cognito_id=${encodeURIComponent(cognitoId)}`),
          fetch(`${API_BASE}/production-log/active?cognito_id=${encodeURIComponent(cognitoId)}`),
          fetch(`${API_BASE}/goods-in/active?cognito_id=${encodeURIComponent(cognitoId)}`),
        ]);
        const [invJson, plJson, plaJson, giJson] = await Promise.all([
          invRes.json(), plRes.json(), plaRes.json(), giRes.json()
        ]);
        setInventoryRaw(invJson); setProdLogs(plJson); setProdLogsActive(plaJson); setGoodsInRaw(giJson);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, [cognitoId]);

  const { kpiStockoutsCount, kpiLowStockCount, ingredientStockList, expiringSoonList, weeklyBatchesData, recipeStockList } = useMemo(() => {
    // ... logic remains identical to your previous code ...
    // Note: Ensure this Memo logic is copied correctly from your existing Dashboard.jsx
    const mapped = (inventoryRaw || []).map((r, i) => {
        const name = r.ingredient || "Unknown";
        const unit = r.unit || "";
        const group = detectUnitGroup(unit);
        const stockBase = toBaseAmount(r.totalRemaining, unit);
        const display = formatDisplayAmount(stockBase, group);
        const rawExpiry = r.expiryDate || r.expiry || r.bestBefore;
        const d = rawExpiry ? new Date(rawExpiry) : null;
        return { id: `${name}-${i}`, name, group, stockBase, display, expiryDate: d && !isNaN(d.getTime()) ? d : undefined };
    });
    const meanBase = mapped.reduce((s, it) => s + (it.stockBase || 0), 0) / Math.max(mapped.length, 1);
    const ingredientStockList = mapped.map(it => ({ ...it, maxBase: Math.max(it.stockBase, Math.round(meanBase * 1.25), 1) }));
    const soonCut = new Date(); soonCut.setDate(soonCut.getDate() + 7);
    const expiringSoonList = ingredientStockList.filter(r => r.expiryDate && r.expiryDate <= soonCut);
    const kpiLowStockCount = ingredientStockList.filter(it => (it.stockBase / it.maxBase) * 100 <= 25 && it.stockBase > 0).length;
    const stockoutAggMap = new Map();
    (goodsInRaw || []).forEach(row => {
        const name = row.ingredient || "Unknown";
        const unit = row.unit || "";
        const group = detectUnitGroup(unit);
        const rem = toBaseAmount(row.remaining || 0, unit);
        const key = `${name}__${group}`;
        if(stockoutAggMap.has(key)) stockoutAggMap.get(key).stockBase += rem;
        else stockoutAggMap.set(key, { name, group, stockBase: rem });
    });
    const kpiStockoutsCount = Array.from(stockoutAggMap.values()).filter(it => it.stockBase <= 0).length;
    
    // Weekly batches calculation
    const today = new Date();
    const startWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));
    const dayMap = new Map(DAYS.map(d => [d, 0]));
    (prodLogs || []).forEach(row => {
        const d = new Date(row.date || row.createdAt);
        if(isNaN(d.getTime())) return;
        const key = DAYS[(d.getDay() + 6) % 7];
        dayMap.set(key, (dayMap.get(key) || 0) + (row.batchesProduced || 0));
    });
    const weeklyBatchesData = DAYS.map(day => ({ day, batches: dayMap.get(day) }));

    // Recipe stock
    const recipeMap = new Map();
    (prodLogsActive || []).forEach(row => {
        const name = row.recipe || "Unknown";
        const units = Number(row.unitsRemaining || 0);
        recipeMap.set(name, (recipeMap.get(name) || 0) + units);
    });
    const recipeStockList = Array.from(recipeMap.entries()).map(([name, total]) => ({
        id: name, name, stockBase: total, maxBase: Math.max(total, 50), display: { amount: total }
    }));

    return { kpiStockoutsCount, kpiLowStockCount, ingredientStockList, expiringSoonList, weeklyBatchesData, recipeStockList };
  }, [inventoryRaw, goodsInRaw, prodLogs, prodLogsActive]);

  return (
    <div className="dash">
      <DashboardStyles isDark={isDark} />
      <div className="container header">
        <h1 className="h1">Inventory & Production Dashboard</h1>
        <p className="sub">Current week overview and inventory metrics.</p>
      </div>

      <div className="container grid grid-3" style={{ marginBottom: 24 }}>
        <DashboardCard title="Stockouts">
          <div className="kpi" style={{color: kpiStockoutsCount > 0 ? '#ef4444' : 'inherit'}}>{kpiStockoutsCount}</div>
        </DashboardCard>
        <DashboardCard title="Low Stock">
          <div className="kpi" style={{color: kpiLowStockCount > 0 ? '#f59e0b' : 'inherit'}}>{kpiLowStockCount}</div>
        </DashboardCard>
        <DashboardCard title="Weekly Batches">
          <div className="kpi">{weeklyBatchesData.reduce((s, d) => s + d.batches, 0)}</div>
        </DashboardCard>
      </div>

      <div className="container grid subgrid-2">
        <DashboardCard title="Ingredient Stock Levels">
          <IngredientStock ingredients={ingredientStockList} />
        </DashboardCard>
        <DashboardCard title="Expiring Soon">
          <ExpiringIngredients ingredients={expiringSoonList} />
        </DashboardCard>
        <DashboardCard title="Batches Produced">
          <WeeklyUsageChart data={weeklyBatchesData} isDark={isDark} />
        </DashboardCard>
        <DashboardCard title="Recipe Availability">
          <RecipeStock recipes={recipeStockList} />
        </DashboardCard>
      </div>

      {loading && <div className="veil"><div className="veil-box">Loading Data...</div></div>}
    </div>
  );
};

export default Dashboard;