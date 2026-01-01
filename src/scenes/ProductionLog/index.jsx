// src/scenes/HRP/ProductionLog/ProductionLog.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react"
import { createPortal } from "react-dom"
import { DataGrid } from "@mui/x-data-grid"
import ProductionLogForm from "../form/ProductionLog"
import { useAuth } from "../../contexts/AuthContext"

/* =========================================================================================
   Production Log — updated to match Goods In styling (Light + Dark)
   - Reads localStorage('theme-mode') + listens for window 'themeChanged'
   - Preserves all existing functionality (fetch, search/sort, pagination, edit, delete, record)
   - Keeps the original modal portal approach + ensures dropdowns render above modal

   ✅ NEW (frontend only):
   - "Use non-expired goods only" checkbox shown in Record Production modal.
   - Value is passed into the form as prop: avoidExpiredGoods (boolean)
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

    /* ✅ FIX: make header bg solid in dark mode (prevents light/white bleed) */
    --thead: ${isDark ? "#1e293b" : "#f8fafc"};

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
    color: var(--text2);
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

  .r-flex { display:flex; align-items:center; gap:12px; }

  .r-btn-ghost{
    display:inline-flex; align-items:center; gap:8px;
    padding:10px 16px;
    font-weight:600; font-size:14px;
    color:var(--text);
    border:1px solid var(--border);
    border-radius:8px;
    background:var(--card);
    cursor:pointer;
    box-shadow: var(--shadow-sm);
    transition: all 0.2s ease;
  }
  .r-btn-ghost:hover{
    background:var(--hover);
    border-color: var(--primary-light);
    transform: translateY(-1px);
    box-shadow: var(--shadow);
  }
  .r-btn-ghost:active{ transform: translateY(0); }
  .r-btn-ghost:disabled{ opacity:.55; cursor:not-allowed; transform:none; }

  .r-btn-primary{
    padding:10px 20px;
    font-weight:600; font-size:14px;
    color:#fff;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    border:0;
    border-radius:8px;
    box-shadow: 0 4px 6px -1px rgba(99,102,241,0.3), 0 2px 4px -1px rgba(99,102,241,0.2);
    cursor:pointer;
    transition: all 0.2s ease;
  }
  .r-btn-primary:hover{
    background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%);
    transform: translateY(-1px);
    box-shadow: 0 6px 10px -1px rgba(99,102,241,0.4), 0 4px 6px -1px rgba(99,102,241,0.3);
  }
  .r-btn-primary:active{ transform: translateY(0); }

  .r-btn-danger{
    background: linear-gradient(135deg, var(--danger) 0%, var(--danger2) 100%);
    box-shadow: 0 4px 6px -1px rgba(239,68,68,0.3), 0 2px 4px -1px rgba(239,68,68,0.2);
  }
  .r-btn-danger:hover{
    background: linear-gradient(135deg, #f87171 0%, var(--danger) 100%);
    box-shadow: 0 6px 10px -1px rgba(239,68,68,0.4), 0 4px 6px -1px rgba(239,68,68,0.3);
  }

  /* Toolbar */
  .r-toolbar{
    background: var(--card2);
    padding: 16px 20px;
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: var(--shadow-sm);
    display:flex; flex-wrap:wrap; gap:12px; align-items:center;
    color: var(--text2);
    margin: 16px 24px 0;
  }

  .r-input{
    min-width: 280px;
    flex:1;
    padding: 11px 14px;
    border:1px solid var(--border);
    border-radius:8px;
    outline:none;
    background: ${isDark ? "rgba(255,255,255,0.04)" : "#fff"};
    color: var(--text);
    font-size:14px;
    font-weight:500;
    transition: all 0.2s ease;
  }
  .r-input::placeholder{ color: var(--muted); }
  .r-input:focus{
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
    background: var(--card);
  }

  .r-select{
    padding: 11px 14px;
    border:1px solid var(--border);
    border-radius:8px;
    background: ${isDark ? "rgba(255,255,255,0.04)" : "#fff"};
    color: var(--text);
    font-size:14px;
    font-weight:500;
    cursor:pointer;
    transition: all 0.2s ease;
  }
  .r-select:focus{
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
    outline:none;
  }

  .r-toolbar-gap{ margin-top: 16px; }

  /* Footer */
  .r-footer{
    padding: 16px 24px;
    border-top: 1px solid var(--border);
    display:flex; align-items:center; justify-content:space-between;
    background: ${isDark ? "rgba(99,102,241,0.02)" : "rgba(99,102,241,0.01)"};
    color: var(--text2);
    font-size: 14px;
    font-weight: 500;
  }
  .r-muted{ color: var(--muted); font-size: 13px; font-weight: 500; }

  /* Layout */
  .gi-layout{ display:flex; gap:24px; align-items:flex-start; }
  .gi-main{ flex: 1 1 0%; min-width:0; }
  .gi-side{ width:340px; flex-shrink:0; display:flex; flex-direction:column; gap:20px; }

  .gi-card{
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: var(--shadow);
    padding: 20px;
    color: var(--text2);
  }
  .gi-card h3{
    margin:0 0 16px 0;
    font-size:16px;
    font-weight:700;
    color: var(--text);
    letter-spacing:-0.01em;
  }
  .gi-card strong{ color: var(--text); font-weight:700; }

  /* ✅ Checkbox row (used in Record Production modal) */
  .r-check{
    display:flex;
    align-items:flex-start;
    gap:10px;
    padding: 12px 14px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--mutedCard);
    box-shadow: var(--shadow-sm);
  }
  .r-check input[type="checkbox"]{
    margin-top: 3px;
    width: 18px;
    height: 18px;
    accent-color: var(--primary);
    cursor: pointer;
  }
  .r-check-title{
    font-weight: 800;
    color: var(--text);
    font-size: 14px;
    line-height: 1.2;
  }
  .r-check-sub{
    margin-top: 4px;
    color: var(--muted);
    font-size: 13px;
    font-weight: 500;
  }

  /* DataGrid container */
  .dg-wrap{
    height: 70vh;
    min-width: 750px;
    padding: 0 24px 16px;
  }

  /* DataGrid theme */
  .dg-wrap .MuiDataGrid-root{
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    font-size: 14px;
    color: var(--text2);
    background: var(--card);
    box-shadow: var(--shadow-sm);
  }

  /* ✅ FIX: force ALL header-related containers to use thead background (prevents white bar in dark mode) */
  .dg-wrap .MuiDataGrid-topContainer,
  .dg-wrap .MuiDataGrid-columnHeaders,
  .dg-wrap .MuiDataGrid-columnHeadersInner,
  .dg-wrap .MuiDataGrid-columnHeaderRow,
  .dg-wrap .MuiDataGrid-columnHeader,
  .dg-wrap .MuiDataGrid-columnHeaderTitleContainer,
  .dg-wrap .MuiDataGrid-columnHeaderTitleContainerContent,
  .dg-wrap .MuiDataGrid-scrollbarFiller,
  .dg-wrap .MuiDataGrid-filler{
    background-color: var(--thead) !important;
  }

  .dg-wrap .MuiDataGrid-columnHeaders{
    border-bottom: 2px solid var(--border) !important;
  }
  .dg-wrap .MuiDataGrid-columnHeaderTitle,
  .dg-wrap .MuiDataGrid-sortIcon,
  .dg-wrap .MuiDataGrid-menuIcon,
  .dg-wrap .MuiDataGrid-iconButtonContainer{
    color: var(--muted) !important;
    font-weight: 700 !important;
    text-transform: uppercase;
    letter-spacing: .05em;
    font-size: 11px;
  }

  .dg-wrap .MuiDataGrid-cell{
    border-bottom: 1px solid var(--border);
    color: var(--text2);
  }
  .dg-wrap .MuiDataGrid-row:hover{
    background: var(--hover) !important;
  }
  .dg-wrap .MuiDataGrid-virtualScroller{
    background: transparent;
  }
  .dg-wrap .MuiCheckbox-root, .dg-wrap .MuiSvgIcon-root{
    color: ${isDark ? "#cbd5e1" : "#334155"};
  }

  /* Badge */
  .r-qty-badge{
    display:inline-block;
    padding: 4px 10px;
    border-radius: 6px;
    background: var(--chip);
    color: var(--primary);
    font-weight: 700;
    font-size: 13px;
  }

  /* Selection chip */
  .r-chip{
    background: var(--chip);
    border: 1px solid ${isDark ? "rgba(99,102,241,0.20)" : "transparent"};
    padding: 6px 10px;
    border-radius: 10px;
    display:flex; align-items:center; gap:10px;
  }

  /* Modals */
  .r-modal-dim{
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(4px);
    display:flex;
    align-items:center;
    justify-content:center;
    z-index: 9999;
    padding: 20px;
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }

  .r-modal{
    background: var(--card);
    border-radius: 16px;
    width: 100%;
    max-width: 920px;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: var(--shadow-lg);
    display:flex;
    flex-direction: column;
    z-index: 10000;
    border: 1px solid var(--border);
    animation: slideUp 0.3s ease;
  }
  @keyframes slideUp { from{opacity:0; transform: translateY(20px)} to{opacity:1; transform: translateY(0)} }

  .r-mhdr{
    padding: 20px 24px;
    border-bottom: 1px solid var(--border);
    display:flex;
    align-items:center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    background: ${isDark ? "rgba(99,102,241,0.03)" : "rgba(99,102,241,0.02)"};
  }
  .r-mbody{
    padding: 24px;
    overflow: auto;
    background: var(--card);
    color: var(--text2);
  }
  .r-mfooter{
    padding: 16px 24px;
    border-top: 1px solid var(--border);
    background: ${isDark ? "rgba(99,102,241,0.02)" : "rgba(99,102,241,0.01)"};
    display:flex;
    justify-content: flex-end;
    gap: 12px;
  }

  /* Form grid inside modal */
  .ag-grid{
    display:grid;
    gap: 16px;
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .ag-field{ grid-column: span 2; }
  .ag-field-1{ grid-column: span 1; }
  .ag-field-2{ grid-column: span 2; }
  .ag-field-4{ grid-column: span 4; }

  .ag-label{
    font-size: 13px;
    color: var(--text);
    font-weight: 600;
    margin-bottom: 8px;
    display:block;
    letter-spacing: -0.01em;
  }

  .ag-input, .ag-select{
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
  .ag-input::placeholder{ color: var(--muted); }
  .ag-input:focus, .ag-select:focus{
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
    background: var(--card);
  }

  /* Ensure native inputs/selects aren't clipped */
  .ag-select, .ag-input, select{ position: relative; z-index: 10001; }

  /* Dropdown stacking above modal */
  .MuiPopover-root,
  .MuiPopover-root .MuiPaper-root,
  .MuiMenu-root,
  .MuiMenu-paper,
  .MuiPopper-root,
  .MuiAutocomplete-popper,
  .MuiPickersPopper-root{
    z-index: 10020 !important;
  }
  .MuiModal-root,
  .MuiDialog-root,
  .MuiDrawer-root{
    z-index: 10010 !important;
  }

  @media (max-width: 1100px){
    .gi-layout{ flex-direction: column; }
    .gi-side{ width: 100%; }
    .dg-wrap{ min-width: 0; height: 65vh; padding: 0 0 16px; }
    .r-toolbar{ margin: 16px 0 0; }
  }
`}</style>
)

/* Icons (match Goods In style sizing) */
const Svg = (p) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" {...p} />
const EditIcon = (props) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </Svg>
)
const DeleteIcon = (props) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </Svg>
)

/* =========================================================================================
   Config & utils
   ========================================================================================= */
const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api"

const formatDateYMD = (val) => {
  if (!val) return ""
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) {
    const s = String(val)
    const m = s.match(/\d{4}-\d{2}-\d{2}/)
    return m ? m[0] : s
  }
  return d.toISOString().split("T")[0]
}

const getRowKey = (row) => String(row?.batchCode ?? row?.batch_code ?? row?.id ?? "")
const makeStableId = (row) => {
  if (!row) return null
  const key = getRowKey(row)
  if (key) return key
  const slug = `${row.recipe || "r"}|${row.date || "d"}|${row.producer_name || row.producerName || "p"}`
  return `gen-${slug.replace(/[^a-zA-Z0-9-_]/g, "-")}`
}

const toNumber = (v) => (v === "" || v === null || v === undefined ? 0 : Number(v) || 0)
const nf = (n) => new Intl.NumberFormat().format(n ?? 0)

const Portal = ({ children }) => {
  if (typeof window === "undefined") return null
  return createPortal(children, document.body)
}

/* =========================================================================================
   Component
   ========================================================================================= */
export default function ProductionLog() {
  const { cognitoId } = useAuth() || {}

  // Theme (sync with Topbar)
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme-mode") === "dark")
  useEffect(() => {
    const onThemeChanged = () => setIsDark(localStorage.getItem("theme-mode") === "dark")
    window.addEventListener("themeChanged", onThemeChanged)
    return () => window.removeEventListener("themeChanged", onThemeChanged)
  }, [])

  const [productionLogs, setProductionLogs] = useState([])
  const [recipesMap, setRecipesMap] = useState({})
  const [selectedRows, setSelectedRows] = useState([])
  const [fatalMsg, setFatalMsg] = useState("")

  // Search + sort
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState({ field: "date", dir: "desc" })

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false)
  const [editingRow, setEditingRow] = useState(null)
  const [updating, setUpdating] = useState(false)

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [openProductionForm, setOpenProductionForm] = useState(false)

  // ✅ NEW: frontend-only toggle for avoiding expired goods in allocation (backend later)
  const [avoidExpiredGoods, setAvoidExpiredGoods] = useState(true)

  // ===== Recipes map =====
  useEffect(() => {
    if (!cognitoId) return
    const run = async () => {
      try {
        const res = await fetch(`${API_BASE}/recipes?cognito_id=${encodeURIComponent(cognitoId)}`)
        if (!res.ok) throw new Error("Failed to fetch recipes")
        const data = await res.json()
        const map = {}
        ;(Array.isArray(data) ? data : []).forEach((r) => {
          const key = r.recipe_name ?? r.recipe ?? r.name ?? "unknown"
          map[key] = Number(r.units_per_batch) || 0
        })
        setRecipesMap(map)
      } catch (e) {
        console.error("Recipes fetch error:", e)
      }
    }
    run()
  }, [cognitoId])

  // ===== Fetch production logs =====
  const fetchLogs = useCallback(async () => {
    if (!cognitoId) {
      setFatalMsg("Missing cognito_id.")
      return
    }
    try {
      const res = await fetch(`${API_BASE}/production-log/active?cognito_id=${encodeURIComponent(cognitoId)}`)
      if (!res.ok) throw new Error(`Fetch failed (${res.status})`)
      const data = await res.json()
      if (!Array.isArray(data)) {
        setProductionLogs([])
        return
      }
      const sanitized = data.map((row) => {
        const dbId = row.id ?? row.ID ?? null
        const batchesProduced = toNumber(row.batchesProduced ?? row.batches_produced)
        const batchRemaining = toNumber(row.batchRemaining ?? row.batch_remaining)
        const unitsOfWaste = toNumber(row.units_of_waste ?? row.unitsOfWaste)
        const upb = recipesMap[row.recipe] ?? toNumber(row.units_per_batch)
        const unitsRemaining = toNumber(row.unitsRemaining ?? batchRemaining - unitsOfWaste)
        const batchesRemaining = upb > 0 ? unitsRemaining / upb : null
        const producerName = row.producer_name ?? row.producerName ?? ""

        const normalized = {
          id: String(dbId ?? row.batchCode ?? row.batch_code ?? makeStableId(row)),
          batchCode: row.batchCode ?? row.batch_code ?? null,
          recipe: row.recipe ?? "",
          date: formatDateYMD(row.date ?? null),
          batchesProduced,
          batchRemaining,
          unitsOfWaste,
          unitsRemaining,
          batchesRemaining,
          producerName,
          __raw: row,
        }
        normalized.id = String(normalized.batchCode ?? normalized.id)
        return normalized
      })
      setProductionLogs(sanitized)
      setFatalMsg("")
    } catch (e) {
      console.error("Production log fetch error:", e)
      setFatalMsg(String(e?.message || e))
    }
  }, [cognitoId, recipesMap])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // ===== Grid columns =====
  const columns = useMemo(
    () => [
      { field: "date", headerName: "Date", flex: 1 },
      { field: "recipe", headerName: "Recipe Name", flex: 1 },
      { field: "batchesProduced", headerName: "Batches Produced", type: "number", flex: 1, align: "left", headerAlign: "left" },
      { field: "unitsOfWaste", headerName: "Units of Waste", type: "number", flex: 1, align: "left", headerAlign: "left" },
      { field: "unitsRemaining", headerName: "Units Remaining", type: "number", flex: 1, align: "left", headerAlign: "left" },
      { field: "producerName", headerName: "Produced by", flex: 1, align: "left", headerAlign: "left" },
      { field: "batchCode", headerName: "Batch Code", flex: 1 },
      {
        field: "actions",
        headerName: "Actions",
        width: 140,
        sortable: false,
        filterable: false,
        align: "right",
        headerAlign: "right",
        renderCell: (params) => (
          <button
            className="r-btn-ghost"
            aria-label="Edit row"
            onClick={() => {
              setEditingRow(params.row)
              setEditOpen(true)
            }}
          >
            <EditIcon /> Edit
          </button>
        ),
      },
    ],
    [],
  )

  // ===== Search + sort (client-side) =====
  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let rows = [...productionLogs]
    if (q) rows = rows.filter((r) => Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(q)))

    const dir = sortBy.dir === "asc" ? 1 : -1
    rows.sort((a, b) => {
      const fa = a[sortBy.field] ?? ""
      const fb = b[sortBy.field] ?? ""
      if (typeof fa === "number" && typeof fb === "number") return (fa - fb) * dir
      return String(fa).localeCompare(String(fb)) * dir
    })
    return rows
  }, [productionLogs, searchQuery, sortBy])

  // ===== Sidebar Stats =====
  const stats = useMemo(() => {
    const totalUnitsRemaining = filteredRows.reduce((s, r) => s + toNumber(r.unitsRemaining), 0)
    const totalWaste = filteredRows.reduce((s, r) => s + toNumber(r.unitsOfWaste), 0)
    const totalBatchesProduced = filteredRows.reduce((s, r) => s + toNumber(r.batchesProduced), 0)
    const activeBatches = filteredRows.length
    const byRecipe = filteredRows.reduce((acc, r) => {
      const k = r.recipe || "Unknown"
      acc[k] = (acc[k] || 0) + toNumber(r.unitsRemaining)
      return acc
    }, {})
    const topRecipes = Object.entries(byRecipe)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([recipe, units]) => ({ recipe, units }))

    return { totalUnitsRemaining, totalWaste, totalBatchesProduced, activeBatches, topRecipes }
  }, [filteredRows])

  // ===== Update row (PUT) =====
  const processRowUpdate = async (updatedRow) => {
    if (!cognitoId) throw new Error("Missing cognitoId")

    const batchCodeForPath = updatedRow.batchCode || updatedRow.batch_code
    if (!batchCodeForPath) throw new Error("batchCode is required to update production_log")

    const dateYmd = formatDateYMD(updatedRow.date)
    const batchesProduced = toNumber(updatedRow.batchesProduced ?? updatedRow.batches_produced)
    const unitsOfWaste = toNumber(updatedRow.unitsOfWaste ?? updatedRow.units_of_waste)
    const unitsRemaining = toNumber(updatedRow.unitsRemaining)
    const batchRemaining = toNumber(updatedRow.batchRemaining ?? updatedRow.batch_remaining ?? unitsRemaining + unitsOfWaste)

    const payload = {
      date: dateYmd,
      recipe: updatedRow.recipe,
      batchesProduced,
      units_of_waste: unitsOfWaste,
      batchRemaining,
      unitsRemaining,
      producer_name: updatedRow.producerName ?? updatedRow.producer_name ?? "",
      cognito_id: cognitoId,
    }

    const url = `${API_BASE}/production-log/${encodeURIComponent(batchCodeForPath)}`
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const txt = await res.text().catch(() => "")
      throw new Error(txt || `Server returned ${res.status}`)
    }

    await fetchLogs()
  }

  const handleConfirmEdit = async () => {
    if (!editingRow) {
      setEditOpen(false)
      return
    }
    setUpdating(true)
    try {
      const patched = {
        ...editingRow,
        id: getRowKey(editingRow),
        batchCode: editingRow.batchCode ?? editingRow.batch_code,
        date: formatDateYMD(editingRow.date),
        recipe: editingRow.recipe ?? "",
        batchesProduced: toNumber(editingRow.batchesProduced),
        unitsOfWaste: toNumber(editingRow.unitsOfWaste),
        unitsRemaining: toNumber(editingRow.unitsRemaining),
        batchRemaining: toNumber(
          editingRow.batchRemaining ?? (toNumber(editingRow.unitsRemaining) + toNumber(editingRow.unitsOfWaste)),
        ),
        producerName: editingRow.producerName ?? "",
      }

      setProductionLogs((prev) => {
        const next = [...prev]
        const key = getRowKey(patched)
        const idx = next.findIndex((r) => getRowKey(r) === key)
        if (idx >= 0) next[idx] = { ...next[idx], ...patched }
        return next
      })

      await processRowUpdate(patched)
      setEditOpen(false)
      setEditingRow(null)
    } catch (e) {
      console.error("Edit failed:", e)
      alert(`Update failed: ${e?.message || e}`)
    } finally {
      setUpdating(false)
    }
  }

  // ===== Delete (soft) =====
  const handleDeleteSelectedRows = async () => {
    if (!cognitoId || selectedRows.length === 0) return
    const rowsToDelete = productionLogs.filter((r) => selectedRows.includes(getRowKey(r)))
    try {
      await Promise.all(
        rowsToDelete.map((row) =>
          fetch(`${API_BASE}/delete-production-log`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ batchCode: row.batchCode, cognito_id: cognitoId }),
          }).then(async (res) => {
            if (!res.ok) {
              const t = await res.text().catch(() => "")
              throw new Error(t || `Delete failed for ${row.batchCode}`)
            }
          }),
        ),
      )
      setProductionLogs((prev) => prev.filter((r) => !selectedRows.includes(getRowKey(r))))
      setSelectedRows([])
      setDeleteOpen(false)
    } catch (err) {
      console.error("Delete failed:", err)
      alert(`Delete failed: ${err?.message || err}`)
    }
  }

  // ===== Pagination =====
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const visibleRows = useMemo(() => {
    const start = page * rowsPerPage
    return filteredRows.slice(start, start + rowsPerPage)
  }, [filteredRows, page, rowsPerPage])

  const dangerCardStyle = {
    borderColor: isDark ? "rgba(220,38,38,0.55)" : "#fecaca",
    background: isDark ? "rgba(220,38,38,0.12)" : "#fff1f2",
    color: isDark ? "#fecaca" : "#b91c1c",
    marginBottom: 12,
  }

  return (
    <div className="r-wrap">
      <BrandStyles isDark={isDark} />

      {!cognitoId && (
        <div className="gi-card" style={dangerCardStyle}>
          <strong>Can’t load data:</strong> No cognito_id detected.
        </div>
      )}

      {fatalMsg && (
        <div className="gi-card" style={dangerCardStyle}>
          <strong>API error:</strong> {fatalMsg}
        </div>
      )}

      <div className="gi-layout">
        {/* MAIN TABLE */}
        <div className="gi-main">
          <div className="r-card">
            <div className="r-head">
              <div>
                <h2 className="r-title">Production Log</h2>
                <p className="r-sub">Track batches, waste and remaining units</p>
              </div>

              <div className="r-flex" style={{ marginLeft: "auto" }}>
                <button className="r-btn-primary" onClick={() => setOpenProductionForm(true)}>
                  + Record Production
                </button>

                {selectedRows.length > 0 && (
                  <div className="r-chip">
                    <span className="r-pill">{selectedRows.length} selected</span>
                    <button
                      className="r-btn-ghost"
                      onClick={() => setDeleteOpen(true)}
                      title="Delete selected"
                      style={{
                        color: isDark ? "#fecaca" : "#dc2626",
                        borderColor: isDark ? "rgba(220,38,38,0.35)" : "#fecaca",
                      }}
                    >
                      <DeleteIcon /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="r-toolbar">
              <input
                className="r-input"
                type="text"
                placeholder="Search by recipe, batch code, producer..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(0)
                }}
              />

              {!openProductionForm && (
                <select
                  className="r-select"
                  value={`${sortBy.field}:${sortBy.dir}`}
                  onChange={(e) => {
                    const [field, dir] = e.target.value.split(":")
                    setSortBy({ field, dir })
                    setPage(0)
                  }}
                >
                  <option value="date:desc">Date (new → old)</option>
                  <option value="date:asc">Date (old → new)</option>
                  <option value="recipe:asc">Recipe A→Z</option>
                  <option value="recipe:desc">Recipe Z→A</option>
                  <option value="unitsRemaining:desc">Units remaining (high → low)</option>
                  <option value="unitsRemaining:asc">Units remaining (low → high)</option>
                </select>
              )}
            </div>

            <div className="r-toolbar-gap dg-wrap">
              <DataGrid
                rows={visibleRows}
                columns={columns}
                getRowId={(row) => getRowKey(row)}
                checkboxSelection
                rowSelectionModel={selectedRows}
                onRowSelectionModelChange={(model) => {
                  const arr = Array.isArray(model) ? model.map((m) => String(m)) : []
                  setSelectedRows(arr)
                }}
                disableRowSelectionOnClick
                hideFooter
                onCellDoubleClick={(params) => {
                  setEditingRow(params.row)
                  setEditOpen(true)
                }}
                sx={{
                  border: 0,
                  "& .MuiDataGrid-columnSeparator": { display: "none" },
                  "& .MuiDataGrid-footerContainer": {
                    borderTop: `1px solid ${isDark ? "#1e2942" : "#e2e8f0"}`,
                  },

                  // ✅ FIX: cover header + sticky/top containers that sometimes keep a white background
                  "& .MuiDataGrid-topContainer, & .MuiDataGrid-columnHeaders, & .MuiDataGrid-columnHeader": {
                    backgroundColor: "var(--thead)",
                    color: "var(--muted)",
                    borderBottom: "2px solid var(--border)",
                  },
                  "& .MuiDataGrid-columnHeadersInner, & .MuiDataGrid-columnHeaderRow": {
                    backgroundColor: "var(--thead)",
                  },
                  "& .MuiDataGrid-scrollbarFiller, & .MuiDataGrid-filler": {
                    backgroundColor: "var(--thead)",
                  },

                  "& .MuiDataGrid-columnHeaderTitle": {
                    color: "var(--muted)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: ".05em",
                    fontSize: 11,
                  },
                  "& .MuiDataGrid-sortIcon, & .MuiDataGrid-menuIcon": { color: "var(--muted)" },
                }}
              />
            </div>

            <div className="r-footer">
              <span className="r-muted">
                Showing{" "}
                <strong style={{ color: "var(--text)" }}>{filteredRows.length === 0 ? 0 : page * rowsPerPage + 1}</strong>–
                <strong style={{ color: "var(--text)" }}>{Math.min((page + 1) * rowsPerPage, filteredRows.length)}</strong> of{" "}
                <strong style={{ color: "var(--text)" }}>{filteredRows.length}</strong>
              </span>

              <div className="r-flex">
                <button className="r-btn-ghost" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
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

                {!openProductionForm && (
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
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="gi-side">
          <div className="gi-card">
            <h3>Total Remaining (Units)</h3>
            <p style={{ fontSize: 34, fontWeight: 800, color: "var(--text)", margin: "6px 0 6px" }}>{nf(stats.totalUnitsRemaining)}</p>
            <p className="r-muted" style={{ margin: 0 }}>
              Based on current filters
            </p>
          </div>

          <div className="gi-card">
            <h3>Quick Stats</h3>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
              <span className="r-muted">Batches Produced</span>
              <strong>{nf(stats.totalBatchesProduced)}</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
              <span className="r-muted">Units of Waste</span>
              <strong>{nf(stats.totalWaste)}</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
              <span className="r-muted">Active Batches</span>
              <strong>{nf(stats.activeBatches)}</strong>
            </div>
          </div>

          <div className="gi-card">
            <h3>Top Recipes by Remaining</h3>

            {stats.topRecipes.length === 0 ? (
              <p className="r-muted">No data</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {stats.topRecipes.map((t) => (
                  <div key={t.recipe} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontWeight: 700, color: "var(--text)" }}>{t.recipe}</span>
                    <span className="r-qty-badge">{nf(t.units)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ===================== EDIT MODAL ===================== */}
      {editOpen && editingRow && (
        <Portal>
          <div className="r-modal-dim">
            <div className="r-modal">
              <div className="r-mhdr">
                <h3 className="r-title" style={{ fontSize: 18 }}>
                  Edit Production Log
                </h3>
                <button
                  className="r-btn-ghost"
                  onClick={() => {
                    setEditOpen(false)
                    setEditingRow(null)
                  }}
                >
                  Close
                </button>
              </div>

              <div className="r-mbody">
                <div className="ag-grid">
                  <div className="ag-field ag-field-4">
                    <label className="ag-label">Recipe</label>
                    <input
                      className="ag-input"
                      type="text"
                      value={editingRow.recipe ?? ""}
                      onChange={(e) => setEditingRow((prev) => ({ ...(prev || {}), recipe: e.target.value }))}
                    />
                  </div>

                  <div className="ag-field">
                    <label className="ag-label">Date</label>
                    <input
                      className="ag-input"
                      type="date"
                      value={formatDateYMD(editingRow.date ?? "")}
                      onChange={(e) => setEditingRow((prev) => ({ ...(prev || {}), date: formatDateYMD(e.target.value) }))}
                    />
                  </div>

                  <div className="ag-field ag-field-1">
                    <label className="ag-label">Batches Produced</label>
                    <input
                      className="ag-input"
                      type="number"
                      value={editingRow.batchesProduced ?? 0}
                      onChange={(e) => setEditingRow((prev) => ({ ...(prev || {}), batchesProduced: toNumber(e.target.value) }))}
                    />
                  </div>

                  <div className="ag-field ag-field-1">
                    <label className="ag-label">Units of Waste</label>
                    <input
                      className="ag-input"
                      type="number"
                      value={editingRow.unitsOfWaste ?? 0}
                      onChange={(e) => {
                        const unitsOfWaste = toNumber(e.target.value)
                        const unitsRemaining = toNumber(editingRow.unitsRemaining)
                        setEditingRow((prev) => ({ ...(prev || {}), unitsOfWaste, batchRemaining: unitsRemaining + unitsOfWaste }))
                      }}
                    />
                  </div>

                  <div className="ag-field ag-field-4">
                    <label className="ag-label">Units Remaining</label>
                    <input
                      className="ag-input"
                      type="number"
                      value={editingRow.unitsRemaining ?? 0}
                      onChange={(e) => {
                        const unitsRemaining = toNumber(e.target.value)
                        const unitsOfWaste = toNumber(editingRow.unitsOfWaste)
                        setEditingRow((prev) => ({ ...(prev || {}), unitsRemaining, batchRemaining: unitsRemaining + unitsOfWaste }))
                      }}
                    />
                  </div>

                  <div className="ag-field ag-field-2">
                    <label className="ag-label">Produced by (Name)</label>
                    <input
                      className="ag-input"
                      type="text"
                      value={editingRow.producerName ?? ""}
                      onChange={(e) => setEditingRow((prev) => ({ ...(prev || {}), producerName: e.target.value }))}
                    />
                  </div>

                  <div className="ag-field ag-field-2">
                    <label className="ag-label">Batch Code</label>
                    <input
                      className="ag-input"
                      type="text"
                      value={editingRow.batchCode ?? ""}
                      onChange={(e) => setEditingRow((prev) => ({ ...(prev || {}), batchCode: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="r-mfooter">
                <button
                  className="r-btn-ghost"
                  onClick={() => {
                    setEditOpen(false)
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

      {/* ===================== DELETE CONFIRM MODAL ===================== */}
      {deleteOpen && selectedRows.length > 0 && (
        <Portal>
          <div className="r-modal-dim">
            <div className="r-modal" style={{ maxWidth: 420 }}>
              <div className="r-mhdr">
                <h3 className="r-title" style={{ fontSize: 18 }}>
                  Confirm Deletion
                </h3>
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

                <h3 style={{ fontWeight: 900, color: "var(--text)", marginTop: 10, fontSize: 18 }}>
                  Delete {selectedRows.length} record{selectedRows.length > 1 ? "s" : ""}?
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

      {/* ===================== RECORD PRODUCTION MODAL ===================== */}
      {openProductionForm && (
        <Portal>
          <div className="r-modal-dim">
            <div className="r-modal">
              <div className="r-mhdr">
                <h3 className="r-title" style={{ fontSize: 18 }}>
                  Record Production
                </h3>
                <button className="r-btn-ghost" onClick={() => setOpenProductionForm(false)}>
                  Close
                </button>
              </div>

              <div className="r-mbody">
                {/* ✅ NEW: toggle (frontend only) */}
                <label className="r-check" style={{ marginBottom: 16 }}>
                  <input
                    type="checkbox"
                    checked={!!avoidExpiredGoods}
                    onChange={(e) => setAvoidExpiredGoods(e.target.checked)}
                  />
                  <div>
                    <div className="r-check-title">Use non-expired goods only</div>
                    <div className="r-check-sub">
                      When enabled, batches should be created using stock that hasn’t expired (backend logic coming next).
                    </div>
                  </div>
                </label>

                <ProductionLogForm
                  cognitoId={cognitoId}
                  avoidExpiredGoods={avoidExpiredGoods}  // ✅ pass into single + multiple batch form (frontend only for now)
                  onSubmitted={() => {
                    fetchLogs()
                    setOpenProductionForm(false)
                  }}
                  formId="production-log-form"
                />
              </div>

              <div className="r-mfooter" style={{ justifyContent: "flex-end" }}>
                <button className="r-btn-primary" type="submit" form="production-log-form">
                  Record Production
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}
