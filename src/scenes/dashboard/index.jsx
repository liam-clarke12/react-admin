// src/scenes/dashboard/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import ListAltOutlinedIcon from "@mui/icons-material/ListAltOutlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import QrCode2OutlinedIcon from "@mui/icons-material/QrCode2Outlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import { useAuth } from "../../contexts/AuthContext";
import BarChart from "../../components/BarChart";

const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

/** Brand tokens (scoped) */
const brand = {
  text: "#0f172a",
  subtext: "#334155",
  border: "#e5e7eb",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  primary: "#e11d48",
  primaryDark: "#be123c",
  focusRing: "rgba(225, 29, 72, 0.35)",
  shadow: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)",
};

function KpiCard({ icon, label, value, hint }) {
  return (
    <Box
      className="card"
      sx={{
        p: 2,
        display: "flex",
        alignItems: "center",
        gap: 2,
        border: `1px solid ${brand.border}`,
        background: brand.surface,
        borderRadius: 16,
        boxShadow: brand.shadow,
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 12,
          display: "grid",
          placeItems: "center",
          background: "#f1f5f9",
          border: `1px solid ${brand.border}`,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ color: brand.subtext, fontWeight: 700, fontSize: 12 }}>
          {label}
        </Typography>
        <Typography sx={{ color: brand.text, fontWeight: 900, fontSize: 22, lineHeight: 1.15 }}>
          {value}
        </Typography>
      </Box>
      {hint && (
        <Tooltip title={hint} arrow>
          <IconButton size="small">
            <InfoOutlinedIcon sx={{ color: brand.subtext }} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}

function ListCard({ title, items }) {
  return (
    <Box
      className="card"
      sx={{
        p: 2,
        border: `1px solid ${brand.border}`,
        background: brand.surface,
        borderRadius: 16,
        boxShadow: brand.shadow,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 1,
          justifyContent: "space-between",
        }}
      >
        <Typography sx={{ fontWeight: 800, color: brand.text }}>{title}</Typography>
      </Box>
      <Box sx={{ display: "grid", gap: 1, overflow: "auto" }}>
        {items.length === 0 ? (
          <Typography sx={{ color: brand.subtext, fontSize: 14 }}>No data</Typography>
        ) : (
          items.map((row, i) => (
            <Box
              key={i}
              sx={{
                border: `1px solid ${brand.border}`,
                background: i % 2 ? brand.surfaceMuted : brand.surface,
                borderRadius: 12,
                px: 1.25,
                py: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
              }}
            >
              <Typography sx={{ color: brand.text, fontWeight: 600, fontSize: 14, mr: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {row.left}
              </Typography>
              <Typography sx={{ color: brand.subtext, fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {row.right}
              </Typography>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}

const Dashboard = () => {
  const { cognitoId } = useAuth();
  const [loading, setLoading] = useState(true);

  // data
  const [inventory, setInventory] = useState([]); // [{ ingredient, unit, stockOnHand, barcode }]
  const [goodsOut, setGoodsOut] = useState([]);   // recent goods out
  const [prodLogs, setProdLogs] = useState([]);   // production logs (active if possible)

  // fetch all
  useEffect(() => {
    if (!cognitoId) return;
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        // Inventory (active)
        const invRes = await fetch(
          `${API_BASE}/ingredient-inventory/active?cognito_id=${encodeURIComponent(
            cognitoId
          )}`
        );
        const invJson = invRes.ok ? await invRes.json() : [];
        const inv = (Array.isArray(invJson) ? invJson : []).map((r, idx) => ({
          ingredient: r?.ingredient ?? "",
          unit: r?.unit ?? "",
          stockOnHand: Number(r?.totalRemaining) || 0,
          barcode: r?.activeBarcode ?? "",
          _id: `${r?.ingredient ?? "row"}-${r?.unit ?? "unit"}-${idx}`,
        }));

        // Goods out (recent)
        const goRes = await fetch(
          `${API_BASE}/goods-out?cognito_id=${encodeURIComponent(cognitoId)}`
        );
        const goJson = goRes.ok ? await goRes.json() : [];
        const go = (Array.isArray(goJson) ? goJson : [])
          .map((r) => ({
            date: r?.date ?? "",
            recipe: r?.recipe ?? "",
            stockAmount: Number(r?.stockAmount) || 0,
            recipients: r?.recipients ?? "",
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 6);

        // Production logs (prefer /active)
        let pl = [];
        try {
          const plResActive = await fetch(
            `${API_BASE}/production-log/active?cognito_id=${encodeURIComponent(
              cognitoId
            )}`
          );
          if (plResActive.ok) {
            pl = await plResActive.json();
          } else {
            const plRes = await fetch(
              `${API_BASE}/production-log?cognito_id=${encodeURIComponent(cognitoId)}`
            );
            pl = plRes.ok ? await plRes.json() : [];
          }
        } catch {
          const fallback = await fetch(
            `${API_BASE}/production-log?cognito_id=${encodeURIComponent(cognitoId)}`
          );
          pl = fallback.ok ? await fallback.json() : [];
        }

        if (!mounted) return;
        setInventory(inv);
        setGoodsOut(go);
        setProdLogs(Array.isArray(pl) ? pl : []);
      } catch (err) {
        console.error("[Dashboard] Failed to load data:", err);
        if (!mounted) return;
        setInventory([]);
        setGoodsOut([]);
        setProdLogs([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [cognitoId]);

  // derived KPIs
  const {
    totalStock,
    totalIngredients,
    activeBarcodes,
    lowStockCount,
    topIngredients,
    nextToRunList,
    recentGoodsOutList,
    wasteChartData,
    prodSummary,
  } = useMemo(() => {
    const totalStock = inventory.reduce((sum, r) => sum + (Number(r.stockOnHand) || 0), 0);
    const totalIngredients = inventory.length;
    const activeBarcodes = new Set(inventory.map((r) => r.barcode).filter(Boolean)).size;
    const lowStockCount = inventory.filter((r) => (Number(r.stockOnHand) || 0) <= 10).length;

    // ⬇️ Top 4 by stock
    const topIngredients = [...inventory]
      .sort((a, b) => (b.stockOnHand || 0) - (a.stockOnHand || 0))
      .slice(0, 4)
      .map((r) => ({ ingredient: r.ingredient, amount: Number(r.stockOnHand) || 0 }));

    const nextToRunList = [...inventory]
      .sort((a, b) => a.ingredient.localeCompare(b.ingredient))
      .slice(0, 6)
      .map((r) => ({
        left: r.ingredient,
        right: r.barcode ? `Next: ${r.barcode}` : "—",
      }));

    const recentGoodsOutList = goodsOut.map((g) => ({
      left: g.recipe || "—",
      right:
        `${(g.stockAmount || 0).toLocaleString()} units` +
        (g.recipients ? ` · ${g.recipients}` : ""),
    }));

    // Waste last 7 days
    const byDay = new Map();
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 6); // include today -> 7 days

    (Array.isArray(prodLogs) ? prodLogs : []).forEach((row) => {
      const d = new Date(row?.date || row?.production_log_date || "");
      if (isNaN(d)) return;
      if (d < start) return;
      const key = d.toISOString().slice(0, 10);
      const w = Number(row?.units_of_waste) || 0;
      byDay.set(key, (byDay.get(key) || 0) + w);
    });

    const wasteChartData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      return { day: key.slice(5), waste: byDay.get(key) || 0 }; // show MM-DD
    });

    // Production summary (last 7 days)
    let batches = 0;
    let recipes = new Set();
    let runs = 0;
    (Array.isArray(prodLogs) ? prodLogs : []).forEach((row) => {
      const d = new Date(row?.date || row?.production_log_date || "");
      if (isNaN(d)) return;
      if (d < start) return;
      runs += 1;
      batches += Number(row?.batchesProduced) || 0;
      if (row?.recipe) recipes.add(row.recipe);
      else if (row?.recipe_name) recipes.add(row.recipe_name);
    });

    const prodSummary = {
      batches,
      recipes: recipes.size,
      runs,
    };

    return {
      totalStock,
      totalIngredients,
      activeBarcodes,
      lowStockCount,
      topIngredients,
      nextToRunList,
      recentGoodsOutList,
      wasteChartData,
      prodSummary,
    };
  }, [inventory, goodsOut, prodLogs]);

  return (
    <Box m="20px">
      {/* Scoped styles */}
      <style>{`
        .grid {
          display: grid;
          grid-template-columns: 1fr 2fr 1fr;
          gap: 16px;
        }
        .grid-rows {
          display: grid;
          grid-template-rows: auto auto;
          gap: 16px;
        }
        .kpis {
          display: grid;
          gap: 12px;
        }
        @media (max-width: 1100px) {
          .grid { grid-template-columns: 1fr; }
        }
        .card h3 {
          margin: 0 0 6px 0;
          font-weight: 800;
          color: ${brand.text};
        }
      `}</style>

      {/* Top row */}
      <Box className="grid">
        {/* Left column: KPIs */}
        <Box className="kpis">
          <KpiCard
            icon={<LayersOutlinedIcon sx={{ color: brand.primary }} />}
            label="Total Stock (all ingredients)"
            value={totalStock.toLocaleString()}
            hint="Sum of active stock across all ingredients and units"
          />
          <KpiCard
            icon={<ListAltOutlinedIcon sx={{ color: brand.primary }} />}
            label="Active Ingredients"
            value={totalIngredients}
            hint="Distinct ingredients currently in stock"
          />
          <KpiCard
            icon={<QrCode2OutlinedIcon sx={{ color: brand.primary }} />}
            label="Active Barcodes"
            value={activeBarcodes}
            hint="Distinct barcodes currently usable (FIFO)"
          />
          <KpiCard
            icon={<WarningAmberOutlinedIcon sx={{ color: brand.primary }} />}
            label="Low Stock (≤ 10)"
            value={lowStockCount}
            hint="Ingredients at or below 10 (by their unit)"
          />
        </Box>

        {/* Middle: Inventory chart */}
        <Box
          className="card"
          sx={{
            border: `1px solid ${brand.border}`,
            background: brand.surface,
            borderRadius: 16,
            boxShadow: brand.shadow,
            p: 2,
            minHeight: 320,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <BarChartOutlinedIcon sx={{ color: brand.primary }} />
            <Typography sx={{ fontWeight: 800, color: brand.text }}>
              Inventory (Top 4 by stock)
            </Typography>
          </Box>
          <Box sx={{ flex: 1, minHeight: 260, display: "grid", placeItems: "center" }}>
            {loading ? (
              <CircularProgress />
            ) : (
              <BarChart
                data={topIngredients}
                keys={["amount"]}
                indexBy="ingredient"
                height="260px"
                width="95%"
              />
            )}
          </Box>
        </Box>

        {/* Right: two lists */}
        <Box className="grid-rows">
          <ListCard title="Next to run" items={nextToRunList} />
          <ListCard title="Recent Goods Out" items={recentGoodsOutList} />
        </Box>
      </Box>

      {/* Bottom row: two wide cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          mt: 2,
        }}
      >
        <Box
          className="card"
          sx={{
            border: `1px solid ${brand.border}`,
            background: brand.surface,
            borderRadius: 16,
            boxShadow: brand.shadow,
            p: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Typography sx={{ fontWeight: 800, color: brand.text }}>
              Production (Last 7 days)
            </Typography>
          </Box>
          {loading ? (
            <CircularProgress />
          ) : (
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <KpiCard
                icon={<LayersOutlinedIcon sx={{ color: brand.primary }} />}
                label="Batches Produced"
                value={prodSummary.batches.toLocaleString()}
              />
              <KpiCard
                icon={<ListAltOutlinedIcon sx={{ color: brand.primary }} />}
                label="Recipes"
                value={prodSummary.recipes}
              />
              <KpiCard
                icon={<BarChartOutlinedIcon sx={{ color: brand.primary }} />}
                label="Runs Logged"
                value={prodSummary.runs}
              />
            </Box>
          )}
        </Box>

        <Box
          className="card"
          sx={{
            border: `1px solid ${brand.border}`,
            background: brand.surface,
            borderRadius: 16,
            boxShadow: brand.shadow,
            p: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Typography sx={{ fontWeight: 800, color: brand.text }}>
              Wastage (Last 7 days)
            </Typography>
          </Box>
          <Box sx={{ minHeight: 240, display: "grid", placeItems: "center" }}>
            {loading ? (
              <CircularProgress />
            ) : (
              <BarChart
                data={wasteChartData}
                keys={["waste"]}
                indexBy="day"
                height="220px"
                width="95%"
              />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
