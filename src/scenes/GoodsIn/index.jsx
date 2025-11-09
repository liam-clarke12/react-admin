// src/scenes/GoodsIn/index.jsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Autocomplete from "@mui/material/Autocomplete";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";

/* =========================================================================================
   Brand Styles
   ========================================================================================= */
const BrandStyles = () => (
  <style>{`
  .r-wrap { padding: 16px; }
  .r-card {
    background:#fff; border:1px solid #e5e7eb; border-radius:16px;
    box-shadow:0 1px 2px rgba(16,24,40,0.06),0 1px 3px rgba(16,24,40,0.08);
    overflow:hidden;
  }
  .r-head { padding:16px; display:flex; flex-wrap:wrap; gap:10px; align-items:center; justify-content:space-between; border-bottom:1px solid #e5e7eb; }
  .r-title { margin:0; font-weight:900; color:#0f172a; font-size:20px; }
  .r-sub { margin:0; color:#64748b; font-size:12px; }
  .r-pill { font-size:12px; font-weight:800; color:#7C3AED; }
  .r-flex { display:flex; align-items:center; gap:10px; }
  .r-btn-ghost {
    display:inline-flex; align-items:center; gap:8px; padding:8px 12px; font-weight:800; font-size:14px;
    color:#0f172a; border:1px solid #e5e7eb; border-radius:10px; background:#fff; cursor:pointer;
  }
  .r-btn-ghost:hover { background:#f4f1ff; }
  .r-btn-primary {
    padding:10px 16px; font-weight:800; color:#fff; background:#7C3AED; border:0; border-radius:10px;
    box-shadow:0 1px 2px rgba(16,24,40,0.06),0 1px 3px rgba(16,24,40,0.08); cursor:pointer;
  }
  .r-btn-primary:hover { background:#5B21B6; }
  .r-btn-danger { background:#dc2626; }
  .r-btn-danger:hover { background:#b91c1c; }

  /* Table (no horizontal scroll) */
  .r-table-wrap { overflow-x: hidden; }
  table.r-table { width:100%; table-layout: fixed; border-collapse:separate; border-spacing:0; font-size:14px; color:#334155; }
  .r-thead { background:#f8fafc; text-transform:uppercase; letter-spacing:.03em; font-size:12px; color:#64748b; }
  .r-thead th { padding:12px; text-align:left; white-space:nowrap; }
  .r-row { border-bottom:1px solid #e5e7eb; transition: background .15s ease; }
  .r-row:hover { background:#f4f1ff; }
  .r-td { padding:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .r-td--name { font-weight:800; color:#0f172a; }
  .r-qty-badge { display:inline-block; padding:2px 8px; border-radius:10px; background:#f1f5f9; color:#0f172a; font-weight:700; }
  .r-badge-mono { display:inline-block; padding:2px 8px; border-radius:8px; font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size:12px; background:#ede9fe; color:#7C3AED; max-width: 180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .r-actions { text-align:right; }
  .r-chk { width:16px; height:16px; }

  .col-date{width:110px}
  .col-temp{width:80px}
  .col-num{width:120px}
  .col-invoice{width:120px}
  .col-expiry{width:110px}
  .col-batch{width:200px}
  .col-actions{width:160px}

  .r-toolbar { background:#fff; padding:12px 16px; border:1px solid #e5e7eb; border-radius:12px; box-shadow:0 1px 2px rgba(16,24,40,0.06); display:flex; flex-wrap:wrap; gap:10px; align-items:center; }
  .r-input {
    min-width:260px; flex:1; padding:10px 12px; border:1px solid #e5e7eb; border-radius:10px; outline:none;
  }
  .r-input:focus { border-color:#7C3AED; box-shadow:0 0 0 4px rgba(124,58,237,.18); }
  .r-select { padding:10px 12px; border:1px solid #e5e7eb; border-radius:10px; background:#fff; }
  .r-toolbar-gap { margin-top:12px; }

  .r-footer { padding:12px 16px; border-top:1px solid #e5e7eb; display:flex; align-items:center; justify-content:space-between; background:#fff; }
  .r-muted { color:#64748b; font-size:12px; }

  /* Page layout */
  .gi-layout { display:flex; gap:24px; align-items:flex-start; }
  .gi-main { flex:1 1 0%; min-width:0; }
  .gi-side { width:320px; flex-shrink:0; display:flex; flex-direction:column; gap:16px; }
  .gi-card { background:#fff; border:1px solid #e5e7eb; border-radius:16px; box-shadow:0 1px 2px rgba(16,24,40,0.06),0 1px 3px rgba(16,24,40,0.08); padding:16px; }

  /* Modal shell */
  .r-modal-dim { position:fixed; inset:0; background:rgba(0,0,0,.55); display:flex; align-items:center; justify-content:center; z-index:60; padding:16px;}
  .r-modal { background:#fff; border-radius:14px; width:100%; max-width:900px; max-height:90vh; overflow:hidden; box-shadow:0 10px 30px rgba(2,6,23,.22); display:flex; flex-direction:column; }
  .r-mhdr { padding:14px 16px; border-bottom:1px solid #e5e7eb; display:flex; align-items:center; justify-content:space-between; }
  .r-mbody { padding:16px; overflow:auto; background:#fff; }
  .r-mfooter { padding:12px 16px; border-top:1px solid #e5e7eb; background:#f8fafc; display:flex; justify-content:flex-end; gap:10px; }

  /* Add Good form bits in modal */
  .ag-grid { display:grid; gap:12px; grid-template-columns:repeat(4, minmax(0, 1fr)); }
  .ag-field { grid-column: span 2; }
  .ag-field-1 { grid-column: span 1; }
  .ag-field-4 { grid-column: span 4; }
  .ag-label { font-size:12px; color:#64748b; font-weight:800; margin-bottom:6px; display:block; }
  .ag-input, .ag-select { width:100%; padding:10px 12px; border:1px solid #e5e7eb; border-radius:10px; outline:none; }
  .ag-input:focus, .ag-select:focus { border-color:#7C3AED; box-shadow:0 0 0 4px rgba(124,58,237,.18); }

  .ag-row { border:1px solid #e5e7eb; border-radius:12px; padding:12px; background:#fff; }
  .ag-row:nth-child(odd){ background:#f8fafc; }
  `}</style>
);

/* Icons */
const Svg = (p) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" {...p} />;
const EditIcon = (props) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </Svg>
);
const DeleteIcon = (props) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </Svg>
);
const PlusIcon = (props) => (
  <Svg width="18" height="18" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

/* =========================================================================================
   Types & Utils
   ========================================================================================= */
const UnitGroup = Object.freeze({ GRAMS: "grams_group", ML: "ml_group", UNITS: "units_group" });
const unitOptions = [
  { value: "grams", label: "Grams (g)" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "kg", label: "Kilograms (Kg)" },
  { value: "l", label: "Litres (L)" },
  { value: "units", label: "Units" },
];
function toBaseAmount(amount, unit) {
  if (!unit) return Number(amount || 0);
  const u = String(unit).toLowerCase();
  if (u === "kg") return Number(amount || 0) * 1000;
  if (u === "grams" || u === "g") return Number(amount || 0);
  if (u === "l") return Number(amount || 0) * 1000;
  if (u === "ml") return Number(amount || 0);
  return Number(amount || 0);
}
function detectUnitGroup(unit) {
  if (!unit) return UnitGroup.UNITS;
  const u = String(unit).toLowerCase();
  if (u === "kg" || u === "grams" || u === "g") return UnitGroup.GRAMS;
  if (u === "l" || u === "ml") return UnitGroup.ML;
  return UnitGroup.UNITS;
}
function formatDisplayAmount(baseAmount, group) {
  if (group === UnitGroup.GRAMS) {
    if (Math.abs(baseAmount) >= 1000) return { amount: Number((baseAmount / 1000).toFixed(2)), unit: "kg" };
    return { amount: Math.round(baseAmount), unit: "g" };
  }
  if (group === UnitGroup.ML) {
    if (Math.abs(baseAmount) >= 1000) return { amount: Number((baseAmount / 1000).toFixed(2)), unit: "l" };
    return { amount: Math.round(baseAmount), unit: "ml" };
  }
  return { amount: Math.round(baseAmount), unit: "units" };
}

/* =========================================================================================
   Config
   ========================================================================================= */
const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

/* =========================================================================================
   Small Bar List (side stats)
   ========================================================================================= */
const SmallBarList = ({ data = [] }) => {
  if (!data || data.length === 0) return <p className="r-muted">No data available.</p>;
  const maxBase = Math.max(...data.map((d) => Number(d.baseAmount) || 0), 1);
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {data.map((d) => {
        const pct = (Number(d.baseAmount) / maxBase) * 100;
        return (
          <div key={d.ingredient}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>{d.ingredient}</span>
              <span style={{ fontSize: 12, fontWeight: 800 }}>{d.amount} {d.unit}</span>
            </div>
            <div style={{ height: 10, borderRadius: 999, background: "#e5e7eb", overflow: "hidden" }}>
              <span style={{ display: "block", height: "100%", width: `${pct}%`, background: "linear-gradient(180deg, #6366f1, #7C3AED)" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* =========================================================================================
   Main Component
   ========================================================================================= */
export default function GoodsIn() {
  // Auth
  const { cognitoId: cognitoIdFromAuth } = useAuth() || {};
  const cognitoIdFromWindow =
    typeof window !== "undefined" && window.__COGNITO_ID__ ? window.__COGNITO_ID__ : "";
  let cognitoIdFromStorage = "";
  try {
    cognitoIdFromStorage =
      typeof window !== "undefined" ? (localStorage.getItem("cognito_id") || "") : "";
  } catch {}
  const cognitoId = cognitoIdFromAuth || cognitoIdFromWindow || cognitoIdFromStorage || "";

  // Table state
  const [goodsInRows, setGoodsInRows] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState({ field: "date", dir: "desc" });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [fatalMsg, setFatalMsg] = useState("");
  const selectAllCheckboxRef = useRef(null);

  // Edit / Delete
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [originalBarcode, setOriginalBarcode] = useState(null);
  const [originalId, setOriginalId] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // ADD GOODS POPUP
  const [addOpen, setAddOpen] = useState(false);
  const [addTab, setAddTab] = useState(0); // 0 single, 1 multiple

  // single entry state
  const [single, setSingle] = useState({
    date: new Date().toISOString().slice(0,10),
    ingredient: "", // id of ingredient or custom name
    invoiceNumber: "",
    stockReceived: "",
    unit: "grams",
    barCode: "",
    expiryDate: new Date().toISOString().slice(0,10),
    temperature: "N/A",
  });

  // multiple entry state (array of items)
  const blankItem = () => ({
    date: new Date().toISOString().slice(0,10),
    ingredient: "",
    invoiceNumber: single.invoiceNumber || "",
    stockReceived: "",
    unit: "grams",
    barCode: "",
    expiryDate: new Date().toISOString().slice(0,10),
    temperature: "N/A",
  });
  const [multi, setMulti] = useState([blankItem()]);

  // Ingredients (master + custom) and loading states
  const [masterIngredients, setMasterIngredients] = useState([]);
  const [customIngredients, setCustomIngredients] = useState([]);
  const [loadingMaster, setLoadingMaster] = useState(false);
  const [loadingCustom, setLoadingCustom] = useState(false);
  const ingredients = useMemo(
    () => [
      ...masterIngredients.map((i) => ({ ...i, source: "master" })),
      ...customIngredients.map((i) => ({ ...i, source: "custom" })),
    ],
    [masterIngredients, customIngredients]
  );

  // "Add ingredient" dialog & targeting (which slot should receive the new ingredient)
  const [addIngOpen, setAddIngOpen] = useState(false);
  const [addingIng, setAddingIng] = useState(false);
  const [newIngredientName, setNewIngredientName] = useState("");
  const [ingTarget, setIngTarget] = useState(null); // { mode: 'single' } or { mode: 'multi', index: number }

  // Toast
  const [toastOpen, setToastOpen] = useState(false);

  // Helpers
  const computeIngredientInventory = (rows) => {
    const active = (Array.isArray(rows) ? rows : []).filter((r) => r.stockRemaining > 0);
    const map = new Map();
    for (const r of active) {
      const key = r.ingredient;
      const prev = map.get(key) || { ingredient: key, amount: 0, barcode: r.barCode, _date: r.date, unit: r.unit };
      const amount = prev.amount + r.stockRemaining;
      let nextBarcode = prev.barcode;
      let nextDate = prev._date;
      try {
        const prevTime = new Date(prev._date).getTime() || Infinity;
        const curTime = new Date(r.date).getTime() || Infinity;
        if (curTime < prevTime) { nextBarcode = r.barCode; nextDate = r.date; }
      } catch {}
      map.set(key, { ingredient: key, amount, barcode: nextBarcode, _date: nextDate, unit: r.unit });
    }
  };

  const fetchGoodsInData = useCallback(async () => {
    if (!cognitoId) {
      setFatalMsg("Missing cognito_id. Ensure useAuth() provides cognitoId, or set window.__COGNITO_ID__ / localStorage('cognito_id').");
      setGoodsInRows([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const url = `${API_BASE}/goods-in/active?cognito_id=${encodeURIComponent(cognitoId)}`;
      const response = await fetch(url);
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        console.error("[GoodsIn] GET /goods-in/active 400/500:", text);
        throw new Error(text || `Failed to fetch Goods In data (status ${response.status})`);
      }
      const data = await response.json();
      const normalized = (Array.isArray(data) ? data : []).map((row, idx) => {
        const stockRemaining = Number(row.stockRemaining || 0);
        const serverBar = row.barCode ? String(row.barCode) : null;
        return {
          _id: serverBar ? `${serverBar}-${idx}` : `gen-${idx}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          date: row.date ? String(row.date).slice(0, 10) : "",
          expiryDate: row.expiryDate ? String(row.expiryDate).slice(0, 10) : null,
          stockReceived: Number(row.stockReceived || 0),
          stockRemaining,
          processed: stockRemaining === 0 ? "Yes" : "No",
          barCode: serverBar || row.barCode || null,
          invoiceNumber: row.invoice_number ?? row.invoiceNumber ?? null,
          unit: row.unit ?? row.unitName ?? row.unit_label ?? "",
          ingredient: row.ingredient,
          temperature: row.temperature
        };
      });

      setGoodsInRows(normalized);
      computeIngredientInventory(normalized);
      setFatalMsg("");
    } catch (error) {
      console.error("Error fetching Goods In data:", error);
      setFatalMsg(String(error?.message || error));
    } finally { setLoading(false); }
  }, [cognitoId]);

  useEffect(() => { fetchGoodsInData(); }, [fetchGoodsInData]);

  // Fetch ingredients when popup opens
  useEffect(() => {
    if (!addOpen || !cognitoId) return;
    setLoadingMaster(true);
    fetch(`${API_BASE}/ingredients?cognito_id=${cognitoId}`)
      .then(res => { if (!res.ok) throw new Error("Failed to fetch ingredients"); return res.json(); })
      .then(setMasterIngredients)
      .catch(err => console.error("Ingredients master error:", err))
      .finally(() => setLoadingMaster(false));

    setLoadingCustom(true);
    fetch(`${API_BASE}/custom-ingredients?cognito_id=${cognitoId}`)
      .then(res => { if (!res.ok) throw new Error("Failed to fetch custom ingredients"); return res.json(); })
      .then(data => setCustomIngredients(data.map(ci => ({ id: `c-${ci.id}`, name: ci.name }))))
      .catch(err => console.error("Custom ingredients error:", err))
      .finally(() => setLoadingCustom(false));
  }, [addOpen, cognitoId]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let rows = [...goodsInRows];
    if (q) {
      rows = rows.filter((r) => Object.values(r).some(val => String(val).toLowerCase().includes(q)));
    }
    const dir = sortBy.dir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      const fa = a[sortBy.field] ?? "";
      const fb = b[sortBy.field] ?? "";
      if (typeof fa === 'number' && typeof fb === 'number') return (fa - fb) * dir;
      return String(fa).localeCompare(String(fb)) * dir;
    });
    return rows;
  }, [goodsInRows, searchQuery, sortBy]);

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate =
        selectedRows.length > 0 && selectedRows.length < filteredRows.length;
    }
  }, [selectedRows, filteredRows]);

  // Edit/update/delete
  const processRowUpdate = async (newRow, oldRow) => {
    if (!cognitoId) throw new Error("Missing cognito_id for update.");
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
      cognito_id: cognitoId,
    };
    const identifierForPath = oldRow.barCode || newRow.barCode;
    if (!identifierForPath) throw new Error("Barcode is required for update.");
    const url = `${API_BASE}/goods-in/${encodeURIComponent(identifierForPath)}`;
    const response = await fetch(url, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error("[GoodsIn] PUT /goods-in/{id} 400/500:", text);
      throw new Error(text || `Failed to update row (status ${response.status})`);
    }
    await fetchGoodsInData();
  };
  const handleDeleteSelectedRows = async () => {
    if (selectedRows.length === 0) return;
    if (!cognitoId) { alert("Missing cognito_id for delete."); return; }
    try {
      const rowsToDelete = goodsInRows.filter((r) => selectedRows.includes(r._id));
      await Promise.all(rowsToDelete.map((row) =>
        fetch(`${API_BASE}/delete-row`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ barCode: row.barCode, cognito_id: cognitoId }),
        }).then(async (res) => {
          if (!res.ok) {
            const t = await res.text().catch(() => "");
            throw new Error(t || `Soft delete failed for ${row.barCode}`);
          }
        })
      ));
      await fetchGoodsInData();
      setSelectedRows([]); setDeleteOpen(false);
    } catch (err) {
      console.error("Soft delete error:", err);
      alert("Could not delete selected records. Check console for details.");
    }
  };
  const handleEditRow = (row) => {
    setEditingRow({ ...row });
    setOriginalBarcode(row.barCode);
    setOriginalId(row._id);
    setEditDialogOpen(true);
  };
  const handleConfirmEdit = async () => {
    if (!editingRow) return; setUpdating(true);
    try {
      await processRowUpdate(editingRow, { barCode: originalBarcode, _id: originalId });
      setEditDialogOpen(false); setEditingRow(null); setOriginalBarcode(null); setOriginalId(null);
    } catch (err) {
      console.error("Confirm edit failed:", err);
      alert("Update failed. See console for details.");
    } finally { setUpdating(false); }
  };

  const visibleRows = useMemo(() => {
    const start = page * rowsPerPage; return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  const toggleSelectAll = (e) => {
    if (e?.target?.checked) setSelectedRows(filteredRows.map((r) => r._id));
    else setSelectedRows([]);
  };
  const toggleRowSelection = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const totalsByBaseUnitGroup = useMemo(() => {
    const acc = { [UnitGroup.GRAMS]: 0, [UnitGroup.ML]: 0, [UnitGroup.UNITS]: 0, };
    filteredRows.forEach((r) => {
      const group = detectUnitGroup(r.unit);
      const base = toBaseAmount(r.stockRemaining, r.unit);
      acc[group] = (acc[group] || 0) + base;
    });
    return acc;
  }, [filteredRows]);

  const displayTotalsByGroup = useMemo(() => {
    return {
      gramsGroup: formatDisplayAmount(totalsByBaseUnitGroup[UnitGroup.GRAMS] || 0, UnitGroup.GRAMS),
      mlGroup: formatDisplayAmount(totalsByBaseUnitGroup[UnitGroup.ML] || 0, UnitGroup.ML),
      unitsGroup: formatDisplayAmount(totalsByBaseUnitGroup[UnitGroup.UNITS] || 0, UnitGroup.UNITS),
    };
  }, [totalsByBaseUnitGroup]);

  const totalsByIngredient = useMemo(() => {
    const map = new Map();
    goodsInRows.forEach((r) => {
      const key = r.ingredient || "—";
      const prev = map.get(key) || { baseAmount: 0, unitSamples: new Map() };
      prev.baseAmount += toBaseAmount(r.stockRemaining, r.unit);
      prev.unitSamples.set(r.unit || "", (prev.unitSamples.get(r.unit || "") || 0) + 1);
      map.set(key, prev);
    });
    const arr = Array.from(map.entries()).map(([ingredient, { baseAmount, unitSamples }]) => {
      let chosenGroup = UnitGroup.UNITS;
      for (const u of unitOptions.map(o => o.value)) {
        if (unitSamples.has(u)) { chosenGroup = detectUnitGroup(u); break; }
      }
      const disp = formatDisplayAmount(baseAmount, chosenGroup);
      return { ingredient, amount: disp.amount, unit: disp.unit, baseAmount };
    });
    arr.sort((a, b) => b.baseAmount - a.baseAmount);
    return arr.slice(0, 6);
  }, [goodsInRows]);

  const numSelected = selectedRows.length;

  /* ===========================================================
     Add Good(s) Submit
     =========================================================== */
  const resolveIngredientName = (value) => {
    const opt = ingredients.find((i) => String(i.id) === String(value));
    return opt ? opt.name : value;
  };

  const submitSingle = async () => {
    const payload = {
      ...single,
      ingredient: resolveIngredientName(single.ingredient),
      ingredientId: ingredients.find((i) => String(i.id) === String(single.ingredient))?.id ?? null,
      invoiceNumber: single.invoiceNumber || null,
      cognito_id: cognitoId,
    };
    const res = await fetch(`${API_BASE}/submit`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text().catch(()=>"Submit failed"));
  };

  const submitMultiple = async () => {
    const entries = multi.map((it) => ({
      ...it,
      ingredient: resolveIngredientName(it.ingredient),
      ingredientId: ingredients.find((i) => String(i.id) === String(it.ingredient))?.id ?? null,
      invoiceNumber: it.invoiceNumber || null,
    }));
    const res = await fetch(`${API_BASE}/submit/batch`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries, cognito_id: cognitoId }),
    });
    if (res.ok) return;
    // fallback sequential
    for (const e of entries) {
      const r = await fetch(`${API_BASE}/submit`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...e, cognito_id: cognitoId }),
      });
      if (!r.ok) console.warn("submit fallback failed:", await r.text().catch(()=>r.status));
    }
  };

  const handleAddSubmit = async () => {
    try {
      if (!cognitoId) throw new Error("Missing cognito id");
      if (addTab === 0) {
        await submitSingle();
      } else {
        if (!multi.length) throw new Error("Please add at least one item");
        await submitMultiple();
      }
      setAddOpen(false);
      // reset forms
      setSingle({
        date: new Date().toISOString().slice(0,10),
        ingredient: "",
        invoiceNumber: "",
        stockReceived: "",
        unit: "grams",
        barCode: "",
        expiryDate: new Date().toISOString().slice(0,10),
        temperature: "N/A",
      });
      setMulti([blankItem()]);
      // refresh list and toast
      await fetchGoodsInData();
      setToastOpen(true);
    } catch (e) {
      console.error("Add Good(s) submit error:", e);
      alert(String(e?.message || e));
    }
  };

  const addMultiRow = () => setMulti((arr) => [...arr, blankItem()]);
  const removeMultiRow = (idx) => setMulti((arr) => arr.filter((_, i) => i !== idx));

  /* ===========================================================
     Add custom ingredient (dialog) + auto-select into target
     =========================================================== */
  const handleOpenAddIngredient = (target) => {
    setIngTarget(target); // { mode:'single' } or { mode:'multi', index }
    setAddIngOpen(true);
  };

  const handleAddCustomIngredient = async () => {
    if (!newIngredientName.trim() || !cognitoId) return;
    setAddingIng(true);
    try {
      const res = await fetch(`${API_BASE}/custom-ingredients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cognito_id: cognitoId, name: newIngredientName.trim() }),
      });
      if (!res.ok) throw new Error("Failed to add ingredient");

      // refresh custom list
      const updated = await fetch(`${API_BASE}/custom-ingredients?cognito_id=${cognitoId}`);
      if (!updated.ok) throw new Error("Failed to refresh custom ingredients");
      const data = await updated.json();
      const mapped = data.map((ci) => ({ id: `c-${ci.id}`, name: ci.name }));
      setCustomIngredients(mapped);

      // try to find newly added by name
      const justAdded = mapped.find((i) => i.name.toLowerCase() === newIngredientName.trim().toLowerCase());

      // auto-select into the target slot
      if (justAdded) {
        if (ingTarget?.mode === "single") {
          setSingle((s) => ({ ...s, ingredient: justAdded.id }));
        } else if (ingTarget?.mode === "multi" && typeof ingTarget.index === "number") {
          setMulti((arr) => arr.map((v, i) => (i === ingTarget.index ? { ...v, ingredient: justAdded.id } : v)));
        }
      }

      // close dialog
      setAddIngOpen(false);
      setNewIngredientName("");
      setIngTarget(null);
    } catch (err) {
      console.error("add custom ingredient error:", err);
      alert("Could not add ingredient");
    } finally {
      setAddingIng(false);
    }
  };

  return (
    <div className="r-wrap">
      <BrandStyles />

      {/* Errors / Missing Cognito */}
      {!cognitoId && (
        <div className="gi-card" style={{ borderColor:"#fecaca", background:"#fff1f2", color:"#b91c1c", marginBottom:12 }}>
          <strong>Can’t load data:</strong> No cognito_id detected. Ensure your auth provider sets <code>cognitoId</code>.
        </div>
      )}
      {fatalMsg && (
        <div className="gi-card" style={{ borderColor:"#fecaca", background:"#fff1f2", color:"#b91c1c", marginBottom:12 }}>
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
                  <span style={{ display:"inline-flex", alignItems:"center", gap:8 }}>
                    <PlusIcon /> Add Good(s)
                  </span>
                </button>

                {numSelected > 0 && (
                  <div className="r-flex" style={{ background:"#eef2ff", padding:"6px 10px", borderRadius:10 }}>
                    <span className="r-pill">{numSelected} selected</span>
                    <button
                      className="r-btn-ghost"
                      onClick={() => setDeleteOpen(true)}
                      aria-label="Delete selected"
                      title="Delete selected"
                      style={{ color:"#dc2626", borderColor:"#fecaca" }}
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
                placeholder="Search by ingredient, batch code, invoice..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
              />
              <select
                className="r-select"
                value={`${sortBy.field}:${sortBy.dir}`}
                onChange={(e) => {
                  const [field, dir] = e.target.value.split(":");
                  setSortBy({ field, dir });
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
                    <th className="r-td col-date">Date</th>
                    <th className="r-td">Ingredient</th>
                    <th className="r-td col-temp">Temp</th>
                    <th className="r-td col-num">Received</th>
                    <th className="r-td col-num">Remaining</th>
                    <th className="r-td col-invoice">Invoice #</th>
                    <th className="r-td col-expiry">Expiry</th>
                    <th className="r-td col-batch">Batch Code</th>
                    <th className="r-td col-actions r-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr className="r-row">
                      <td className="r-td" colSpan={10} style={{ textAlign: "center" }}>
                        <span className="r-muted">Loading goods in…</span>
                      </td>
                    </tr>
                  ) : visibleRows.length === 0 ? (
                    <tr className="r-row">
                      <td className="r-td" colSpan={10} style={{ textAlign: "center" }}>
                        <span className="r-muted">No records found.</span>
                      </td>
                    </tr>
                  ) : (
                    visibleRows.map((row) => (
                      <tr key={row._id} className="r-row">
                        <td className="r-td">
                          <input
                            className="r-chk"
                            type="checkbox"
                            checked={selectedRows.includes(row._id)}
                            onChange={() => toggleRowSelection(row._id)}
                          />
                        </td>
                        <td className="r-td">{row.date || "-"}</td>
                        <td className="r-td r-td--name">{row.ingredient || "-"}</td>
                        <td className="r-td">{row.temperature ? `${row.temperature}℃` : "-"}</td>
                        <td className="r-td"><span className="r-qty-badge">{row.stockReceived} {row.unit}</span></td>
                        <td className="r-td"><span className="r-qty-badge">{row.stockRemaining} {row.unit}</span></td>
                        <td className="r-td" style={{ color:"#64748b" }}>{row.invoiceNumber || "-"}</td>
                        <td className="r-td" style={{ color:"#64748b" }}>{row.expiryDate || "-"}</td>
                        <td className="r-td"><span className="r-badge-mono">{row.barCode || "-"}</span></td>
                        <td className="r-td r-actions">
                          <button className="r-btn-ghost" onClick={() => handleEditRow(row)} aria-label={`Edit ${row.barCode || row.ingredient}`}>
                            <EditIcon /> Edit
                          </button>
                        </td>
                      </tr>
                    ))
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
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >Prev</button>
                <span className="r-muted">Page {page + 1}</span>
                <button
                  className="r-btn-ghost"
                  onClick={() => setPage(p => ((p + 1) * rowsPerPage < filteredRows.length) ? p + 1 : p)}
                  disabled={(page + 1) * rowsPerPage >= filteredRows.length}
                >Next</button>
                <select
                  className="r-select"
                  value={rowsPerPage}
                  onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
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
            <h3 style={{ margin:0, fontWeight:900, color:"#0f172a" }}>Quick Stats</h3>
            <p className="r-muted" style={{ marginBottom: 10 }}>Top ingredients by remaining stock</p>
            <SmallBarList data={totalsByIngredient} />
          </div>

          <div className="gi-card">
            <h3 style={{ margin:0, fontWeight:900, color:"#0f172a" }}>Total Remaining</h3>
            <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", padding:"6px 0" }}>
              <span className="r-muted">Grams Group</span>
              <strong>{displayTotalsByGroup.gramsGroup.amount} {displayTotalsByGroup.gramsGroup.unit}</strong>
            </div>
            <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", padding:"6px 0" }}>
              <span className="r-muted">ml Group</span>
              <strong>{displayTotalsByGroup.mlGroup.amount} {displayTotalsByGroup.mlGroup.unit}</strong>
            </div>
            <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", padding:"6px 0" }}>
              <span className="r-muted">Units Group</span>
              <strong>{displayTotalsByGroup.unitsGroup.amount} {displayTotalsByGroup.unitsGroup.unit}</strong>
            </div>
          </div>
        </aside>
      </div>

      {/* ===================== EDIT MODAL ===================== */}
      {editDialogOpen && editingRow && (
        <div className="r-modal-dim">
          <div className="r-modal">
            <div className="r-mhdr">
              <h3 className="r-title" style={{ fontSize: 18 }}>Edit Goods In Record</h3>
              <button className="r-btn-ghost" onClick={() => { setEditDialogOpen(false); setEditingRow(null); }}>Close</button>
            </div>
            <div className="r-mbody">
              <div className="ag-grid">
                <div className="ag-field ag-field-4">
                  <label className="ag-label">Ingredient</label>
                  <input className="ag-input" type="text" value={editingRow.ingredient || ""}
                    onChange={(e) => setEditingRow({ ...editingRow, ingredient: e.target.value })}/>
                </div>
                <div className="ag-field">
                  <label className="ag-label">Date</label>
                  <input className="ag-input" type="date" value={editingRow.date || ""}
                    onChange={(e) => setEditingRow({ ...editingRow, date: e.target.value })}/>
                </div>
                <div className="ag-field">
                  <label className="ag-label">Temperature (℃)</label>
                  <input className="ag-input" type="text" value={editingRow.temperature || ""}
                    onChange={(e) => setEditingRow({ ...editingRow, temperature: e.target.value })}/>
                </div>
                <div className="ag-field-1">
                  <label className="ag-label">Stock Received</label>
                  <input className="ag-input" type="number" value={editingRow.stockReceived || ""}
                    onChange={(e) => setEditingRow({ ...editingRow, stockReceived: Number(e.target.value) })}/>
                </div>
                <div className="ag-field-1">
                  <label className="ag-label">Stock Remaining</label>
                  <input className="ag-input" type="number" value={editingRow.stockRemaining || ""}
                    onChange={(e) => setEditingRow({ ...editingRow, stockRemaining: Number(e.target.value) })}/>
                </div>
                <div className="ag-field ag-field-4">
                  <label className="ag-label">Unit</label>
                  <select className="ag-select" value={editingRow.unit || ""} onChange={(e) => setEditingRow({ ...editingRow, unit: e.target.value })}>
                    {unitOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="ag-field">
                  <label className="ag-label">Batch Code</label>
                  <input className="ag-input" type="text" value={editingRow.barCode || ""}
                    onChange={(e) => setEditingRow({ ...editingRow, barCode: e.target.value })}/>
                </div>
                <div className="ag-field">
                  <label className="ag-label">Invoice Number</label>
                  <input className="ag-input" type="text" value={editingRow.invoiceNumber || ""}
                    onChange={(e) => setEditingRow({ ...editingRow, invoiceNumber: e.target.value })}/>
                </div>
                <div className="ag-field ag-field-4">
                  <label className="ag-label">Expiry Date</label>
                  <input className="ag-input" type="date" value={editingRow.expiryDate || ""}
                    onChange={(e) => setEditingRow({ ...editingRow, expiryDate: e.target.value })}/>
                </div>
              </div>
            </div>
            <div className="r-mfooter">
              <button className="r-btn-ghost" onClick={() => { setEditDialogOpen(false); setEditingRow(null); }} disabled={updating}>Cancel</button>
              <button className="r-btn-primary" onClick={handleConfirmEdit} disabled={updating}>{updating ? "Saving..." : "Save Changes"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== DELETE CONFIRM MODAL ===================== */}
      {deleteOpen && numSelected > 0 && (
        <div className="r-modal-dim">
          <div className="r-modal" style={{ maxWidth: 420 }}>
            <div className="r-mhdr">
              <h2 className="r-title" style={{ fontSize: 18 }}>Confirm Deletion</h2>
              <button className="r-btn-ghost" onClick={() => setDeleteOpen(false)}>Close</button>
            </div>
            <div className="r-mbody" style={{ textAlign: "center" }}>
              <div className="r-flex" style={{ width: 60, height: 60, margin:"0 auto", alignItems:"center", justifyContent:"center", background:"#fee2e2", color:"#dc2626", borderRadius:999 }}>
                <DeleteIcon />
              </div>
              <h3 style={{ fontWeight: 900, color:"#0f172a", marginTop: 10, fontSize:18 }}>
                Delete {numSelected} record{numSelected>1 ? "s" : ""}?
              </h3>
              <p className="r-muted" style={{ marginTop: 6 }}>This is a soft-delete action.</p>
            </div>
            <div className="r-mfooter" style={{ justifyContent:"flex-end" }}>
              <button className="r-btn-ghost" onClick={() => setDeleteOpen(false)}>Cancel</button>
              <button className="r-btn-primary r-btn-danger" onClick={handleDeleteSelectedRows}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== ADD GOOD(S) POPUP ===================== */}
      {addOpen && (
        <div className="r-modal-dim">
          <div className="r-modal">
            <div className="r-mhdr">
              <h3 className="r-title" style={{ fontSize: 18 }}>Add Good(s)</h3>
              <div>
                <Tabs value={addTab} onChange={(_,v)=>setAddTab(v)} sx={{ minHeight: 40, "& .MuiTab-root": { textTransform:"none", fontWeight:800, minHeight:40 } }}>
                  <Tab label="Single" />
                  <Tab label={`Multiple (${multi.length})`} />
                </Tabs>
              </div>
            </div>

            <div className="r-mbody">
              {addTab === 0 ? (
                <div className="ag-grid">
                  <div className="ag-field">
                    <label className="ag-label">Date</label>
                    <input className="ag-input" type="date" value={single.date} onChange={(e)=>setSingle(s=>({...s, date: e.target.value}))}/>
                  </div>

                  <div className="ag-field">
                    <label className="ag-label">Ingredient</label>
                    <Autocomplete
                      options={ingredients}
                      value={ingredients.find(i=>String(i.id)===String(single.ingredient)) || null}
                      onChange={(_, val)=>setSingle(s=>({...s, ingredient: val ? val.id : ""}))}
                      getOptionLabel={(opt)=> (typeof opt==="string" ? opt : opt?.name ?? "")}
                      isOptionEqualToValue={(opt,val)=> (opt?.id ?? opt) === (val?.id ?? val)}
                      loading={loadingMaster || loadingCustom}
                      renderInput={(params)=>(
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
                    <div style={{ textAlign:"right", marginTop:8 }}>
                      <button className="r-btn-ghost" onClick={()=>handleOpenAddIngredient({ mode:"single" })}>Add Ingredient +</button>
                    </div>
                  </div>

                  <div className="ag-field">
                    <label className="ag-label">Invoice Number</label>
                    <input className="ag-input" type="text" value={single.invoiceNumber} onChange={(e)=>setSingle(s=>({...s, invoiceNumber: e.target.value}))}/>
                  </div>

                  <div className="ag-field-1">
                    <label className="ag-label">Stock Received</label>
                    <input className="ag-input" type="number" value={single.stockReceived} onChange={(e)=>setSingle(s=>({...s, stockReceived: e.target.value}))}/>
                  </div>

                  <div className="ag-field-1">
                    <label className="ag-label">Unit</label>
                    <select className="ag-select" value={single.unit} onChange={(e)=>setSingle(s=>({...s, unit: e.target.value}))}>
                      {unitOptions.map(u=><option key={u.value} value={u.value}>{u.label}</option>)}
                    </select>
                  </div>

                  <div className="ag-field">
                    <label className="ag-label">Batch Code</label>
                    <input className="ag-input" type="text" value={single.barCode} onChange={(e)=>setSingle(s=>({...s, barCode: e.target.value}))}/>
                  </div>

                  <div className="ag-field">
                    <label className="ag-label">Expiry Date</label>
                    <input className="ag-input" type="date" value={single.expiryDate} onChange={(e)=>setSingle(s=>({...s, expiryDate: e.target.value}))}/>
                  </div>

                  <div className="ag-field">
                    <label className="ag-label">Temperature (℃)</label>
                    <input className="ag-input" type="text" value={single.temperature} onChange={(e)=>setSingle(s=>({...s, temperature: e.target.value}))}/>
                  </div>
                </div>
              ) : (
                <div style={{ display:"grid", gap:12 }}>
                  {multi.map((it, idx)=>(
                    <div key={idx} className="ag-row">
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                        <strong>Good {idx+1}</strong>
                        <IconButton size="small" onClick={()=>removeMultiRow(idx)}><DeleteIcon /></IconButton>
                      </div>
                      <div className="ag-grid">
                        <div className="ag-field">
                          <label className="ag-label">Date</label>
                          <input className="ag-input" type="date" value={it.date} onChange={(e)=>setMulti(arr=> arr.map((v,i)=> i===idx ? {...v, date:e.target.value} : v))}/>
                        </div>

                        <div className="ag-field">
                          <label className="ag-label">Ingredient</label>
                          <Autocomplete
                            options={ingredients}
                            value={ingredients.find(i=>String(i.id)===String(it.ingredient)) || null}
                            onChange={(_, val)=>setMulti(arr=> arr.map((v,i)=> i===idx ? {...v, ingredient: val ? val.id : ""} : v))}
                            getOptionLabel={(opt)=> (typeof opt==="string" ? opt : opt?.name ?? "")}
                            isOptionEqualToValue={(opt,val)=> (opt?.id ?? opt) === (val?.id ?? val)}
                            loading={loadingMaster || loadingCustom}
                            renderInput={(params)=>(
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
                          <div style={{ textAlign:"right", marginTop:8 }}>
                            <button className="r-btn-ghost" onClick={()=>handleOpenAddIngredient({ mode:"multi", index: idx })}>Add Ingredient +</button>
                          </div>
                        </div>

                        <div className="ag-field">
                          <label className="ag-label">Invoice Number</label>
                          <input className="ag-input" type="text" value={it.invoiceNumber} onChange={(e)=>setMulti(arr=> arr.map((v,i)=> i===idx ? {...v, invoiceNumber: e.target.value} : v))}/>
                        </div>

                        <div className="ag-field-1">
                          <label className="ag-label">Stock Received</label>
                          <input className="ag-input" type="number" value={it.stockReceived} onChange={(e)=>setMulti(arr=> arr.map((v,i)=> i===idx ? {...v, stockReceived: e.target.value} : v))}/>
                        </div>

                        <div className="ag-field-1">
                          <label className="ag-label">Unit</label>
                          <select className="ag-select" value={it.unit} onChange={(e)=>setMulti(arr=> arr.map((v,i)=> i===idx ? {...v, unit: e.target.value} : v))}>
                            {unitOptions.map(u=><option key={u.value} value={u.value}>{u.label}</option>)}
                          </select>
                        </div>

                        <div className="ag-field">
                          <label className="ag-label">Batch Code</label>
                          <input className="ag-input" type="text" value={it.barCode} onChange={(e)=>setMulti(arr=> arr.map((v,i)=> i===idx ? {...v, barCode: e.target.value} : v))}/>
                        </div>

                        <div className="ag-field">
                          <label className="ag-label">Expiry Date</label>
                          <input className="ag-input" type="date" value={it.expiryDate} onChange={(e)=>setMulti(arr=> arr.map((v,i)=> i===idx ? {...v, expiryDate: e.target.value} : v))}/>
                        </div>

                        <div className="ag-field">
                          <label className="ag-label">Temperature (℃)</label>
                          <input className="ag-input" type="text" value={it.temperature} onChange={(e)=>setMulti(arr=> arr.map((v,i)=> i===idx ? {...v, temperature: e.target.value} : v))}/>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div>
                    <button className="r-btn-ghost" onClick={addMultiRow}><PlusIcon /> Add another</button>
                  </div>
                </div>
              )}
            </div>

            <div className="r-mfooter">
              <button className="r-btn-ghost" onClick={()=>setAddOpen(false)}>Cancel</button>
              <button className="r-btn-primary" onClick={handleAddSubmit}>
                {addTab===0 ? "Add Good" : `Add ${multi.length} Good(s)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Ingredient dialog */}
      <Dialog
        open={addIngOpen}
        onClose={()=>{ setAddIngOpen(false); setIngTarget(null); }}
        fullWidth
        PaperProps={{ sx:{ borderRadius: 14, border: "1px solid #e5e7eb" } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#0f172a" }}>Add New Ingredient</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Ingredient Name"
            fullWidth
            value={newIngredientName}
            onChange={(e)=>setNewIngredientName(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={()=>{ setAddIngOpen(false); setIngTarget(null); }} disabled={addingIng} sx={{ textTransform:"none", fontWeight:700 }}>
            Cancel
          </Button>
          <Button
            onClick={handleAddCustomIngredient}
            disabled={addingIng || !newIngredientName.trim()}
            variant="contained"
            sx={{
              textTransform:"none", fontWeight:800, borderRadius:999, px:3,
              background:"linear-gradient(180deg, #7C3AED, #5B21B6)",
              "&:hover":{ background:"#5B21B6" }
            }}
            startIcon={addingIng ? <CircularProgress size={18} sx={{ color:"#fff" }} /> : null}
          >
            {addingIng ? "Adding…" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={2500}
        onClose={()=>setToastOpen(false)}
        anchorOrigin={{ vertical:"top", horizontal:"right" }}
      >
        <Alert
          onClose={()=>setToastOpen(false)}
          severity="success"
          sx={{ fontWeight:700, borderRadius:2, "& .MuiAlert-icon": { color:"#7C3AED" } }}
        >
          Added successfully!
        </Alert>
      </Snackbar>
    </div>
  );
}
