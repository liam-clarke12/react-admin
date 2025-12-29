// src/scenes/recipes/Recipes.jsx
import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useData } from "../../contexts/DataContext";
import { useAuth } from "../../contexts/AuthContext";

/* MUI bits to mirror Goods In behaviour */
import Autocomplete from "@mui/material/Autocomplete";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
} from "@mui/material";

const API_BASE =
  "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

/* ---------------- Unit options (local) ---------------- */
const UNIT_OPTIONS = [
  { value: "grams", label: "Grams (g)" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "kg", label: "Kilograms (Kg)" },
  { value: "l", label: "Litres (L)" },
  { value: "units", label: "Units" },
];

/* ---------------- Icons ---------------- */
const Svg = (p) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    stroke="currentColor"
    {...p}
  />
);
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
);
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
);
const MenuIcon = (props) => (
  <Svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </Svg>
);
const CloseIcon = (props) => (
  <Svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);
const CheckIcon = (props) => (
  <Svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="20 6 9 17 4 12" />
  </Svg>
);
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
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </Svg>
);

/* =========================================================================================
   Brand Styles (Light + Dark) — matched to Goods In
   - Reads localStorage('theme-mode') + listens for window 'themeChanged'
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
  .r-btn-ghost:active { transform: translateY(0); }
  .r-btn-ghost[disabled] { opacity: .6; cursor: not-allowed; transform: none; }

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
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .r-btn-primary:hover { 
    background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%);
    transform: translateY(-1px);
    box-shadow: 0 6px 10px -1px rgba(99,102,241,0.4), 0 4px 6px -1px rgba(99,102,241,0.3);
  }
  .r-btn-primary:active { transform: translateY(0); }
  .r-btn-primary[disabled] { opacity: .65; cursor: not-allowed; transform: none; }

  .r-btn-danger { 
    background: linear-gradient(135deg, var(--danger) 0%, var(--danger2) 100%);
    box-shadow: 0 4px 6px -1px rgba(239,68,68,0.3), 0 2px 4px -1px rgba(239,68,68,0.2);
  }
  .r-btn-danger:hover { 
    background: linear-gradient(135deg, #f87171 0%, var(--danger) 100%);
    box-shadow: 0 6px 10px -1px rgba(239,68,68,0.4), 0 4px 6px -1px rgba(239,68,68,0.3);
  }

  .r-link{
    color: var(--primary);
    font-weight: 700;
    background: transparent;
    border: 0;
    cursor: pointer;
    padding: 0;
  }
  .r-link:hover { text-decoration: underline; color: var(--primary-dark); }

  /* Table */
  .r-table-wrap { overflow-x: auto; background: var(--card); }
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
  .r-row { border-bottom: 1px solid var(--border); transition: all 0.15s ease; }
  .r-row:hover { background: var(--hover); }
  .r-td { 
    padding: 16px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    border-bottom: 1px solid var(--border);
  }
  .r-td--name { font-weight: 700; color: var(--text); }
  .r-actions { text-align: right; }
  .r-chk { width: 18px; height: 18px; accent-color: var(--primary); cursor: pointer; }

  /* Toolbar (search) */
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
    margin: 20px 24px 0;
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

  /* Footer */
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
  .r-muted { color: var(--muted); font-size: 13px; font-weight: 500; }
  .r-strong { font-weight: 800; color: var(--text); }

  /* Drawer */
  .r-dim { position:fixed; inset:0; background: rgba(0,0,0,0.6); opacity:0; pointer-events:none; transition:opacity .2s; z-index: 9998; backdrop-filter: blur(4px); }
  .r-dim.open { opacity:1; pointer-events:auto; }
  .r-drawer {
    position:fixed; top:0; right:0; height:100%; width:100%; max-width:420px; background: var(--card); box-shadow: var(--shadow-lg);
    transform:translateX(100%); transition:transform .25s ease; z-index: 9999; display:flex; flex-direction:column;
    border-left:1px solid var(--border);
  }
  .r-drawer.open { transform:translateX(0); }
  .r-dhdr {
    padding:16px 16px;
    color:#fff;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    display:flex; align-items:center; justify-content:space-between; gap:12px;
  }
  .r-dhdr-title { margin:0; font-weight:900; font-size:18px; }
  .r-dhdr-sub { margin:0; font-size:12px; opacity:.92; }
  .r-dbody { padding:14px; background: ${isDark ? "rgba(255,255,255,0.03)" : "#f1f5f9"}; overflow:auto; flex:1; }
  .r-summary { background: var(--card); border:1px solid var(--border); border-radius:10px; padding:12px; box-shadow: var(--shadow-sm); margin-bottom:10px; }
  .r-stat { text-align:right; }
  .r-filter { position:sticky; top:0; padding:8px 0; background: ${isDark ? "rgba(255,255,255,0.02)" : "#f1f5f9"}; }
  .r-list { list-style:none; margin:10px 0 0; padding:0; display:grid; gap:8px; }
  .r-item { display:flex; align-items:center; justify-content:space-between; background: var(--card); border:1px solid var(--border); border-radius:10px; padding:10px 12px; }
  .r-chip { font-size:12px; font-weight:800; background: var(--chip); color: var(--primary); padding:4px 10px; border-radius: 6px; border:1px solid var(--border); }

  .r-badge { 
    background: ${isDark ? "rgba(99,102,241,0.15)" : "#eef2ff"}; 
    color: ${isDark ? "#c7d2fe" : "#4f46e5"};
    border: 1px solid var(--border);
    border-radius: 999px; 
    padding: 4px; 
    display: inline-flex; 
  }

  /* Modals */
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
    border: 1px solid var(--border);
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

  /* Forms (use GoodsIn ag- look; map gof- to same feel) */
  .gof-grid, .ag-grid { display:grid; gap:16px; grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .col-12 { grid-column: span 12; }
  .col-6 { grid-column: span 2; }
  .col-4 { grid-column: span 2; }
  .col-3 { grid-column: span 1; }
  @media (max-width: 900px) { .col-6, .col-4, .col-3 { grid-column: span 4; } }

  .gof-field, .ag-field { grid-column: span 2; }
  .gof-label, .ag-label { 
    font-size: 13px; 
    color: var(--text); 
    font-weight: 600; 
    margin-bottom: 8px; 
    display:block;
    letter-spacing:-0.01em;
  }
  .gof-input, .gof-select, .ag-input, .ag-select {
    width:100%;
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
  .gof-input::placeholder, .ag-input::placeholder { color: var(--muted); }
  .gof-input:focus, .gof-select:focus, .ag-input:focus, .ag-select:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
    background: var(--card);
  }

  .gof-multi-row{
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px;
    background: var(--mutedCard);
  }

  .gof-multi-add-btn{
    border-radius: 10px;
    border: 1px dashed var(--border);
    background: ${isDark ? "rgba(255,255,255,0.04)" : "#f1f5f9"};
    padding: 10px 14px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    color: var(--text2);
    box-shadow: var(--shadow-sm);
  }
  .gof-multi-add-btn:hover{ background: var(--hover); border-color: var(--primary-light); }

  /* Segmented control (for Add Recipe modal tabs) */
  .seg {
    display: inline-flex;
    gap: 4px;
    padding: 4px;
    background: ${isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"};
    border: 1px solid var(--border);
    border-radius: 10px;
  }
  .seg button{
    border:0; background:transparent;
    padding:8px 16px;
    border-radius:8px;
    font-weight:600;
    cursor:pointer;
    color: var(--text2);
    font-size:14px;
  }
  .seg button:hover { background: ${isDark ? "rgba(99,102,241,0.1)" : "#e0e7ff"}; color: var(--text); }
  .seg .active{
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    color:#fff;
    box-shadow: 0 2px 4px rgba(99,102,241,0.3);
  }

  /* Combine list */
  .combine-recipes-list {
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--card);
    padding: 10px;
    max-height: 240px;
    overflow: auto;
    margin-top: 10px;
    box-shadow: var(--shadow-sm);
  }
  .combine-recipes-row{
    display:flex;
    align-items:center;
    justify-content:space-between;
    padding:10px 8px;
    border-bottom:1px solid ${isDark ? "rgba(30,41,66,1)" : "#eef2f7"};
    font-size:13px;
    color: var(--text2);
    gap: 10px;
  }
  .combine-recipes-row:last-child { border-bottom:none; }

  /* MUI Autocomplete dropdown above our modal */
  .MuiAutocomplete-popper { z-index: 10020 !important; }
  .MuiAutocomplete-popper .MuiPaper-root { overflow: visible; }

  /* Better MUI integration */
  .MuiInputBase-root { color: ${isDark ? "#f1f5f9" : "inherit"}; font-weight: 500 !important; }
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
  .MuiFormLabel-root { color: ${isDark ? "#94a3b8" : "#64748b"} !important; font-weight: 600 !important; }
  .MuiPaper-root { 
    background-color: ${isDark ? "#151b2e" : "#fff"};
    border: 1px solid var(--border);
    box-shadow: var(--shadow-lg) !important;
  }
  `}</style>
);

/* =========================================================================================
   Portal helper (fixes z-index issues like your previous popup-behind-form bug)
   ========================================================================================= */
const Portal = ({ children }) => {
  if (typeof window === "undefined") return null;
  return createPortal(children, document.body);
};

/* ---------------- Recipe Table ---------------- */
const RecipeTable = ({
  recipes,
  onOpenDrawer,
  onEdit,
  selectedRecipeIds,
  setSelectedRecipeIds,
  onDelete,
  onAdd,
  searchQuery,
  setSearchQuery,
  isDark,
}) => {
  const checkboxRef = useRef(null);

  const handleSelectAll = (e) => {
    if (e.target.checked)
      setSelectedRecipeIds(new Set(recipes.map((r) => r.id)));
    else setSelectedRecipeIds(new Set());
  };
  const handleSelectRow = (id) => {
    const next = new Set(selectedRecipeIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedRecipeIds(next);
  };

  const numSelected = selectedRecipeIds.size;
  const rowCount = recipes.length;

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate =
        numSelected > 0 && numSelected < rowCount;
    }
  }, [numSelected, rowCount]);

  return (
    <div className="r-card">
      <div className="r-head">
        <div>
          <h2 className="r-title">Recipes</h2>
          <p className="r-sub">Create, edit and combine recipes</p>
        </div>

        <div className="r-flex">
          <button className="r-btn-primary" onClick={onAdd}>
            <PlusIcon /> Add Recipe
          </button>

          {numSelected > 0 && (
            <div
              className="r-flex"
              style={{
                background: isDark ? "rgba(124,58,237,0.12)" : "#eef2ff",
                padding: "6px 10px",
                borderRadius: 10,
                border: `1px solid ${
                  isDark ? "rgba(124,58,237,0.25)" : "transparent"
                }`,
              }}
            >
              <span className="r-pill">{numSelected} selected</span>
              <button
                className="r-btn-ghost"
                onClick={onDelete}
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
          placeholder="Search by recipe name or ingredient..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="r-table-wrap" style={{ marginTop: 16 }}>
        <table className="r-table">
          <thead className="r-thead">
            <tr>
              <th className="r-td" style={{ width: 40 }}>
                <input
                  ref={checkboxRef}
                  className="r-chk"
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={rowCount > 0 && numSelected === rowCount}
                />
              </th>
              <th className="r-td">Recipe</th>
              <th className="r-td">Units per Batch</th>
              <th className="r-td">Ingredients</th>
              <th className="r-td">Quantities</th>
              <th className="r-td r-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {recipes.map((r) => (
              <tr key={r.id} className="r-row">
                <td className="r-td">
                  <input
                    className="r-chk"
                    type="checkbox"
                    checked={selectedRecipeIds.has(r.id)}
                    onChange={() => handleSelectRow(r.id)}
                  />
                </td>
                <td className="r-td r-td--name">{r.name}</td>
                <td className="r-td">{r.unitsPerBatch}</td>
                <td className="r-td">
                  <button
                    className="r-link"
                    onClick={() => onOpenDrawer(r.id, "ingredients")}
                  >
                    View ({r.ingredients.length})
                  </button>
                </td>
                <td className="r-td">
                  <button
                    className="r-link"
                    onClick={() => onOpenDrawer(r.id, "quantities")}
                  >
                    View Quantities
                  </button>
                </td>
                <td className="r-td r-actions">
                  <button
                    className="r-btn-ghost"
                    onClick={() => onEdit(r)}
                    aria-label={`Edit ${r.name}`}
                  >
                    <EditIcon /> Edit
                  </button>
                </td>
              </tr>
            ))}
            {recipes.length === 0 && (
              <tr className="r-row">
                <td
                  className="r-td"
                  colSpan={6}
                  style={{ textAlign: "center" }}
                >
                  <span className="r-muted">No recipes found.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="r-footer">
        <span className="r-muted">
          Showing <strong>{recipes.length}</strong> recipe
          {recipes.length === 1 ? "" : "s"}
        </span>
        <span className="r-muted">Tip: Use “Combine Recipes” when building sub-mixes.</span>
      </div>
    </div>
  );
};

/* ---------------- Drawer ---------------- */
const RecipeDrawer = ({ isOpen, onClose, recipe, type }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const displayItems = useMemo(() => {
    if (!recipe) return [];
    return recipe.ingredients.map((ing) => ({
      name: ing.name,
      details:
        type === "quantities" ? `${ing.quantity} ${ing.unit}` : ing.name,
      fullText: `${ing.name} ${ing.quantity} ${ing.unit}`.toLowerCase(),
    }));
  }, [recipe, type]);

  const filtered = useMemo(() => {
    const q = (searchTerm || "").toLowerCase();
    return displayItems.filter((it) => it.fullText.includes(q));
  }, [displayItems, searchTerm]);

  const exportCsv = () => {
    if (!recipe) return;
    const headers =
      type === "quantities" ? ["Ingredient", "Quantity", "Unit"] : ["Ingredient"];
    const rows = recipe.ingredients.map((ing) =>
      type === "quantities"
        ? [ing.name, String(ing.quantity), ing.unit]
        : [ing.name]
    );
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(recipe?.name || "recipe")
      .replace(/\s+/g, "_")}_${type}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className={`r-dim ${isOpen ? "open" : ""}`} onClick={onClose} />
      <div className={`r-drawer ${isOpen ? "open" : ""}`}>
        <div className="r-dhdr">
          <div className="r-flex">
            <span className="r-badge">
              <MenuIcon />
            </span>
            <div>
              <h3 className="r-dhdr-title">
                {type === "ingredients" ? "Ingredients" : "Quantities"}
              </h3>
              <p className="r-dhdr-sub">{recipe?.name || "No recipe selected"}</p>
            </div>
          </div>
          <button className="r-btn-ghost" onClick={onClose}>
            <CloseIcon /> Close
          </button>
        </div>

        <div className="r-dbody">
          <div
            className="r-summary r-flex"
            style={{ justifyContent: "space-between" }}
          >
            <div>
              <div
                className="r-muted"
                style={{ textTransform: "uppercase", fontWeight: 800 }}
              >
                Recipe
              </div>
              <div className="r-strong">{recipe?.name || "—"}</div>
              <div className="r-muted">
                Units per batch: {recipe?.unitsPerBatch ?? "N/A"}
              </div>
            </div>
            <div className="r-stat">
              <div
                className="r-muted"
                style={{ textTransform: "uppercase", fontWeight: 800 }}
              >
                Items
              </div>
              <div className="r-strong" style={{ color: "#6366f1", fontSize: 24 }}>
                {filtered.length}
              </div>
            </div>
          </div>

          <div className="r-filter">
            <input
              className="r-input"
              type="text"
              placeholder="Filter items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <ul className="r-list">
            {filtered.map((it, i) => (
              <li key={i} className="r-item">
                <div className="r-flex">
                  <span className="r-badge">
                    <CheckIcon />
                  </span>
                  <span className="r-strong" style={{ fontWeight: 700 }}>
                    {it.name}
                  </span>
                </div>
                {type === "quantities" && <span className="r-chip">{it.details}</span>}
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="r-item" style={{ justifyContent: "center" }}>
                <span className="r-muted">No items found.</span>
              </li>
            )}
          </ul>
        </div>

        <div className="r-footer">
          <button className="r-btn-ghost" onClick={exportCsv} disabled={!recipe}>
            Export CSV
          </button>
          <button className="r-btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </>
  );
};

/* ---------------- Shared ingredient source (same as Goods In) ---------------- */
const useIngredientOptions = (cognitoId, refreshKey = 0) => {
  const [masterIngredients, setMasterIngredients] = useState([]);
  const [customIngredients, setCustomIngredients] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!cognitoId) return;
    setLoading(true);
    try {
      const [mRes, cRes] = await Promise.all([
        fetch(`${API_BASE}/ingredients?cognito_id=${encodeURIComponent(cognitoId)}`),
        fetch(`${API_BASE}/custom-ingredients?cognito_id=${encodeURIComponent(cognitoId)}`),
      ]);

      const m = mRes.ok ? await mRes.json() : [];
      const c = cRes.ok ? await cRes.json() : [];
      setMasterIngredients(Array.isArray(m) ? m : []);
      setCustomIngredients(
        Array.isArray(c) ? c.map((ci) => ({ id: `c-${ci.id}`, name: ci.name })) : []
      );
    } catch (e) {
      console.error("Ingredient load error:", e);
      setMasterIngredients([]);
      setCustomIngredients([]);
    } finally {
      setLoading(false);
    }
  }, [cognitoId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const ingredients = useMemo(
    () => [
      ...masterIngredients.map((i) => ({ ...i, source: "master" })),
      ...customIngredients.map((i) => ({ ...i, source: "custom" })),
    ],
    [masterIngredients, customIngredients]
  );

  return { ingredients, reload: load, loading };
};

/* ---------------- Add custom ingredient dialog (shared) ---------------- */
const AddIngredientDialog = ({ open, onClose, onAdd, adding }) => {
  const [name, setName] = useState("");
  useEffect(() => {
    if (!open) setName("");
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          border: "1px solid var(--border)",
          backgroundColor: "var(--card)",
          color: "var(--text)",
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, color: "var(--text)" }}>
        Add New Ingredient
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Ingredient Name"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          InputLabelProps={{ sx: { color: "var(--muted)" } }}
          InputProps={{
            sx: {
              color: "var(--text)",
              backgroundColor: "rgba(255,255,255,0.04)",
              borderRadius: 2,
            },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={adding} sx={{ textTransform: "none", fontWeight: 700 }}>
          Cancel
        </Button>
        <Button
          onClick={() => onAdd(name)}
          disabled={adding || !name.trim()}
          variant="contained"
          sx={{
            textTransform: "none",
            fontWeight: 800,
            borderRadius: 999,
            px: 3,
            background: "linear-gradient(135deg, #7C3AED, #5B21B6)",
            "&:hover": { background: "#5B21B6" },
          }}
          startIcon={adding ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : null}
        >
          {adding ? "Adding…" : "Add"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/* ---------------- Summary Modal for new recipe ---------------- */
const RecipeSummaryModal = ({ open, onClose, onConfirm, initialRecipe }) => {
  const [draft, setDraft] = useState(initialRecipe || null);

  useEffect(() => {
    if (open && initialRecipe) {
      setDraft(JSON.parse(JSON.stringify(initialRecipe)));
    }
  }, [open, initialRecipe]);

  if (!open || !draft) return null;

  const handleField = (k, v) => setDraft((p) => ({ ...p, [k]: v }));

  const handleIngredient = (idx, k, v) => {
    const arr = [...(draft.ingredients || [])];
    arr[idx] = { ...(arr[idx] || {}), [k]: v };
    setDraft((p) => ({ ...p, ingredients: arr }));
  };

  const addIngredientRow = () => {
    setDraft((p) => ({
      ...p,
      ingredients: [
        ...(p.ingredients || []),
        { id: `sum_${Date.now()}`, name: "", quantity: 0, unit: UNIT_OPTIONS[0].value },
      ],
    }));
  };

  const removeIngredient = (idx) => {
    setDraft((p) => ({
      ...p,
      ingredients: p.ingredients.filter((_, i) => i !== idx),
    }));
  };

  return (
    <Portal>
      <div className="r-modal-dim">
        <div className="r-modal">
          <div className="r-mhdr">
            <h2 className="r-title" style={{ fontSize: 18 }}>
              Review New Recipe
            </h2>
            <button className="r-btn-ghost" onClick={onClose}>
              <CloseIcon /> Close
            </button>
          </div>

          <div className="r-mbody">
            <p className="r-muted" style={{ marginBottom: 12 }}>
              Make any final tweaks to the recipe before saving.
            </p>

            <div className="gof-grid">
              <div className="gof-field col-6">
                <label className="gof-label">Recipe Name</label>
                <input
                  type="text"
                  className="gof-input"
                  value={draft.name}
                  onChange={(e) => handleField("name", e.target.value)}
                />
              </div>
              <div className="gof-field col-6">
                <label className="gof-label">Units per Batch</label>
                <input
                  type="number"
                  className="gof-input"
                  value={draft.unitsPerBatch}
                  onChange={(e) =>
                    handleField("unitsPerBatch", parseInt(e.target.value || "0", 10))
                  }
                />
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <h3 className="r-strong" style={{ marginBottom: 8 }}>
                Ingredients
              </h3>
              <div style={{ display: "grid", gap: 8 }}>
                {(draft.ingredients || []).map((ing, idx) => (
                  <div key={ing.id || idx} className="gof-multi-row">
                    <div className="gof-grid">
                      <div className="gof-field col-6">
                        <label className="gof-label">Ingredient</label>
                        <input
                          type="text"
                          className="gof-input"
                          value={ing.name}
                          onChange={(e) => handleIngredient(idx, "name", e.target.value)}
                        />
                      </div>
                      <div className="gof-field col-3">
                        <label className="gof-label">Quantity</label>
                        <input
                          type="number"
                          className="gof-input"
                          value={ing.quantity}
                          onChange={(e) =>
                            handleIngredient(idx, "quantity", parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div className="gof-field col-3">
                        <label className="gof-label">Unit</label>
                        <select
                          className="gof-select"
                          value={ing.unit}
                          onChange={(e) => handleIngredient(idx, "unit", e.target.value)}
                        >
                          {UNIT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div style={{ marginTop: 8, textAlign: "right" }}>
                      <button
                        type="button"
                        className="r-btn-ghost"
                        onClick={() => removeIngredient(idx)}
                        style={{
                          padding: "8px 12px",
                          color: "var(--danger)",
                          borderColor: "rgba(239,68,68,0.35)",
                        }}
                        title="Remove"
                      >
                        <DeleteIcon /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="gof-multi-add-btn"
                style={{ marginTop: 10 }}
                onClick={addIngredientRow}
              >
                + Add Ingredient
              </button>
            </div>
          </div>

          <div className="r-mfooter">
            <button className="r-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="r-btn-primary" onClick={() => onConfirm(draft)}>
              Confirm & Create
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

/* ---------------- Edit Modal (Nory-style form) ---------------- */
const EditRecipeModal = ({ isOpen, onClose, onSave, recipe }) => {
  const { cognitoId } = useAuth();
  const { ingredients, reload } = useIngredientOptions(cognitoId, isOpen ? 1 : 0);

  const [edited, setEdited] = useState(null);
  const [saving, setSaving] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addTargetIndex, setAddTargetIndex] = useState(null);

  useEffect(() => {
    if (recipe) setEdited(JSON.parse(JSON.stringify(recipe)));
    else setEdited(null);
  }, [recipe]);

  if (!isOpen || !edited) return null;

  const handleField = (k, v) => setEdited((p) => ({ ...p, [k]: v }));
  const handleIngredient = (idx, k, v) => {
    const arr = [...(edited?.ingredients || [])];
    arr[idx] = { ...(arr[idx] || {}), [k]: v };
    setEdited((p) => ({ ...p, ingredients: arr }));
  };
  const addIngredientRow = () => {
    setEdited((p) => ({
      ...p,
      ingredients: [
        ...(p?.ingredients || []),
        { id: `new_${Date.now()}`, name: "", quantity: 0, unit: UNIT_OPTIONS[0].value },
      ],
    }));
  };
  const removeIngredient = (idx) => {
    const arr = (edited?.ingredients || []).filter((_, i) => i !== idx);
    setEdited((p) => ({ ...p, ingredients: arr }));
  };
  const save = async () => {
    setSaving(true);
    await onSave(edited);
    setSaving(false);
  };

  const openAddCustom = (index) => {
    setAddTargetIndex(index);
    setAddOpen(true);
  };
  const doAddCustom = async (name) => {
    if (!cognitoId || !name?.trim()) return;
    setAdding(true);
    try {
      const resp = await fetch(`${API_BASE}/custom-ingredients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cognito_id: cognitoId, name: name.trim() }),
      });
      if (!resp.ok) throw new Error("Failed to add ingredient");
      await reload();

      // NOTE: ingredients state updates async; best effort:
      const just = (ingredients || []).find(
        (i) => i.name?.toLowerCase() === name.trim().toLowerCase()
      );
      if (just && addTargetIndex != null) {
        handleIngredient(addTargetIndex, "name", just.name);
      }
      setAddOpen(false);
      setAddTargetIndex(null);
    } catch (e) {
      console.error("add ingredient failed:", e);
      alert("Could not add ingredient");
    } finally {
      setAdding(false);
    }
  };

  return (
    <Portal>
      <div className="r-modal-dim">
        <div className="r-modal">
          <div className="r-mhdr">
            <h2 className="r-title" style={{ fontSize: 18 }}>
              Edit Recipe
            </h2>
            <button className="r-btn-ghost" onClick={onClose}>
              <CloseIcon /> Close
            </button>
          </div>

          <div className="r-mbody">
            <div className="gof-grid">
              <div className="gof-field col-6">
                <label className="gof-label">Recipe Name</label>
                <input
                  type="text"
                  className="gof-input"
                  value={edited?.name || ""}
                  onChange={(e) => handleField("name", e.target.value)}
                />
              </div>
              <div className="gof-field col-6">
                <label className="gof-label">Units per Batch</label>
                <input
                  type="number"
                  className="gof-input"
                  value={edited?.unitsPerBatch ?? 0}
                  onChange={(e) => handleField("unitsPerBatch", parseInt(e.target.value || "0", 10))}
                />
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <h3 className="r-strong" style={{ marginBottom: 8 }}>
                Ingredients
              </h3>
              <div style={{ display: "grid", gap: 8 }}>
                {(edited?.ingredients || []).map((ing, idx) => (
                  <div key={ing.id || idx} className="gof-multi-row">
                    <div className="gof-grid">
                      <div className="gof-field col-6">
                        <label className="gof-label">Ingredient</label>
                        <Autocomplete
                          options={ingredients}
                          value={ingredients.find((i) => i.name === ing.name) || null}
                          onChange={(_, val) => handleIngredient(idx, "name", val ? val.name : "")}
                          getOptionLabel={(opt) => (typeof opt === "string" ? opt : opt?.name ?? "")}
                          isOptionEqualToValue={(opt, val) => (opt?.id ?? opt) === (val?.id ?? val)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Select an ingredient"
                              InputLabelProps={{ sx: { color: "var(--muted)" } }}
                              InputProps={{
                                ...params.InputProps,
                                sx: { color: "var(--text)", borderRadius: 2 },
                              }}
                            />
                          )}
                          disableClearable={false}
                        />
                        <div style={{ marginTop: 8 }}>
                          <button type="button" className="r-btn-ghost" onClick={() => openAddCustom(idx)}>
                            Add Ingredient +
                          </button>
                        </div>
                      </div>

                      <div className="gof-field col-3">
                        <label className="gof-label">Quantity</label>
                        <input
                          type="number"
                          className="gof-input"
                          placeholder="Quantity"
                          value={ing.quantity}
                          onChange={(e) => handleIngredient(idx, "quantity", parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      <div className="gof-field col-3">
                        <label className="gof-label">Unit</label>
                        <select
                          className="gof-select"
                          value={ing.unit}
                          onChange={(e) => handleIngredient(idx, "unit", e.target.value)}
                        >
                          {UNIT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ marginTop: 8, textAlign: "right" }}>
                      <button
                        type="button"
                        className="r-btn-ghost"
                        onClick={() => removeIngredient(idx)}
                        style={{
                          padding: "8px 12px",
                          color: "var(--danger)",
                          borderColor: "rgba(239,68,68,0.35)",
                        }}
                        title="Remove"
                      >
                        <DeleteIcon /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" className="gof-multi-add-btn" style={{ marginTop: 10 }} onClick={addIngredientRow}>
                + Add Ingredient
              </button>
            </div>
          </div>

          <div className="r-mfooter">
            <button className="r-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="r-btn-primary" onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <AddIngredientDialog
          open={addOpen}
          onClose={() => {
            setAddOpen(false);
            setAddTargetIndex(null);
          }}
          onAdd={doAddCustom}
          adding={adding}
        />
      </div>
    </Portal>
  );
};

/* ---------------- Add Recipe Modal (popup form + combine tab) ---------------- */
const AddRecipeModal = ({ isOpen, onClose, onSave, existingRecipes }) => {
  const { cognitoId } = useAuth();
  const { ingredients, reload } = useIngredientOptions(cognitoId, isOpen ? 1 : 0);

  const [mode, setMode] = useState("manual"); // "manual" | "combine"

  const [newRecipe, setNewRecipe] = useState({
    name: "",
    unitsPerBatch: 1,
    ingredients: [{ id: `new_${Date.now()}`, name: "", quantity: 0, unit: UNIT_OPTIONS[0].value }],
  });

  const [saving, setSaving] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addTargetIndex, setAddTargetIndex] = useState(null);

  const [selectedRecipeIdsLocal, setSelectedRecipeIdsLocal] = useState([]);
  const [extraIngredients, setExtraIngredients] = useState([]);

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryRecipe, setSummaryRecipe] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setMode("manual");
      setNewRecipe({
        name: "",
        unitsPerBatch: 1,
        ingredients: [{ id: `new_${Date.now()}`, name: "", quantity: 0, unit: UNIT_OPTIONS[0].value }],
      });
      setSelectedRecipeIdsLocal([]);
      setExtraIngredients([]);
      setSummaryOpen(false);
      setSummaryRecipe(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleField = (k, v) => setNewRecipe((p) => ({ ...p, [k]: v }));

  const handleIngredient = (idx, k, v) => {
    const arr = [...newRecipe.ingredients];
    arr[idx] = { ...arr[idx], [k]: v };
    setNewRecipe((p) => ({ ...p, ingredients: arr }));
  };
  const addIngredientRow = () => {
    setNewRecipe((p) => ({
      ...p,
      ingredients: [...p.ingredients, { id: `new_${Date.now()}`, name: "", quantity: 0, unit: UNIT_OPTIONS[0].value }],
    }));
  };
  const removeIngredient = (idx) => {
    setNewRecipe((p) => ({ ...p, ingredients: p.ingredients.filter((_, i) => i !== idx) }));
  };

  const handleExtraIngredient = (idx, k, v) => {
    const arr = [...extraIngredients];
    arr[idx] = { ...arr[idx], [k]: v };
    setExtraIngredients(arr);
  };
  const addExtraIngredientRow = () => {
    setExtraIngredients((prev) => [
      ...prev,
      { id: `extra_${Date.now()}`, name: "", quantity: 0, unit: UNIT_OPTIONS[0].value },
    ]);
  };
  const removeExtraIngredient = (idx) => {
    setExtraIngredients((prev) => prev.filter((_, i) => i !== idx));
  };

  const openAddCustom = (index, isExtra = false) => {
    setAddTargetIndex({ index, isExtra });
    setAddOpen(true);
  };

  const doAddCustom = async (name) => {
    if (!cognitoId || !name?.trim()) return;
    setAdding(true);
    try {
      const resp = await fetch(`${API_BASE}/custom-ingredients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cognito_id: cognitoId, name: name.trim() }),
      });
      if (!resp.ok) throw new Error("Failed to add ingredient");
      await reload();

      const just = (ingredients || []).find((i) => i.name?.toLowerCase() === name.trim().toLowerCase());
      if (just && addTargetIndex != null) {
        const { index, isExtra } = addTargetIndex;
        if (isExtra) handleExtraIngredient(index, "name", just.name);
        else handleIngredient(index, "name", just.name);
      }
      setAddOpen(false);
      setAddTargetIndex(null);
    } catch (e) {
      console.error("add ingredient failed:", e);
      alert("Could not add ingredient");
    } finally {
      setAdding(false);
    }
  };

  const combinedBaseIngredients = (() => {
    const selectedSet = new Set(selectedRecipeIdsLocal);
    const map = new Map();

    (existingRecipes || []).forEach((rec) => {
      if (!selectedSet.has(rec.id)) return;
      (rec.ingredients || []).forEach((ing) => {
        if (!ing.name) return;
        const unitVal = ing.unit || "";
        const key = `${ing.name}::${unitVal}`;
        const prev = map.get(key) || { name: ing.name, unit: unitVal, quantity: 0 };
        const qty = parseFloat(ing.quantity) || 0;
        prev.quantity += qty;
        map.set(key, prev);
      });
    });

    return Array.from(map.values()).map((it, idx) => ({ id: `combo_${idx}`, ...it }));
  })();

  const toggleRecipeSelect = (id) => {
    setSelectedRecipeIdsLocal((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const mergeIngredients = (arrays) => {
    const map = new Map();
    arrays
      .flat()
      .filter(Boolean)
      .forEach((ing) => {
        if (!ing.name) return;
        const unitVal = ing.unit || "";
        const key = `${ing.name}::${unitVal}`;
        const existing = map.get(key) || {
          id: ing.id || `m_${map.size}`,
          name: ing.name,
          unit: unitVal,
          quantity: 0,
        };
        existing.quantity += Number(ing.quantity) || 0;
        map.set(key, existing);
      });
    return Array.from(map.values());
  };

  const handleOpenSummary = () => {
    let candidateIngredients = [];

    if (mode === "manual") {
      candidateIngredients = mergeIngredients([newRecipe.ingredients]);
    } else {
      candidateIngredients = mergeIngredients([combinedBaseIngredients, extraIngredients]);
    }

    if (!newRecipe.name.trim()) {
      alert("Please provide a recipe name.");
      return;
    }
    if (!candidateIngredients.length) {
      alert("Please add at least one ingredient.");
      return;
    }

    const candidate = {
      name: newRecipe.name,
      unitsPerBatch: newRecipe.unitsPerBatch || 0,
      ingredients: candidateIngredients,
    };

    setSummaryRecipe(candidate);
    setSummaryOpen(true);
  };

  const handleConfirmSummary = async (finalRecipe) => {
    setSummaryOpen(false);
    setSaving(true);
    await onSave(finalRecipe);
    setSaving(false);
  };

  const renderManualIngredients = () => (
    <div style={{ marginTop: 16 }}>
      <h3 className="r-strong" style={{ marginBottom: 8 }}>
        Ingredients
      </h3>
      <div style={{ display: "grid", gap: 8 }}>
        {newRecipe.ingredients.map((ing, idx) => (
          <div key={ing.id} className="gof-multi-row">
            <div className="gof-grid">
              <div className="gof-field col-6">
                <label className="gof-label">Ingredient</label>
                <Autocomplete
                  options={ingredients}
                  value={ingredients.find((i) => i.name === ing.name) || null}
                  onChange={(_, val) => handleIngredient(idx, "name", val ? val.name : "")}
                  getOptionLabel={(opt) => (typeof opt === "string" ? opt : opt?.name ?? "")}
                  isOptionEqualToValue={(opt, val) => (opt?.id ?? opt) === (val?.id ?? val)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select an ingredient"
                      InputLabelProps={{ sx: { color: "var(--muted)" } }}
                      InputProps={{
                        ...params.InputProps,
                        sx: { color: "var(--text)", borderRadius: 2 },
                      }}
                    />
                  )}
                  disableClearable={false}
                />
                <div style={{ marginTop: 8 }}>
                  <button type="button" className="r-btn-ghost" onClick={() => openAddCustom(idx, false)}>
                    Add Ingredient +
                  </button>
                </div>
              </div>

              <div className="gof-field col-3">
                <label className="gof-label">Quantity</label>
                <input
                  type="number"
                  className="gof-input"
                  placeholder="Qty"
                  value={ing.quantity}
                  onChange={(e) => handleIngredient(idx, "quantity", parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="gof-field col-3">
                <label className="gof-label">Unit</label>
                <select className="gof-select" value={ing.unit} onChange={(e) => handleIngredient(idx, "unit", e.target.value)}>
                  {UNIT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginTop: 8, textAlign: "right" }}>
              <button
                type="button"
                className="r-btn-ghost"
                onClick={() => removeIngredient(idx)}
                style={{
                  padding: "8px 12px",
                  color: "var(--danger)",
                  borderColor: "rgba(239,68,68,0.35)",
                }}
                title="Remove"
              >
                <DeleteIcon /> Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="gof-multi-add-btn" style={{ marginTop: 10 }} onClick={addIngredientRow}>
        + Add Ingredient
      </button>
    </div>
  );

  const renderCombineMode = () => (
    <>
      <div style={{ marginTop: 16 }}>
        <h3 className="r-strong" style={{ marginBottom: 4 }}>
          Select Recipes to Combine
        </h3>
        <p className="r-muted">
          Pick existing recipes to merge. Ingredients with the same name and unit will have their quantities summed.
        </p>

        <div className="combine-recipes-list">
          {(existingRecipes || []).map((r) => (
            <div key={r.id} className="combine-recipes-row">
              <label style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <input
                  type="checkbox"
                  className="r-chk"
                  checked={selectedRecipeIdsLocal.includes(r.id)}
                  onChange={() => toggleRecipeSelect(r.id)}
                />
                <span className="r-td--name" style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.name}
                </span>
              </label>
              <span className="r-muted" style={{ whiteSpace: "nowrap" }}>
                Units/batch: {r.unitsPerBatch ?? "—"}
              </span>
            </div>
          ))}
          {(!existingRecipes || existingRecipes.length === 0) && (
            <div className="r-muted">No recipes available yet.</div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <h3 className="r-strong" style={{ marginBottom: 4 }}>
          Combined Ingredients (auto)
        </h3>
        {combinedBaseIngredients.length === 0 ? (
          <p className="r-muted">Select recipes above to see combined ingredients.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {combinedBaseIngredients.map((ing) => (
              <div key={ing.id} className="gof-multi-row">
                <div className="gof-grid">
                  <div className="gof-field col-6">
                    <label className="gof-label">Ingredient</label>
                    <input type="text" className="gof-input" value={ing.name} readOnly />
                  </div>
                  <div className="gof-field col-3">
                    <label className="gof-label">Quantity</label>
                    <input type="number" className="gof-input" value={ing.quantity} readOnly />
                  </div>
                  <div className="gof-field col-3">
                    <label className="gof-label">Unit</label>
                    <input type="text" className="gof-input" value={ing.unit} readOnly />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <h3 className="r-strong" style={{ marginBottom: 4 }}>
          Additional Ingredients
        </h3>
        <p className="r-muted" style={{ marginBottom: 6 }}>
          Add any extra ingredients to this combined recipe.
        </p>

        <div style={{ display: "grid", gap: 8 }}>
          {extraIngredients.map((ing, idx) => (
            <div key={ing.id} className="gof-multi-row">
              <div className="gof-grid">
                <div className="gof-field col-6">
                  <label className="gof-label">Ingredient</label>
                  <Autocomplete
                    options={ingredients}
                    value={ingredients.find((i) => i.name === ing.name) || null}
                    onChange={(_, val) => handleExtraIngredient(idx, "name", val ? val.name : "")}
                    getOptionLabel={(opt) => (typeof opt === "string" ? opt : opt?.name ?? "")}
                    isOptionEqualToValue={(opt, val) => (opt?.id ?? opt) === (val?.id ?? val)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Select an ingredient"
                        InputLabelProps={{ sx: { color: "var(--muted)" } }}
                        InputProps={{
                          ...params.InputProps,
                          sx: { color: "var(--text)", borderRadius: 2 },
                        }}
                      />
                    )}
                    disableClearable={false}
                  />
                  <div style={{ marginTop: 8 }}>
                    <button type="button" className="r-btn-ghost" onClick={() => openAddCustom(idx, true)}>
                      Add Ingredient +
                    </button>
                  </div>
                </div>

                <div className="gof-field col-3">
                  <label className="gof-label">Quantity</label>
                  <input
                    type="number"
                    className="gof-input"
                    placeholder="Qty"
                    value={ing.quantity}
                    onChange={(e) => handleExtraIngredient(idx, "quantity", parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="gof-field col-3">
                  <label className="gof-label">Unit</label>
                  <select className="gof-select" value={ing.unit} onChange={(e) => handleExtraIngredient(idx, "unit", e.target.value)}>
                    {UNIT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: 8, textAlign: "right" }}>
                <button
                  type="button"
                  className="r-btn-ghost"
                  onClick={() => removeExtraIngredient(idx)}
                  style={{
                    padding: "8px 12px",
                    color: "var(--danger)",
                    borderColor: "rgba(239,68,68,0.35)",
                  }}
                  title="Remove"
                >
                  <DeleteIcon /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <button type="button" className="gof-multi-add-btn" style={{ marginTop: 10 }} onClick={addExtraIngredientRow}>
          + Add Extra Ingredient
        </button>
      </div>
    </>
  );

  return (
    <Portal>
      <div className="r-modal-dim">
        <div className="r-modal">
          <div className="r-mhdr">
            <h2 className="r-title" style={{ fontSize: 18 }}>
              Add New Recipe
            </h2>

            <div className="seg" role="tablist" aria-label="Add recipe mode">
              <button
                role="tab"
                aria-selected={mode === "manual"}
                className={mode === "manual" ? "active" : ""}
                onClick={() => setMode("manual")}
                type="button"
              >
                Manual
              </button>
              <button
                role="tab"
                aria-selected={mode === "combine"}
                className={mode === "combine" ? "active" : ""}
                onClick={() => setMode("combine")}
                type="button"
              >
                Combine
              </button>
            </div>

            <button className="r-btn-ghost" onClick={onClose}>
              <CloseIcon /> Close
            </button>
          </div>

          <div className="r-mbody">
            <div className="gof-grid">
              <div className="gof-field col-6">
                <label className="gof-label">Recipe Name</label>
                <input
                  type="text"
                  className="gof-input"
                  value={newRecipe.name}
                  onChange={(e) => handleField("name", e.target.value)}
                  placeholder="e.g., Açaí Base Mix"
                />
              </div>
              <div className="gof-field col-6">
                <label className="gof-label">Units per Batch</label>
                <input
                  type="number"
                  className="gof-input"
                  value={newRecipe.unitsPerBatch}
                  onChange={(e) => handleField("unitsPerBatch", parseInt(e.target.value || "0", 10))}
                />
              </div>
            </div>

            {mode === "manual" ? renderManualIngredients() : renderCombineMode()}
          </div>

          <div className="r-mfooter">
            <button className="r-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="r-btn-primary" onClick={handleOpenSummary} disabled={saving}>
              {saving ? "Creating..." : "Create Recipe"}
            </button>
          </div>
        </div>

        <AddIngredientDialog
          open={addOpen}
          onClose={() => {
            setAddOpen(false);
            setAddTargetIndex(null);
          }}
          onAdd={doAddCustom}
          adding={adding}
        />

        <RecipeSummaryModal
          open={summaryOpen}
          onClose={() => setSummaryOpen(false)}
          onConfirm={handleConfirmSummary}
          initialRecipe={summaryRecipe}
        />
      </div>
    </Portal>
  );
};

/* ---------------- Delete Modal ---------------- */
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, count, isDark }) => {
  if (!isOpen || count === 0) return null;
  return (
    <Portal>
      <div className="r-modal-dim">
        <div className="r-modal" style={{ maxWidth: 420 }}>
          <div className="r-mhdr">
            <h2 className="r-title" style={{ fontSize: 18 }}>
              Confirm Deletion
            </h2>
            <button className="r-btn-ghost" onClick={onClose}>
              <CloseIcon /> Close
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
              Delete {count} recipe{count > 1 ? "s" : ""}?
            </h3>
            <p className="r-muted" style={{ marginTop: 6 }}>
              This action cannot be undone.
            </p>
          </div>
          <div className="r-mfooter" style={{ justifyContent: "flex-end" }}>
            <button className="r-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="r-btn-primary r-btn-danger" onClick={onConfirm}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

/* ---------------- Main Screen ---------------- */
const Recipes = () => {
  const { cognitoId } = useAuth();
  const { setRows } = useData();

  // theme sync with Topbar (same as Dashboard/GoodsIn)
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("theme-mode") === "dark"
  );

  useEffect(() => {
    const onThemeChanged = () => {
      setIsDark(localStorage.getItem("theme-mode") === "dark");
    };
    window.addEventListener("themeChanged", onThemeChanged);
    return () => window.removeEventListener("themeChanged", onThemeChanged);
  }, []);

  const [recipes, setRecipes] = useState([]);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState("ingredients");
  const [drawerRecipe, setDrawerRecipe] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [addOpen, setAddOpen] = useState(false);

  // Search state for Recipes list
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRecipeData = useCallback(async () => {
    if (!cognitoId) return;
    try {
      const res = await fetch(
        `${API_BASE}/recipes?cognito_id=${encodeURIComponent(cognitoId)}`
      );
      if (!res.ok) throw new Error("Failed to fetch Recipe data");
      const data = await res.json();

      const grouped = data.reduce((acc, row) => {
        let entry = acc.find((r) => r.id === row.recipe_id);
        if (entry) {
          entry.ingredients.push(row.ingredient);
          entry.quantities.push(row.quantity);
          entry.units.push(row.unit);
        } else {
          acc.push({
            id: row.recipe_id,
            recipe: row.recipe,
            upb: row.units_per_batch,
            ingredients: [row.ingredient],
            quantities: [row.quantity],
            units: [row.unit],
          });
        }
        return acc;
      }, []);
      setRows(grouped);

      const asRecipes = grouped.map((g) => ({
        id: g.id,
        name: g.recipe,
        unitsPerBatch: g.upb,
        ingredients: (g.ingredients || []).map((ing, i) => ({
          id: `${g.id}_${i}`,
          name: ing,
          quantity: g.quantities?.[i] ?? "",
          unit: g.units?.[i] ?? "",
        })),
      }));
      setRecipes(asRecipes);
    } catch (err) {
      console.error("Error fetching recipes:", err);
      setRows([]);
      setRecipes([]);
    }
  }, [cognitoId, setRows]);

  useEffect(() => {
    fetchRecipeData();
  }, [fetchRecipeData]);

  const filteredRecipes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return recipes;

    return recipes.filter((r) => {
      const fields = [r.name, r.unitsPerBatch, ...(r.ingredients || []).map((i) => i.name)];
      return fields.some((val) => String(val ?? "").toLowerCase().includes(q));
    });
  }, [recipes, searchQuery]);

  const handleOpenDrawer = (recipeId, type) => {
    const r = recipes.find((x) => x.id === recipeId);
    setDrawerRecipe(r || null);
    setDrawerType(type);
    setDrawerOpen(true);
  };
  const handleCloseDrawer = () => setDrawerOpen(false);

  const handleEdit = async (recipe) => {
    try {
      const url = `${API_BASE}/recipes/${encodeURIComponent(recipe.id)}?cognito_id=${encodeURIComponent(cognitoId)}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Failed to fetch recipe ${recipe.id}`);
      const payload = await resp.json();
      const r = {
        id: payload.recipe_id,
        name: payload.recipe_name,
        unitsPerBatch: payload.units_per_batch,
        ingredients: (payload.ingredients || []).map((it, i) => ({
          id: it.id ?? `${payload.recipe_id}_${i}`,
          name: it.ingredient_name,
          quantity: it.quantity,
          unit: it.unit,
        })),
      };
      setEditingRecipe(r);
      setEditOpen(true);
    } catch (e) {
      console.error("Failed to open editor:", e);
      alert("Could not open recipe editor.");
    }
  };

  const handleSaveEdited = async (edited) => {
    if (!edited || !cognitoId) return;
    try {
      const payload = {
        recipe: edited.name,
        upb: edited.unitsPerBatch,
        ingredients: edited.ingredients.map((i) => i.name),
        quantities: edited.ingredients.map((i) => i.quantity),
        units: edited.ingredients.map((i) => i.unit),
        cognito_id: cognitoId,
      };
      const resp = await fetch(`${API_BASE}/recipes/${encodeURIComponent(edited.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const t = await resp.text().catch(() => "");
        throw new Error(t || `Update failed (${resp.status})`);
      }
      await fetchRecipeData();
      setEditOpen(false);
      setEditingRecipe(null);
    } catch (e) {
      console.error("Save recipe failed:", e);
      alert("Save failed. See console for details.");
    }
  };

  const handleConfirmDelete = async () => {
    const ids = Array.from(selectedRecipeIds);
    if (!ids.length || !cognitoId) {
      setDeleteOpen(false);
      return;
    }
    try {
      for (const id of ids) {
        const rec = recipes.find((r) => r.id === id);
        if (!rec) continue;
        const resp = await fetch(`${API_BASE}/delete-recipe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipeName: rec.name, cognito_id: cognitoId }),
        });
        if (!resp.ok) console.warn("Delete failed for", rec.name);
      }
      await fetchRecipeData();
      setSelectedRecipeIds(new Set());
    } catch (e) {
      console.error("Error deleting recipes:", e);
      alert("Could not delete recipes.");
    } finally {
      setDeleteOpen(false);
    }
  };

  const handleCreateRecipe = async (newRecipe) => {
    if (!cognitoId) return;
    try {
      const payload = {
        recipe: newRecipe.name,
        upb: newRecipe.unitsPerBatch,
        ingredients: newRecipe.ingredients.map((i) => i.name),
        quantities: newRecipe.ingredients.map((i) => i.quantity),
        units: newRecipe.ingredients.map((i) => i.unit),
        cognito_id: cognitoId,
      };
      const res = await fetch(`${API_BASE}/add-recipe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to add recipe");
      await res.json();
      await fetchRecipeData();
      setAddOpen(false);
    } catch (err) {
      console.error("Error submitting recipe:", err);
      alert("Recipe submission failed");
    }
  };

  return (
    <div className="r-wrap">
      <BrandStyles isDark={isDark} />

      <RecipeTable
        recipes={filteredRecipes}
        onOpenDrawer={handleOpenDrawer}
        onEdit={handleEdit}
        selectedRecipeIds={selectedRecipeIds}
        setSelectedRecipeIds={setSelectedRecipeIds}
        onDelete={() => setDeleteOpen(true)}
        onAdd={() => setAddOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isDark={isDark}
      />

      <RecipeDrawer
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        recipe={drawerRecipe}
        type={drawerType}
      />

      <DeleteConfirmationModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        count={selectedRecipeIds.size}
        isDark={isDark}
      />

      <EditRecipeModal
        isOpen={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditingRecipe(null);
        }}
        onSave={handleSaveEdited}
        recipe={editingRecipe}
      />

      <AddRecipeModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleCreateRecipe}
        existingRecipes={recipes}
      />
    </div>
  );
};

export default Recipes;
