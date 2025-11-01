// src/scenes/dashboard/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveLine } from "@nivo/line";
import { useAuth } from "../../contexts/AuthContext";
import BarChart from "../../components/BarChart";

const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

/** Brand tokens (scoped) — updated to Pantone 13-4520 TCX / Nory purple) */
const brand = {
  text: "#0f172a",
  subtext: "#334155",
  border: "#e5e7eb",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  danger: "#dc2626",
  primary: "#7C3AED",     // Nory purple
  primaryDark: "#5B21B6", // darker purple
  focusRing: "rgba(124,58,237,0.18)",
  shadow: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)",
  inputBg: "#ffffff"
};

// small helper palette (you can expand or modify)
const chartPalette = [
  brand.primary,
  brand.primaryDark,
  "#C084FC", // lilac
  "#E9D5FF", // soft lavender
  "#DDD6FE", // pale purple
];

// Minimal KPI card
function KpiCard({ label, value }) {
  return (
    <Box
      sx={{
        p: 2,
        border: `1px solid ${brand.border}`,
        background: brand.surface,
        borderRadius: 16,
        boxShadow: brand.shadow,
        textAlign: "center",
      }}
    >
      <Typography sx={{ color: brand.subtext, fontWeight: 700, fontSize: 12 }}>
        {label}
      </Typography>
      <Typography sx={{ color: brand.text, fontWeight: 900, fontSize: 22, mt: 0.5 }}>
        {value}
      </Typography>
    </Box>
  );
}

// Ring Chart Component
function RingChart({ data, height = "260px" }) {
  return (
    <Box sx={{ height }}>
      <ResponsivePie
        data={data}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        innerRadius={0.6}
        padAngle={1}
        cornerRadius={3}
        // use custom function so we always map in-brand colors
        colors={(d) => {
          // d: { id, value, data, index, ... }
          const idx = typeof d.index === "number" ? d.index : (d.data && d.data.index) || 0;
          return chartPalette[idx % chartPalette.length];
        }}
        borderWidth={1}
        borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
        enableArcLabels={false}
        arcLinkLabelsSkipAngle={10}
        arcLinkLabelsTextColor={brand.subtext}
        arcLinkLabelsThickness={2}
        arcLinkLabelsColor={{ from: "color" }}
        tooltip={({ datum }) => (
          <div style={{ padding: 8, background: "#fff", border: `1px solid ${brand.border}`, borderRadius: 8 }}>
            <div style={{ fontWeight: 800 }}>{datum.id}</div>
            <div style={{ color: brand.subtext }}>{datum.value.toLocaleString()}</div>
          </div>
        )}
      />
    </Box>
  );
}

// Line Chart Component
function LineChart({ data, height = "260px" }) {
  return (
    <Box sx={{ height }}>
      <ResponsiveLine
        data={[
          {
            id: "Waste",
            data: data.map((d) => ({ x: d.day, y: d.waste })),
          },
        ]}
        margin={{ top: 20, right: 20, bottom: 40, left: 50 }}
        xScale={{ type: "point" }}
        yScale={{
          type: "linear",
          min: "auto",
          max: "auto",
          stacked: false,
          reverse: false,
        }}
        axisBottom={{
          orient: "bottom",
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
        }}
        axisLeft={{
          orient: "left",
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
        }}
        colors={[brand.primary]}
        pointSize={6}
        pointColor={{ theme: "background" }}
        pointBorderWidth={2}
        pointBorderColor={{ from: "serieColor" }}
        enableArea={true}
        areaOpacity={0.15}
      />
    </Box>
  );
}

const Dashboard = () => {
  const { cognitoId } = useAuth();
  const [loading, setLoading] = useState(true);

  // data
  const [inventory, setInventory] = useState([]);
  const [prodLogs, setProdLogs] = useState([]);

  useEffect(() => {
    if (!cognitoId) return;
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        // Inventory
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
          _id: `${r?.ingredient ?? "row"}-${idx}`,
        }));

        // Production logs
        const plRes = await fetch(
          `${API_BASE}/production-log?cognito_id=${encodeURIComponent(cognitoId)}`
        );
        const plJson = plRes.ok ? await plRes.json() : [];

        if (!mounted) return;
        setInventory(inv);
        setProdLogs(Array.isArray(plJson) ? plJson : []);
      } catch (err) {
        console.error("[Dashboard] Failed to load data:", err);
        if (!mounted) return;
        setInventory([]);
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

  // Derived chart data
  const { totalStock, lowStockCount, recentProduction, ringData, barData, lineData } = useMemo(() => {
    const totalStock = inventory.reduce(
      (sum, r) => sum + (Number(r.stockOnHand) || 0),
      0
    );
    const lowStockCount = inventory.filter(
      (r) => (Number(r.stockOnHand) || 0) <= 10
    ).length;

    // Last 7 days window
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 6);

    const recentLogs = prodLogs.filter((row) => {
      const d = new Date(row?.date || row?.production_log_date || "");
      return !isNaN(d) && d >= start;
    });

    const recentProduction = recentLogs.reduce(
      (sum, r) => sum + (Number(r.batchesProduced) || 0),
      0
    );

    // Ring chart → top ingredients by stock
    const ringData = [...inventory]
      .sort((a, b) => (b.stockOnHand || 0) - (a.stockOnHand || 0))
      .slice(0, 5)
      .map((r, i) => ({
        id: r.ingredient || `Item ${i + 1}`,
        label: r.ingredient || `Item ${i + 1}`,
        value: r.stockOnHand || 0,
      }));

    // Bar chart → batches produced per recipe (last 7 days)
    const byRecipe = {};
    recentLogs.forEach((r) => {
      const name = r.recipe || r.recipe_name || "Unknown";
      byRecipe[name] = (byRecipe[name] || 0) + (Number(r.batchesProduced) || 0);
    });
    const barData = Object.entries(byRecipe).map(([recipe, batches]) => ({
      recipe,
      batches,
    }));

    // Line chart → waste trend over last 7 days
    const wasteByDay = new Map();
    recentLogs.forEach((row) => {
      const d = new Date(row?.date || row?.production_log_date || "");
      if (isNaN(d)) return;
      const key = d.toISOString().slice(0, 10);
      wasteByDay.set(key, (wasteByDay.get(key) || 0) + (Number(row?.units_of_waste) || 0));
    });
    const lineData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      return { day: key.slice(5), waste: wasteByDay.get(key) || 0 };
    });

    return { totalStock, lowStockCount, recentProduction, ringData, barData, lineData };
  }, [inventory, prodLogs]);

  return (
    <Box m="20px">
      <style>{`
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 16px;
        }
      `}</style>

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", height: "300px" }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* KPIs */}
          <Box className="grid" sx={{ mb: 2 }}>
            <KpiCard label="Total Stock" value={totalStock.toLocaleString()} />
            <KpiCard label="Low Stock (≤ 10)" value={lowStockCount} />
            <KpiCard label="Production (Last 7 Days)" value={recentProduction} />
          </Box>

          {/* Charts */}
          <Box className="grid">
            <Box
              sx={{
                border: `1px solid ${brand.border}`,
                background: brand.surface,
                borderRadius: 16,
                boxShadow: brand.shadow,
                p: 2,
              }}
            >
              <Typography sx={{ fontWeight: 800, color: brand.text, mb: 1 }}>
                Stock Distribution
              </Typography>
              <RingChart data={ringData} />
            </Box>

            <Box
              sx={{
                border: `1px solid ${brand.border}`,
                background: brand.surface,
                borderRadius: 16,
                boxShadow: brand.shadow,
                p: 2,
              }}
            >
              <Typography sx={{ fontWeight: 800, color: brand.text, mb: 1 }}>
                Batches Produced (Last 7 Days)
              </Typography>
              {/* pass colors prop to BarChart so it can use brand palette */}
              <BarChart
                data={barData}
                keys={["batches"]}
                indexBy="recipe"
                height="260px"
                width="95%"
                colors={chartPalette}
              />
            </Box>

            <Box
              sx={{
                border: `1px solid ${brand.border}`,
                background: brand.surface,
                borderRadius: 16,
                boxShadow: brand.shadow,
                p: 2,
              }}
            >
              <Typography sx={{ fontWeight: 800, color: brand.text, mb: 1 }}>
                Waste Trend (Last 7 Days)
              </Typography>
              <LineChart data={lineData} />
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default Dashboard;
