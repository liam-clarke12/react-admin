// src/scenes/goodsout/GoodsOut.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react"
import { createPortal } from "react-dom"
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  TextField,
  Divider,
  Card,
  CardContent,
  ListItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert,
} from "@mui/material"
import { DataGrid } from "@mui/x-data-grid"
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined"
import CheckRoundedIcon from "@mui/icons-material/CheckRounded"
import DeleteIcon from "@mui/icons-material/Delete"
import CloseIcon from "@mui/icons-material/Close"
import AddIcon from "@mui/icons-material/Add"
import { useAuth } from "../../contexts/AuthContext"
import * as yup from "yup"
import { Formik, FieldArray } from "formik"

/* =========================================================================================
   Brand Styles (Light + Dark) — matches GoodsIn styling
   - Reads localStorage('theme-mode') + listens for window 'themeChanged'
   - ✅ NEW: checkbox styling (r-check) to match Production Log
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

    /* ✅ FIX: use a SOLID header background in dark mode to prevent white/ghost bars */
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
  .r-btn-ghost:active { transform: translateY(0); }

  .r-btn-primary {
    display:inline-flex; align-items:center; gap:8px;
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
  .r-btn-primary:active { transform: translateY(0); }

  .r-btn-danger { 
    background: linear-gradient(135deg, var(--danger) 0%, var(--danger2) 100%);
    box-shadow: 0 4px 6px -1px rgba(239,68,68,0.3), 0 2px 4px -1px rgba(239,68,68,0.2);
  }
  .r-btn-danger:hover { 
    background: linear-gradient(135deg, #f87171 0%, var(--danger) 100%);
    box-shadow: 0 6px 10px -1px rgba(239,68,68,0.4), 0 4px 6px -1px rgba(239,68,68,0.3);
  }

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
    margin: 16px 24px 0;
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
  .r-input::placeholder { color: var(--muted); }
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

  .r-toolbar-gap { margin-top: 16px; }

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
    gap: 12px;
    flex-wrap: wrap;
  }

  .r-muted { 
    color: var(--muted); 
    font-size: 13px;
    font-weight: 500;
  }

  .gi-layout { display:flex; gap:24px; align-items:flex-start; }
  .gi-main { flex:1 1 0%; min-width:0; }
  .gi-side { width:340px; flex-shrink:0; display:flex; flex-direction:column; gap:20px; }

  .gi-card{
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: var(--shadow);
    padding: 20px;
    color: var(--text2);
  }
  .gi-card h3{
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 700;
    color: var(--text);
    letter-spacing: -0.01em;
  }
  .gi-card strong{ color: var(--text); font-weight: 700; }

  /* ✅ Checkbox row (same component as Production Log) */
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

  /* Modal (matches GoodsIn) */
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
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

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
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
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
  .r-mbody { padding: 24px; overflow: auto; background: var(--card); color: var(--text2); }
  .r-mfooter { 
    padding: 16px 24px; 
    border-top: 1px solid var(--border); 
    background: ${isDark ? "rgba(99,102,241,0.02)" : "rgba(99,102,241,0.01)"};
    display: flex; 
    justify-content: flex-end; 
    gap: 12px;
  }

  /* Segmented control (matches GoodsIn) */
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

  /* Form grid (matches GoodsIn ag-*) */
  .ag-grid { 
    display: grid; 
    gap: 16px; 
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .ag-field { grid-column: span 2; }
  .ag-field-1 { grid-column: span 1; }
  .ag-field-4 { grid-column: span 4; }

  @media (max-width: 900px){
    .ag-grid{ grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .ag-field, .ag-field-1, .ag-field-4 { grid-column: span 2; }
    .gi-layout{ flex-direction: column; }
    .gi-side{ width: 100%; }
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
  .ag-input::placeholder { color: var(--muted); }
  .ag-input:focus, .ag-select:focus { 
    border-color: var(--primary); 
    box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
    background: var(--card);
  }
  .ag-error{ color: #ef4444; font-size: 12px; margin-top: 6px; font-weight: 600; }

  .ag-row { 
    border: 1px solid var(--border); 
    border-radius: 10px; 
    padding: 16px; 
    background: var(--card); 
    color: var(--text2);
    margin-bottom: 12px;
  }
  .ag-row:nth-child(odd){ background: ${isDark ? "rgba(255,255,255,0.02)" : "#f9fafb"}; }

  /* DataGrid */
  .dg-wrap { height: 70vh; min-width: 750px; padding: 0 24px 16px; }
  .dg-wrap .MuiDataGrid-root { border:0; background: transparent; }

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
    border-bottom:1px solid var(--border) !important;
  }

  .dg-wrap .MuiDataGrid-columnHeaderTitle,
  .dg-wrap .MuiDataGrid-sortIcon,
  .dg-wrap .MuiDataGrid-menuIcon,
  .dg-wrap .MuiDataGrid-iconButtonContainer{
    color: var(--muted) !important;
    font-weight: 800 !important;
    text-transform: uppercase;
    letter-spacing: .05em;
    font-size: 11px;
  }

  .dg-wrap .MuiDataGrid-cell{
    border-bottom:1px solid var(--border);
    color: var(--text2);
    font-weight: 500;
  }
  .dg-wrap .MuiCheckbox-root, .dg-wrap .MuiSvgIcon-root{
    color: ${isDark ? "#cbd5e1" : "#475569"};
  }

  .go-drawer-meta { opacity: 0.95; }
  `}</style>
)

/* =========================================================================================
   Config + Validation
   ========================================================================================= */
const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api"

const goodsOutSchema = yup.object().shape({
  date: yup.string().required("Date is required"),
  recipe: yup.string().required("Recipe is required"),
  stockAmount: yup.number().typeError("Must be a number").positive("Must be positive").required("Amount is required"),
  recipients: yup.string().required("Recipient is required"),
})

const multiGoodsOutSchema = yup.object().shape({
  items: yup.array().of(goodsOutSchema).min(1, "You must add at least one row"),
})

/* Fetch available units from Production Log */
const useAvailableUnitsFetcher = (cognitoId) => {
  return useCallback(
    async (recipeName) => {
      if (!cognitoId || !recipeName) return 0
      try {
        const res = await fetch(`${API_BASE}/production-log/active?cognito_id=${encodeURIComponent(cognitoId)}`)
        if (!res.ok) throw new Error("Failed to fetch production log")

        const rows = await res.json()
        let total = 0

        ;(Array.isArray(rows) ? rows : []).forEach((r) => {
          const rName = r.recipe ?? r.recipe_name ?? r.name ?? ""
          if ((rName || "").trim() !== recipeName.trim()) return

          const br = Number(r.batchRemaining ?? r.batch_remaining ?? r.units_per_batch_total ?? 0)
          const waste = Number(r.units_of_waste ?? r.unitsOfWaste ?? 0)
          const out = Number(r.units_out ?? r.unitsOut ?? 0)
          const apiUnits = Number(r.units_remaining ?? r.unitsRemaining ?? NaN)

          const remain = Number.isFinite(apiUnits) ? apiUnits : Math.max(0, br - waste - out)
          if (Number.isFinite(remain)) total += remain
        })

        return total
      } catch (err) {
        console.error("[AvailCheck] failed:", err)
        return 0
      }
    },
    [cognitoId],
  )
}

/* =========================================================================================
   Helpers
   ========================================================================================= */
const nf = (n) => new Intl.NumberFormat().format(n ?? 0)

const safeParse = (val, fallback) => {
  if (val == null) return fallback
  if (Array.isArray(val) || (typeof val === "object" && val !== null)) return val
  if (typeof val === "string") {
    try {
      const trimmed = val.trim()
      if (!trimmed) return fallback
      const p = JSON.parse(trimmed)
      return p ?? fallback
    } catch {
      return fallback
    }
  }
  return fallback
}

const formatToYYYYMMDD = (val) => {
  if (!val) return ""
  try {
    const d = new Date(val)
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  } catch {}
  const m = String(val).match(/\d{4}-\d{2}-\d{2}/)
  return m ? m[0] : String(val).slice(0, 10)
}

const normalizeRowPairs = (row) => {
  const rawCodes = row.batchcodes ?? row.batchCodes ?? row.codes ?? row.batch_codes
  const rawQty = row.quantitiesUsed ?? row.quantities ?? row.batchesUsed ?? row.quantities_used

  const codes = safeParse(rawCodes, [])
  const qty = safeParse(rawQty, [])

  const out = []

  if (Array.isArray(codes) && codes.length) {
    codes.forEach((c, i) => {
      const code = typeof c === "string" ? c : c?.code || c?.batchCode || `Batch ${i + 1}`
      const units = Number((Array.isArray(qty) ? qty[i] : qty?.[code]) ?? c?.units ?? c?.qty ?? 0)
      out.push({ code, units })
    })
    return out
  }

  if (codes && typeof codes === "object") {
    Object.entries(codes).forEach(([code, units]) => {
      out.push({ code, units: Number(units) || 0 })
    })
    return out
  }

  if (Array.isArray(qty)) {
    return qty.map((u, i) => ({ code: `Batch ${i + 1}`, units: Number(u) || 0 }))
  }

  return []
}

const buildDrawerItems = (row) =>
  normalizeRowPairs(row).map((it) => ({
    ...it,
    unitsLabel: `${nf(it.units)} units`,
  }))

/* Drawer Portal */
const Portal = ({ children }) => (typeof window === "undefined" ? null : createPortal(children, document.body))

/* =========================================================================================
   HARD BLOCK MODAL (NO PROCEED) — styled like GoodsIn modal
   ========================================================================================= */
const HardBlockModal = ({ open, recipe, need, have, onClose, isDark }) => {
  if (!open) return null

  return createPortal(
    <div className="r-modal-dim" onClick={onClose}>
      <div className="r-modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="r-mhdr">
          <h3 className="r-title" style={{ fontSize: 18 }}>
            Insufficient Finished Units
          </h3>
          <button className="r-btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="r-mbody">
          <div
            className="gi-card"
            style={{
              padding: 14,
              marginBottom: 14,
              borderColor: isDark ? "rgba(239,68,68,0.55)" : "#fecaca",
              background: isDark ? "rgba(239,68,68,0.12)" : "#fff1f2",
              color: isDark ? "#fecaca" : "#b91c1c",
              boxShadow: "none",
            }}
          >
            You’re trying to send out more <strong>{recipe}</strong> units than are currently available.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="gi-card" style={{ padding: 14, boxShadow: "none" }}>
              <div className="r-muted" style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>
                Requested
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>{need}</div>
            </div>
            <div className="gi-card" style={{ padding: 14, boxShadow: "none" }}>
              <div className="r-muted" style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>
                Available
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>{have}</div>
            </div>
          </div>

          <p style={{ marginTop: 12, fontSize: 14, color: "var(--text2)", fontWeight: 600 }}>
            Please produce more <strong>{recipe}</strong> before recording these goods out.
          </p>
        </div>

        <div className="r-mfooter">
          <button className="r-btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/* =========================================================================================
   EXPIRY NOTICE MODAL (frontend-only)
   - Shows when "Use non-expired goods only" is ON
   - Backend will enforce later; this is a clear user-facing warning
   ========================================================================================= */
const ExpiryNoticeModal = ({ open, onClose, isDark }) => {
  if (!open) return null

  return createPortal(
    <div className="r-modal-dim" onClick={onClose}>
      <div className="r-modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="r-mhdr">
          <h3 className="r-title" style={{ fontSize: 18 }}>
            Non-Expired Goods Only
          </h3>
          <button className="r-btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="r-mbody">
          <div
            className="gi-card"
            style={{
              padding: 14,
              marginBottom: 14,
              borderColor: isDark ? "rgba(245,158,11,0.45)" : "rgba(245,158,11,0.35)",
              background: isDark ? "rgba(245,158,11,0.10)" : "rgba(255,247,237,1)",
              color: isDark ? "#fde68a" : "#92400e",
              boxShadow: "none",
            }}
          >
            This checkbox will ensure your goods-out is allocated only against <strong>non-expired production batches</strong>.
            <br />
            <span style={{ opacity: 0.9 }}>
              Backend enforcement is coming next — for now this is a front-end flag that will be sent with the request.
            </span>
          </div>

          <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text2)", fontWeight: 600, fontSize: 14, lineHeight: 1.55 }}>
            <li>When enabled, the system should exclude batches with an expiry date before the goods-out date.</li>
            <li>If stock can’t be satisfied using non-expired batches, the backend will hard-block (later).</li>
          </ul>
        </div>

        <div className="r-mfooter">
          <button className="r-btn-primary" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/* =========================================================================================
   MAIN COMPONENT
   ========================================================================================= */
export default function GoodsOut() {
  const { cognitoId } = useAuth()

  // Theme (sync with Topbar)
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme-mode") === "dark")
  useEffect(() => {
    const onThemeChanged = () => setIsDark(localStorage.getItem("theme-mode") === "dark")
    window.addEventListener("themeChanged", onThemeChanged)
    return () => window.removeEventListener("themeChanged", onThemeChanged)
  }, [])

  /* ===========================
     Form Modal State
  ============================ */
  const [formOpen, setFormOpen] = useState(false)
  const [formView, setFormView] = useState("single") // single | multiple

  const [recipes, setRecipes] = useState([])
  const [recipesLoading, setRecipesLoading] = useState(false)
  const [recipesError, setRecipesError] = useState("")

  const [toastOpen, setToastOpen] = useState(false)

  const [blockOpen, setBlockOpen] = useState(false)
  const [blockInfo, setBlockInfo] = useState({ recipe: "", need: 0, have: 0 })

  // ✅ NEW: expiry checkbox state (frontend only)
  const [avoidExpiredGoods, setAvoidExpiredGoods] = useState(true)
  const [expiryNoticeOpen, setExpiryNoticeOpen] = useState(false)

  const fetchAvailableUnits = useAvailableUnitsFetcher(cognitoId)

  const [goodsOut, setGoodsOut] = useState([])
  const [fatalMsg, setFatalMsg] = useState("")

  const [selectedRows, setSelectedRows] = useState([])
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerItems, setDrawerItems] = useState([])
  const [drawerHeader, setDrawerHeader] = useState("")
  const [selectedRow, setSelectedRow] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")

  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState({ field: "date", dir: "desc" })
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  /* Fetch recipes for select dropdown */
  useEffect(() => {
    if (!cognitoId) return
    const loadRecipes = async () => {
      setRecipesLoading(true)
      setRecipesError("")

      try {
        const res = await fetch(`${API_BASE}/recipes?cognito_id=${encodeURIComponent(cognitoId)}`)
        if (!res.ok) throw new Error("Failed to load recipes")
        const data = await res.json()

        const names = Array.isArray(data) ? data.map((r) => r.recipe_name ?? r.recipe ?? r.name).filter(Boolean) : []

        setRecipes([...new Set(names)])
      } catch (err) {
        console.error("Recipe load error:", err)
        setRecipesError("Error loading recipes")
      } finally {
        setRecipesLoading(false)
      }
    }

    loadRecipes()
  }, [cognitoId])

  /* Fetch goods-out list */
  const fetchGoodsOut = useCallback(async () => {
    if (!cognitoId) return setFatalMsg("Missing cognito_id.")

    try {
      const res = await fetch(`${API_BASE}/goods-out?cognito_id=${encodeURIComponent(cognitoId)}`)
      if (!res.ok) throw new Error("Failed to fetch goods out")

      const raw = await res.json()
      const arr = Array.isArray(raw) ? raw : []

      const norm = arr.map((r, idx) => {
        const stockAmount = Number(r.stockAmount ?? r.stock_amount ?? r.unitsOut ?? r.units_out ?? r.units ?? r.qty ?? 0)

        const recipe = r.recipe ?? r.recipe_name ?? r.product ?? r.product_name ?? "Unknown"
        const recipients = r.recipients ?? r.customer ?? r.client ?? r.destination ?? ""

        const date = formatToYYYYMMDD(r.date ?? r.production_log_date ?? r.created_at ?? r.createdAt) || ""

        return {
          ...r,
          id: r.id ?? `${recipe}-${idx}`,
          stockAmount,
          recipe,
          recipients,
          date,
        }
      })

      setGoodsOut(norm)
      setFatalMsg("")
    } catch (err) {
      console.error("[GoodsOut] fetch failed:", err)
      setFatalMsg(String(err.message || err))
    }
  }, [cognitoId])

  useEffect(() => {
    fetchGoodsOut()
  }, [fetchGoodsOut])

  /* ===============================
     Submit — SINGLE
  =============================== */
  const handleSubmitSingle = async (values, helpers) => {
    const need = Number(values.stockAmount) || 0
    const have = await fetchAvailableUnits(values.recipe)

    if (need > have) {
      setBlockInfo({ recipe: values.recipe, need, have })
      setBlockOpen(true)
      return
    }

    try {
      // ✅ send flag (backend will enforce later)
      const payload = { ...values, cognito_id: cognitoId, avoidExpiredGoods }

      const res = await fetch(`${API_BASE}/add-goods-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        console.error("[add-goods-out] failed:", res.status, txt)
        throw new Error(txt || "Submit failed")
      }

      helpers.resetForm()
      setFormOpen(false)
      setToastOpen(true)
      await fetchGoodsOut()
    } catch (err) {
      alert("Submission failed. Check console.")
      console.error(err)
    }
  }

  /* ===============================
     Submit — MULTIPLE
  =============================== */
  const handleSubmitBatch = async (values, helpers) => {
    const items = values.items || []

    // aggregate needs
    const needMap = {}
    items.forEach((item) => {
      const r = item.recipe?.trim()
      if (!r) return
      needMap[r] = (needMap[r] || 0) + Number(item.stockAmount || 0)
    })

    // HARD precheck (total available units; expiry filtering will be backend later)
    for (const [recipe, need] of Object.entries(needMap)) {
      const have = await fetchAvailableUnits(recipe)
      if (need > have) {
        setBlockInfo({ recipe, need, have })
        setBlockOpen(true)
        return
      }
    }

    try {
      const payload = {
        entries: items.map((i) => ({
          date: i.date,
          recipe: i.recipe,
          stockAmount: i.stockAmount,
          recipients: i.recipients,
        })),
        cognito_id: cognitoId,

        // ✅ send top-level flag (backend later)
        avoidExpiredGoods,
      }

      const res = await fetch(`${API_BASE}/add-goods-out-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Batch submit failed")

      helpers.resetForm()
      setFormOpen(false)
      setToastOpen(true)
      await fetchGoodsOut()
    } catch (err) {
      console.error(err)
      alert("Batch submission failed.")
    }
  }

  /* =====================================================================
     FORM MODAL CONTENT (styled like GoodsIn)
     ===================================================================== */
  const renderFormModal = () => {
    if (!formOpen) return null

    return createPortal(
      <div className="r-modal-dim" onClick={() => setFormOpen(false)}>
        <div className="r-modal" onClick={(e) => e.stopPropagation()}>
          {/* HEADER */}
          <div className="r-mhdr">
            <h3 className="r-title" style={{ fontSize: 18 }}>
              Add Goods Out
            </h3>

            <div className="r-flex" style={{ gap: 10 }}>
              <div className="seg" role="tablist" aria-label="Goods out mode">
                <button
                  type="button"
                  role="tab"
                  aria-selected={formView === "single"}
                  className={formView === "single" ? "active" : ""}
                  onClick={() => setFormView("single")}
                >
                  Single
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={formView === "multiple"}
                  className={formView === "multiple" ? "active" : ""}
                  onClick={() => setFormView("multiple")}
                >
                  Multiple
                </button>
              </div>

              <button className="r-btn-ghost" onClick={() => setFormOpen(false)}>
                Close
              </button>
            </div>
          </div>

          {/* BODY */}
          <div className="r-mbody">
            {/* ✅ NEW: expiry checkbox (shared across single & multiple) */}
            <label className="r-check" style={{ marginBottom: 16 }}>
              <input
                type="checkbox"
                checked={!!avoidExpiredGoods}
                onChange={(e) => {
                  const next = e.target.checked
                  setAvoidExpiredGoods(next)
                  if (next) setExpiryNoticeOpen(true) // show info popup like Production Log
                }}
              />
              <div>
                <div className="r-check-title">Use non-expired goods only</div>
                <div className="r-check-sub">
                  When enabled, goods out should be allocated only from batches that haven’t expired (backend logic coming next).
                </div>
              </div>
            </label>

            {/* ===================== SINGLE FORM ===================== */}
            {formView === "single" && (
              <Formik
                initialValues={{
                  date: new Date().toISOString().split("T")[0],
                  recipe: "",
                  stockAmount: "",
                  recipients: "",
                }}
                validationSchema={goodsOutSchema}
                onSubmit={handleSubmitSingle}
              >
                {({ handleSubmit, values, errors, touched, handleChange, handleBlur }) => (
                  <form onSubmit={handleSubmit}>
                    <div className="ag-grid">
                      <div className="ag-field">
                        <label className="ag-label">Date</label>
                        <input
                          type="date"
                          name="date"
                          className="ag-input"
                          value={values.date}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                        {touched.date && errors.date && <div className="ag-error">{errors.date}</div>}
                      </div>

                      <div className="ag-field">
                        <label className="ag-label">Recipe</label>
                        <select
                          name="recipe"
                          className="ag-select"
                          value={values.recipe}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        >
                          <option value="" disabled>
                            {recipesLoading ? "Loading..." : recipesError ? recipesError : "Select recipe…"}
                          </option>
                          {recipes.map((r, idx) => (
                            <option key={idx} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                        {touched.recipe && errors.recipe && <div className="ag-error">{errors.recipe}</div>}
                      </div>

                      <div className="ag-field-4">
                        <label className="ag-label">Amount of Units</label>
                        <input
                          type="number"
                          className="ag-input"
                          name="stockAmount"
                          placeholder="0"
                          value={values.stockAmount}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                        {touched.stockAmount && errors.stockAmount && <div className="ag-error">{errors.stockAmount}</div>}
                      </div>

                      <div className="ag-field-4">
                        <label className="ag-label">Recipient</label>
                        <input
                          type="text"
                          className="ag-input"
                          name="recipients"
                          placeholder="Store / Customer"
                          value={values.recipients}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                        {touched.recipients && errors.recipients && <div className="ag-error">{errors.recipients}</div>}
                      </div>
                    </div>

                    <div className="r-mfooter">
                      <button type="button" className="r-btn-ghost" onClick={() => setFormOpen(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="r-btn-primary">
                        Submit
                      </button>
                    </div>
                  </form>
                )}
              </Formik>
            )}

            {/* ===================== MULTIPLE FORM ===================== */}
            {formView === "multiple" && (
              <Formik
                initialValues={{
                  items: [
                    {
                      date: new Date().toISOString().split("T")[0],
                      recipe: "",
                      stockAmount: "",
                      recipients: "",
                    },
                  ],
                }}
                validationSchema={multiGoodsOutSchema}
                onSubmit={handleSubmitBatch}
              >
                {({ values, errors, touched, handleChange, handleSubmit }) => (
                  <form onSubmit={handleSubmit}>
                    <FieldArray
                      name="items"
                      render={({ push, remove }) => (
                        <>
                          <div style={{ display: "grid", gap: 12 }}>
                            {values.items.map((item, idx) => {
                              const itemErrors = errors.items?.[idx] || {}
                              const itemTouched = touched.items?.[idx] || {}

                              return (
                                <div key={idx} className="ag-row">
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      marginBottom: 10,
                                    }}
                                  >
                                    <strong style={{ color: "var(--text)" }}>Goods Out {idx + 1}</strong>
                                    {values.items.length > 1 && (
                                      <button
                                        type="button"
                                        className="r-btn-ghost"
                                        onClick={() => remove(idx)}
                                        style={{
                                          padding: "8px 12px",
                                          color: isDark ? "#fecaca" : "#dc2626",
                                          borderColor: isDark ? "rgba(239,68,68,0.35)" : "#fecaca",
                                        }}
                                      >
                                        Remove
                                      </button>
                                    )}
                                  </div>

                                  <div className="ag-grid">
                                    <div className="ag-field">
                                      <label className="ag-label">Date</label>
                                      <input
                                        type="date"
                                        className="ag-input"
                                        name={`items[${idx}].date`}
                                        value={item.date}
                                        onChange={handleChange}
                                      />
                                      {itemTouched.date && itemErrors.date && <div className="ag-error">{itemErrors.date}</div>}
                                    </div>

                                    <div className="ag-field">
                                      <label className="ag-label">Recipe</label>
                                      <select
                                        className="ag-select"
                                        name={`items[${idx}].recipe`}
                                        value={item.recipe}
                                        onChange={handleChange}
                                      >
                                        <option value="" disabled>
                                          {recipesLoading ? "Loading..." : recipesError ? recipesError : "Select recipe…"}
                                        </option>
                                        {recipes.map((r, i) => (
                                          <option key={i} value={r}>
                                            {r}
                                          </option>
                                        ))}
                                      </select>
                                      {itemTouched.recipe && itemErrors.recipe && <div className="ag-error">{itemErrors.recipe}</div>}
                                    </div>

                                    <div className="ag-field-4">
                                      <label className="ag-label">Amount of Units</label>
                                      <input
                                        type="number"
                                        className="ag-input"
                                        name={`items[${idx}].stockAmount`}
                                        value={item.stockAmount}
                                        onChange={handleChange}
                                        placeholder="0"
                                      />
                                      {itemTouched.stockAmount && itemErrors.stockAmount && (
                                        <div className="ag-error">{itemErrors.stockAmount}</div>
                                      )}
                                    </div>

                                    <div className="ag-field-4">
                                      <label className="ag-label">Recipient</label>
                                      <input
                                        type="text"
                                        className="ag-input"
                                        name={`items[${idx}].recipients`}
                                        value={item.recipients}
                                        placeholder="Store / Customer"
                                        onChange={handleChange}
                                      />
                                      {itemTouched.recipients && itemErrors.recipients && (
                                        <div className="ag-error">{itemErrors.recipients}</div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          <div style={{ marginTop: 12 }}>
                            <button
                              type="button"
                              className="r-btn-ghost"
                              onClick={() =>
                                push({
                                  date: new Date().toISOString().split("T")[0],
                                  recipe: "",
                                  stockAmount: "",
                                  recipients: "",
                                })
                              }
                            >
                              + Add another row
                            </button>
                          </div>

                          <div className="r-mfooter">
                            <button type="button" className="r-btn-ghost" onClick={() => setFormOpen(false)}>
                              Cancel
                            </button>
                            <button type="submit" className="r-btn-primary">
                              Submit Multiple
                            </button>
                          </div>
                        </>
                      )}
                    />
                  </form>
                )}
              </Formik>
            )}
          </div>
        </div>
      </div>,
      document.body,
    )
  }

  /* Drawer open */
  const openDrawerForRow = (row) => {
    const rr = { ...row, date: formatToYYYYMMDD(row?.date) }
    setSelectedRow(rr)
    setDrawerHeader("Batchcodes")
    setDrawerItems(buildDrawerItems(rr))
    setSearchTerm("")
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setSelectedRow(null)
    setDrawerItems([])
  }

  /* Delete selected rows */
  const handleDelete = async () => {
    try {
      const map = new Map(goodsOut.map((r) => [String(r.id), r]))
      const ids = selectedRows
        .map((rid) => map.get(String(rid)))
        .filter(Boolean)
        .map((r) => r.id)
        .map(Number)
        .filter((n) => !Number.isNaN(n))

      if (!ids.length) {
        setDeleteOpen(false)
        return
      }

      const res = await fetch(`${API_BASE}/goods-out/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, cognito_id: cognitoId }),
      })

      if (!res.ok) throw new Error("Delete failed")

      await fetchGoodsOut()
      setSelectedRows([])
      setDeleteOpen(false)
    } catch (err) {
      console.error("Delete failed:", err)
      setDeleteOpen(false)
    }
  }

  /* DataGrid columns */
  const columns = useMemo(
    () => [
      { field: "date", headerName: "Date", flex: 1 },
      { field: "recipe", headerName: "Recipe Name", flex: 1 },
      { field: "stockAmount", headerName: "Units Out", type: "number", flex: 1 },
      {
        field: "batchcodes",
        headerName: "Batchcodes",
        flex: 1,
        renderCell: (params) => (
          <Typography
            sx={{
              cursor: "pointer",
              color: "var(--primary)",
              fontWeight: 700,
              "&:hover": { color: "var(--primary-dark)" },
            }}
            onClick={() => openDrawerForRow(params.row)}
          >
            Show Batchcodes
          </Typography>
        ),
      },
      { field: "recipients", headerName: "Recipients", flex: 1 },
    ],
    [],
  )

  /* Filter + sort */
  const filteredRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    let rows = [...goodsOut]

    if (q) {
      rows = rows.filter((r) => Object.values(r).some((v) => String(v).toLowerCase().includes(q)))
    }

    const dir = sortBy.dir === "asc" ? 1 : -1
    rows.sort((a, b) => {
      const fa = a[sortBy.field] ?? ""
      const fb = b[sortBy.field] ?? ""
      if (typeof fa === "number" || typeof fb === "number") return (Number(fa) - Number(fb)) * dir
      return String(fa).localeCompare(String(fb)) * dir
    })

    return rows
  }, [goodsOut, searchQuery, sortBy])

  const visibleRows = useMemo(() => {
    const start = page * rowsPerPage
    return filteredRows.slice(start, start + rowsPerPage)
  }, [filteredRows, page, rowsPerPage])

  /* Stats */
  const stats = useMemo(() => {
    const totalUnits = filteredRows.reduce((s, r) => s + (r.stockAmount || 0), 0)
    const shipments = filteredRows.length
    const uniq = (arr) => Array.from(new Set(arr.filter(Boolean))).length
    const uniqueRecipes = uniq(filteredRows.map((r) => r.recipe))
    const uniqueRecipients = uniq(filteredRows.map((r) => r.recipients))
    return { totalUnits, shipments, uniqueRecipes, uniqueRecipients }
  }, [filteredRows])

  return (
    <div className="r-wrap">
      <BrandStyles isDark={isDark} />

      {/* Form modal */}
      {renderFormModal()}

      {/* ✅ NEW: expiry notice popup */}
      <ExpiryNoticeModal open={expiryNoticeOpen} onClose={() => setExpiryNoticeOpen(false)} isDark={isDark} />

      {/* Hard block modal */}
      <HardBlockModal
        open={blockOpen}
        recipe={blockInfo.recipe}
        need={blockInfo.need}
        have={blockInfo.have}
        onClose={() => setBlockOpen(false)}
        isDark={isDark}
      />

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
            bgcolor: isDark ? "rgba(99,102,241,0.14)" : "#fff",
            color: isDark ? "#e5e7eb" : "inherit",
            border: `1px solid ${isDark ? "rgba(99,102,241,0.25)" : "rgba(229,231,235,1)"}`,
            "& .MuiAlert-icon": { color: "var(--primary)" },
          }}
        >
          Goods Out recorded successfully!
        </Alert>
      </Snackbar>

      {/* Errors */}
      {fatalMsg && (
        <div
          className="gi-card"
          style={{
            borderColor: isDark ? "rgba(239,68,68,0.55)" : "#fecaca",
            background: isDark ? "rgba(239,68,68,0.12)" : "#fff1f2",
            color: isDark ? "#fecaca" : "#b91c1c",
            marginBottom: 12,
          }}
        >
          <strong>API error:</strong> {fatalMsg}
        </div>
      )}

      {/* Layout */}
      <div className="gi-layout">
        {/* MAIN TABLE */}
        <div className="gi-main">
          <div className="r-card">
            {/* Header */}
            <div className="r-head">
              <div>
                <h2 className="r-title">Goods Out</h2>
                <p className="r-sub">Log of dispatched units with batchcode details</p>
              </div>

              <div className="r-flex">
                <button className="r-btn-primary" onClick={() => setFormOpen(true)}>
                  <AddIcon fontSize="small" /> Add Goods Out
                </button>

                {selectedRows.length > 0 && (
                  <button
                    className="r-btn-ghost"
                    onClick={() => setDeleteOpen(true)}
                    style={{
                      color: isDark ? "#fecaca" : "#dc2626",
                      borderColor: isDark ? "rgba(239,68,68,0.35)" : "#fecaca",
                    }}
                  >
                    <DeleteIcon fontSize="small" /> Delete
                  </button>
                )}
              </div>
            </div>

            {/* Toolbar */}
            <div className="r-toolbar">
              <input
                className="r-input"
                placeholder="Search..."
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
                  setPage(0)
                }}
              >
                <option value="date:desc">Date (new → old)</option>
                <option value="date:asc">Date (old → new)</option>
                <option value="recipe:asc">Recipe A→Z</option>
                <option value="recipe:desc">Recipe Z→A</option>
                <option value="stockAmount:desc">Units Out (high → low)</option>
                <option value="stockAmount:asc">Units Out (low → high)</option>
                <option value="recipients:asc">Recipients A→Z</option>
                <option value="recipients:desc">Recipients Z→A</option>
              </select>
            </div>

            {/* DataGrid */}
            <div className="r-toolbar-gap dg-wrap">
              <DataGrid
                rows={visibleRows}
                columns={columns}
                getRowId={(row) => row.id}
                checkboxSelection
                disableRowSelectionOnClick
                rowSelectionModel={selectedRows}
                onRowSelectionModelChange={(m) => setSelectedRows((Array.isArray(m) ? m : []).map(String))}
                hideFooter
                sx={{
                  border: 0,
                  "& .MuiDataGrid-columnSeparator": { display: "none" },
                  "& .MuiDataGrid-virtualScroller": { background: "transparent" },
                  "& .MuiDataGrid-footerContainer": { borderTop: `1px solid ${isDark ? "#1e2942" : "#e2e8f0"}` },

                  "& .MuiDataGrid-topContainer, & .MuiDataGrid-columnHeaders, & .MuiDataGrid-columnHeader": {
                    backgroundColor: "var(--thead)",
                  },
                  "& .MuiDataGrid-columnHeadersInner, & .MuiDataGrid-columnHeaderRow": { backgroundColor: "var(--thead)" },
                  "& .MuiDataGrid-scrollbarFiller, & .MuiDataGrid-filler": { backgroundColor: "var(--thead)" },
                }}
              />
            </div>

            {/* Footer */}
            <div className="r-footer">
              <span className="r-muted">
                Showing <strong>{filteredRows.length === 0 ? 0 : page * rowsPerPage + 1}</strong>–
                <strong>{Math.min((page + 1) * rowsPerPage, filteredRows.length)}</strong> of{" "}
                <strong>{filteredRows.length}</strong>
              </span>

              <div className="r-flex">
                <button className="r-btn-ghost" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                  Prev
                </button>

                <span className="r-muted">Page {page + 1}</span>

                <button
                  className="r-btn-ghost"
                  disabled={(page + 1) * rowsPerPage >= filteredRows.length}
                  onClick={() => setPage((p) => ((p + 1) * rowsPerPage < filteredRows.length ? p + 1 : p))}
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

        {/* RIGHT SIDEBAR */}
        <aside className="gi-side">
          <div className="gi-card">
            <h3>Total Units Out</h3>
            <div style={{ fontSize: 34, fontWeight: 800, color: "var(--text)", lineHeight: 1.1 }}>{nf(stats.totalUnits)}</div>
            <p className="r-muted" style={{ marginTop: 8 }}>
              Based on filtered data
            </p>
          </div>

          <div className="gi-card">
            <h3>Quick Stats</h3>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="r-muted">Shipments</span>
                <strong>{nf(stats.shipments)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="r-muted">Unique Recipes</span>
                <strong>{nf(stats.uniqueRecipes)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="r-muted">Unique Recipients</span>
                <strong>{nf(stats.uniqueRecipients)}</strong>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* DELETE CONFIRM MODAL (PORTALED) */}
      {deleteOpen && selectedRows.length > 0 && (
        <Portal>
          <div className="r-modal-dim" onClick={() => setDeleteOpen(false)}>
            <div className="r-modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
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
                    background: isDark ? "rgba(239,68,68,0.18)" : "#fee2e2",
                    color: isDark ? "#fecaca" : "#dc2626",
                    borderRadius: 999,
                    border: `1px solid ${isDark ? "rgba(239,68,68,0.35)" : "transparent"}`,
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
                  Delete {selectedRows.length} record{selectedRows.length > 1 ? "s" : ""}?
                </h3>

                <p className="r-muted" style={{ marginTop: 6 }}>
                  This is a soft delete.
                </p>
              </div>

              <div className="r-mfooter">
                <button className="r-btn-ghost" onClick={() => setDeleteOpen(false)}>
                  Cancel
                </button>
                <button className="r-btn-primary r-btn-danger" onClick={handleDelete}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* BATCHCODE DRAWER */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={closeDrawer}
        PaperProps={{
          sx: {
            width: 420,
            borderRadius: "20px 0 0 20px",
            border: `1px solid ${isDark ? "#1e2942" : "#e2e8f0"}`,
            backgroundColor: isDark ? "#151b2e" : "#fff",
            color: isDark ? "#f1f5f9" : "#0f172a",
            boxShadow: isDark ? "0 24px 48px rgba(0,0,0,0.55)" : "0 24px 48px rgba(15,23,42,0.12)",
          },
        }}
      >
        {/* HEADER */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
            color: "#fff",
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <MenuOutlinedIcon />
            <Box className="go-drawer-meta">
              <Typography variant="h6" fontWeight={900}>
                {drawerHeader}
              </Typography>
              <Typography variant="caption">
                {selectedRow?.recipe} · {selectedRow?.date}
              </Typography>
            </Box>
          </Box>

          <IconButton onClick={closeDrawer} sx={{ color: "#fff" }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* CONTENT */}
        <Box sx={{ p: 2 }}>
          <Card
            variant="outlined"
            sx={{
              borderColor: isDark ? "#1e2942" : "#e2e8f0",
              backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "#fff",
              color: isDark ? "#f1f5f9" : "#0f172a",
              borderRadius: 2,
              mb: 2,
              boxShadow: "none",
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Typography fontSize={12} color={isDark ? "rgba(148,163,184,0.95)" : "#64748b"} fontWeight={900}>
                Recipient
              </Typography>
              <Typography fontWeight={900}>{selectedRow?.recipients}</Typography>
            </CardContent>
          </Card>

          <TextField
            size="small"
            placeholder="Search batch code..."
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                color: isDark ? "#f1f5f9" : "#0f172a",
                backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#fff",
                "& fieldset": { borderColor: isDark ? "#1e2942" : "#e2e8f0" },
                "&:hover fieldset": { borderColor: isDark ? "rgba(129,140,248,0.5)" : "rgba(99,102,241,0.5)" },
                "&.Mui-focused fieldset": { borderColor: "#6366f1" },
              },
              "& .MuiInputBase-input::placeholder": {
                color: isDark ? "rgba(148,163,184,0.85)" : "#94a3b8",
                opacity: 1,
              },
            }}
          />

          <Divider sx={{ mb: 2, borderColor: isDark ? "#1e2942" : "#e2e8f0" }} />

          {drawerItems && drawerItems.length > 0 ? (
            drawerItems
              .filter((i) => (i.code || "").toLowerCase().includes(searchTerm.toLowerCase()))
              .map((it, idx) => (
                <Box
                  key={`${it.code}-${idx}`}
                  sx={{
                    border: `1px solid ${isDark ? "#1e2942" : "#e2e8f0"}`,
                    backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "#fff",
                    borderRadius: 2,
                    p: 1.5,
                    mb: 1,
                    boxShadow: "none",
                  }}
                >
                  <ListItem
                    secondaryAction={
                      <Box
                        sx={{
                          borderRadius: 999,
                          px: 1.5,
                          py: 0.5,
                          background: isDark ? "rgba(99,102,241,0.12)" : "#eff6ff",
                          border: `1px solid ${isDark ? "rgba(99,102,241,0.25)" : "rgba(226,232,240,1)"}`,
                          fontSize: 12,
                          fontWeight: 800,
                          color: isDark ? "#f1f5f9" : "#0f172a",
                        }}
                      >
                        {it.unitsLabel}
                      </Box>
                    }
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CheckRoundedIcon sx={{ color: "#6366f1" }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={it.code}
                      primaryTypographyProps={{
                        fontWeight: 900,
                        color: isDark ? "#f1f5f9" : "#0f172a",
                      }}
                    />
                  </ListItem>
                </Box>
              ))
          ) : (
            <Typography variant="body2" sx={{ color: isDark ? "rgba(148,163,184,0.95)" : "text.secondary" }}>
              No batchcodes recorded for this goods-out entry.
            </Typography>
          )}
        </Box>
      </Drawer>
    </div>
  )
}
