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
      --bg: #f3f4f6;         /* gray-100 */
      --bg-card: #ffffff;    /* white */
      --text: #111827;       /* gray-900 */
      --text-muted: #6b7280; /* gray-500 */
      --text-muted-2: #374151; /* gray-700 */
      --indigo: #6366f1;     /* indigo-500 */
      --shadow: 0 4px 16px rgba(0,0,0,0.08);
      --shadow-strong: 0 10px 30px rgba(0,0,0,0.18);
      --g50: #f9fafb;        /* gray-50 */
      --g200: #e5e7eb;       /* gray-200 */
      --g700: #374151;       /* gray-700 */
      --green: #10b981;
      --green-100: #d1fae5;
      --green-900: #064e3b;
      --green-300: #86efac;
      --red: #ef4444;
      --red-100: #fee2e2;
      --red-900: #7f1d1d;
      --red-300: #fca5a5;
      --yellow: #f59e0b;
      --overlay: rgba(0,0,0,0.2);
      --overlay-dark: rgba(0,0,0,0.4);
      --radius-xl: 14px;
      --radius-full: 999px;
      --pad: 24px;
      --gap: 24px;
    }
    @media (prefers-color-scheme: dark) {
      :root{
        --bg: #111827;       /* gray-900 */
        --bg-card: #1f2937;  /* gray-800 */
        --text: #f9fafb;     /* gray-100 */
        --text-muted: #9ca3af; /* gray-400 */
        --text-muted-2: #e5e7eb; /* gray-200 */
        --g50: rgba(55,65,81,0.5);
        --g200: #374151;
        --g700: #374151;
        --shadow: 0 6px 22px rgba(0,0,0,0.35);
        --shadow-strong: 0 16px 40px rgba(0,0,0,0.55);
      }
    }

    .dash { min-height: 100vh; background: var(--bg); padding: 24px 16px; }
    .container { max-width: 1120px; margin: 0 auto; }
    .header { margin-bottom: 24px; }
    .h1 { font-size: 28px; font-weight: 800; color: var(--text); margin: 0 0 6px 0; }
    @media (min-width: 768px) { .h1 { font-size: 34px; } }
    .sub { color: var(--text-muted); font-size: 14px; margin: 0; }

    .grid { display: grid; gap: var(--gap); }
    .grid-3 { grid-template-columns: 1fr; }
    @media (min-width: 640px) { .grid-3 { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 1024px) { .grid-3 { grid-template-columns: repeat(3, 1fr); } }

    .main-grid { grid-template-columns: 1fr; }
    .subgrid-2 { grid-template-columns: 1fr; }
    @media (min-width: 1024px) { .subgrid-2 { grid-template-columns: repeat(2, 1fr); } }

    .card {
      background: var(--bg-card);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow);
      padding: var(--pad);
      display: flex; flex-direction: column; min-width: 0;
    }
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
    @media (prefers-color-scheme: dark) {
      .badge-green { background: var(--green-900); color: var(--green-300); }
      .badge-red { background: var(--red-900); color: var(--red-300); }
    }

    .muted-box { background: var(--g50); border-radius: 10px; padding: 12px; display: flex; justify-content: space-between; align-items: center; }

    .progress-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 14px; }
    .progress-row .name { font-weight: 500; color: var(--text); }
    .progress-row .qty { color: var(--text-muted); }
    .progress { width: 100%; height: 10px; background: var(--g200); border-radius: var(--radius-full); overflow: hidden; }
    @media (prefers-color-scheme: dark) { .progress { background: var(--g700); } }
    .bar { height: 100%; border-radius: var(--radius-full); transition: width .3s ease; }
    .bar.green { background: #10b981; }
    .bar.yellow { background: #f59e0b; }
    .bar.red { background: #ef4444; }

    .h-80 { height: 320px; }
    .chart { width: 100%; height: 260px; }
    @media (min-width: 768px) { .chart { height: 290px; } }

    .veil { position: fixed; inset: 0; background: var(--overlay); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 50; }
    @media (prefers-color-scheme: dark) { .veil { background: var(--overlay-dark); } }
    .veil-box { background: var(--bg-card); color: var(--text); border-radius: var(--radius-xl); box-shadow: var(--shadow-strong); padding: 16px 24px; font-weight: 600; }
  `}</style>
);

/* ==========================================
   Inline components (no Tailwind classes)
   ========================================== */

// Card wrapper
const DashboardCard = ({ title, icon, children, className = "" }) => {
  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        {icon && <span className="card-icon">{icon}</span>}
        <h2 className="card-title">{title}</h2>
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
};

// Expiring ingredients list (from ACTIVE INVENTORY ONLY)
const ExpiringIngredients = ({ ingredients }) => {
  const list = Array.isArray(ingredients) ? ingredients : [];
  if (list.length === 0) {
    return <div className="list-empty">No ingredients expiring soon. Good job!</div>;
  }

  const getDaysRemaining = (date) => {
    if (!date) return 0;
    const today = new Date(); today.setHours(0,0,0,0);
    const expiry = new Date(date); expiry.setHours(0,0,0,0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="list h-80">
      {list.map((ingredient) => {
        const daysRemaining = getDaysRemaining(ingredient.expiryDate);
        const urgencyStyle =
          daysRemaining <= 1 ? { color: "#ef4444" } :
          daysRemaining <= 3 ? { color: "#f59e0b" } :
          { color: "var(--text-muted)" };

        return (
          <div key={ingredient.id} className="list-item">
            <div>
              <p className="list-item-title">{ingredient.name}</p>
              <p className="list-item-sub">
                {ingredient.stock}{ingredient.unit}
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

// Ingredient stock bars (show ONLY current qty in label)
const IngredientStock = ({ ingredients }) => {
  const list = Array.isArray(ingredients) ? ingredients : [];
  if (list.length === 0) return <p className="list-item-sub">No ingredients in stock.</p>;

  const sorted = [...list].sort((a, b) => a.stock / a.maxStock - b.stock / b.maxStock);

  return (
    <div className="list h-80">
      {sorted.map((ing) => {
        const pct = Math.max(0, Math.min(100, (ing.stock / ing.maxStock) * 100));
        const color = pct < 25 ? "red" : pct < 50 ? "yellow" : "green";
        return (
          <div key={ing.id}>
            <div className="progress-row">
              <span className="name">{ing.name}</span>
              {/* Only show current quantity + unit */}
              <span className="qty">{ing.stock} {ing.unit}</span>
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

// Recipe availability tiles
const RecipeInventory = ({ recipes }) => {
  const list = Array.isArray(recipes) ? recipes : [];
  if (list.length === 0) return <p className="list-item-sub">No recipes available.</p>;

  return (
    <div className="list">
      {list.map((r) => (
        <div key={r.name} className="muted-box">
          <span className="name" style={{ color: "var(--text)" }}>{r.name}</span>
          <span className={`badge ${r.canMake > 0 ? "badge-green" : "badge-red"}`}>
            x{r.canMake}
          </span>
        </div>
      ))}
    </div>
  );
};

// Weekly usage chart wrapper
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
        <Bar dataKey="goodsUsed" fill="#6366F1" name="Goods Used" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

/* ===========================
   Dashboard container
   =========================== */

const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";
const dayShort = (d) => ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d];

const Dashboard = () => {
  const { cognitoId } = useAuth() || {};
  const [loading, setLoading] = useState(true);

  const [inventoryRaw, setInventoryRaw] = useState([]);
  const [prodLogs, setProdLogs] = useState([]);
  const [goodsInRaw, setGoodsInRaw] = useState([]); // kept if you need elsewhere later

  useEffect(() => {
    if (!cognitoId) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [invRes, plRes, giRes] = await Promise.all([
          fetch(`${API_BASE}/ingredient-inventory/active?cognito_id=${encodeURIComponent(cognitoId)}`),
          fetch(`${API_BASE}/production-log?cognito_id=${encodeURIComponent(cognitoId)}`),
          fetch(`${API_BASE}/goods-in?cognito_id=${encodeURIComponent(cognitoId)}`),
        ]);
        const invJson = invRes.ok ? await invRes.json() : [];
        const plJson = plRes.ok ? await plRes.json() : [];
        const giJson = giRes.ok ? await giRes.json() : [];
        if (!mounted) return;
        setInventoryRaw(Array.isArray(invJson) ? invJson : []);
        setProdLogs(Array.isArray(plJson) ? plJson : []);
        setGoodsInRaw(Array.isArray(giJson) ? giJson : []);
      } catch (e) {
        console.error("Dashboard load error:", e);
        if (!mounted) return;
        setInventoryRaw([]); setProdLogs([]); setGoodsInRaw([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [cognitoId]);

  const {
    kpiStockoutsCount,           // NEW KPI
    kpiLowStockCount,
    kpiRecentProduction,
    ingredientStockList,
    expiringSoonList,            // now from ACTIVE inventory
    weeklyUsageData,
    recipeAvailability,
  } = useMemo(() => {
    // Map ACTIVE inventory → base fields; try to capture any expiry signals from active rows
    const invMapped = (inventoryRaw || []).map((r, i) => ({
      id: `${r.ingredient || "item"}-${i}`,
      name: r.ingredient || "Unknown",
      unit: r.unit || "",
      stock: Number(r.totalRemaining) || 0,
      // try to read an expiry field from active inventory rows (adjust field names if needed)
      expiryDate: (() => {
        const raw =
          r.expiryDate || r.expiry || r.bestBefore || r.best_before ||
          r.activeExpiry || r.active_expiry || r.batchExpiry || r.batch_expiry || null;
        const d = raw ? new Date(raw) : null;
        return d && !Number.isNaN(d.getTime()) ? d : undefined;
      })(),
      maxStock: 0, // set below
    }));

    // heuristic maxStock so bars render nicely
    const mean = invMapped.reduce((s, it) => s + (it.stock || 0), 0) / Math.max(invMapped.length, 1);
    const ingredientStockList = invMapped
      .map((it) => ({ ...it, maxStock: Math.max(it.stock, Math.round(mean * 1.25), 1) }))
      .sort((a, b) => a.stock / a.maxStock - b.stock / b.maxStock);

    // Expiring soon (next 7 days) — FROM ACTIVE INVENTORY ONLY
    const now = new Date(); const soonCut = new Date(now); soonCut.setDate(now.getDate() + 7);
    const expiringSoonList = invMapped
      .filter((r) => r.expiryDate && r.expiryDate <= soonCut)
      .sort((a, b) => (a.expiryDate?.getTime() || 0) - (b.expiryDate?.getTime() || 0))
      .slice(0, 30);

    // KPIs
    const kpiLowStockCount = ingredientStockList.filter((it) => (it.stock || 0) <= 10).length;
    const kpiStockoutsCount = ingredientStockList.filter((it) => (it.stock || 0) <= 0).length; // NEW

    // Production last 7 days
    const start = new Date(); start.setDate(start.getDate() - 6);
    const recentLogs = (prodLogs || []).filter((row) => {
      const d = new Date(row?.date || row?.production_log_date || "");
      return !Number.isNaN(d.getTime()) && d >= start;
    });
    const kpiRecentProduction = recentLogs.reduce((sum, r) => sum + (Number(r.batchesProduced) || 0), 0);

    // Weekly usage chart (aggregate batches per day as “goodsUsed”)
    const dayMap = new Map();
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      dayMap.set(dayShort(d.getDay()), 0);
    }
    recentLogs.forEach((r) => {
      const d = new Date(r?.date || r?.production_log_date || "");
      const key = dayShort(d.getDay());
      const inc = Number(r.batchesProduced) || 0;
      dayMap.set(key, (dayMap.get(key) || 0) + inc);
    });
    const weeklyUsageData = Array.from(dayMap.entries()).map(([day, goodsUsed]) => ({ day, goodsUsed }));

    // Recipe availability (heuristic)
    const byRecipe = {};
    recentLogs.forEach((r) => {
      const name = r.recipe || r.recipe_name || "Unknown";
      byRecipe[name] = (byRecipe[name] || 0) + (Number(r.batchesProduced) || 0);
    });
    const recipeAvailability = Object.entries(byRecipe)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([name, total]) => ({ name, canMake: Math.max(0, Math.round(total)) }));

    return {
      kpiStockoutsCount,
      kpiLowStockCount,
      kpiRecentProduction,
      ingredientStockList,
      expiringSoonList,
      weeklyUsageData,
      recipeAvailability,
    };
  }, [inventoryRaw, prodLogs]);

  return (
    <div className="dash">
      <DashboardStyles />
      <div className="container header">
        <h1 className="h1">Inventory & Production Dashboard</h1>
        <p className="sub">Real-time view of stock, expiries, and weekly usage.</p>
      </div>

      {/* KPI Row */}
      <div className="container grid grid-3" style={{ marginBottom: 24 }}>
        {/* Replaced "Total Stock" with "Stockouts" */}
        <DashboardCard title="Stockouts (0 qty)">
          <div className="kpi">{kpiStockoutsCount}</div>
        </DashboardCard>

        <DashboardCard title="Low Stock (≤ 10)">
          <div className="kpi">{kpiLowStockCount}</div>
        </DashboardCard>

        <DashboardCard title="Batches Produced (Last 7 Days)">
          <div className="kpi">{kpiRecentProduction}</div>
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

          <DashboardCard title="Weekly Usage">
            <WeeklyUsageChart data={weeklyUsageData} />
          </DashboardCard>

          <DashboardCard title="Recipe Availability (heuristic)">
            <RecipeInventory recipes={recipeAvailability} />
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
