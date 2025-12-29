// src/scenes/goodsout/GoodsOut.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
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
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import { useAuth } from "../../contexts/AuthContext";
import * as yup from "yup";
import { Formik, FieldArray } from "formik";

/* =====================================================================
   Brand Styles (includes FORM + MODAL styles) + DARK MODE
   - Reads localStorage "theme-mode" = "dark"
   - Listens for window "themeChanged" event
   ===================================================================== */
const BrandStyles = ({ isDark }) => (
  <style>{`
  :root{
    --bg: ${isDark ? "#0b1220" : "#f3f4f6"};
    --card: ${isDark ? "#0f172a" : "#fff"};
    --card2: ${isDark ? "rgba(255,255,255,0.02)" : "#fff"};
    --border: ${isDark ? "#1f2a44" : "#e5e7eb"};
    --text: ${isDark ? "#e5e7eb" : "#0f172a"};
    --text2: ${isDark ? "#cbd5e1" : "#334155"};
    --muted: ${isDark ? "#94a3b8" : "#64748b"};
    --hover: ${isDark ? "rgba(124,58,237,0.14)" : "#f4f1ff"};
    --thead: ${isDark ? "rgba(255,255,255,0.03)" : "#f8fafc"};
    --chip: ${isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9"};
    --primary: #7C3AED;
    --primary2: #5B21B6;
    --danger: #dc2626;
    --danger2: #b91c1c;
  }

  .r-wrap { padding: 16px; background: var(--bg); min-height: calc(100vh - 0px); color: var(--text); }
  .r-card {
    background:var(--card);
    border:1px solid var(--border);
    border-radius:16px;
    box-shadow:0 1px 2px rgba(16,24,40,${isDark ? "0.22" : "0.06"}),0 1px 3px rgba(16,24,40,${isDark ? "0.28" : "0.08"});
    overflow:hidden;
  }
  .r-head { padding:16px; display:flex; flex-wrap:wrap; gap:10px; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border); background: var(--card2); }
  .r-title { margin:0; font-weight:900; color:var(--text); font-size:20px; }
  .r-sub { margin:0; color:var(--muted); font-size:12px; }
  .r-pill { font-size:12px; font-weight:900; color:var(--primary); }
  .r-flex { display:flex; align-items:center; gap:10px; }

  /* Buttons */
  .r-btn-ghost {
    display:inline-flex; align-items:center; gap:8px; padding:8px 12px; font-weight:900; font-size:14px;
    color:var(--text);
    border:1px solid var(--border);
    border-radius:10px;
    background:${isDark ? "rgba(255,255,255,0.03)" : "#fff"};
    cursor:pointer;
  }
  .r-btn-ghost:hover { background: var(--hover); }

  .r-btn-primary {
    display:inline-flex; align-items:center; gap:8px;
    padding:10px 16px; font-weight:900; color:#fff;
    background: linear-gradient(180deg, var(--primary), var(--primary2));
    border:0; border-radius:10px; cursor:pointer;
    box-shadow:0 4px 12px rgba(124,58,237,0.25);
  }
  .r-btn-primary:hover {
    background: linear-gradient(180deg, var(--primary2), var(--primary2));
  }

  .r-btn-danger { background:var(--danger); }
  .r-btn-danger:hover { background:var(--danger2); }

  /* Search toolbar */
  .r-toolbar {
    background:var(--card);
    padding:12px 16px;
    border:1px solid var(--border);
    border-radius:12px;
    display:flex; flex-wrap:wrap; gap:10px; align-items:center;
    margin: 12px 16px 0;
    box-shadow:0 1px 2px rgba(16,24,40,${isDark ? "0.22" : "0.06"});
  }
  .r-input {
    min-width:260px; flex:1;
    padding:10px 12px;
    border:1px solid var(--border);
    border-radius:10px;
    outline:none;
    background:${isDark ? "rgba(255,255,255,0.03)" : "#fff"};
    color:var(--text);
  }
  .r-input::placeholder { color:${isDark ? "rgba(148,163,184,0.85)" : "#94a3b8"}; }
  .r-input:focus { border-color:var(--primary); box-shadow:0 0 0 4px rgba(124,58,237,.18); }
  .r-select {
    padding:10px 12px;
    border:1px solid var(--border);
    border-radius:10px;
    background:${isDark ? "rgba(255,255,255,0.03)" : "#fff"};
    color:var(--text);
  }
  .r-toolbar-gap { margin-top:12px; }

  /* Modal shell */
  .go-modal-dim {
    position:fixed; inset:0;
    background:rgba(0,0,0,0.55);
    display:flex; align-items:center; justify-content:center;
    z-index:200000;
    padding:20px;
  }
  .go-modal {
    background:var(--card);
    border:1px solid var(--border);
    width:100%; max-width:560px;
    max-height:92vh; overflow:hidden;
    border-radius:18px;
    display:flex; flex-direction:column;
    box-shadow:0 18px 40px rgba(0,0,0,${isDark ? "0.45" : "0.35"});
  }
  .go-mhdr {
    padding:20px 24px;
    border-bottom:1px solid var(--border);
    display:flex; align-items:center; justify-content:space-between;
    background: var(--card2);
  }
  .go-mbody {
    padding:20px 24px;
    overflow:auto;
    color: var(--text2);
  }
  .go-mfooter {
    border-top:1px solid var(--border);
    padding:14px 20px;
    display:flex; justify-content:flex-end; gap:12px;
    background:${isDark ? "rgba(255,255,255,0.02)" : "#f8fafc"};
  }

  /* Tabs */
  .go-tabs { display:inline-flex; background:${isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0"}; padding:4px; border-radius:999px; gap:4px; margin-bottom:18px; }
  .go-tab {
    border:none; background:transparent;
    padding:6px 14px; border-radius:999px;
    cursor:pointer;
    font-weight:800; font-size:13px;
    color:var(--muted);
  }
  .go-tab.active {
    background:${isDark ? "rgba(255,255,255,0.06)" : "#fff"};
    color:var(--primary);
    box-shadow:0 1px 3px rgba(16,24,40,.12);
  }

  /* Fields */
  .go-grid { display:grid; grid-template-columns:repeat(12, 1fr); gap:20px; }
  .col-6 { grid-column:span 6; }
  .col-12 { grid-column:span 12; }
  @media(max-width:900px){
    .col-6 { grid-column:span 12; }
  }
  .go-field { display:flex; flex-direction:column; }
  .go-label { font-size:13px; font-weight:800; margin-bottom:6px; color:${isDark ? "#cbd5e1" : "#475569"}; }
  .go-input, .go-select {
    padding:12px 14px; border-radius:12px;
    border:1px solid var(--border);
    background:${isDark ? "rgba(255,255,255,0.03)" : "#f8fafc"};
    color:var(--text);
    font-size:14px; outline:none;
  }
  .go-input::placeholder { color:${isDark ? "rgba(148,163,184,0.85)" : "#94a3b8"}; }
  .go-input:focus, .go-select:focus {
    border-color:var(--primary);
    box-shadow:0 0 0 4px rgba(124,58,237,.18);
  }
  .go-error { color:#ef4444; font-size:12px; margin-top:6px; }

  /* Multi rows */
  .go-row {
    border:1px solid var(--border);
    background:${isDark ? "rgba(255,255,255,0.02)" : "#f8fafc"};
    padding:14px;
    border-radius:12px;
    margin-bottom:14px;
  }
  .go-row-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; color:var(--text); }
  .go-row-remove { border:none; background:none; color:#ef4444; cursor:pointer; font-size:12px; font-weight:800; }

  /* Toast */
  .go-toast {
    position:fixed; top:16px; right:16px;
    background:${isDark ? "#0b1220" : "#0f172a"};
    border:1px solid ${isDark ? "#1f2a44" : "transparent"};
    color:#e5e7eb;
    padding:10px 14px; border-radius:999px;
    animation:toastIn .2s forwards;
    z-index:10000; font-size:13px;
  }
  @keyframes toastIn {
    from { opacity:0; transform:translateY(-12px); }
    to { opacity:1; transform:translateY(0); }
  }

  /* DataGrid */
  .dg-wrap { height: 70vh; min-width: 750px; }
  .dg-wrap .MuiDataGrid-root { border:0; background: transparent; color: var(--text2); }

  /* ===== FIX: FORCE HEADER ROW TO FOLLOW DARK MODE ===== */
  .dg-wrap .MuiDataGrid-columnHeaders,
  .dg-wrap .MuiDataGrid-columnHeadersInner,
  .dg-wrap .MuiDataGrid-columnHeader,
  .dg-wrap .MuiDataGrid-columnHeaderTitleContainer{
    background: var(--thead) !important;
  }
  .dg-wrap .MuiDataGrid-columnHeaders{
    border-bottom:1px solid var(--border) !important;
  }
  .dg-wrap .MuiDataGrid-columnHeaderTitle,
  .dg-wrap .MuiDataGrid-columnHeaderTitleContainerContent,
  .dg-wrap .MuiDataGrid-sortIcon,
  .dg-wrap .MuiDataGrid-menuIcon,
  .dg-wrap .MuiDataGrid-iconButtonContainer{
    color: var(--muted) !important;
  }

  .dg-wrap .MuiDataGrid-cell{ border-bottom:1px solid var(--border); }
  .dg-wrap .MuiCheckbox-root, .dg-wrap .MuiSvgIcon-root{ color: ${isDark ? "#cbd5e1" : "#334155"}; }

  /* Sidebar stats */
  .stat-card {
    padding:16px;
    border-radius:16px;
    border:1px solid var(--border);
    background:${isDark ? "rgba(255,255,255,0.02)" : "#f8fafc"};
  }
  .stat-accent {
    background:${isDark
      ? "linear-gradient(180deg, rgba(124,58,237,0.12), rgba(236,72,153,0.08))"
      : "linear-gradient(180deg,#eef2ff,#fdf2ff)"};
  }
  .stat-title {
    font-size:12px;
    font-weight:900;
    color:var(--muted);
    margin:0 0 4px 0;
    text-transform:uppercase;
    letter-spacing:0.06em;
  }
  .stat-value {
    font-size:28px;
    font-weight:900;
    color:var(--text);
    margin:0 0 4px 0;
  }
  .stat-sub {
    font-size:12px;
    color:${isDark ? "rgba(148,163,184,0.9)" : "#94a3b8"};
    margin:0;
  }
  .stat-row {
    display:flex;
    align-items:center;
    justify-content:space-between;
    padding:4px 0;
  }
  .stat-kpi {
    font-size:13px;
    font-weight:900;
    color:var(--text);
  }

  .r-footer {
    padding:12px 16px;
    display:flex;
    align-items:center;
    justify-content:space-between;
    border-top:1px solid var(--border);
    background:${isDark ? "rgba(255,255,255,0.02)" : "#f8fafc"};
    gap:12px;
    flex-wrap:wrap;
  }
  .r-muted {
    font-size:12px;
    color:${isDark ? "rgba(148,163,184,0.9)" : "#94a3b8"};
  }

  /* Layout */
  .gi-layout { display:flex; gap:24px; align-items:flex-start; }
  .gi-main { flex:1 1 0%; min-width:0; }
  .gi-side { width:320px; flex:0 0 320px; position:sticky; top:16px; display:flex; flex-direction:column; gap:12px; }
  `}</style>
);

/* =====================================================================
   HARD BLOCK MODAL (NO PROCEED)
   ===================================================================== */
const HardBlockModal = ({ open, recipe, need, have, onClose, isDark }) => {
  if (!open) return null;
  return createPortal(
    <div className="go-modal-dim" onClick={onClose}>
      <div className="go-modal" onClick={(e) => e.stopPropagation()}>
        <div className="go-mhdr">
          <h3 style={{ margin: 0, fontWeight: 900, color: "var(--text)" }}>
            Insufficient Finished Units
          </h3>
          <button className="r-btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="go-mbody">
          <p
            style={{
              background: isDark ? "rgba(220,38,38,0.10)" : "#fef2f2",
              border: `1px solid ${isDark ? "rgba(220,38,38,0.35)" : "#fecaca"}`,
              padding: "12px",
              borderRadius: "12px",
              color: isDark ? "#fecaca" : "#b91c1c",
              fontWeight: 800,
              marginBottom: "16px",
            }}
          >
            You’re trying to send out more <strong>{recipe}</strong> units than are currently
            available.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginBottom: "14px",
            }}
          >
            <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "10px 12px" }}>
              <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 900, textTransform: "uppercase" }}>
                Requested
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "var(--text)" }}>{need}</div>
            </div>
            <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "10px 12px" }}>
              <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 900, textTransform: "uppercase" }}>
                Available
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "var(--text)" }}>{have}</div>
            </div>
          </div>

          <p style={{ fontSize: 13, color: "var(--text2)" }}>
            Please produce more <strong>{recipe}</strong> before recording these goods out.
          </p>
        </div>

        <div className="go-mfooter">
          <button className="r-btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

/* =====================================================================
   TOAST
   ===================================================================== */
const Toast = ({ open, children, onClose }) => {
  if (!open) return null;
  return createPortal(
    <div className="go-toast" onClick={onClose}>
      {children}
    </div>,
    document.body
  );
};

/* =====================================================================
   GOODS OUT FORM (Single + Multiple) — Integrated Modal
   ===================================================================== */

const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

const goodsOutSchema = yup.object().shape({
  date: yup.string().required("Date is required"),
  recipe: yup.string().required("Recipe is required"),
  stockAmount: yup
    .number()
    .typeError("Must be a number")
    .positive("Must be positive")
    .required("Amount is required"),
  recipients: yup.string().required("Recipient is required"),
});

const multiGoodsOutSchema = yup.object().shape({
  items: yup.array().of(goodsOutSchema).min(1, "You must add at least one row"),
});

/* Fetch available units from Production Log */
const useAvailableUnitsFetcher = (cognitoId) => {
  return useCallback(
    async (recipeName) => {
      if (!cognitoId || !recipeName) return 0;
      try {
        const res = await fetch(
          `${API_BASE}/production-log/active?cognito_id=${encodeURIComponent(cognitoId)}`
        );
        if (!res.ok) throw new Error("Failed to fetch production log");

        const rows = await res.json();
        let total = 0;

        (Array.isArray(rows) ? rows : []).forEach((r) => {
          const rName = r.recipe ?? r.recipe_name ?? r.name ?? "";
          if ((rName || "").trim() !== recipeName.trim()) return;

          const br = Number(r.batchRemaining ?? r.batch_remaining ?? r.units_per_batch_total ?? 0);
          const waste = Number(r.units_of_waste ?? r.unitsOfWaste ?? 0);
          const out = Number(r.units_out ?? r.unitsOut ?? 0);
          const apiUnits = Number(r.units_remaining ?? r.unitsRemaining ?? NaN);

          const remain = Number.isFinite(apiUnits) ? apiUnits : Math.max(0, br - waste - out);
          if (Number.isFinite(remain)) total += remain;
        });

        return total;
      } catch (err) {
        console.error("[AvailCheck] failed:", err);
        return 0;
      }
    },
    [cognitoId]
  );
};

/* =====================================================================
   Helpers
   ===================================================================== */
const nf = (n) => new Intl.NumberFormat().format(n ?? 0);

const safeParse = (val, fallback) => {
  if (val == null) return fallback;
  if (Array.isArray(val) || (typeof val === "object" && val !== null)) return val;
  if (typeof val === "string") {
    try {
      const trimmed = val.trim();
      if (!trimmed) return fallback;
      const p = JSON.parse(trimmed);
      return p ?? fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
};

const formatToYYYYMMDD = (val) => {
  if (!val) return "";
  try {
    const d = new Date(val);
    if (!isNaN(d)) return d.toISOString().slice(0, 10);
  } catch {}
  const m = String(val).match(/\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : String(val).slice(0, 10);
};

const normalizeRowPairs = (row) => {
  const rawCodes = row.batchcodes ?? row.batchCodes ?? row.codes ?? row.batch_codes;
  const rawQty = row.quantitiesUsed ?? row.quantities ?? row.batchesUsed ?? row.quantities_used;

  const codes = safeParse(rawCodes, []);
  const qty = safeParse(rawQty, []);

  const out = [];

  if (Array.isArray(codes) && codes.length) {
    codes.forEach((c, i) => {
      const code = typeof c === "string" ? c : c?.code || c?.batchCode || `Batch ${i + 1}`;
      const units = Number((Array.isArray(qty) ? qty[i] : qty?.[code]) ?? c?.units ?? c?.qty ?? 0);
      out.push({ code, units });
    });
    return out;
  }

  if (codes && typeof codes === "object") {
    Object.entries(codes).forEach(([code, units]) => {
      out.push({ code, units: Number(units) || 0 });
    });
    return out;
  }

  if (Array.isArray(qty)) {
    return qty.map((u, i) => ({ code: `Batch ${i + 1}`, units: Number(u) || 0 }));
  }

  return [];
};

const buildDrawerItems = (row) =>
  normalizeRowPairs(row).map((it) => ({
    ...it,
    unitsLabel: `${nf(it.units)} units`,
  }));

/* Drawer Portal */
const Portal = ({ children }) =>
  typeof window === "undefined" ? null : createPortal(children, document.body);

/* =====================================================================
   MAIN COMPONENT
   ===================================================================== */
export default function GoodsOut() {
  const { cognitoId } = useAuth();

  // Theme (sync with Topbar)
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme-mode") === "dark");
  useEffect(() => {
    const onThemeChanged = () => setIsDark(localStorage.getItem("theme-mode") === "dark");
    window.addEventListener("themeChanged", onThemeChanged);
    return () => window.removeEventListener("themeChanged", onThemeChanged);
  }, []);

  /* ===========================
     Form Modal State
  ============================= */
  const [formOpen, setFormOpen] = useState(false);
  const [formView, setFormView] = useState("single"); // single | multiple

  const [recipes, setRecipes] = useState([]);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [recipesError, setRecipesError] = useState("");

  const [toastOpen, setToastOpen] = useState(false);

  const [blockOpen, setBlockOpen] = useState(false);
  const [blockInfo, setBlockInfo] = useState({ recipe: "", need: 0, have: 0 });

  const fetchAvailableUnits = useAvailableUnitsFetcher(cognitoId);

  const [goodsOut, setGoodsOut] = useState([]);
  const [fatalMsg, setFatalMsg] = useState("");

  const [selectedRows, setSelectedRows] = useState([]);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerItems, setDrawerItems] = useState([]);
  const [drawerHeader, setDrawerHeader] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState({ field: "date", dir: "desc" });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  /* Fetch recipes for select dropdown */
  useEffect(() => {
    if (!cognitoId) return;
    const loadRecipes = async () => {
      setRecipesLoading(true);
      setRecipesError("");

      try {
        const res = await fetch(`${API_BASE}/recipes?cognito_id=${encodeURIComponent(cognitoId)}`);
        if (!res.ok) throw new Error("Failed to load recipes");
        const data = await res.json();

        const names = Array.isArray(data)
          ? data.map((r) => r.recipe_name ?? r.recipe ?? r.name).filter(Boolean)
          : [];

        setRecipes([...new Set(names)]);
      } catch (err) {
        console.error("Recipe load error:", err);
        setRecipesError("Error loading recipes");
      } finally {
        setRecipesLoading(false);
      }
    };

    loadRecipes();
  }, [cognitoId]);

  /* Fetch goods-out list */
  const fetchGoodsOut = useCallback(async () => {
    if (!cognitoId) return setFatalMsg("Missing cognito_id.");

    try {
      const res = await fetch(`${API_BASE}/goods-out?cognito_id=${encodeURIComponent(cognitoId)}`);
      if (!res.ok) throw new Error("Failed to fetch goods out");

      const raw = await res.json();
      const arr = Array.isArray(raw) ? raw : [];

      const norm = arr.map((r, idx) => {
        const stockAmount = Number(
          r.stockAmount ??
            r.stock_amount ??
            r.unitsOut ??
            r.units_out ??
            r.units ??
            r.qty ??
            0
        );

        const recipe = r.recipe ?? r.recipe_name ?? r.product ?? r.product_name ?? "Unknown";

        const recipients = r.recipients ?? r.customer ?? r.client ?? r.destination ?? "";

        const date =
          formatToYYYYMMDD(r.date ?? r.production_log_date ?? r.created_at ?? r.createdAt) || "";

        return {
          ...r,
          id: r.id ?? `${recipe}-${idx}`,
          stockAmount,
          recipe,
          recipients,
          date,
        };
      });

      setGoodsOut(norm);
      setFatalMsg("");
    } catch (err) {
      console.error("[GoodsOut] fetch failed:", err);
      setFatalMsg(String(err.message || err));
    }
  }, [cognitoId]);

  useEffect(() => {
    fetchGoodsOut();
  }, [fetchGoodsOut]);

  /* ===============================
     Submit — SINGLE
  =============================== */
  const handleSubmitSingle = async (values, helpers) => {
    const need = Number(values.stockAmount) || 0;
    const have = await fetchAvailableUnits(values.recipe);

    if (need > have) {
      setBlockInfo({ recipe: values.recipe, need, have });
      setBlockOpen(true);
      return;
    }

    try {
      const payload = { ...values, cognito_id: cognitoId };

      const res = await fetch(`${API_BASE}/add-goods-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Submit failed");

      helpers.resetForm();
      setFormOpen(false);
      setToastOpen(true);
      await fetchGoodsOut();
    } catch (err) {
      alert("Submission failed. Check console.");
      console.error(err);
    }
  };

  /* ===============================
     Submit — MULTIPLE
  =============================== */
  const handleSubmitBatch = async (values, helpers) => {
    const items = values.items || [];

    const needMap = {};
    items.forEach((item) => {
      const r = item.recipe?.trim();
      if (!r) return;
      needMap[r] = (needMap[r] || 0) + Number(item.stockAmount || 0);
    });

    for (const [recipe, need] of Object.entries(needMap)) {
      const have = await fetchAvailableUnits(recipe);
      if (need > have) {
        setBlockInfo({ recipe, need, have });
        setBlockOpen(true);
        return;
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
      };

      const res = await fetch(`${API_BASE}/add-goods-out-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Batch submit failed");

      helpers.resetForm();
      setFormOpen(false);
      setToastOpen(true);
      await fetchGoodsOut();
    } catch (err) {
      console.error(err);
      alert("Batch submission failed.");
    }
  };

  /* =====================================================================
     FORM MODAL CONTENT
     ===================================================================== */
  const renderFormModal = () => {
    if (!formOpen) return null;

    return createPortal(
      <div className="go-modal-dim" onClick={() => setFormOpen(false)}>
        <div className="go-modal" onClick={(e) => e.stopPropagation()}>
          <div className="go-mhdr">
            <h3 style={{ margin: 0, fontWeight: 900, color: "var(--text)" }}>Add Goods Out</h3>
            <button className="r-btn-ghost" onClick={() => setFormOpen(false)}>
              Close
            </button>
          </div>

          <div className="go-mbody">
            <div className="go-tabs">
              <button
                type="button"
                className={`go-tab ${formView === "single" ? "active" : ""}`}
                onClick={() => setFormView("single")}
              >
                Single
              </button>
              <button
                type="button"
                className={`go-tab ${formView === "multiple" ? "active" : ""}`}
                onClick={() => setFormView("multiple")}
              >
                Multiple
              </button>
            </div>

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
                    <div className="go-grid">
                      <div className="go-field col-6">
                        <label className="go-label">Date</label>
                        <input
                          type="date"
                          name="date"
                          className="go-input"
                          value={values.date}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                        {touched.date && errors.date && <div className="go-error">{errors.date}</div>}
                      </div>

                      <div className="go-field col-6">
                        <label className="go-label">Recipe</label>
                        <select
                          name="recipe"
                          className="go-select"
                          value={values.recipe}
                          onChange={handleChange}
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
                        {touched.recipe && errors.recipe && <div className="go-error">{errors.recipe}</div>}
                      </div>

                      <div className="go-field col-12">
                        <label className="go-label">Amount of Units</label>
                        <input
                          type="number"
                          className="go-input"
                          name="stockAmount"
                          placeholder="0"
                          value={values.stockAmount}
                          onChange={handleChange}
                        />
                        {touched.stockAmount && errors.stockAmount && (
                          <div className="go-error">{errors.stockAmount}</div>
                        )}
                      </div>

                      <div className="go-field col-12">
                        <label className="go-label">Recipient</label>
                        <input
                          type="text"
                          className="go-input"
                          name="recipients"
                          placeholder="Store / Customer"
                          value={values.recipients}
                          onChange={handleChange}
                        />
                        {touched.recipients && errors.recipients && (
                          <div className="go-error">{errors.recipients}</div>
                        )}
                      </div>
                    </div>

                    <div className="go-mfooter">
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
                          {values.items.map((item, idx) => {
                            const itemErrors = errors.items?.[idx] || {};
                            const itemTouched = touched.items?.[idx] || {};

                            return (
                              <div key={idx} className="go-row">
                                <div className="go-row-head">
                                  <strong>Goods Out {idx + 1}</strong>
                                  {values.items.length > 1 && (
                                    <button type="button" className="go-row-remove" onClick={() => remove(idx)}>
                                      Remove
                                    </button>
                                  )}
                                </div>

                                <div className="go-grid">
                                  <div className="go-field col-6">
                                    <label className="go-label">Date</label>
                                    <input
                                      type="date"
                                      className="go-input"
                                      name={`items[${idx}].date`}
                                      value={item.date}
                                      onChange={handleChange}
                                    />
                                    {itemTouched.date && itemErrors.date && (
                                      <div className="go-error">{itemErrors.date}</div>
                                    )}
                                  </div>

                                  <div className="go-field col-6">
                                    <label className="go-label">Recipe</label>
                                    <select
                                      className="go-select"
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
                                    {itemTouched.recipe && itemErrors.recipe && (
                                      <div className="go-error">{itemErrors.recipe}</div>
                                    )}
                                  </div>

                                  <div className="go-field col-12">
                                    <label className="go-label">Amount of Units</label>
                                    <input
                                      type="number"
                                      className="go-input"
                                      name={`items[${idx}].stockAmount`}
                                      value={item.stockAmount}
                                      onChange={handleChange}
                                      placeholder="0"
                                    />
                                    {itemTouched.stockAmount && itemErrors.stockAmount && (
                                      <div className="go-error">{itemErrors.stockAmount}</div>
                                    )}
                                  </div>

                                  <div className="go-field col-12">
                                    <label className="go-label">Recipient</label>
                                    <input
                                      type="text"
                                      className="go-input"
                                      name={`items[${idx}].recipients`}
                                      value={item.recipients}
                                      placeholder="Store / Customer"
                                      onChange={handleChange}
                                    />
                                    {itemTouched.recipients && itemErrors.recipients && (
                                      <div className="go-error">{itemErrors.recipients}</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}

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

                          <div className="go-mfooter">
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
      document.body
    );
  };

  /* Drawer open */
  const openDrawerForRow = (row) => {
    const rr = { ...row, date: formatToYYYYMMDD(row?.date) };
    setSelectedRow(rr);
    setDrawerHeader("Batchcodes");
    setDrawerItems(buildDrawerItems(rr));
    setSearchTerm("");
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedRow(null);
    setDrawerItems([]);
  };

  /* Delete selected rows */
  const handleDelete = async () => {
    try {
      const map = new Map(goodsOut.map((r) => [String(r.id), r]));
      const ids = selectedRows
        .map((rid) => map.get(String(rid)))
        .filter(Boolean)
        .map((r) => r.id)
        .map(Number)
        .filter((n) => !isNaN(n));

      if (!ids.length) {
        setDeleteOpen(false);
        return;
      }

      const res = await fetch(`${API_BASE}/goods-out/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, cognito_id: cognitoId }),
      });

      if (!res.ok) throw new Error("Delete failed");

      await fetchGoodsOut();
      setSelectedRows([]);
      setDeleteOpen(false);
    } catch (err) {
      console.error("Delete failed:", err);
      setDeleteOpen(false);
    }
  };

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
              fontWeight: 800,
              "&:hover": { color: "var(--primary2)" },
            }}
            onClick={() => openDrawerForRow(params.row)}
          >
            Show Batchcodes
          </Typography>
        ),
      },
      { field: "recipients", headerName: "Recipients", flex: 1 },
    ],
    []
  );

  /* Filter + sort */
  const filteredRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let rows = [...goodsOut];

    if (q) {
      rows = rows.filter((r) => Object.values(r).some((v) => String(v).toLowerCase().includes(q)));
    }

    const dir = sortBy.dir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      const fa = a[sortBy.field] ?? "";
      const fb = b[sortBy.field] ?? "";
      if (typeof fa === "number" || typeof fb === "number") {
        return (Number(fa) - Number(fb)) * dir;
      }
      return String(fa).localeCompare(String(fb)) * dir;
    });

    return rows;
  }, [goodsOut, searchQuery, sortBy]);

  const visibleRows = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  /* Stats */
  const stats = useMemo(() => {
    const totalUnits = filteredRows.reduce((s, r) => s + (r.stockAmount || 0), 0);
    const shipments = filteredRows.length;
    const uniq = (arr) => Array.from(new Set(arr.filter(Boolean))).length;
    const uniqueRecipes = uniq(filteredRows.map((r) => r.recipe));
    const uniqueRecipients = uniq(filteredRows.map((r) => r.recipients));
    return { totalUnits, shipments, uniqueRecipes, uniqueRecipients };
  }, [filteredRows]);

  return (
    <div className="r-wrap">
      <BrandStyles isDark={isDark} />

      {renderFormModal()}

      <HardBlockModal
        open={blockOpen}
        recipe={blockInfo.recipe}
        need={blockInfo.need}
        have={blockInfo.have}
        onClose={() => setBlockOpen(false)}
        isDark={isDark}
      />

      <Toast open={toastOpen} onClose={() => setToastOpen(false)}>
        Goods Out recorded successfully!
      </Toast>

      {fatalMsg && (
        <div
          className="r-card"
          style={{
            borderColor: isDark ? "rgba(220,38,38,0.45)" : "#fecaca",
            background: isDark ? "rgba(220,38,38,0.10)" : "#fff1f2",
            color: isDark ? "#fecaca" : "#b91c1c",
            marginBottom: 12,
            padding: 14,
          }}
        >
          <strong>Error:</strong> {fatalMsg}
        </div>
      )}

      <div className="gi-layout">
        <div className="gi-main">
          <div className="r-card">
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
                      borderColor: isDark ? "rgba(220,38,38,0.35)" : "#fecaca",
                      background: isDark ? "rgba(220,38,38,0.10)" : undefined,
                    }}
                  >
                    <DeleteIcon fontSize="small" /> Delete
                  </button>
                )}
              </div>
            </div>

            <div className="r-toolbar">
              <input
                className="r-input"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
              />

              <select
                className="r-select"
                value={`${sortBy.field}:${sortBy.dir}`}
                onChange={(e) => {
                  const [field, dir] = e.target.value.split(":");
                  setSortBy({ field, dir });
                  setPage(0);
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

            <div className="r-toolbar-gap dg-wrap">
              <DataGrid
                rows={visibleRows}
                columns={columns}
                getRowId={(row) => row.id}
                checkboxSelection
                disableRowSelectionOnClick
                rowSelectionModel={selectedRows}
                onRowSelectionModelChange={(m) =>
                  setSelectedRows((Array.isArray(m) ? m : []).map(String))
                }
                hideFooter
                sx={{
                  border: 0,
                  "& .MuiDataGrid-columnSeparator": { display: "none" },
                  "& .MuiDataGrid-virtualScroller": { background: "transparent" },
                  "& .MuiDataGrid-footerContainer": {
                    borderTop: `1px solid ${isDark ? "#1f2a44" : "#e5e7eb"}`,
                  },

                  /* Belt + braces: set header bg + text via sx too */
                  "& .MuiDataGrid-columnHeaders": {
                    backgroundColor: "var(--thead)",
                    color: "var(--muted)",
                    borderBottom: "1px solid var(--border)",
                  },
                  "& .MuiDataGrid-columnHeaderTitle": { color: "var(--muted)", fontWeight: 900 },
                  "& .MuiDataGrid-sortIcon, & .MuiDataGrid-menuIcon": { color: "var(--muted)" },
                }}
              />
            </div>

            <div className="r-footer">
              <span className="r-muted">
                Showing {filteredRows.length === 0 ? 0 : page * rowsPerPage + 1}–
                {Math.min((page + 1) * rowsPerPage, filteredRows.length)} of {filteredRows.length}
              </span>

              <div className="r-flex">
                <button
                  className="r-btn-ghost"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Prev
                </button>

                <span className="r-muted">Page {page + 1}</span>

                <button
                  className="r-btn-ghost"
                  disabled={(page + 1) * rowsPerPage >= filteredRows.length}
                  onClick={() =>
                    setPage((p) => ((p + 1) * rowsPerPage < filteredRows.length ? p + 1 : p))
                  }
                >
                  Next
                </button>

                <select
                  className="r-select"
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setPage(0);
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

        <aside className="gi-side">
          <div className="r-card stat-card stat-accent">
            <p className="stat-title">Total Units Out</p>
            <p className="stat-value">{nf(stats.totalUnits)}</p>
            <p className="stat-sub">Based on filtered data</p>
          </div>

          <div className="r-card stat-card">
            <div className="stat-row">
              <span className="stat-kpi">Shipments</span>
              <span className="stat-kpi">{nf(stats.shipments)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-kpi">Unique Recipes</span>
              <span className="stat-kpi">{nf(stats.uniqueRecipes)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-kpi">Unique Recipients</span>
              <span className="stat-kpi">{nf(stats.uniqueRecipients)}</span>
            </div>
          </div>
        </aside>
      </div>

      {deleteOpen && selectedRows.length > 0 && (
        <Portal>
          <div className="go-modal-dim" onClick={() => setDeleteOpen(false)}>
            <div className="go-modal" onClick={(e) => e.stopPropagation()}>
              <div className="go-mhdr">
                <h3 style={{ margin: 0, fontWeight: 900, color: "var(--text)" }}>
                  Confirm Deletion
                </h3>
                <button className="r-btn-ghost" onClick={() => setDeleteOpen(false)}>
                  Close
                </button>
              </div>

              <div className="go-mbody" style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 60,
                    height: 60,
                    margin: "0 auto",
                    borderRadius: 999,
                    background: isDark ? "rgba(220,38,38,0.12)" : "#fee2e2",
                    border: `1px solid ${isDark ? "rgba(220,38,38,0.35)" : "transparent"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isDark ? "#fecaca" : "#dc2626",
                  }}
                >
                  <DeleteIcon />
                </div>

                <h3 style={{ marginTop: 16, fontWeight: 900, color: "var(--text)" }}>
                  Delete {selectedRows.length} record{selectedRows.length > 1 ? "s" : ""}?
                </h3>

                <p style={{ color: "var(--muted)", fontSize: 13, fontWeight: 700 }}>
                  This is a soft delete.
                </p>
              </div>

              <div className="go-mfooter">
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

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={closeDrawer}
        PaperProps={{
          sx: {
            width: 420,
            borderRadius: "20px 0 0 20px",
            border: `1px solid ${isDark ? "#1f2a44" : "#e5e7eb"}`,
            backgroundColor: isDark ? "#0f172a" : "#fff",
            color: isDark ? "#e5e7eb" : "#0f172a",
            boxShadow: isDark ? "0 24px 48px rgba(0,0,0,0.55)" : "0 24px 48px rgba(15,23,42,0.12)",
          },
        }}
      >
        <Box
          sx={{
            background: "linear-gradient(180deg,#7C3AED,#5B21B6)",
            color: "#fff",
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <MenuOutlinedIcon />
            <Box>
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

        <Box sx={{ p: 2 }}>
          <Card
            variant="outlined"
            sx={{
              borderColor: isDark ? "#1f2a44" : "#e5e7eb",
              backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "#fff",
              color: isDark ? "#e5e7eb" : "#0f172a",
              borderRadius: 2,
              mb: 2,
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
                color: isDark ? "#e5e7eb" : "#0f172a",
                backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#fff",
                "& fieldset": { borderColor: isDark ? "#1f2a44" : "#e5e7eb" },
                "&:hover fieldset": { borderColor: isDark ? "#2a385a" : "#cbd5e1" },
                "&.Mui-focused fieldset": { borderColor: "#7C3AED" },
              },
              "& .MuiInputBase-input::placeholder": {
                color: isDark ? "rgba(148,163,184,0.85)" : "#94a3b8",
                opacity: 1,
              },
            }}
          />

          <Divider sx={{ mb: 2, borderColor: isDark ? "#1f2a44" : "#e5e7eb" }} />

          {drawerItems && drawerItems.length > 0 ? (
            drawerItems
              .filter((i) => (i.code || "").toLowerCase().includes(searchTerm.toLowerCase()))
              .map((it, idx) => (
                <Box
                  key={`${it.code}-${idx}`}
                  sx={{
                    border: `1px solid ${isDark ? "#1f2a44" : "#e5e7eb"}`,
                    backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "#fff",
                    borderRadius: 2,
                    p: 1.5,
                    mb: 1,
                  }}
                >
                  <ListItem
                    secondaryAction={
                      <Box
                        sx={{
                          borderRadius: 999,
                          px: 1.5,
                          py: 0.5,
                          background: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
                          border: `1px solid ${isDark ? "#1f2a44" : "#e5e7eb"}`,
                          fontSize: 12,
                          fontWeight: 900,
                          color: isDark ? "#e5e7eb" : "#0f172a",
                        }}
                      >
                        {it.unitsLabel}
                      </Box>
                    }
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CheckRoundedIcon sx={{ color: "#7C3AED" }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={it.code}
                      primaryTypographyProps={{
                        fontWeight: 900,
                        color: isDark ? "#e5e7eb" : "#0f172a",
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
  );
}
// src/scenes/goodsout/GoodsOut.jsx
"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
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
} from "@mui/material"
import { DataGrid } from "@mui/x-data-grid"
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined"
import CheckRoundedIcon from "@mui/icons-material/CheckRounded"
import DeleteIcon from "@mui/icons-material/Delete"
import CloseIcon from "@mui/icons-material/Close"
import AddIcon from "@mui/icons-material/Add"
import { useAuth } from "@/contexts/AuthContext"
import * as yup from "yup"
import { Formik, FieldArray } from "formik"

const BrandStyles = ({ isDark }: { isDark: boolean }) => (
  <style>{`
  :root{
    --bg: ${isDark ? "#0a0f1e" : "#f8fafc"};
    --card: ${isDark ? "#0f172a" : "#ffffff"};
    --card2: ${isDark ? "rgba(255,255,255,0.02)" : "#fafbfc"};
    --border: ${isDark ? "#1e293b" : "#e2e8f0"};
    --text: ${isDark ? "#f1f5f9" : "#0f172a"};
    --text2: ${isDark ? "#cbd5e1" : "#334155"};
    --muted: ${isDark ? "#94a3b8" : "#64748b"};
    --hover: ${isDark ? "rgba(99,102,241,0.12)" : "#f0f4ff"};
    --thead: ${isDark ? "rgba(255,255,255,0.03)" : "#f8fafc"};
    --chip: ${isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9"};
    --primary: #6366f1;
    --primary2: #4f46e5;
    --danger: #ef4444;
    --danger2: #dc2626;
    --success: #10b981;
  }

  .r-wrap { 
    padding: 24px; 
    background: var(--bg); 
    min-height: 100vh; 
    color: var(--text);
  }
  
  .r-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 16px;
    box-shadow: ${
      isDark
        ? "0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.4)"
        : "0 1px 3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.06)"
    };
    overflow: hidden;
    transition: all 0.2s ease;
  }

  .r-head { 
    padding: 20px 24px; 
    display: flex; 
    flex-wrap: wrap; 
    gap: 16px; 
    align-items: center; 
    justify-content: space-between; 
    border-bottom: 1px solid var(--border); 
    background: var(--card2);
  }
  
  .r-title { 
    margin: 0; 
    font-weight: 800; 
    color: var(--text); 
    font-size: 24px;
    letter-spacing: -0.02em;
  }
  
  .r-sub { 
    margin: 4px 0 0 0; 
    color: var(--muted); 
    font-size: 14px;
    font-weight: 500;
  }
  
  .r-flex { 
    display: flex; 
    align-items: center; 
    gap: 12px;
  }

  /* Buttons */
  .r-btn-ghost {
    display: inline-flex; 
    align-items: center; 
    gap: 8px; 
    padding: 10px 16px; 
    font-weight: 700; 
    font-size: 14px;
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--card);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .r-btn-ghost:hover { 
    background: var(--hover);
    border-color: var(--primary);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.2)"};
  }
  .r-btn-ghost:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .r-btn-primary {
    display: inline-flex; 
    align-items: center; 
    gap: 8px;
    padding: 10px 20px; 
    font-weight: 700; 
    font-size: 14px;
    color: #ffffff;
    background: linear-gradient(135deg, var(--primary), var(--primary2));
    border: 0; 
    border-radius: 10px; 
    cursor: pointer;
    box-shadow: 0 4px 14px ${isDark ? "rgba(99,102,241,0.3)" : "rgba(99,102,241,0.35)"};
    transition: all 0.2s ease;
  }
  .r-btn-primary:hover {
    background: linear-gradient(135deg, var(--primary2), var(--primary));
    transform: translateY(-2px);
    box-shadow: 0 6px 20px ${isDark ? "rgba(99,102,241,0.4)" : "rgba(99,102,241,0.45)"};
  }

  .r-btn-danger { 
    background: linear-gradient(135deg, var(--danger), var(--danger2));
    box-shadow: 0 4px 14px rgba(239,68,68,0.3);
  }
  .r-btn-danger:hover { 
    background: linear-gradient(135deg, var(--danger2), var(--danger));
    box-shadow: 0 6px 20px rgba(239,68,68,0.4);
  }

  /* Search toolbar */
  .r-toolbar {
    background: var(--card);
    padding: 16px 20px;
    border: 1px solid var(--border);
    border-radius: 12px;
    display: flex; 
    flex-wrap: wrap; 
    gap: 12px; 
    align-items: center;
    margin: 16px 24px 0;
    box-shadow: ${isDark ? "0 1px 2px rgba(0,0,0,0.2)" : "0 1px 2px rgba(15,23,42,0.04)"};
  }
  
  .r-input {
    min-width: 280px; 
    flex: 1;
    padding: 11px 14px;
    border: 1px solid var(--border);
    border-radius: 10px;
    outline: none;
    background: ${isDark ? "rgba(255,255,255,0.04)" : "#ffffff"};
    color: var(--text);
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  .r-input::placeholder { 
    color: var(--muted);
    font-weight: 400;
  }
  .r-input:focus { 
    border-color: var(--primary); 
    box-shadow: 0 0 0 3px ${isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.1)"};
    background: var(--card);
  }
  
  .r-select {
    padding: 11px 14px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: ${isDark ? "rgba(255,255,255,0.04)" : "#ffffff"};
    color: var(--text);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .r-select:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px ${isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.1)"};
    outline: none;
  }
  
  .r-toolbar-gap { margin-top: 16px; }

  /* Modal shell */
  .go-modal-dim {
    position: fixed; 
    inset: 0;
    background: ${isDark ? "rgba(0,0,0,0.7)" : "rgba(15,23,42,0.6)"};
    backdrop-filter: blur(4px);
    display: flex; 
    align-items: center; 
    justify-content: center;
    z-index: 200000;
    padding: 20px;
    animation: fadeIn 0.2s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from { 
      opacity: 0; 
      transform: translateY(20px) scale(0.95); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0) scale(1); 
    }
  }
  
  .go-modal {
    background: var(--card);
    border: 1px solid var(--border);
    width: 100%; 
    max-width: 600px;
    max-height: 92vh; 
    overflow: hidden;
    border-radius: 20px;
    display: flex; 
    flex-direction: column;
    box-shadow: ${isDark ? "0 24px 48px rgba(0,0,0,0.6)" : "0 24px 48px rgba(15,23,42,0.15)"};
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  
  .go-mhdr {
    padding: 24px 28px;
    border-bottom: 1px solid var(--border);
    display: flex; 
    align-items: center; 
    justify-content: space-between;
    background: var(--card2);
  }
  
  .go-mbody {
    padding: 24px 28px;
    overflow: auto;
    color: var(--text2);
  }
  
  .go-mfooter {
    border-top: 1px solid var(--border);
    padding: 16px 24px;
    display: flex; 
    justify-content: flex-end; 
    gap: 12px;
    background: ${isDark ? "rgba(255,255,255,0.02)" : "#f8fafc"};
  }

  /* Tabs */
  .go-tabs { 
    display: inline-flex; 
    background: ${isDark ? "rgba(255,255,255,0.05)" : "#e2e8f0"}; 
    padding: 4px; 
    border-radius: 12px; 
    gap: 4px; 
    margin-bottom: 20px;
  }
  
  .go-tab {
    border: none; 
    background: transparent;
    padding: 8px 16px; 
    border-radius: 9px;
    cursor: pointer;
    font-weight: 700; 
    font-size: 13px;
    color: var(--muted);
    transition: all 0.2s ease;
  }
  .go-tab.active {
    background: ${isDark ? "rgba(99,102,241,0.15)" : "#ffffff"};
    color: var(--primary);
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  /* Fields */
  .go-grid { 
    display: grid; 
    grid-template-columns: repeat(12, 1fr); 
    gap: 20px;
  }
  .col-6 { grid-column: span 6; }
  .col-12 { grid-column: span 12; }
  
  @media(max-width: 900px){
    .col-6 { grid-column: span 12; }
  }
  
  .go-field { 
    display: flex; 
    flex-direction: column;
  }
  
  .go-label { 
    font-size: 13px; 
    font-weight: 700; 
    margin-bottom: 8px; 
    color: var(--text);
    letter-spacing: 0.01em;
  }
  
  .go-input, .go-select {
    padding: 12px 14px; 
    border-radius: 10px;
    border: 1px solid var(--border);
    background: ${isDark ? "rgba(255,255,255,0.04)" : "#ffffff"};
    color: var(--text);
    font-size: 14px; 
    outline: none;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  
  .go-input::placeholder { 
    color: var(--muted);
    font-weight: 400;
  }
  
  .go-input:focus, .go-select:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px ${isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.1)"};
    background: var(--card);
  }
  
  .go-error { 
    color: var(--danger); 
    font-size: 12px; 
    margin-top: 6px;
    font-weight: 600;
  }

  /* Multi rows */
  .go-row {
    border: 1px solid var(--border);
    background: ${isDark ? "rgba(255,255,255,0.02)" : "#f8fafc"};
    padding: 16px;
    border-radius: 14px;
    margin-bottom: 16px;
  }
  
  .go-row-head { 
    display: flex; 
    align-items: center; 
    justify-content: space-between; 
    margin-bottom: 14px; 
    color: var(--text);
  }
  
  .go-row-remove { 
    border: none; 
    background: none; 
    color: var(--danger); 
    cursor: pointer; 
    font-size: 13px; 
    font-weight: 700;
    transition: all 0.2s ease;
  }
  .go-row-remove:hover {
    color: var(--danger2);
  }

  /* Toast */
  .go-toast {
    position: fixed; 
    top: 24px; 
    right: 24px;
    background: ${isDark ? "#0f172a" : "#ffffff"};
    border: 1px solid ${isDark ? "#1e293b" : "#e2e8f0"};
    color: ${isDark ? "#f1f5f9" : "#0f172a"};
    padding: 12px 20px; 
    border-radius: 12px;
    animation: toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 10000; 
    font-size: 14px;
    font-weight: 600;
    box-shadow: ${isDark ? "0 10px 40px rgba(0,0,0,0.5)" : "0 10px 40px rgba(15,23,42,0.15)"};
  }
  
  @keyframes toastIn {
    from { opacity: 0; transform: translateY(-16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* DataGrid */
  .dg-wrap { 
    height: 70vh; 
    min-width: 750px;
  }
  
  .dg-wrap .MuiDataGrid-root { 
    border: 0; 
    background: transparent; 
    color: var(--text2);
  }

  .dg-wrap .MuiDataGrid-columnHeaders,
  .dg-wrap .MuiDataGrid-columnHeadersInner,
  .dg-wrap .MuiDataGrid-columnHeader,
  .dg-wrap .MuiDataGrid-columnHeaderTitleContainer {
    background: var(--thead) !important;
  }
  
  .dg-wrap .MuiDataGrid-columnHeaders {
    border-bottom: 1px solid var(--border) !important;
  }
  
  .dg-wrap .MuiDataGrid-columnHeaderTitle,
  .dg-wrap .MuiDataGrid-columnHeaderTitleContainerContent,
  .dg-wrap .MuiDataGrid-sortIcon,
  .dg-wrap .MuiDataGrid-menuIcon,
  .dg-wrap .MuiDataGrid-iconButtonContainer {
    color: var(--muted) !important;
    font-weight: 700 !important;
  }

  .dg-wrap .MuiDataGrid-cell { 
    border-bottom: 1px solid var(--border);
    padding: 16px;
  }
  
  .dg-wrap .MuiCheckbox-root, 
  .dg-wrap .MuiSvgIcon-root { 
    color: ${isDark ? "#cbd5e1" : "#334155"};
  }

  /* Sidebar stats */
  .stat-card {
    padding: 20px;
    border-radius: 16px;
    border: 1px solid var(--border);
    background: ${isDark ? "rgba(255,255,255,0.02)" : "#ffffff"};
    transition: all 0.2s ease;
  }
  
  .stat-card:hover {
    border-color: ${isDark ? "#334155" : "#cbd5e1"};
    box-shadow: ${isDark ? "0 4px 12px rgba(0,0,0,0.3)" : "0 4px 12px rgba(15,23,42,0.08)"};
    transform: translateY(-2px);
  }
  
  .stat-accent {
    background: ${
      isDark
        ? "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.08))"
        : "linear-gradient(135deg, #eef2ff, #f5f3ff)"
    };
    border-color: ${isDark ? "rgba(99,102,241,0.3)" : "#e0e7ff"};
  }
  
  .stat-title {
    font-size: 12px;
    font-weight: 800;
    color: var(--muted);
    margin: 0 0 8px 0;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  
  .stat-value {
    font-size: 32px;
    font-weight: 800;
    color: var(--text);
    margin: 0 0 6px 0;
    letter-spacing: -0.02em;
  }
  
  .stat-sub {
    font-size: 13px;
    color: var(--muted);
    margin: 0;
    font-weight: 500;
  }
  
  .stat-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid var(--border);
  }
  
  .stat-row:last-child {
    border-bottom: none;
  }
  
  .stat-kpi {
    font-size: 14px;
    font-weight: 700;
    color: var(--text);
  }

  .r-footer {
    padding: 16px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid var(--border);
    background: ${isDark ? "rgba(255,255,255,0.02)" : "#f8fafc"};
    gap: 16px;
    flex-wrap: wrap;
  }
  
  .r-muted {
    font-size: 13px;
    color: var(--muted);
    font-weight: 600;
  }

  /* Layout */
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
    flex: 0 0 340px; 
    position: sticky; 
    top: 24px; 
    display: flex; 
    flex-direction: column; 
    gap: 16px;
  }
  
  @media(max-width: 1200px) {
    .gi-layout {
      flex-direction: column;
    }
    .gi-side {
      width: 100%;
      position: static;
    }
  }
  `}</style>
)

/* =====================================================================
   HARD BLOCK MODAL (NO PROCEED)
   ===================================================================== */
const HardBlockModal = ({ open, recipe, need, have, onClose, isDark }: any) => {
  if (!open) return null
  return createPortal(
    <div className="go-modal-dim" onClick={onClose}>
      <div className="go-modal" onClick={(e) => e.stopPropagation()}>
        <div className="go-mhdr">
          <h3 style={{ margin: 0, fontWeight: 800, color: "var(--text)" }}>Insufficient Finished Units</h3>
          <button className="r-btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="go-mbody">
          <p
            style={{
              background: isDark ? "rgba(239,68,68,0.1)" : "#fef2f2",
              border: `1px solid ${isDark ? "rgba(239,68,68,0.3)" : "#fecaca"}`,
              padding: "14px 16px",
              borderRadius: "12px",
              color: isDark ? "#fecaca" : "#dc2626",
              fontWeight: 700,
              marginBottom: "20px",
              fontSize: "14px",
            }}
          >
            You're trying to send out more <strong>{recipe}</strong> units than are currently available.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "14px 16px" }}>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--muted)",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Requested
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", marginTop: "4px" }}>{need}</div>
            </div>
            <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "14px 16px" }}>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--muted)",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Available
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", marginTop: "4px" }}>{have}</div>
            </div>
          </div>

          <p style={{ fontSize: 14, color: "var(--text2)", fontWeight: 500 }}>
            Please produce more <strong>{recipe}</strong> before recording these goods out.
          </p>
        </div>

        <div className="go-mfooter">
          <button className="r-btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/* =====================================================================
   TOAST
   ===================================================================== */
const Toast = ({ open, children, onClose }: any) => {
  if (!open) return null
  return createPortal(
    <div className="go-toast" onClick={onClose}>
      {children}
    </div>,
    document.body,
  )
}

/* =====================================================================
   GOODS OUT FORM (Single + Multiple) — Integrated Modal
   ===================================================================== */

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
const useAvailableUnitsFetcher = (cognitoId: string) => {
  return useCallback(
    async (recipeName: string) => {
      if (!cognitoId || !recipeName) return 0
      try {
        const res = await fetch(`${API_BASE}/production-log/active?cognito_id=${encodeURIComponent(cognitoId)}`)
        if (!res.ok) throw new Error("Failed to fetch production log")

        const rows = await res.json()
        let total = 0
        ;(Array.isArray(rows) ? rows : []).forEach((r: any) => {
          const rName = r.recipe ?? r.recipe_name ?? r.name ?? ""
          if ((rName || "").trim() !== recipeName.trim()) return

          const br = Number(r.batchRemaining ?? r.batch_remaining ?? r.units_per_batch_total ?? 0)
          const waste = Number(r.units_of_waste ?? r.unitsOfWaste ?? 0)
          const out = Number(r.units_out ?? r.unitsOut ?? 0)
          const apiUnits = Number(r.units_remaining ?? r.unitsRemaining ?? Number.NaN)

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

/* =====================================================================
   Helpers
   ===================================================================== */
const nf = (n: number) => new Intl.NumberFormat().format(n ?? 0)

const safeParse = (val: any, fallback: any) => {
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

const formatToYYYYMMDD = (val: any) => {
  if (!val) return ""
  try {
    const d = new Date(val)
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  } catch {}
  const m = String(val).match(/\d{4}-\d{2}-\d{2}/)
  return m ? m[0] : String(val).slice(0, 10)
}

const normalizeRowPairs = (row: any) => {
  const rawCodes = row.batchcodes ?? row.batchCodes ?? row.codes ?? row.batch_codes
  const rawQty = row.quantitiesUsed ?? row.quantities ?? row.batchesUsed ?? row.quantities_used

  const codes = safeParse(rawCodes, [])
  const qty = safeParse(rawQty, [])

  const out = []

  if (Array.isArray(codes) && codes.length) {
    codes.forEach((c: any, i: number) => {
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
    return qty.map((u: any, i: number) => ({ code: `Batch ${i + 1}`, units: Number(u) || 0 }))
  }

  return []
}

const buildDrawerItems = (row: any) =>
  normalizeRowPairs(row).map((it: any) => ({
    ...it,
    unitsLabel: `${nf(it.units)} units`,
  }))

/* Drawer Portal */
const Portal = ({ children }: any) => (typeof window === "undefined" ? null : createPortal(children, document.body))

/* =====================================================================
   MAIN COMPONENT
   ===================================================================== */
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
  ============================= */
  const [formOpen, setFormOpen] = useState(false)
  const [formView, setFormView] = useState("single") // single | multiple

  const [recipes, setRecipes] = useState<string[]>([])
  const [recipesLoading, setRecipesLoading] = useState(false)
  const [recipesError, setRecipesError] = useState("")

  const [toastOpen, setToastOpen] = useState(false)

  const [blockOpen, setBlockOpen] = useState(false)
  const [blockInfo, setBlockInfo] = useState({ recipe: "", need: 0, have: 0 })

  const fetchAvailableUnits = useAvailableUnitsFetcher(cognitoId || "")

  const [goodsOut, setGoodsOut] = useState<any[]>([])
  const [fatalMsg, setFatalMsg] = useState("")

  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerItems, setDrawerItems] = useState<any[]>([])
  const [drawerHeader, setDrawerHeader] = useState("")
  const [selectedRow, setSelectedRow] = useState<any>(null)
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

        const names = Array.isArray(data)
          ? data.map((r: any) => r.recipe_name ?? r.recipe ?? r.name).filter(Boolean)
          : []

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

      const norm = arr.map((r: any, idx: number) => {
        const stockAmount = Number(
          r.stockAmount ?? r.stock_amount ?? r.unitsOut ?? r.units_out ?? r.units ?? r.qty ?? 0,
        )

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
    } catch (err: any) {
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
  const handleSubmitSingle = async (values: any, helpers: any) => {
    const need = Number(values.stockAmount) || 0
    const have = await fetchAvailableUnits(values.recipe)

    if (need > have) {
      setBlockInfo({ recipe: values.recipe, need, have })
      setBlockOpen(true)
      return
    }

    try {
      const payload = { ...values, cognito_id: cognitoId }

      const res = await fetch(`${API_BASE}/add-goods-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Submit failed")

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
  const handleSubmitBatch = async (values: any, helpers: any) => {
    const items = values.items || []

    const needMap: any = {}
    items.forEach((item: any) => {
      const r = item.recipe?.trim()
      if (!r) return
      needMap[r] = (needMap[r] || 0) + Number(item.stockAmount || 0)
    })

    for (const [recipe, need] of Object.entries(needMap)) {
      const have = await fetchAvailableUnits(recipe)
      if (need > have) {
        setBlockInfo({ recipe, need: need as number, have })
        setBlockOpen(true)
        return
      }
    }

    try {
      const payload = {
        entries: items.map((i: any) => ({
          date: i.date,
          recipe: i.recipe,
          stockAmount: i.stockAmount,
          recipients: i.recipients,
        })),
        cognito_id: cognitoId,
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

  const renderFormModal = () => {
    if (!formOpen) return null

    return createPortal(
      <div className="go-modal-dim" onClick={() => setFormOpen(false)}>
        <div className="go-modal" onClick={(e) => e.stopPropagation()}>
          <div className="go-mhdr">
            <h3 style={{ margin: 0, fontWeight: 800, color: "var(--text)" }}>Add Goods Out</h3>
            <button className="r-btn-ghost" onClick={() => setFormOpen(false)}>
              Close
            </button>
          </div>

          <div className="go-mbody">
            <div className="go-tabs">
              <button
                type="button"
                className={`go-tab ${formView === "single" ? "active" : ""}`}
                onClick={() => setFormView("single")}
              >
                Single
              </button>
              <button
                type="button"
                className={`go-tab ${formView === "multiple" ? "active" : ""}`}
                onClick={() => setFormView("multiple")}
              >
                Multiple
              </button>
            </div>

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
                    <div className="go-grid">
                      <div className="go-field col-6">
                        <label className="go-label">Date</label>
                        <input
                          type="date"
                          name="date"
                          className="go-input"
                          value={values.date}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                        {touched.date && errors.date && <div className="go-error">{errors.date}</div>}
                      </div>

                      <div className="go-field col-6">
                        <label className="go-label">Recipe</label>
                        <select name="recipe" className="go-select" value={values.recipe} onChange={handleChange}>
                          <option value="" disabled>
                            {recipesLoading ? "Loading..." : recipesError ? recipesError : "Select recipe…"}
                          </option>
                          {recipes.map((r, idx) => (
                            <option key={idx} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                        {touched.recipe && errors.recipe && <div className="go-error">{errors.recipe}</div>}
                      </div>

                      <div className="go-field col-12">
                        <label className="go-label">Amount of Units</label>
                        <input
                          type="number"
                          className="go-input"
                          name="stockAmount"
                          placeholder="0"
                          value={values.stockAmount}
                          onChange={handleChange}
                        />
                        {touched.stockAmount && errors.stockAmount && (
                          <div className="go-error">{errors.stockAmount}</div>
                        )}
                      </div>

                      <div className="go-field col-12">
                        <label className="go-label">Recipient</label>
                        <input
                          type="text"
                          className="go-input"
                          name="recipients"
                          placeholder="Store / Customer"
                          value={values.recipients}
                          onChange={handleChange}
                        />
                        {touched.recipients && errors.recipients && <div className="go-error">{errors.recipients}</div>}
                      </div>
                    </div>

                    <div className="go-mfooter">
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
                          {values.items.map((item: any, idx: number) => {
                            const itemErrors: any = errors.items?.[idx] || {}
                            const itemTouched: any = touched.items?.[idx] || {}

                            return (
                              <div key={idx} className="go-row">
                                <div className="go-row-head">
                                  <strong>Goods Out {idx + 1}</strong>
                                  {values.items.length > 1 && (
                                    <button type="button" className="go-row-remove" onClick={() => remove(idx)}>
                                      Remove
                                    </button>
                                  )}
                                </div>

                                <div className="go-grid">
                                  <div className="go-field col-6">
                                    <label className="go-label">Date</label>
                                    <input
                                      type="date"
                                      className="go-input"
                                      name={`items[${idx}].date`}
                                      value={item.date}
                                      onChange={handleChange}
                                    />
                                    {itemTouched.date && itemErrors.date && (
                                      <div className="go-error">{itemErrors.date}</div>
                                    )}
                                  </div>

                                  <div className="go-field col-6">
                                    <label className="go-label">Recipe</label>
                                    <select
                                      className="go-select"
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
                                    {itemTouched.recipe && itemErrors.recipe && (
                                      <div className="go-error">{itemErrors.recipe}</div>
                                    )}
                                  </div>

                                  <div className="go-field col-12">
                                    <label className="go-label">Amount of Units</label>
                                    <input
                                      type="number"
                                      className="go-input"
                                      name={`items[${idx}].stockAmount`}
                                      value={item.stockAmount}
                                      onChange={handleChange}
                                      placeholder="0"
                                    />
                                    {itemTouched.stockAmount && itemErrors.stockAmount && (
                                      <div className="go-error">{itemErrors.stockAmount}</div>
                                    )}
                                  </div>

                                  <div className="go-field col-12">
                                    <label className="go-label">Recipient</label>
                                    <input
                                      type="text"
                                      className="go-input"
                                      name={`items[${idx}].recipients`}
                                      value={item.recipients}
                                      placeholder="Store / Customer"
                                      onChange={handleChange}
                                    />
                                    {itemTouched.recipients && itemErrors.recipients && (
                                      <div className="go-error">{itemErrors.recipients}</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}

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

                          <div className="go-mfooter">
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
  const openDrawerForRow = (row: any) => {
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
        .map((r: any) => r.id)
        .map(Number)
        .filter((n) => !isNaN(n))

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
        renderCell: (params: any) => (
          <Typography
            sx={{
              cursor: "pointer",
              color: "var(--primary)",
              fontWeight: 700,
              fontSize: "14px",
              "&:hover": { color: "var(--primary2)", textDecoration: "underline" },
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
      if (typeof fa === "number" || typeof fb === "number") {
        return (Number(fa) - Number(fb)) * dir
      }
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
    const uniq = (arr: any[]) => Array.from(new Set(arr.filter(Boolean))).length
    const uniqueRecipes = uniq(filteredRows.map((r) => r.recipe))
    const uniqueRecipients = uniq(filteredRows.map((r) => r.recipients))
    return { totalUnits, shipments, uniqueRecipes, uniqueRecipients }
  }, [filteredRows])

  return (
    <div className="r-wrap">
      <BrandStyles isDark={isDark} />

      {renderFormModal()}

      <HardBlockModal
        open={blockOpen}
        recipe={blockInfo.recipe}
        need={blockInfo.need}
        have={blockInfo.have}
        onClose={() => setBlockOpen(false)}
        isDark={isDark}
      />

      <Toast open={toastOpen} onClose={() => setToastOpen(false)}>
        Goods Out recorded successfully!
      </Toast>

      {fatalMsg && (
        <div
          className="r-card"
          style={{
            borderColor: isDark ? "rgba(239,68,68,0.4)" : "#fecaca",
            background: isDark ? "rgba(239,68,68,0.1)" : "#fef2f2",
            color: isDark ? "#fecaca" : "#dc2626",
            marginBottom: 16,
            padding: 16,
          }}
        >
          <strong>Error:</strong> {fatalMsg}
        </div>
      )}

      <div className="gi-layout">
        <div className="gi-main">
          <div className="r-card">
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
                      borderColor: isDark ? "rgba(239,68,68,0.3)" : "#fecaca",
                      background: isDark ? "rgba(239,68,68,0.1)" : undefined,
                    }}
                  >
                    <DeleteIcon fontSize="small" /> Delete ({selectedRows.length})
                  </button>
                )}
              </div>
            </div>

            <div className="r-toolbar">
              <input
                className="r-input"
                placeholder="Search goods out records..."
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
                  "& .MuiDataGrid-footerContainer": {
                    borderTop: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
                  },
                  "& .MuiDataGrid-columnHeaders": {
                    backgroundColor: "var(--thead)",
                    color: "var(--muted)",
                    borderBottom: "1px solid var(--border)",
                  },
                  "& .MuiDataGrid-columnHeaderTitle": { color: "var(--muted)", fontWeight: 700 },
                  "& .MuiDataGrid-sortIcon, & .MuiDataGrid-menuIcon": { color: "var(--muted)" },
                }}
              />
            </div>

            <div className="r-footer">
              <span className="r-muted">
                Showing {filteredRows.length === 0 ? 0 : page * rowsPerPage + 1}–
                {Math.min((page + 1) * rowsPerPage, filteredRows.length)} of {filteredRows.length}
              </span>

              <div className="r-flex">
                <button
                  className="r-btn-ghost"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
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

        <aside className="gi-side">
          <div className="r-card stat-card stat-accent">
            <p className="stat-title">Total Units Out</p>
            <p className="stat-value">{nf(stats.totalUnits)}</p>
            <p className="stat-sub">Based on filtered data</p>
          </div>

          <div className="r-card stat-card">
            <div className="stat-row">
              <span className="stat-kpi">Shipments</span>
              <span className="stat-kpi">{nf(stats.shipments)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-kpi">Unique Recipes</span>
              <span className="stat-kpi">{nf(stats.uniqueRecipes)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-kpi">Unique Recipients</span>
              <span className="stat-kpi">{nf(stats.uniqueRecipients)}</span>
            </div>
          </div>
        </aside>
      </div>

      {deleteOpen && selectedRows.length > 0 && (
        <Portal>
          <div className="go-modal-dim" onClick={() => setDeleteOpen(false)}>
            <div className="go-modal" onClick={(e) => e.stopPropagation()}>
              <div className="go-mhdr">
                <h3 style={{ margin: 0, fontWeight: 800, color: "var(--text)" }}>Confirm Deletion</h3>
                <button className="r-btn-ghost" onClick={() => setDeleteOpen(false)}>
                  Close
                </button>
              </div>

              <div className="go-mbody" style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    margin: "0 auto",
                    borderRadius: "50%",
                    background: isDark ? "rgba(239,68,68,0.12)" : "#fee2e2",
                    border: `1px solid ${isDark ? "rgba(239,68,68,0.3)" : "transparent"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isDark ? "#fecaca" : "#dc2626",
                  }}
                >
                  <DeleteIcon fontSize="large" />
                </div>

                <h3 style={{ marginTop: 20, fontWeight: 800, color: "var(--text)", fontSize: "18px" }}>
                  Delete {selectedRows.length} record{selectedRows.length > 1 ? "s" : ""}?
                </h3>

                <p style={{ color: "var(--muted)", fontSize: 14, fontWeight: 500, marginTop: 8 }}>
                  This is a soft delete.
                </p>
              </div>

              <div className="go-mfooter">
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

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={closeDrawer}
        PaperProps={{
          sx: {
            width: 440,
            borderRadius: "20px 0 0 20px",
            border: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
            backgroundColor: isDark ? "#0f172a" : "#ffffff",
            color: isDark ? "#f1f5f9" : "#0f172a",
            boxShadow: isDark ? "0 24px 48px rgba(0,0,0,0.6)" : "0 24px 48px rgba(15,23,42,0.15)",
          },
        }}
      >
        <Box
          sx={{
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            color: "#ffffff",
            p: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <MenuOutlinedIcon />
            <Box>
              <Typography variant="h6" fontWeight={800}>
                {drawerHeader}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 500 }}>
                {selectedRow?.recipe} · {selectedRow?.date}
              </Typography>
            </Box>
          </Box>

          <IconButton onClick={closeDrawer} sx={{ color: "#ffffff" }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ p: 3 }}>
          <Card
            variant="outlined"
            sx={{
              borderColor: isDark ? "#1e293b" : "#e2e8f0",
              backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
              color: isDark ? "#f1f5f9" : "#0f172a",
              borderRadius: 2,
              mb: 3,
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Typography
                fontSize={12}
                color={isDark ? "#94a3b8" : "#64748b"}
                fontWeight={800}
                textTransform="uppercase"
                letterSpacing="0.06em"
              >
                Recipient
              </Typography>
              <Typography fontWeight={800} mt={0.5} fontSize={16}>
                {selectedRow?.recipients}
              </Typography>
            </CardContent>
          </Card>

          <TextField
            size="small"
            placeholder="Search batch code..."
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": {
                color: isDark ? "#f1f5f9" : "#0f172a",
                backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
                "& fieldset": { borderColor: isDark ? "#1e293b" : "#e2e8f0" },
                "&:hover fieldset": { borderColor: isDark ? "#334155" : "#cbd5e1" },
                "&.Mui-focused fieldset": { borderColor: "#6366f1" },
              },
              "& .MuiInputBase-input::placeholder": {
                color: isDark ? "#94a3b8" : "#94a3b8",
                opacity: 1,
              },
            }}
          />

          <Divider sx={{ mb: 3, borderColor: isDark ? "#1e293b" : "#e2e8f0" }} />

          {drawerItems && drawerItems.length > 0 ? (
            drawerItems
              .filter((it) => (it.code || "").toLowerCase().includes(searchTerm.toLowerCase()))
              .map((it, idx) => (
                <Box
                  key={`${it.code}-${idx}`}
                  sx={{
                    border: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
                    backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
                    borderRadius: 2,
                    p: 2,
                    mb: 2,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: isDark ? "#334155" : "#cbd5e1",
                      boxShadow: isDark ? "0 4px 12px rgba(0,0,0,0.3)" : "0 4px 12px rgba(15,23,42,0.08)",
                    },
                  }}
                >
                  <ListItem
                    secondaryAction={
                      <Box
                        sx={{
                          borderRadius: "12px",
                          px: 2,
                          py: 0.75,
                          background: isDark ? "rgba(99,102,241,0.12)" : "#eef2ff",
                          border: `1px solid ${isDark ? "rgba(99,102,241,0.3)" : "#e0e7ff"}`,
                          fontSize: 13,
                          fontWeight: 700,
                          color: isDark ? "#a5b4fc" : "#6366f1",
                        }}
                      >
                        {it.unitsLabel}
                      </Box>
                    }
                    sx={{ p: 0 }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <CheckRoundedIcon sx={{ color: "#6366f1" }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={it.code}
                      primaryTypographyProps={{
                        fontWeight: 700,
                        fontSize: 15,
                        color: isDark ? "#f1f5f9" : "#0f172a",
                      }}
                    />
                  </ListItem>
                </Box>
              ))
          ) : (
            <Typography
              variant="body2"
              sx={{ color: isDark ? "#94a3b8" : "#64748b", textAlign: "center", py: 4, fontWeight: 500 }}
            >
              No batchcodes recorded for this goods-out entry.
            </Typography>
          )}
        </Box>
      </Drawer>
    </div>
  )
}
