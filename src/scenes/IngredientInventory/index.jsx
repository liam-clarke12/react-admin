"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "../../contexts/AuthContext"

/* =====================
   Scoped Styles + Dark mode - Professional SaaS Design for Food Production
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

    /* Enhanced table styling with better spacing */
    .ii-table-wrap { 
      overflow:auto; 
      max-height:600px;
    }
    .ii-table { 
      width:100%; 
      border-collapse:separate; 
      border-spacing:0; 
      font-size:14px;
    }
    .ii-thead th {
      text-align:left; 
      font-size:12px; 
      text-transform:uppercase; 
      letter-spacing:0.05em;
      background:var(--thead-bg); 
      color:var(--text-muted); 
      padding:14px 16px; 
      border-bottom:1px solid var(--border); 
      font-weight:700;
      position:sticky; 
      top:0; 
      z-index:1;
    }
    .ii-row { 
      border-bottom:1px solid var(--border);
      transition: background 0.15s ease;
    }
    .ii-row:nth-child(odd) { background:var(--row-odd); }
    .ii-row:nth-child(even) { background:var(--row-even); }
    .ii-row:hover { 
      background:var(--row-hover);
    }
    .ii-td { 
      padding:16px; 
      color: var(--text);
      font-weight:500;
    }
    .ii-td-strong { 
      font-weight:600; 
      color:var(--text); 
      white-space:nowrap;
    }
    
    /* Updated chip design */
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
    
    /* Enhanced badge with indigo theme */
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

    /* Enhanced modal with backdrop blur */
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
    
    /* Enhanced button styles with gradients */
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

    /* Enhanced chart with better gradients */
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

/* ===================== Config & helpers ===================== */
const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api"

const mockData = [
  {
    ingredient: "All-Purpose Flour",
    unit: "kg",
    totalRemaining: 25,
    barcode: "FL-AP-123",
    date: "2023-10-26",
  },
  {
    ingredient: "Granulated Sugar",
    unit: "kg",
    totalRemaining: 50,
    barcode: "SUG-GR-456",
    date: "2023-10-25",
  },
  {
    ingredient: "Unsalted Butter",
    unit: "kg",
    stockOnHand: 10,
    barcode: "BUT-UN-789",
    date: "2023-10-27",
  },
  {
    ingredient: "Large Eggs",
    unit: "units",
    totalRemaining: 144,
    barcode: "EGG-LG-101",
    date: "2023-10-24",
  },
  {
    ingredient: "Baking Soda",
    unit: "g",
    totalRemaining: 500,
    barcode: "SOD-BK-112",
    date: "2023-10-20",
  },
  { ingredient: "Milk", unit: "L", totalRemaining: 12, barcode: "MLK-WH-113", date: "2023-10-26" },
  { ingredient: "All-Purpose Flour", unit: "g", totalRemaining: 5000, barcode: "FL-AP-124", date: "2023-10-28" },
  { ingredient: "Milk", unit: "ml", totalRemaining: 2000, barcode: "MLK-WH-114", date: "2023-10-28" },
]

const detectUnitTypeAndFactor = (rawUnit) => {
  const u = String(rawUnit || "")
    .trim()
    .toLowerCase()
  if (!u) return { type: "units", base: "units", factor: 1 }
  if (u.includes("kg") || u.includes("kilogram")) return { type: "mass", base: "g", factor: 1000 }
  if (u.includes("g") || u.includes("gram")) return { type: "mass", base: "g", factor: 1 }
  if ((u.includes("l") && !u.includes("ml")) || u.includes("litre") || u.includes("liter"))
    return { type: "volume", base: "ml", factor: 1000 }
  if (u.includes("ml") || u.includes("milliliter") || u.includes("millilitre"))
    return { type: "volume", base: "ml", factor: 1 }
  if (u.includes("unit") || u.includes("each") || u.includes("pcs") || u.includes("piece"))
    return { type: "units", base: "units", factor: 1 }
  return { type: "units", base: "units", factor: 1 }
}

const formatDisplayForGroup = (type, totalBase) => {
  if (type === "mass") {
    if (Math.abs(totalBase) >= 1000) {
      const val = +(totalBase / 1000).toFixed(3)
      return { displayValue: val, displayUnit: "kg", numericForChart: val }
    }
    return { displayValue: +(+totalBase).toFixed(3), displayUnit: "g", numericForChart: totalBase }
  }
  if (type === "volume") {
    if (Math.abs(totalBase) >= 1000) {
      const val = +(totalBase / 1000).toFixed(3)
      return { displayValue: val, displayUnit: "L", numericForChart: val }
    }
    return { displayValue: +(+totalBase).toFixed(3), displayUnit: "ml", numericForChart: totalBase }
  }
  return { displayValue: Number(totalBase), displayUnit: "units", numericForChart: totalBase }
}

const resolveCognitoId = (fromAuth) => {
  if (fromAuth) return fromAuth
  try {
    const url = new URL(window.location.href)
    const qp = url.searchParams.get("cognito_id")
    if (qp) return qp
  } catch {}
  try {
    const ls = localStorage.getItem("cognito_id") || localStorage.getItem("CognitoId")
    if (ls) return ls
  } catch {}
  try {
    if (window && window.__COGNITO_ID) return window.__COGNITO_ID
  } catch {}
  return null
}

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
          These rows are read-only aggregates of your active goods-in lots. To change stock-on-hand values you must add,
          delete or edit the corresponding goods-in entries from the "Goods In" screen. This view summarizes active
          inventory and cannot be edited directly.
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

/* ===================== Simple inline icons (self-contained) ===================== */
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

/* ===================== Processor ===================== */
function processInventory(data) {
  const groups = {}
  ;(data || []).forEach((r, idx) => {
    const ingredient = (r?.ingredient ?? "").trim()
    if (!ingredient) return

    const { type, base, factor } = detectUnitTypeAndFactor(r?.unit ?? "")
    const rawAmount = Number(r?.totalRemaining ?? r?.stockOnHand ?? 0) || 0
    const baseAmount = rawAmount * (factor || 1)
    const key = ingredient.toLowerCase()

    if (!groups[key]) {
      groups[key] = {
        ingredient,
        totalBase: baseAmount,
        type,
        baseUnit: base,
        sampleBarcode: r?.activeBarcode ?? r?.barcode ?? "",
        sampleId: r?.batchCode ?? `${ingredient}-${idx}`,
        latestDate: r?.date ?? null,
      }
    } else {
      if (groups[key].type !== type) {
        const altKey = `${key}::${type}`
        if (!groups[altKey]) {
          groups[altKey] = {
            ingredient: `${ingredient} (${type})`,
            totalBase: baseAmount,
            type,
            baseUnit: base,
            sampleBarcode: r?.activeBarcode ?? r?.barcode ?? "",
            sampleId: r?.batchCode ?? `${ingredient}-${idx}-alt`,
            latestDate: r?.date ?? null,
          }
        } else {
          groups[altKey].totalBase += baseAmount
          if (r?.date && (!groups[altKey].latestDate || new Date(r.date) > new Date(groups[altKey].latestDate))) {
            groups[altKey].latestDate = r.date
          }
        }
      } else {
        groups[key].totalBase += baseAmount
        if (r?.date && (!groups[key].latestDate || new Date(r.date) > new Date(groups[key].latestDate))) {
          groups[key].latestDate = r.date
        }
        if (!groups[key].sampleBarcode && (r?.activeBarcode || r?.barcode)) {
          groups[key].sampleBarcode = r?.activeBarcode ?? r?.barcode
        }
      }
    }
  })

  const processed = Object.values(groups).map((g, i) => {
    const { displayValue, displayUnit, numericForChart } = formatDisplayForGroup(g.type, g.totalBase)
    return {
      id: g.sampleId ?? `${g.ingredient}-${i}`,
      ingredient: g.ingredient,
      unitsInStock: displayValue,
      unit: displayUnit,
      _numeric: numericForChart,
      barcode: g.sampleBarcode ?? "",
      date: g.latestDate,
    }
  })

  processed.sort((a, b) => a.ingredient.localeCompare(b.ingredient))
  return processed
}

/* ===================== Main Component ===================== */
const IngredientInventory = () => {
  const { cognitoId } = useAuth() || {}

  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme-mode") === "dark")

  useEffect(() => {
    const onThemeChanged = () => {
      setIsDark(localStorage.getItem("theme-mode") === "dark")
    }
    window.addEventListener("themeChanged", onThemeChanged)
    return () => window.removeEventListener("themeChanged", onThemeChanged)
  }, [])

  const [rows, setRows] = useState([])
  const [infoOpen, setInfoOpen] = useState(false)
  const [snack, setSnack] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchActiveInventory = async () => {
      const cid = resolveCognitoId(cognitoId)

      try {
        if (!cid) {
          const processed = processInventory(mockData)
          setRows(processed)
          setSnack("No Cognito ID found. Showing mock data.")
          return
        }

        const url = `${API_BASE}/ingredient-inventory/active?cognito_id=${encodeURIComponent(cid)}`
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Fetch failed (${res.status})`)
        const data = await res.json()
        const list = Array.isArray(data) ? data : []
        const processed = processInventory(list)
        setRows(processed)
      } catch (e) {
        console.error("Inventory load failed:", e)
        const processed = processInventory(mockData)
        setRows(processed)
        setSnack("API error — showing mock data.")
      }
    }

    fetchActiveInventory()
  }, [cognitoId])

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) =>
      [r.ingredient, r.barcode, r.unit].some((field) =>
        String(field ?? "")
          .toLowerCase()
          .includes(q),
      ),
    )
  }, [rows, searchQuery])

  const chartData = useMemo(
    () =>
      (filteredRows || []).map((r) => ({
        ingredient: r.ingredient,
        amount: Number(r._numeric) || 0,
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
            <div className="ii-logo" aria-label="Inventory">
              Inv
            </div>
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

        <div className="ii-grid">
          <div className="ii-card" style={{ minHeight: 520 }}>
            <div className="ii-card-head">
              <h3>Active Stock</h3>
              <p>Normalized into g / ml / units</p>
            </div>

            <div className="ii-toolbar">
              <input
                className="ii-input"
                type="text"
                placeholder="Search by ingredient, unit, barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
                      <td className="ii-td" colSpan={4} style={{ textAlign: "center", color: "var(--text-soft)" }}>
                        No active inventory found.
                      </td>
                    </tr>
                  ) : filteredRows.length === 0 ? (
                    <tr className="ii-row">
                      <td className="ii-td" colSpan={4} style={{ textAlign: "center", color: "var(--text-soft)" }}>
                        No items match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, index) => (
                      <tr key={row.id || index} className="ii-row">
                        <td className="ii-td ii-td-strong">{row.ingredient}</td>
                        <td className="ii-td">
                          <span className="ii-chip">
                            {Number.isFinite(row.unitsInStock)
                              ? row.unitsInStock.toLocaleString()
                              : String(row.unitsInStock)}
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

          <div className="ii-card" style={{ display: "flex", flexDirection: "column" }}>
            <div className="ii-chart-head">
              <h4>Inventory Levels</h4>
              <p>Normalized amounts by ingredient</p>
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
                        key={`${d.ingredient}-${i}`}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <div className="ii-bar" style={{ height: `${h}px` }}>
                          <div className="ii-bar-value">{Number(d.amount).toLocaleString()}</div>
                        </div>
                        <span className="ii-bar-label">{d.ingredient}</span>
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

export default IngredientInventory
