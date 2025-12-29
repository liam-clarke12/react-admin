"use client"

// src/scenes/GoodsIn/index.jsx
import { useEffect, useMemo, useState, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import { useAuth } from "../../contexts/AuthContext"
import Autocomplete from "@mui/material/Autocomplete"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material"

/* =========================================================================================
   Brand Styles (Light + Dark)
   - Reads localStorage('theme-mode') + listens for window 'themeChanged' (same as Topbar)
   ========================================================================================= */
const BrandStyles = ({ isDark }) => (
  <style>{`
  :root{
    --bg: ${isDark ? "#0a0f1e" : "#f8fafc"};
    --card: ${isDark ? "#151b2e" : "#ffffff"};
    --card2: ${isDark ? "#1a2033" : "#ffffff"};
    --mutedCard: ${isDark ? "rgba(255,255,255,0.03)" : "#f9fafb"};
    --border: ${isDark ? "#1e2942" : "#e2e8f0"};
    --text: ${isDark ? "#f1f5f9" : "#0f172a"};
    --text2: ${isDark ? "#cbd5e1" : "#475569"};
    --muted: ${isDark ? "#94a3b8" : "#64748b"};
    --hover: ${isDark ? "rgba(99,102,241,0.08)" : "#f0f4ff"};
    --thead: ${isDark ? "rgba(99,102,241,0.05)" : "#f8fafc"};
    --chip: ${isDark ? "rgba(99,102,241,0.12)" : "#eff6ff"};
    --monoBg: ${isDark ? "rgba(99,102,241,0.15)" : "#eef2ff"};
    --primary: #6366f1;
    --primary-light: #818cf8;
    --primary-dark: #4f46e5;
    --primary2: #4338ca;
    --success: #10b981;
    --success-light: #34d399;
    --warning: #f59e0b;
    --danger: #ef4444;
    --danger2: #dc2626;
    --shadow-sm: ${isDark ? "0 1px 2px rgba(0,0,0,0.3)" : "0 1px 2px rgba(0,0,0,0.04)"};
    --shadow: ${isDark ? "0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -1px rgba(0,0,0,0.2)" : "0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.04)"};
    --shadow-lg: ${isDark ? "0 20px 25px -5px rgba(0,0,0,0.4), 0 10px 10px -5px rgba(0,0,0,0.3)" : "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)"};
  }

  * { transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease; }

  .r-wrap { 
    padding: 24px; 
    background: var(--bg); 
    min-height: calc(100vh - 0px);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  }
  
  .r-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: var(--shadow);
    overflow: visible;
    color: var(--text2);
  }
  
  .r-head { 
    padding: 20px 24px; 
    display: flex; 
    flex-wrap: wrap; 
    gap: 16px; 
    align-items: center; 
    justify-content: space-between; 
    border-bottom: 1px solid var(--border);
    background: ${isDark ? "rgba(99,102,241,0.02)" : "rgba(99,102,241,0.01)"};
  }
  
  .r-title { 
    margin: 0; 
    font-weight: 700; 
    color: var(--text); 
    font-size: 24px;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }
  
  .r-sub { 
    margin: 4px 0 0 0; 
    color: var(--muted); 
    font-size: 14px;
    font-weight: 500;
  }
  
  .r-pill { 
    font-size: 13px; 
    font-weight: 700; 
    color: var(--primary);
    background: var(--chip);
    padding: 4px 12px;
    border-radius: 6px;
  }
  
  .r-flex { 
    display: flex; 
    align-items: center; 
    gap: 12px; 
  }

  .r-btn-ghost {
    display: inline-flex; 
    align-items: center; 
    gap: 8px; 
    padding: 10px 16px; 
    font-weight: 600; 
    font-size: 14px;
    color: var(--text); 
    border: 1px solid var(--border); 
    border-radius: 8px; 
    background: var(--card); 
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    transition: all 0.2s ease;
  }
  .r-btn-ghost:hover { 
    background: var(--hover);
    border-color: var(--primary-light);
    transform: translateY(-1px);
    box-shadow: var(--shadow);
  }
  .r-btn-ghost:active {
    transform: translateY(0);
  }
  
  .r-btn-primary {
    padding: 10px 20px; 
    font-weight: 600; 
    font-size: 14px;
    color: #fff; 
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    border: 0; 
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(99,102,241,0.3), 0 2px 4px -1px rgba(99,102,241,0.2);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .r-btn-primary:hover { 
    background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%);
    transform: translateY(-1px);
    box-shadow: 0 6px 10px -1px rgba(99,102,241,0.4), 0 4px 6px -1px rgba(99,102,241,0.3);
  }
  .r-btn-primary:active {
    transform: translateY(0);
  }
  
  .r-btn-danger { 
    background: linear-gradient(135deg, var(--danger) 0%, var(--danger2) 100%);
    box-shadow: 0 4px 6px -1px rgba(239,68,68,0.3), 0 2px 4px -1px rgba(239,68,68,0.2);
  }
  .r-btn-danger:hover { 
    background: linear-gradient(135deg, #f87171 0%, var(--danger) 100%);
    box-shadow: 0 6px 10px -1px rgba(239,68,68,0.4), 0 4px 6px -1px rgba(239,68,68,0.3);
  }

  /* Redesigned table with better spacing and modern styling */
  .r-table-wrap { 
    overflow-x: auto;
    background: var(--card);
  }
  
  table.r-table { 
    width: 100%; 
    table-layout: auto; 
    border-collapse: separate; 
    border-spacing: 0; 
    font-size: 14px; 
    color: var(--text2);
  }
  
  .r-thead { 
    background: var(--thead);
    text-transform: uppercase; 
    letter-spacing: 0.05em; 
    font-size: 11px; 
    font-weight: 700;
    color: var(--muted);
  }
  
  .r-thead th { 
    padding: 16px 16px; 
    text-align: left; 
    white-space: nowrap; 
    border-bottom: 2px solid var(--border);
    font-weight: 700;
  }
  
  .r-row { 
    border-bottom: 1px solid var(--border); 
    transition: all 0.15s ease;
  }
  .r-row:hover { 
    background: var(--hover);
  }
  
  .r-td { 
    padding: 16px; 
    overflow: hidden; 
    text-overflow: ellipsis; 
    white-space: nowrap; 
    border-bottom: 1px solid var(--border);
    font-size: 14px;
  }
  
  .r-td--name { 
    font-weight: 700; 
    color: var(--text);
  }
  
  .r-qty-badge { 
    display: inline-block; 
    padding: 4px 10px; 
    border-radius: 6px; 
    background: var(--chip); 
    color: var(--primary); 
    font-weight: 700;
    font-size: 13px;
  }
  
  .r-badge-mono {
    display: inline-block; 
    padding: 4px 10px; 
    border-radius: 6px;
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, monospace;
    font-size: 12px; 
    background: var(--monoBg); 
    color: var(--primary);
    max-width: 180px; 
    overflow: hidden; 
    text-overflow: ellipsis; 
    white-space: nowrap;
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  
  .r-actions { 
    text-align: right;
  }
  
  .r-chk { 
    width: 18px; 
    height: 18px; 
    accent-color: var(--primary);
    cursor: pointer;
  }

  .col-date{width:120px}
  .col-temp{width:90px}
  .col-num{width:120px}
  .col-invoice{width:130px}
  .col-expiry{width:120px}
  .col-ingredient{width:280px}
  .col-batch{width:160px}
  .col-actions{width:150px}
  .col-supplier{width:170px}

  /* Enhanced toolbar with better visual hierarchy */
  .r-toolbar {
    background: var(--card2);
    padding: 16px 20px;
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: var(--shadow-sm);
    display: flex; 
    flex-wrap: wrap; 
    gap: 12px; 
    align-items: center;
    color: var(--text2);
    margin-bottom: 20px;
  }
  
  .r-input {
    min-width: 280px; 
    flex: 1; 
    padding: 11px 14px;
    border: 1px solid var(--border);
    border-radius: 8px; 
    outline: none;
    background: ${isDark ? "rgba(255,255,255,0.04)" : "#fff"};
    color: var(--text);
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  .r-input::placeholder { 
    color: var(--muted);
  }
  .r-input:focus { 
    border-color: var(--primary); 
    box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
    background: var(--card);
  }
  
  .r-select {
    padding: 11px 14px; 
    border: 1px solid var(--border); 
    border-radius: 8px;
    background: ${isDark ? "rgba(255,255,255,0.04)" : "#fff"};
    color: var(--text);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .r-select:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
    outline: none;
  }
  
  .r-toolbar-gap { 
    margin-top: 16px; 
  }

  /* Modern footer design */
  .r-footer {
    padding: 16px 24px;
    border-top: 1px solid var(--border);
    display: flex; 
    align-items: center; 
    justify-content: space-between;
    background: ${isDark ? "rgba(99,102,241,0.02)" : "rgba(99,102,241,0.01)"};
    color: var(--text2);
    font-size: 14px;
    font-weight: 500;
  }
  
  .r-muted { 
    color: var(--muted); 
    font-size: 13px;
    font-weight: 500;
  }

  /* Improved page layout with better spacing */
  .gi-layout { 
    display: flex; 
    gap: 24px; 
    align-items: flex-start;
  }
  
  .gi-main { 
    flex: 1 1 0%; 
    min-width: 0;
  }
  
  .gi-side { 
    width: 340px; 
    flex-shrink: 0; 
    display: flex; 
    flex-direction: column; 
    gap: 20px;
  }
  
  .gi-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: var(--shadow);
    padding: 20px;
    color: var(--text2);
  }
  
  .gi-card h3 {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 700;
    color: var(--text);
    letter-spacing: -0.01em;
  }
  
  .gi-card strong { 
    color: var(--text);
    font-weight: 700;
  }

  /* Refined modal design */
  .r-modal-dim { 
    position: fixed; 
    inset: 0; 
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(4px);
    display: flex; 
    align-items: center; 
    justify-content: center; 
    z-index: 9999; 
    padding: 20px;
    animation: fadeIn 0.2s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .r-modal { 
    background: var(--card); 
    border-radius: 16px; 
    width: 100%; 
    max-width: 920px; 
    max-height: 90vh; 
    overflow: hidden; 
    box-shadow: var(--shadow-lg);
    display: flex; 
    flex-direction: column; 
    z-index: 10000; 
    border: 1px solid var(--border);
    animation: slideUp 0.3s ease;
  }
  
  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(20px); 
    }
    to { 
      opacity: 1;
      transform: translateY(0); 
    }
  }
  
  .r-mhdr { 
    padding: 20px 24px; 
    border-bottom: 1px solid var(--border); 
    display: flex; 
    align-items: center; 
    justify-content: space-between; 
    gap: 16px; 
    flex-wrap: wrap;
    background: ${isDark ? "rgba(99,102,241,0.03)" : "rgba(99,102,241,0.02)"};
  }
  
  .r-mbody { 
    padding: 24px; 
    overflow: auto; 
    background: var(--card); 
    color: var(--text2);
  }
  
  .r-mfooter { 
    padding: 16px 24px; 
    border-top: 1px solid var(--border); 
    background: ${isDark ? "rgba(99,102,241,0.02)" : "rgba(99,102,241,0.01)"};
    display: flex; 
    justify-content: flex-end; 
    gap: 12px;
  }

  /* Enhanced form styling */
  .ag-grid { 
    display: grid; 
    gap: 16px; 
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  
  .ag-field { 
    grid-column: span 2;
  }
  
  .ag-field-1 { 
    grid-column: span 1;
  }
  
  .ag-field-4 { 
    grid-column: span 4;
  }
  
  .ag-label { 
    font-size: 13px; 
    color: var(--text); 
    font-weight: 600; 
    margin-bottom: 8px; 
    display: block;
    letter-spacing: -0.01em;
  }
  
  .ag-input, .ag-select {
    width: 100%;
    padding: 11px 14px;
    border: 1px solid var(--border);
    border-radius: 8px;
    outline: none;
    background: ${isDark ? "rgba(255,255,255,0.04)" : "#fff"};
    color: var(--text);
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  
  .ag-input::placeholder { 
    color: var(--muted);
  }
  
  .ag-input:focus, .ag-select:focus { 
    border-color: var(--primary); 
    box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
    background: var(--card);
  }

  .ag-row { 
    border: 1px solid var(--border); 
    border-radius: 10px; 
    padding: 16px; 
    background: var(--card); 
    color: var(--text2);
    margin-bottom: 12px;
  }
  
  .ag-row:nth-child(odd){ 
    background: ${isDark ? "rgba(255,255,255,0.02)" : "#f9fafb"};
  }

  /* Modern segmented control */
  .seg {
    display: inline-flex; 
    gap: 4px; 
    padding: 4px;
    background: ${isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"};
    border: 1px solid var(--border);
    border-radius: 10px;
    position: relative; 
    z-index: 10001;
  }
  
  .seg button {
    border: 0; 
    background: transparent; 
    padding: 8px 16px; 
    border-radius: 8px; 
    font-weight: 600; 
    cursor: pointer; 
    color: var(--text2);
    font-size: 14px;
    transition: all 0.2s ease;
  }
  
  .seg button:hover { 
    background: ${isDark ? "rgba(99,102,241,0.1)" : "#e0e7ff"};
    color: var(--text);
  }
  
  .seg .active { 
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    color: #fff; 
    box-shadow: 0 2px 4px rgba(99,102,241,0.3);
  }

  /* MUI Autocomplete dropdown above modal */
  .MuiAutocomplete-popper { z-index: 10020 !important; }
  .MuiAutocomplete-popper .MuiPaper-root { overflow: visible; }

  /* Better MUI integration with our design system */
  .MuiInputBase-root { 
    color: ${isDark ? "#f1f5f9" : "inherit"};
    font-weight: 500 !important;
  }
  .MuiOutlinedInput-notchedOutline { 
    border-color: ${isDark ? "rgba(30,41,66,1)" : "rgba(226,232,240,1)"} !important;
    transition: border-color 0.2s ease !important;
  }
  .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline { 
    border-color: ${isDark ? "rgba(129,140,248,0.5)" : "rgba(99,102,241,0.5)"} !important;
  }
  .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
    border-color: var(--primary) !important;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.1) !important;
  }
  .MuiFormLabel-root { 
    color: ${isDark ? "#94a3b8" : "#64748b"} !important;
    font-weight: 600 !important;
  }
  .MuiPaper-root { 
    background-color: ${isDark ? "#151b2e" : "#fff"};
    border: 1px solid var(--border);
    box-shadow: var(--shadow-lg) !important;
  }
  `}</style>
)

/* Icons */
const Svg = (p) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" {...p} />
const EditIcon = (props) => (
  <Svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </Svg>
)
const DeleteIcon = (props) => (
  <Svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </Svg>
)
const PlusIcon = (props) => (
  <Svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 5v14M5 12h14" />
  </Svg>
)

/* =========================================================================================
   Types & Utils
   ========================================================================================= */
const UnitGroup = Object.freeze({
  GRAMS: "grams_group",
  ML: "ml_group",
  UNITS: "units_group",
})
const unitOptions = [
  { value: "grams", label: "Grams (g)" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "kg", label: "Kilograms (Kg)" },
  { value: "l", label: "Litres (L)" },
  { value: "units", label: "Units" },
]
function toBaseAmount(amount, unit) {
  if (!unit) return Number(amount || 0)
  const u = String(unit).toLowerCase()
  if (u === "kg") return Number(amount || 0) * 1000
  if (u === "grams" || u === "g") return Number(amount || 0)
  if (u === "l") return Number(amount || 0) * 1000
  if (u === "ml") return Number(amount || 0)
  return Number(amount || 0)
}
function detectUnitGroup(unit) {
  if (!unit) return UnitGroup.UNITS
  const u = String(unit).toLowerCase()
  if (u === "kg" || u === "grams" || u === "g") return UnitGroup.GRAMS
  if (u === "l" || u === "ml") return UnitGroup.ML
  return UnitGroup.UNITS
}
function formatDisplayAmount(baseAmount, group) {
  if (group === UnitGroup.GRAMS) {
    if (Math.abs(baseAmount) >= 1000) return { amount: Number((baseAmount / 1000).toFixed(2)), unit: "kg" }
    return { amount: Math.round(baseAmount), unit: "g" }
  }
  if (group === UnitGroup.ML) {
    if (Math.abs(baseAmount) >= 1000) return { amount: Number((baseAmount / 1000).toFixed(2)), unit: "l" }
    return { amount: Math.round(baseAmount), unit: "ml" }
  }
  return { amount: Math.round(baseAmount), unit: "units" }
}

/* =========================================================================================
   Config
   ========================================================================================= */
const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api"

/* =========================================================================================
   Small Bar List (side stats)
   ========================================================================================= */
const SmallBarList = ({ data = [], isDark }) => {
  if (!data || data.length === 0) return <p className="r-muted">No data available.</p>
  const maxBase = Math.max(...data.map((d) => Number(d.baseAmount) || 0), 1)
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {data.map((d) => {
        const pct = (Number(d.baseAmount) / maxBase) * 100
        return (
          <div key={d.ingredient}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: isDark ? "#cbd5e1" : "#475569" }}>
                {d.ingredient}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: isDark ? "#f1f5f9" : "#0f172a" }}>
                {d.amount} {d.unit}
              </span>
            </div>
            <div
              style={{
                height: 8,
                borderRadius: 999,
                background: isDark ? "rgba(255,255,255,0.06)" : "#e5e7eb",
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  display: "block",
                  height: "100%",
                  width: `${pct}%`,
                  background: "linear-gradient(90deg, #6366f1, #818cf8)",
                  borderRadius: 999,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* =========================================================================================
   Helpers
   ========================================================================================= */
const Portal = ({ children }) => {
  if (typeof window === "undefined") return null
  return createPortal(children, document.body)
}

/* =========================================================================================
   Main Component
   ========================================================================================= */
export default function GoodsIn() {
  // Theme (sync with Topbar)
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme-mode") === "dark")
  useEffect(() => {
    const onThemeChanged = () => setIsDark(localStorage.getItem("theme-mode") === "dark")
    window.addEventListener("themeChanged", onThemeChanged)
    return () => window.removeEventListener("themeChanged", onThemeChanged)
  }, [])

  // Auth
  const { cognitoId: cognitoIdFromAuth } = useAuth() || {}
  const cognitoIdFromWindow = typeof window !== "undefined" && window.__COGNITO_ID__ ? window.__COGNITO_ID__ : ""
  let cognitoIdFromStorage = ""
  try {
    cognitoIdFromStorage = typeof window !== "undefined" ? localStorage.getItem("cognito_id") || "" : ""
  } catch {}
  const cognitoId = cognitoIdFromAuth || cognitoIdFromWindow || cognitoIdFromStorage || ""

  // Table state
  const [goodsInRows, setGoodsInRows] = useState([])
  const [selectedRows, setSelectedRows] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState({ field: "date", dir: "desc" })
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [loading, setLoading] = useState(true)
  const [fatalMsg, setFatalMsg] = useState("")
  const selectAllCheckboxRef = useRef(null)

  // Edit / Delete
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingRow, setEditingRow] = useState(null)
  const [originalBarcode, setOriginalBarcode] = useState(null)
  const [originalId, setOriginalId] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  // ADD GOODS POPUP
  const [addOpen, setAddOpen] = useState(false)
  const [addTab, setAddTab] = useState(0) // 0 single, 1 multiple

  // single entry state
  const [single, setSingle] = useState({
    date: new Date().toISOString().slice(0, 10),
    ingredient: "",
    invoiceNumber: "",
    supplier: "",
    stockReceived: "",
    unit: "grams",
    barCode: "",
    expiryDate: new Date().toISOString().slice(0, 10),
    temperature: "N/A",
  })

  // multiple entry state
  const blankItem = () => ({
    date: new Date().toISOString().slice(0, 10),
    ingredient: "",
    invoiceNumber: single.invoiceNumber || "",
    supplier: single.supplier || "",
    stockReceived: "",
    unit: "grams",
    barCode: "",
    expiryDate: new Date().toISOString().slice(0, 10),
    temperature: "N/A",
  })
  const [multi, setMulti] = useState([blankItem()])

  // Ingredients
  const [masterIngredients, setMasterIngredients] = useState([])
  const [customIngredients, setCustomIngredients] = useState([])
  const [loadingMaster, setLoadingMaster] = useState(false)
  const [loadingCustom, setLoadingCustom] = useState(false)
  const ingredients = useMemo(
    () => [
      ...masterIngredients.map((i) => ({ ...i, source: "master" })),
      ...customIngredients.map((i) => ({ ...i, source: "custom" })),
    ],
    [masterIngredients, customIngredients],
  )

  const ingredientNameById = useMemo(() => {
    const m = new Map()
    masterIngredients.forEach((i) => m.set(String(i.id), i.name))
    customIngredients.forEach((i) => m.set(String(i.id), i.name))
    return m
  }, [masterIngredients, customIngredients])

  // Add ingredient dialog
  const [addIngOpen, setAddIngOpen] = useState(false)
  const [addingIng, setAddingIng] = useState(false)
  const [newIngredientName, setNewIngredientName] = useState("")
  const [ingTarget, setIngTarget] = useState(null)

  // Toast
  const [toastOpen, setToastOpen] = useState(false)

  // Helpers (unchanged)
  const computeIngredientInventory = (rows) => {
    const active = (Array.isArray(rows) ? rows : []).filter((r) => r.stockRemaining > 0)
    const map = new Map()
    for (const r of active) {
      const key = r.ingredient
      const prev = map.get(key) || {
        ingredient: key,
        amount: 0,
        barcode: r.barCode,
        _date: r.date,
        unit: r.unit,
      }
      const amount = prev.amount + r.stockRemaining
      let nextBarcode = prev.barcode
      let nextDate = prev._date
      try {
        const prevTime = new Date(prev._date).getTime() || Number.POSITIVE_INFINITY
        const curTime = new Date(r.date).getTime() || Number.POSITIVE_INFINITY
        if (curTime < prevTime) {
          nextBarcode = r.barCode
          nextDate = r.date
        }
      } catch {}
      map.set(key, { ingredient: key, amount, barcode: nextBarcode, _date: nextDate, unit: r.unit })
    }
  }

  const fetchGoodsInData = useCallback(async () => {
    if (!cognitoId) {
      setFatalMsg(
        "Missing cognito_id. Ensure useAuth() provides cognitoId, or set window.__COGNITO_ID__ / localStorage('cognito_id').",
      )
      setGoodsInRows([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const url = `${API_BASE}/goods-in/active?cognito_id=${encodeURIComponent(cognitoId)}`
      const response = await fetch(url)
      if (!response.ok) {
        const text = await response.text().catch(() => "")
        console.error("[GoodsIn] GET /goods-in/active 400/500:", text)
        throw new Error(text || `Failed to fetch Goods In data (status ${response.status})`)
      }
      const data = await response.json()
      const normalized = (Array.isArray(data) ? data : []).map((row, idx) => {
        const stockRemaining = Number(row.stockRemaining || 0)
        const serverBar = row.barCode ? String(row.barCode) : null
        const rawIngredient = row.ingredient ?? row.ingredientName ?? row.ingredient_name ?? row.name ?? ""

        return {
          _id: serverBar ? `${serverBar}-${idx}` : `gen-${idx}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          date: row.date ? String(row.date).slice(0, 10) : "",
          expiryDate: row.expiryDate ? String(row.expiryDate).slice(0, 10) : null,
          stockReceived: Number(row.stockReceived || 0),
          stockRemaining,
          processed: stockRemaining === 0 ? "Yes" : "No",
          barCode: serverBar || row.barCode || null,
          invoiceNumber: row.invoice_number ?? row.invoiceNumber ?? null,
          supplier: row.supplier ?? row.supplier_name ?? row.supplierName ?? null,
          unit: row.unit ?? row.unitName ?? row.unit_label ?? "",
          ingredient: rawIngredient,
          temperature: row.temperature,
        }
      })

      setGoodsInRows(normalized)
      computeIngredientInventory(normalized)
      setFatalMsg("")
    } catch (error) {
      console.error("Error fetching Goods In data:", error)
      setFatalMsg(String(error?.message || error))
    } finally {
      setLoading(false)
    }
  }, [cognitoId])

  useEffect(() => {
    fetchGoodsInData()
  }, [fetchGoodsInData])

  // Load ingredients on mount
  useEffect(() => {
    if (!cognitoId) return

    setLoadingMaster(true)
    fetch(`${API_BASE}/ingredients?cognito_id=${cognitoId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch ingredients")
        return res.json()
      })
      .then(setMasterIngredients)
      .catch((err) => console.error("Ingredients master error:", err))
      .finally(() => setLoadingMaster(false))

    setLoadingCustom(true)
    fetch(`${API_BASE}/custom-ingredients?cognito_id=${cognitoId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch custom ingredients")
        return res.json()
      })
      .then(setCustomIngredients)
      .then(() => {})
      .catch((err) => console.error("Custom ingredients error:", err))
      .finally(() => setLoadingCustom(false))
  }, [cognitoId])

  // Refresh ingredients when Add dialog opens
  useEffect(() => {
    if (!addOpen || !cognitoId) return

    setLoadingMaster(true)
    fetch(`${API_BASE}/ingredients?cognito_id=${cognitoId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch ingredients")
        return res.json()
      })
      .then(setMasterIngredients)
      .catch((err) => console.error("Ingredients master error:", err))
      .finally(() => setLoadingMaster(false))

    setLoadingCustom(true)
    fetch(`${API_BASE}/custom-ingredients?cognito_id=${cognitoId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch custom ingredients")
        return res.json()
      })
      .then((data) => setCustomIngredients(data.map((ci) => ({ id: `c-${ci.id}`, name: ci.name }))))
      .catch((err) => console.error("Custom ingredients error:", err))
      .finally(() => setLoadingCustom(false))
  }, [addOpen, cognitoId])

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let rows = [...goodsInRows]
    if (q) {
      rows = rows.filter((r) => Object.values(r).some((val) => String(val).toLowerCase().includes(q)))
    }
    const dir = sortBy.dir === "asc" ? 1 : -1
    rows.sort((a, b) => {
      const fa = a[sortBy.field] ?? ""
      const fb = b[sortBy.field] ?? ""
      if (typeof fa === "number" && typeof fb === "number") return (fa - fb) * dir
      return String(fa).localeCompare(String(fb)) * dir
    })
    return rows
  }, [goodsInRows, searchQuery, sortBy])

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = selectedRows.length > 0 && selectedRows.length < filteredRows.length
    }
  }, [selectedRows, filteredRows])

  // Edit/update/delete
  const processRowUpdate = async (newRow, oldRow) => {
    if (!cognitoId) throw new Error("Missing cognito_id for update.")
    const payload = {
      date: newRow.date,
      ingredient: newRow.ingredient,
      temperature: newRow.temperature,
      stockReceived: newRow.stockReceived,
      stockRemaining: newRow.stockRemaining,
      unit: newRow.unit,
      expiryDate: newRow.expiryDate,
      barCode: newRow.barCode,
      invoice_number: newRow.invoiceNumber ?? null,
      supplier: newRow.supplier ?? null,
      cognito_id: cognitoId,
    }
    const identifierForPath = oldRow.barCode || newRow.barCode
    if (!identifierForPath) throw new Error("Barcode is required for update.")
    const url = `${API_BASE}/goods-in/${encodeURIComponent(identifierForPath)}`
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const text = await response.text().catch(() => "")
      console.error("[GoodsIn] PUT /goods-in/{id} 400/500:", text)
      throw new Error(text || `Failed to update row (status ${response.status})`)
    }
    await fetchGoodsInData()
  }

  const handleDeleteSelectedRows = async () => {
    if (selectedRows.length === 0) return
    if (!cognitoId) {
      alert("Missing cognito_id for delete.")
      return
    }
    try {
      const rowsToDelete = goodsInRows.filter((r) => selectedRows.includes(r._id))
      await Promise.all(
        rowsToDelete.map((row) =>
          fetch(`${API_BASE}/delete-row`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ barCode: row.barCode, cognito_id: cognitoId }),
          }).then(async (res) => {
            if (!res.ok) {
              const t = await res.text().catch(() => "")
              throw new Error(t || `Soft delete failed for ${row.barCode}`)
            }
          }),
        ),
      )
      await fetchGoodsInData()
      setSelectedRows([])
      setDeleteOpen(false)
    } catch (err) {
      console.error("Soft delete error:", err)
      alert("Could not delete selected records. Check console for details.")
    }
  }

  const handleEditRow = (row) => {
    setEditingRow({ ...row })
    setOriginalBarcode(row.barCode)
    setOriginalId(row._id)
    setEditDialogOpen(true)
  }

  const handleConfirmEdit = async () => {
    if (!editingRow) return
    setUpdating(true)
    try {
      await processRowUpdate(editingRow, { barCode: originalBarcode, _id: originalId })
      setEditDialogOpen(false)
      setEditingRow(null)
      setOriginalBarcode(null)
      setOriginalId(null)
    } catch (err) {
      console.error("Confirm edit failed:", err)
      alert("Update failed. See console for details.")
    } finally {
      setUpdating(false)
    }
  }

  const visibleRows = useMemo(() => {
    const start = page * rowsPerPage
    return filteredRows.slice(start, start + rowsPerPage)
  }, [filteredRows, page, rowsPerPage])

  const toggleSelectAll = (e) => {
    if (e?.target?.checked) setSelectedRows(filteredRows.map((r) => r._id))
    else setSelectedRows([])
  }

  const toggleRowSelection = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const totalsByBaseUnitGroup = useMemo(() => {
    const acc = { [UnitGroup.GRAMS]: 0, [UnitGroup.ML]: 0, [UnitGroup.UNITS]: 0 }
    filteredRows.forEach((r) => {
      const group = detectUnitGroup(r.unit)
      const base = toBaseAmount(r.stockRemaining, r.unit)
      acc[group] = (acc[group] || 0) + base
    })
    return acc
  }, [filteredRows])

  const displayTotalsByGroup = useMemo(() => {
    return {
      gramsGroup: formatDisplayAmount(totalsByBaseUnitGroup[UnitGroup.GRAMS] || 0, UnitGroup.GRAMS),
      mlGroup: formatDisplayAmount(totalsByBaseUnitGroup[UnitGroup.ML] || 0, UnitGroup.ML),
      unitsGroup: formatDisplayAmount(totalsByBaseUnitGroup[UnitGroup.UNITS] || 0, UnitGroup.UNITS),
    }
  }, [totalsByBaseUnitGroup])

  const totalsByIngredient = useMemo(() => {
    const map = new Map()
    goodsInRows.forEach((r) => {
      const displayName = ingredientNameById.get(String(r.ingredient)) || r.ingredient || "—"
      const key = displayName
      const prev = map.get(key) || { baseAmount: 0, unitSamples: new Map() }
      prev.baseAmount += toBaseAmount(r.stockRemaining, r.unit)
      prev.unitSamples.set(r.unit || "", (prev.unitSamples.get(r.unit || "") || 0) + 1)
      map.set(key, prev)
    })
    const arr = Array.from(map.entries()).map(([ingredient, { baseAmount, unitSamples }]) => {
      let chosenGroup = UnitGroup.UNITS
      for (const u of unitOptions.map((o) => o.value)) {
        if (unitSamples.has(u)) {
          chosenGroup = detectUnitGroup(u)
          break
        }
      }
      const disp = formatDisplayAmount(baseAmount, chosenGroup)
      return { ingredient, amount: disp.amount, unit: disp.unit, baseAmount }
    })
    arr.sort((a, b) => b.baseAmount - a.baseAmount)
    return arr.slice(0, 6)
  }, [goodsInRows, ingredientNameById])

  const numSelected = selectedRows.length

  /* ===========================================================
     Add Good(s) Submit
     =========================================================== */
  const resolveIngredientName = (value) => {
    const opt = ingredients.find((i) => String(i.id) === String(value))
    return opt ? opt.name : value
  }

  const submitSingle = async () => {
    const payload = {
      ...single,
      ingredient: resolveIngredientName(single.ingredient),
      ingredientId: ingredients.find((i) => String(i.id) === String(single.ingredient))?.id ?? null,
      invoiceNumber: single.invoiceNumber || null,
      supplier: single.supplier || null,
      cognito_id: cognitoId,
    }
    const res = await fetch(`${API_BASE}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await res.text().catch(() => "Submit failed"))
  }

  const submitMultiple = async () => {
    const entries = multi.map((it) => ({
      ...it,
      ingredient: resolveIngredientName(it.ingredient),
      ingredientId: ingredients.find((i) => String(i.id) === String(it.ingredient))?.id ?? null,
      invoiceNumber: it.invoiceNumber || null,
      supplier: it.supplier || null,
    }))
    const res = await fetch(`${API_BASE}/submit/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries, cognito_id: cognitoId }),
    })
    if (res.ok) return
    for (const e of entries) {
      const r = await fetch(`${API_BASE}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...e, cognito_id: cognitoId }),
      })
      if (!r.ok) console.warn("submit fallback failed:", await r.text().catch(() => r.status))
    }
  }

  const handleAddSubmit = async () => {
    try {
      if (!cognitoId) throw new Error("Missing cognito id")
      if (addTab === 0) await submitSingle()
      else {
        if (!multi.length) throw new Error("Please add at least one item")
        await submitMultiple()
      }

      setAddOpen(false)
      setSingle({
        date: new Date().toISOString().slice(0, 10),
        ingredient: "",
        invoiceNumber: "",
        supplier: "",
        stockReceived: "",
        unit: "grams",
        barCode: "",
        expiryDate: new Date().toISOString().slice(0, 10),
        temperature: "N/A",
      })
      setMulti([blankItem()])
      await fetchGoodsInData()
      setToastOpen(true)
    } catch (e) {
      console.error("Add Good(s) submit error:", e)
      alert(String(e?.message || e))
    }
  }

  const addMultiRow = () => setMulti((arr) => [...arr, blankItem()])
  const removeMultiRow = (idx) => setMulti((arr) => arr.filter((_, i) => i !== idx))

  /* ===========================================================
     Add custom ingredient
     =========================================================== */
  const handleOpenAddIngredient = (target) => {
    setIngTarget(target)
    setAddIngOpen(true)
  }

  const handleAddCustomIngredient = async () => {
    if (!newIngredientName.trim() || !cognitoId) return
    setAddingIng(true)
    try {
      const res = await fetch(`${API_BASE}/custom-ingredients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cognito_id: cognitoId, name: newIngredientName.trim() }),
      })
      if (!res.ok) throw new Error("Failed to add ingredient")

      const updated = await fetch(`${API_BASE}/custom-ingredients?cognito_id=${cognitoId}`)
      if (!updated.ok) throw new Error("Failed to refresh custom ingredients")
      const data = await updated.json()
      const mapped = data.map((ci) => ({ id: `c-${ci.id}`, name: ci.name }))
      setCustomIngredients(mapped)

      const justAdded = mapped.find((i) => i.name.toLowerCase() === newIngredientName.trim().toLowerCase())

      if (justAdded) {
        if (ingTarget?.mode === "single") {
          setSingle((s) => ({ ...s, ingredient: justAdded.id }))
        } else if (ingTarget?.mode === "multi" && typeof ingTarget.index === "number") {
          setMulti((arr) => arr.map((v, i) => (i === ingTarget.index ? { ...v, ingredient: justAdded.id } : v)))
        }
      }

      setAddIngOpen(false)
      setNewIngredientName("")
      setIngTarget(null)
    } catch (err) {
      console.error("add custom ingredient error:", err)
      alert("Could not add ingredient")
    } finally {
      setAddingIng(false)
    }
  }

  const dangerCardStyle = {
    borderColor: isDark ? "rgba(220,38,38,0.55)" : "#fecaca",
    background: isDark ? "rgba(220,38,38,0.12)" : "#fff1f2",
    color: isDark ? "#fecaca" : "#b91c1c",
    marginBottom: 12,
  }

  return (
    <div className="r-wrap">
      <BrandStyles isDark={isDark} />

      {/* Errors / Missing Cognito */}
      {!cognitoId && (
        <div className="gi-card" style={dangerCardStyle}>
          <strong>Can’t load data:</strong> No cognito_id detected. Ensure your auth provider sets{" "}
          <code>cognitoId</code>.
        </div>
      )}
      {fatalMsg && (
        <div className="gi-card" style={dangerCardStyle}>
          <strong>API error:</strong> {fatalMsg}
        </div>
      )}

      <div className="gi-layout">
        {/* MAIN */}
        <div className="gi-main">
          <div className="r-card">
            <div className="r-head">
              <div>
                <h2 className="r-title">Goods In Management</h2>
                <p className="r-sub">Track and manage incoming inventory</p>
              </div>

              <div className="r-flex">
                <button className="r-btn-primary" onClick={() => setAddOpen(true)}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <PlusIcon /> Add Good(s)
                  </span>
                </button>

                {numSelected > 0 && (
                  <div
                    className="r-flex"
                    style={{
                      background: isDark ? "rgba(124,58,237,0.12)" : "#eef2ff",
                      padding: "6px 10px",
                      borderRadius: 10,
                      border: `1px solid ${isDark ? "rgba(124,58,237,0.25)" : "transparent"}`,
                    }}
                  >
                    <span className="r-pill">{numSelected} selected</span>
                    <button
                      className="r-btn-ghost"
                      onClick={() => setDeleteOpen(true)}
                      aria-label="Delete selected"
                      title="Delete selected"
                      style={{
                        color: isDark ? "#fecaca" : "#dc2626",
                        borderColor: isDark ? "rgba(220,38,38,0.35)" : "#fecaca",
                      }}
                    >
                      <DeleteIcon />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Toolbar */}
            <div className="r-toolbar">
              <input
                className="r-input"
                type="text"
                placeholder="Search by ingredient, batch code, invoice, supplier..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(0)
                }}
              />
              <select
                className="r-select"
                value={`${sortBy.field}:${sortBy.dir}`}
                onChange={(e) => {
                  const [field, dir] = e.target.value.split(":")
                  setSortBy({ field, dir })
                }}
              >
                <option value="date:desc">Date (new → old)</option>
                <option value="date:asc">Date (old → new)</option>
                <option value="ingredient:asc">Ingredient A→Z</option>
                <option value="ingredient:desc">Ingredient Z→A</option>
                <option value="stockRemaining:desc">Remaining (high → low)</option>
                <option value="stockRemaining:asc">Remaining (low → high)</option>
              </select>
            </div>

            {/* TABLE */}
            <div className="r-table-wrap r-toolbar-gap">
              <table className="r-table">
                <thead className="r-thead">
                  <tr>
                    <th className="r-td" style={{ width: 40 }}>
                      <input
                        ref={selectAllCheckboxRef}
                        className="r-chk"
                        type="checkbox"
                        onChange={toggleSelectAll}
                        checked={filteredRows.length > 0 && numSelected === filteredRows.length}
                      />
                    </th>
                    <th className="r-td col-ingredient">Ingredient</th>
                    <th className="r-td col-date">Date</th>
                    <th className="r-td col-temp">Temp</th>
                    <th className="r-td col-num">Received</th>
                    <th className="r-td col-num">Remaining</th>
                    <th className="r-td col-supplier">Supplier</th>
                    <th className="r-td col-invoice">Invoice #</th>
                    <th className="r-td col-expiry">Expiry</th>
                    <th className="r-td col-batch">Batch Code</th>
                    <th className="r-td col-actions r-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr className="r-row">
                      <td className="r-td" colSpan={11} style={{ textAlign: "center" }}>
                        <span className="r-muted">Loading goods in…</span>
                      </td>
                    </tr>
                  ) : visibleRows.length === 0 ? (
                    <tr className="r-row">
                      <td className="r-td" colSpan={11} style={{ textAlign: "center" }}>
                        <span className="r-muted">No records found.</span>
                      </td>
                    </tr>
                  ) : (
                    visibleRows.map((row) => {
                      const ingredientDisplay = ingredientNameById.get(String(row.ingredient)) || row.ingredient || "-"
                      return (
                        <tr key={row._id} className="r-row">
                          <td className="r-td">
                            <input
                              className="r-chk"
                              type="checkbox"
                              checked={selectedRows.includes(row._id)}
                              onChange={() => toggleRowSelection(row._id)}
                            />
                          </td>
                          <td className="r-td r-td--name">{ingredientDisplay}</td>
                          <td className="r-td">{row.date || "-"}</td>
                          <td className="r-td">{row.temperature ? `${row.temperature}℃` : "-"}</td>
                          <td className="r-td">
                            <span className="r-qty-badge">
                              {row.stockReceived} {row.unit}
                            </span>
                          </td>
                          <td className="r-td">
                            <span className="r-qty-badge">
                              {row.stockRemaining} {row.unit}
                            </span>
                          </td>
                          <td className="r-td" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                            {row.supplier || "-"}
                          </td>
                          <td className="r-td" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                            {row.invoiceNumber || "-"}
                          </td>
                          <td className="r-td" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                            {row.expiryDate || "-"}
                          </td>
                          <td className="r-td">
                            <span className="r-badge-mono">{row.barCode || "-"}</span>
                          </td>
                          <td className="r-td r-actions">
                            <button
                              className="r-btn-ghost"
                              onClick={() => handleEditRow(row)}
                              aria-label={`Edit ${row.barCode || ingredientDisplay}`}
                            >
                              <EditIcon /> Edit
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* FOOTER / PAGINATION */}
            <div className="r-footer">
              <span className="r-muted">
                Showing <strong>{filteredRows.length === 0 ? 0 : page * rowsPerPage + 1}</strong>–
                <strong>{Math.min((page + 1) * rowsPerPage, filteredRows.length)}</strong> of{" "}
                <strong>{filteredRows.length}</strong>
              </span>
              <div className="r-flex">
                <button
                  className="r-btn-ghost"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Prev
                </button>
                <span className="r-muted">Page {page + 1}</span>
                <button
                  className="r-btn-ghost"
                  onClick={() => setPage((p) => ((p + 1) * rowsPerPage < filteredRows.length ? p + 1 : p))}
                  disabled={(page + 1) * rowsPerPage >= filteredRows.length}
                >
                  Next
                </button>
                <select
                  className="r-select"
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value))
                    setPage(0)
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SIDE (right) */}
        <aside className="gi-side">
          <div className="gi-card">
            <h3>Quick Stats</h3>
            <p className="r-muted" style={{ marginBottom: 10 }}>
              Top ingredients by remaining stock
            </p>
            <SmallBarList data={totalsByIngredient} isDark={isDark} />
          </div>

          <div className="gi-card">
            <h3>Total Remaining</h3>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                padding: "6px 0",
              }}
            >
              <span className="r-muted">Grams Group</span>
              <strong>
                {displayTotalsByGroup.gramsGroup.amount} {displayTotalsByGroup.gramsGroup.unit}
              </strong>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                padding: "6px 0",
              }}
            >
              <span className="r-muted">ml Group</span>
              <strong>
                {displayTotalsByGroup.mlGroup.amount} {displayTotalsByGroup.mlGroup.unit}
              </strong>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                padding: "6px 0",
              }}
            >
              <span className="r-muted">Units Group</span>
              <strong>
                {displayTotalsByGroup.unitsGroup.amount} {displayTotalsByGroup.unitsGroup.unit}
              </strong>
            </div>
          </div>
        </aside>
      </div>

      {/* ===================== EDIT MODAL (PORTALED) ===================== */}
      {editDialogOpen && editingRow && (
        <Portal>
          <div className="r-modal-dim">
            <div className="r-modal">
              <div className="r-mhdr">
                <h3 className="r-title" style={{ fontSize: 18 }}>
                  Edit Goods In Record
                </h3>
                <button
                  className="r-btn-ghost"
                  onClick={() => {
                    setEditDialogOpen(false)
                    setEditingRow(null)
                  }}
                >
                  Close
                </button>
              </div>
              <div className="r-mbody">
                <div className="ag-grid">
                  <div className="ag-field ag-field-4">
                    <label className="ag-label">Ingredient</label>
                    <input
                      className="ag-input"
                      type="text"
                      value={editingRow.ingredient || ""}
                      onChange={(e) => setEditingRow({ ...editingRow, ingredient: e.target.value })}
                    />
                  </div>
                  <div className="ag-field">
                    <label className="ag-label">Date</label>
                    <input
                      className="ag-input"
                      type="date"
                      value={editingRow.date || ""}
                      onChange={(e) => setEditingRow({ ...editingRow, date: e.target.value })}
                    />
                  </div>
                  <div className="ag-field">
                    <label className="ag-label">Temperature (℃)</label>
                    <input
                      className="ag-input"
                      type="text"
                      value={editingRow.temperature || ""}
                      onChange={(e) => setEditingRow({ ...editingRow, temperature: e.target.value })}
                    />
                  </div>
                  <div className="ag-field-1">
                    <label className="ag-label">Stock Received</label>
                    <input
                      className="ag-input"
                      type="number"
                      value={editingRow.stockReceived || ""}
                      onChange={(e) => setEditingRow({ ...editingRow, stockReceived: Number(e.target.value) })}
                    />
                  </div>
                  <div className="ag-field-1">
                    <label className="ag-label">Stock Remaining</label>
                    <input
                      className="ag-input"
                      type="number"
                      value={editingRow.stockRemaining || ""}
                      onChange={(e) => setEditingRow({ ...editingRow, stockRemaining: Number(e.target.value) })}
                    />
                  </div>
                  <div className="ag-field ag-field-4">
                    <label className="ag-label">Unit</label>
                    <select
                      className="ag-select"
                      value={editingRow.unit || ""}
                      onChange={(e) => setEditingRow({ ...editingRow, unit: e.target.value })}
                    >
                      {unitOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="ag-field">
                    <label className="ag-label">Batch Code</label>
                    <input
                      className="ag-input"
                      type="text"
                      value={editingRow.barCode || ""}
                      onChange={(e) => setEditingRow({ ...editingRow, barCode: e.target.value })}
                    />
                  </div>
                  <div className="ag-field">
                    <label className="ag-label">Invoice Number</label>
                    <input
                      className="ag-input"
                      type="text"
                      value={editingRow.invoiceNumber || ""}
                      onChange={(e) => setEditingRow({ ...editingRow, invoiceNumber: e.target.value })}
                    />
                  </div>
                  <div className="ag-field">
                    <label className="ag-label">Supplier</label>
                    <input
                      className="ag-input"
                      type="text"
                      value={editingRow.supplier || ""}
                      onChange={(e) => setEditingRow({ ...editingRow, supplier: e.target.value })}
                    />
                  </div>
                  <div className="ag-field ag-field-4">
                    <label className="ag-label">Expiry Date</label>
                    <input
                      className="ag-input"
                      type="date"
                      value={editingRow.expiryDate || ""}
                      onChange={(e) => setEditingRow({ ...editingRow, expiryDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="r-mfooter">
                <button
                  className="r-btn-ghost"
                  onClick={() => {
                    setEditDialogOpen(false)
                    setEditingRow(null)
                  }}
                  disabled={updating}
                >
                  Cancel
                </button>
                <button className="r-btn-primary" onClick={handleConfirmEdit} disabled={updating}>
                  {updating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ===================== DELETE CONFIRM MODAL (PORTALED) ===================== */}
      {deleteOpen && numSelected > 0 && (
        <Portal>
          <div className="r-modal-dim">
            <div className="r-modal" style={{ maxWidth: 420 }}>
              <div className="r-mhdr">
                <h2 className="r-title" style={{ fontSize: 18 }}>
                  Confirm Deletion
                </h2>
                <button className="r-btn-ghost" onClick={() => setDeleteOpen(false)}>
                  Close
                </button>
              </div>
              <div className="r-mbody" style={{ textAlign: "center" }}>
                <div
                  className="r-flex"
                  style={{
                    width: 60,
                    height: 60,
                    margin: "0 auto",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isDark ? "rgba(220,38,38,0.18)" : "#fee2e2",
                    color: isDark ? "#fecaca" : "#dc2626",
                    borderRadius: 999,
                    border: `1px solid ${isDark ? "rgba(220,38,38,0.35)" : "transparent"}`,
                  }}
                >
                  <DeleteIcon />
                </div>
                <h3
                  style={{
                    fontWeight: 900,
                    color: isDark ? "#e5e7eb" : "#0f172a",
                    marginTop: 10,
                    fontSize: 18,
                  }}
                >
                  Delete {numSelected} record{numSelected > 1 ? "s" : ""}?
                </h3>
                <p className="r-muted" style={{ marginTop: 6 }}>
                  This is a soft-delete action.
                </p>
              </div>
              <div className="r-mfooter" style={{ justifyContent: "flex-end" }}>
                <button className="r-btn-ghost" onClick={() => setDeleteOpen(false)}>
                  Cancel
                </button>
                <button className="r-btn-primary r-btn-danger" onClick={handleDeleteSelectedRows}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ===================== ADD GOOD(S) POPUP (PORTALED) ===================== */}
      {addOpen && (
        <Portal>
          <div className="r-modal-dim">
            <div className="r-modal">
              <div className="r-mhdr">
                <h3 className="r-title" style={{ fontSize: 18 }}>
                  Add Good(s)
                </h3>
                <div className="seg" role="tablist" aria-label="Add goods mode">
                  <button
                    role="tab"
                    aria-selected={addTab === 0}
                    className={addTab === 0 ? "active" : ""}
                    onClick={() => setAddTab(0)}
                  >
                    Single
                  </button>
                  <button
                    role="tab"
                    aria-selected={addTab === 1}
                    className={addTab === 1 ? "active" : ""}
                    onClick={() => setAddTab(1)}
                  >
                    Multiple ({multi.length})
                  </button>
                </div>
              </div>

              <div className="r-mbody">
                {addTab === 0 ? (
                  <div className="ag-grid">
                    <div className="ag-field">
                      <label className="ag-label">Date</label>
                      <input
                        className="ag-input"
                        type="date"
                        value={single.date}
                        onChange={(e) => setSingle((s) => ({ ...s, date: e.target.value }))}
                      />
                    </div>

                    <div className="ag-field">
                      <label className="ag-label">Ingredient</label>
                      <Autocomplete
                        options={ingredients}
                        value={ingredients.find((i) => String(i.id) === String(single.ingredient)) || null}
                        onChange={(_, val) => setSingle((s) => ({ ...s, ingredient: val ? val.id : "" }))}
                        getOptionLabel={(opt) => (typeof opt === "string" ? opt : (opt?.name ?? ""))}
                        isOptionEqualToValue={(opt, val) => (opt?.id ?? opt) === (val?.id ?? val)}
                        loading={loadingMaster || loadingCustom}
                        slotProps={{ popper: { sx: { zIndex: 10020 } } }}
                        componentsProps={{ popper: { sx: { zIndex: 10020 } } }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Search ingredients…"
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {(loadingMaster || loadingCustom) && <CircularProgress size={18} />}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
                          />
                        )}
                      />
                      <div style={{ textAlign: "right", marginTop: 8 }}>
                        <button className="r-btn-ghost" onClick={() => handleOpenAddIngredient({ mode: "single" })}>
                          Add Ingredient +
                        </button>
                      </div>
                    </div>

                    <div className="ag-field">
                      <label className="ag-label">Invoice Number</label>
                      <input
                        className="ag-input"
                        type="text"
                        value={single.invoiceNumber}
                        onChange={(e) => setSingle((s) => ({ ...s, invoiceNumber: e.target.value }))}
                      />
                    </div>

                    <div className="ag-field">
                      <label className="ag-label">Supplier</label>
                      <input
                        className="ag-input"
                        type="text"
                        value={single.supplier}
                        onChange={(e) => setSingle((s) => ({ ...s, supplier: e.target.value }))}
                      />
                    </div>

                    <div className="ag-field-1">
                      <label className="ag-label">Stock Received</label>
                      <input
                        className="ag-input"
                        type="number"
                        value={single.stockReceived}
                        onChange={(e) => setSingle((s) => ({ ...s, stockReceived: e.target.value }))}
                      />
                    </div>

                    <div className="ag-field-1">
                      <label className="ag-label">Unit</label>
                      <select
                        className="ag-select"
                        value={single.unit}
                        onChange={(e) => setSingle((s) => ({ ...s, unit: e.target.value }))}
                      >
                        {unitOptions.map((u) => (
                          <option key={u.value} value={u.value}>
                            {u.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="ag-field">
                      <label className="ag-label">Batch Code</label>
                      <input
                        className="ag-input"
                        type="text"
                        value={single.barCode}
                        onChange={(e) => setSingle((s) => ({ ...s, barCode: e.target.value }))}
                      />
                    </div>

                    <div className="ag-field">
                      <label className="ag-label">Expiry Date</label>
                      <input
                        className="ag-input"
                        type="date"
                        value={single.expiryDate}
                        onChange={(e) => setSingle((s) => ({ ...s, expiryDate: e.target.value }))}
                      />
                    </div>

                    <div className="ag-field">
                      <label className="ag-label">Temperature (℃)</label>
                      <input
                        className="ag-input"
                        type="text"
                        value={single.temperature}
                        onChange={(e) => setSingle((s) => ({ ...s, temperature: e.target.value }))}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 12 }}>
                    {multi.map((it, idx) => (
                      <div key={idx} className="ag-row">
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 8,
                          }}
                        >
                          <strong style={{ color: isDark ? "#e5e7eb" : "#0f172a" }}>Good {idx + 1}</strong>
                          <IconButton size="small" onClick={() => removeMultiRow(idx)}>
                            <DeleteIcon />
                          </IconButton>
                        </div>
                        <div className="ag-grid">
                          <div className="ag-field">
                            <label className="ag-label">Date</label>
                            <input
                              className="ag-input"
                              type="date"
                              value={it.date}
                              onChange={(e) =>
                                setMulti((arr) => arr.map((v, i) => (i === idx ? { ...v, date: e.target.value } : v)))
                              }
                            />
                          </div>

                          <div className="ag-field">
                            <label className="ag-label">Ingredient</label>
                            <Autocomplete
                              options={ingredients}
                              value={ingredients.find((i) => String(i.id) === String(it.ingredient)) || null}
                              onChange={(_, val) =>
                                setMulti((arr) =>
                                  arr.map((v, i) => (i === idx ? { ...v, ingredient: val ? val.id : "" } : v)),
                                )
                              }
                              getOptionLabel={(opt) => (typeof opt === "string" ? opt : (opt?.name ?? ""))}
                              isOptionEqualToValue={(opt, val) => (opt?.id ?? opt) === (val?.id ?? val)}
                              loading={loadingMaster || loadingCustom}
                              slotProps={{ popper: { sx: { zIndex: 10020 } } }}
                              componentsProps={{ popper: { sx: { zIndex: 10020 } } }}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  placeholder="Search ingredients…"
                                  InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                      <>
                                        {(loadingMaster || loadingCustom) && <CircularProgress size={18} />}
                                        {params.InputProps.endAdornment}
                                      </>
                                    ),
                                  }}
                                />
                              )}
                            />
                            <div style={{ textAlign: "right", marginTop: 8 }}>
                              <button
                                className="r-btn-ghost"
                                onClick={() => handleOpenAddIngredient({ mode: "multi", index: idx })}
                              >
                                Add Ingredient +
                              </button>
                            </div>
                          </div>

                          <div className="ag-field">
                            <label className="ag-label">Invoice Number</label>
                            <input
                              className="ag-input"
                              type="text"
                              value={it.invoiceNumber}
                              onChange={(e) =>
                                setMulti((arr) =>
                                  arr.map((v, i) => (i === idx ? { ...v, invoiceNumber: e.target.value } : v)),
                                )
                              }
                            />
                          </div>

                          <div className="ag-field">
                            <label className="ag-label">Supplier</label>
                            <input
                              className="ag-input"
                              type="text"
                              value={it.supplier}
                              onChange={(e) =>
                                setMulti((arr) =>
                                  arr.map((v, i) => (i === idx ? { ...v, supplier: e.target.value } : v)),
                                )
                              }
                            />
                          </div>

                          <div className="ag-field-1">
                            <label className="ag-label">Stock Received</label>
                            <input
                              className="ag-input"
                              type="number"
                              value={it.stockReceived}
                              onChange={(e) =>
                                setMulti((arr) =>
                                  arr.map((v, i) => (i === idx ? { ...v, stockReceived: e.target.value } : v)),
                                )
                              }
                            />
                          </div>

                          <div className="ag-field-1">
                            <label className="ag-label">Unit</label>
                            <select
                              className="ag-select"
                              value={it.unit}
                              onChange={(e) =>
                                setMulti((arr) => arr.map((v, i) => (i === idx ? { ...v, unit: e.target.value } : v)))
                              }
                            >
                              {unitOptions.map((u) => (
                                <option key={u.value} value={u.value}>
                                  {u.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="ag-field">
                            <label className="ag-label">Batch Code</label>
                            <input
                              className="ag-input"
                              type="text"
                              value={it.barCode}
                              onChange={(e) =>
                                setMulti((arr) =>
                                  arr.map((v, i) => (i === idx ? { ...v, barCode: e.target.value } : v)),
                                )
                              }
                            />
                          </div>

                          <div className="ag-field">
                            <label className="ag-label">Expiry Date</label>
                            <input
                              className="ag-input"
                              type="date"
                              value={it.expiryDate}
                              onChange={(e) =>
                                setMulti((arr) =>
                                  arr.map((v, i) => (i === idx ? { ...v, expiryDate: e.target.value } : v)),
                                )
                              }
                            />
                          </div>

                          <div className="ag-field">
                            <label className="ag-label">Temperature (℃)</label>
                            <input
                              className="ag-input"
                              type="text"
                              value={it.temperature}
                              onChange={(e) =>
                                setMulti((arr) =>
                                  arr.map((v, i) => (i === idx ? { ...v, temperature: e.target.value } : v)),
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <div>
                      <button className="r-btn-ghost" onClick={addMultiRow}>
                        <PlusIcon /> Add another
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="r-mfooter">
                <button className="r-btn-ghost" onClick={() => setAddOpen(false)}>
                  Cancel
                </button>
                <button className="r-btn-primary" onClick={handleAddSubmit}>
                  {addTab === 0 ? "Add Good" : `Add ${multi.length} Good(s)`}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Add Ingredient dialog */}
      <Dialog
        open={addIngOpen}
        onClose={() => {
          setAddIngOpen(false)
          setIngTarget(null)
        }}
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 14,
            border: `1px solid ${isDark ? "#1f2a44" : "#e5e7eb"}`,
            bgcolor: isDark ? "#0f172a" : "#fff",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: isDark ? "#e5e7eb" : "#0f172a" }}>Add New Ingredient</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Ingredient Name"
            fullWidth
            value={newIngredientName}
            onChange={(e) => setNewIngredientName(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#fff",
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setAddIngOpen(false)
              setIngTarget(null)
            }}
            disabled={addingIng}
            sx={{ textTransform: "none", fontWeight: 700, color: isDark ? "#94a3b8" : "#64748b" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddCustomIngredient}
            disabled={addingIng || !newIngredientName.trim()}
            variant="contained"
            sx={{
              textTransform: "none",
              fontWeight: 800,
              borderRadius: 999,
              px: 3,
              background: "linear-gradient(135deg, #7C3AED, #5B21B6)",
              "&:hover": { background: "#5B21B6" },
            }}
            startIcon={addingIng ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : null}
          >
            {addingIng ? "Adding…" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={2500}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setToastOpen(false)}
          severity="success"
          sx={{
            fontWeight: 700,
            borderRadius: 2,
            bgcolor: isDark ? "rgba(124,58,237,0.14)" : "#fff",
            color: isDark ? "#e5e7eb" : "inherit",
            border: `1px solid ${isDark ? "rgba(124,58,237,0.25)" : "rgba(229,231,235,1)"}`,
            "& .MuiAlert-icon": { color: "#7C3AED" },
          }}
        >
          Added successfully!
        </Alert>
      </Snackbar>
    </div>
  )
}
