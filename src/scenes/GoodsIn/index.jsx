import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";

/* =========================================================================================
   Tailwind-Style CSS Shim (no Tailwind required)
   ========================================================================================= */
const StyleShim = () => (
  <style>{`
    :root {
      --slate-900:#0f172a; --slate-800:#1f2937; --slate-700:#334155; --slate-600:#475569;
      --slate-500:#64748b; --slate-400:#94a3b8; --slate-300:#cbd5e1; --slate-200:#e2e8f0;
      --slate-100:#f1f5f9; --slate-50:#f8fafc;
      --violet-800:#5B21B6; --violet-700:#6D28D9; --violet-600:#7C3AED; --violet-500:#8B5CF6;
      --emerald-800:#065f46; --emerald-100:#d1fae5;
      --red-700:#b91c1c; --red-600:#dc2626; --red-300:#fca5a5;
      --white:#fff; --black:#000;
      --radius-sm: .375rem; --radius-md:.5rem; --radius-lg:.75rem; --radius-xl:1rem;
      --shadow-sm: 0 1px 2px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.08);
      --shadow-md: 0 4px 12px rgba(0,0,0,.08);
      --shadow-lg: 0 10px 22px rgba(124,58,237,.18);
    }

    /* layout & flex */
    .mx-auto{margin-left:auto;margin-right:auto}
    .max-w-screen-2xl{max-width:1536px}
    .flex{display:flex}.flex-col{flex-direction:column}.flex-wrap{flex-wrap:wrap}
    .items-center{align-items:center}.items-baseline{align-items:baseline}
    .justify-between{justify-content:space-between}.justify-center{justify-content:center}
    .flex-1{flex:1 1 0%}.flex-shrink-0{flex-shrink:0}
    .gap-2{gap:.5rem}.gap-4{gap:1rem}.gap-6{gap:1.5rem}

    /* sizing */
    .w-full{width:100%}.w-12{width:3rem}.w-20{width:5rem}.w-24{width:6rem}.w-80{width:20rem}
    .h-12{height:3rem}.h-2\\.5{height:.625rem}.h-6{height:1.5rem}.h-8{height:2rem}
    .min-w-250{min-width:250px}.min-w-1200{min-width:1200px}

    /* spacing */
    .p-3{padding:.75rem}.p-4{padding:1rem}.p-6{padding:1.5rem}.p-8{padding:2rem}
    .px-2{padding-left:.5rem;padding-right:.5rem}
    .px-3{padding-left:.75rem;padding-right:.75rem}
    .px-4{padding-left:1rem;padding-right:1rem}
    .px-6{padding-left:1.5rem;padding-right:1.5rem}
    .py-0\\.5{padding-top:.125rem;padding-bottom:.125rem}
    .py-1{padding-top:.25rem;padding-bottom:.25rem}
    .py-2{padding-top:.5rem;padding-bottom:.5rem}
    .py-3{padding-top:.75rem;padding-bottom:.75rem}
    .py-4{padding-top:1rem;padding-bottom:1rem}
    .py-16{padding-top:4rem;padding-bottom:4rem}

    /* text */
    .text-xs{font-size:.75rem;line-height:1rem}
    .text-sm{font-size:.875rem;line-height:1.25rem}
    .text-lg{font-size:1.125rem;line-height:1.75rem}
    .text-2xl{font-size:1.5rem;line-height:2rem}
    .font-medium{font-weight:500}.font-semibold{font-weight:600}.font-bold{font-weight:700}
    .text-right{text-align:right}.text-center{text-align:center}.uppercase{text-transform:uppercase}
    .truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .font-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace}

    /* colors */
    .text-slate-900{color:var(--slate-900)}.text-slate-800{color:var(--slate-800)}
    .text-slate-700{color:var(--slate-700)}.text-slate-600{color:var(--slate-600)}
    .text-slate-500{color:var(--slate-500)}.text-slate-400{color:var(--slate-400)}
    .text-emerald-800{color:var(--emerald-800)}.text-white{color:#fff}
    .bg-white{background:#fff}.bg-slate-50{background:var(--slate-50)}
    .bg-slate-100{background:var(--slate-100)}.bg-slate-200{background:var(--slate-200)}
    .bg-emerald-100{background:var(--emerald-100)}
    .bg-violet-100{background:rgba(124,58,237,.12)}
    .text-violet-800{color:var(--violet-800)}

    /* borders */
    .border{border:1px solid var(--slate-200)}
    .border-b{border-bottom:1px solid var(--slate-200)}
    .border-slate-200{border-color:var(--slate-200)}
    .border-slate-300{border-color:var(--slate-300)}
    .rounded{border-radius:var(--radius-sm)}
    .rounded-md{border-radius:var(--radius-md)}
    .rounded-lg{border-radius:var(--radius-lg)}
    .rounded-full{border-radius:9999px}

    /* shadows */
    .shadow-sm{box-shadow:var(--shadow-sm)}
    .shadow-md{box-shadow:var(--shadow-md)}
    .shadow-lg{box-shadow:var(--shadow-lg)}
    .shadow-violet{box-shadow:0 8px 20px rgba(124,58,237,0.20)}

    /* effects */
    .hover\\:bg-slate-100:hover{background:var(--slate-100)}
    .hover\\:bg-red-700:hover{background:var(--red-700)}
    .hover\\:text-violet-800:hover{color:var(--violet-800)}
    .disabled\\:opacity-50:disabled{opacity:.5}
    .disabled\\:cursor-not-allowed:disabled{cursor:not-allowed}

    /* inputs / focus */
    .focus\\:ring-2:focus{outline:none;box-shadow:0 0 0 2px rgba(124,58,237,.35)}
    .focus\\:ring-1:focus{outline:none;box-shadow:0 0 0 1px rgba(124,58,237,.35)}
    .focus\\:border-violet-500:focus{border-color:var(--violet-600)}

    /* helpers */
    .bg-grad-violet{background:linear-gradient(135deg,var(--violet-600),var(--violet-800))}
    .overflow-hidden{overflow:hidden}.overflow-x-auto{overflow-x:auto}
    .transition{transition:all .2s ease}.transition-colors{transition:background .15s ease,color .15s ease}
    .animate-spin{animation:spin 1s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
  `}</style>
);

/* =========================================================================================
   Icons
   ========================================================================================= */
const PackageIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16.5 9.4 7.55 4.24" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <path d="m3.29 7 8.71 5 8.71-5" />
    <path d="M12 22V12" />
  </svg>
);
const DeleteIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
);
const EditIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const FilterIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);
const SearchIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const SpinnerIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" className={`animate-spin ${className}`}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

/* =========================================================================================
   JSDoc typedefs (editor only, not runtime)
   ========================================================================================= */
/**
 * @typedef {Object} GoodsInRow
 * @property {string} _id
 * @property {string} date
 * @property {string} ingredient
 * @property {string|number|null} temperature
 * @property {number} stockReceived
 * @property {number} stockRemaining
 * @property {string} unit
 * @property {string|null} expiryDate
 * @property {string|null} barCode
 * @property {string|null} invoiceNumber
 * @property {'Yes'|'No'} processed
 */
/** @typedef {{ value: string, label: string }} UnitOption */
/** @typedef {{ ingredient: string, amount: number, unit: string, baseAmount: number }} IngredientTotal */
/** @typedef {{ amount: number, unit: string }} DisplayTotal */

/* =========================================================================================
   Units utils
   ========================================================================================= */
const UnitGroup = Object.freeze({
  GRAMS: "grams_group",
  ML: "ml_group",
  UNITS: "units_group",
});

/** @type {UnitOption[]} */
const unitOptions = [
  { value: "grams", label: "Grams (g)" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "kg", label: "Kilograms (Kg)" },
  { value: "l", label: "Litres (L)" },
  { value: "units", label: "Units" },
];

/** @param {number} amount @param {string} unit */
function toBaseAmount(amount, unit) {
  if (!unit) return Number(amount || 0);
  const u = String(unit).toLowerCase();
  if (u === "kg") return Number(amount || 0) * 1000;
  if (u === "grams" || u === "g") return Number(amount || 0);
  if (u === "l") return Number(amount || 0) * 1000;
  if (u === "ml") return Number(amount || 0);
  return Number(amount || 0);
}

/** @param {string} unit */
function detectUnitGroup(unit) {
  if (!unit) return UnitGroup.UNITS;
  const u = String(unit).toLowerCase();
  if (u === "kg" || u === "grams" || u === "g") return UnitGroup.GRAMS;
  if (u === "l" || u === "ml") return UnitGroup.ML;
  return UnitGroup.UNITS;
}

/** @param {number} baseAmount @param {string} group */
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
   Small Bar Chart (normalized by base units)
   ========================================================================================= */
/** @param {{data: IngredientTotal[]}} props */
const SmallBarChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return <p className="text-sm text-slate-500">No data available for chart.</p>;
  }
  const maxBase = Math.max(...data.map((d) => Number(d.baseAmount) || 0), 1);
  return (
    <div className="w-full flex flex-col gap-2">
      {data.map((d) => {
        const pct = (Number(d.baseAmount) / maxBase) * 100;
        return (
          <div key={d.ingredient} className="flex items-center gap-2"
               title={`${d.ingredient}: ${d.amount} ${d.unit}`}>
            <p className="text-xs text-slate-600 w-24 truncate">{d.ingredient}</p>
            <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden border border-slate-200">
              <div className="h-full rounded-full transition shadow-sm"
                   style={{
                     width: `${pct}%`,
                     background: "linear-gradient(180deg, var(--violet-600), var(--violet-800))"
                   }}
                   role="meter" aria-valuemin={0} aria-valuemax={100}
                   aria-valuenow={Math.round(pct)}
                   aria-label={`${d.ingredient} ${d.amount} ${d.unit}`}
              />
            </div>
            <p className="text-xs font-semibold text-slate-800 w-20 text-right">
              {d.amount} {d.unit}
            </p>
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
  // ---- Get cognitoId from your auth context (preferred), with graceful fallbacks
  const auth = (typeof useAuth === "function" ? useAuth() : {}) || {};
  const cognitoIdFromAuth = auth?.cognitoId;
  const cognitoIdFromWindow =
    typeof window !== "undefined" && window.__COGNITO_ID__ ? window.__COGNITO_ID__ : "";
  let cognitoIdFromStorage = "";
  try { cognitoIdFromStorage = typeof window !== "undefined" ? (localStorage.getItem("cognito_id") || "") : ""; } catch {}

  const cognitoId = cognitoIdFromAuth || cognitoIdFromWindow || cognitoIdFromStorage || "";

  /** @type {[GoodsInRow[], Function]} */
  const [goodsInRows, setGoodsInRows] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  /** @type {[{field: string, dir: 'asc'|'desc'}, Function]} */
  const [sortBy, setSortBy] = useState({ field: "date", dir: "desc" });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  /** @type {[GoodsInRow|null, Function]} */
  const [editingRow, setEditingRow] = useState(null);
  const [originalBarcode, setOriginalBarcode] = useState(null);
  const [originalId, setOriginalId] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fatalMsg, setFatalMsg] = useState("");
  const selectAllCheckboxRef = useRef(null);

  // (kept for local calc parity)
  /** @param {GoodsInRow[]} rows */
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
      setFatalMsg(
        "Missing cognito_id. The auth context didn’t return one. Ensure useAuth() provides cognitoId, or set window.__COGNITO_ID__ / localStorage('cognito_id')."
      );
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

  /** @param {GoodsInRow} newRow @param {{barCode:string|null,_id:string|null}} oldRow */
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
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
      setSelectedRows([]); setOpenConfirmDialog(false);
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

  const toggleSelectAll = () => {
    if (selectedRows.length === filteredRows.length && filteredRows.length > 0) setSelectedRows([]);
    else setSelectedRows(filteredRows.map((r) => r._id));
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

  /** @type {{[k:string]: DisplayTotal}} */
  const displayTotalsByGroup = useMemo(() => {
    return {
      gramsGroup: formatDisplayAmount(totalsByBaseUnitGroup[UnitGroup.GRAMS] || 0, UnitGroup.GRAMS),
      mlGroup: formatDisplayAmount(totalsByBaseUnitGroup[UnitGroup.ML] || 0, UnitGroup.ML),
      unitsGroup: formatDisplayAmount(totalsByBaseUnitGroup[UnitGroup.UNITS] || 0, UnitGroup.UNITS),
    };
  }, [totalsByBaseUnitGroup]);

  /** @type {IngredientTotal[]} */
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

  return (
    <div className="p-4 max-w-screen-2xl mx-auto">
      <StyleShim />

      {/* Missing cognito banner */}
      {!cognitoId && (
        <div className="p-3 rounded-md" style={{background:"rgba(220,38,38,.08)", border:"1px solid #fecaca", color:"#b91c1c", marginBottom:"1rem"}}>
          <strong>Can’t load data:</strong> No cognito_id detected from useAuth().
          <div className="text-sm" style={{marginTop:".5rem"}}>
            Ensure your auth provider sets <code>cognitoId</code> in <code>useAuth()</code>, or set <code>window.__COGNITO_ID__</code> / <code>localStorage("cognito_id")</code> for fallback.
          </div>
        </div>
      )}
      {fatalMsg && (
        <div className="p-3 rounded-md" style={{background:"rgba(220,38,38,.08)", border:"1px solid #fecaca", color:"#b91c1c", marginBottom:"1rem"}}>
          <strong>API error:</strong> {fatalMsg}
        </div>
      )}

      <div className="flex flex-col gap-4" aria-disabled={!cognitoId || !!fatalMsg}>
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-grad-violet shadow-violet">
              <PackageIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Goods In Management</h1>
              <p className="text-sm text-slate-500">Track and manage incoming inventory</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedRows.length > 0 && (
              <span className="text-sm font-medium bg-slate-200 text-slate-700 px-3 py-1 rounded-full">
                {selectedRows.length} selected
              </span>
            )}
            <button
              onClick={() => setOpenConfirmDialog(true)}
              disabled={selectedRows.length === 0}
              className="flex items-center gap-2 px-4 py-2"
              style={{
                background: "var(--red-600)", color: "white", borderRadius: "0.75rem",
                boxShadow: "var(--shadow-sm)"
              }}
              onMouseOver={(e)=>{ if(!e.currentTarget.disabled) e.currentTarget.style.background="var(--red-700)"; }}
              onMouseOut={(e)=>{ if(!e.currentTarget.disabled) e.currentTarget.style.background="var(--red-600)"; }}
            >
              <DeleteIcon className="w-4 h-4" />
              <span className="text-sm font-semibold">Delete ({selectedRows.length})</span>
            </button>
          </div>
        </header>

        {/* Toolbar */}
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
          <div className="relative flex-grow min-w-250">
            <SearchIcon className="absolute" style={{left:"0.75rem", top:"50%", transform:"translateY(-50%)"}} />
            <input
              type="text"
              placeholder="Search by ingredient, batch code, invoice..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
              className="w-full"
              style={{
                padding: ".5rem 1rem .5rem 2.5rem", border:"1px solid var(--slate-300)",
                borderRadius: "0.5rem", transition: "box-shadow .15s,border-color .15s"
              }}
              onFocus={(e)=>{ e.currentTarget.style.boxShadow="0 0 0 2px rgba(124,58,237,.35)"; e.currentTarget.style.borderColor="var(--violet-600)"; }}
              onBlur={(e)=>{ e.currentTarget.style.boxShadow="none"; e.currentTarget.style.borderColor="var(--slate-300)"; }}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              style={{ border:"1px solid var(--slate-300)", color:"var(--slate-700)" }}
              onMouseOver={(e)=>{ e.currentTarget.style.background="var(--slate-100)"; }}
              onMouseOut={(e)=>{ e.currentTarget.style.background="transparent"; }}
            >
              <FilterIcon className="w-4 h-4" />
              <span>Filters</span>
            </button>
            <select
              value={`${sortBy.field}:${sortBy.dir}`}
              onChange={(e) => {
                const [field, dir] = e.target.value.split(":");
                setSortBy({ field, dir });
              }}
              className="text-sm font-medium rounded-lg transition-colors"
              style={{ padding: ".5rem .75rem", border:"1px solid var(--slate-300)", color:"var(--slate-700)" }}
              onFocus={(e)=>{ e.currentTarget.style.boxShadow="0 0 0 2px rgba(124,58,237,.35)"; e.currentTarget.style.borderColor="var(--violet-600)"; }}
              onBlur={(e)=>{ e.currentTarget.style.boxShadow="none"; e.currentTarget.style.borderColor="var(--slate-300)"; }}
            >
              <option value="date:desc">Date (new → old)</option>
              <option value="date:asc">Date (old → new)</option>
              <option value="ingredient:asc">Ingredient A→Z</option>
              <option value="ingredient:desc">Ingredient Z→A</option>
              <option value="stockRemaining:desc">Stock Remaining (high → low)</option>
              <option value="stockRemaining:asc">Stock Remaining (low → high)</option>
            </select>
          </div>
        </div>

        {/* Main grid */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Table Card */}
          <main className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600 min-w-1200">
                <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                  <tr>
                    <th scope="col" className="p-4" style={{width:"3rem"}}>
                      <input
                        type="checkbox"
                        ref={selectAllCheckboxRef}
                        className="w-4 h-4"
                        style={{
                          accentColor: "var(--violet-600)",
                          background: "var(--slate-100)", border:"1px solid var(--slate-300)", borderRadius: "0.375rem"
                        }}
                        checked={selectedRows.length > 0 && selectedRows.length === filteredRows.length}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Ingredient</th>
                    <th className="px-6 py-3">Temp</th>
                    <th className="px-6 py-3 text-center">Received</th>
                    <th className="px-6 py-3 text-center">Remaining</th>
                    <th className="px-6 py-3">Invoice #</th>
                    <th className="px-6 py-3">Expiry</th>
                    <th className="px-6 py-3">Batch Code</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="text-center py-16">
                        <div className="flex flex-col items-center gap-2">
                          <SpinnerIcon className="w-8 h-8 text-violet-600" />
                          <p>Loading goods in...</p>
                        </div>
                      </td>
                    </tr>
                  ) : visibleRows.length === 0 ? (
                    <tr><td colSpan={10} className="text-center py-16"><p>No records found</p></td></tr>
                  ) : (
                    visibleRows.map((row) => (
                      <tr key={row._id} className="bg-white border-b"
                          onMouseOver={(e)=>{ e.currentTarget.style.background="rgba(124,58,237,.05)"; }}
                          onMouseOut={(e)=>{ e.currentTarget.style.background="#fff"; }}>
                        <td className="p-4">
                          <input
                            type="checkbox"
                            className="w-4 h-4"
                            style={{ accentColor:"var(--violet-600)", background:"var(--slate-100)", border:"1px solid var(--slate-300)", borderRadius: "0.375rem" }}
                            checked={selectedRows.includes(row._id)}
                            onChange={() => toggleRowSelection(row._id)}
                          />
                        </td>
                        <td className="px-6 py-4">{row.date || "-"}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">{row.ingredient || "-"}</td>
                        <td className="px-6 py-4">{row.temperature ? `${row.temperature}℃` : "-"}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-md"
                                style={{ background:"var(--emerald-100)", color:"var(--emerald-800)", fontWeight:600 }}>
                            {row.stockReceived} {row.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-md"
                                style={{ background:"var(--slate-100)", color:"var(--slate-800)", fontWeight:500 }}>
                            {row.stockRemaining} {row.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{row.invoiceNumber || "-"}</td>
                        <td className="px-6 py-4 text-slate-500">{row.expiryDate || "-"}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 bg-violet-100 text-violet-800 text-xs font-mono rounded">{row.barCode || "-"}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleEditRow(row)} className="text-slate-700"
                                  onMouseOver={(e)=>{ e.currentTarget.style.color="var(--violet-800)"; }}
                                  onMouseOut={(e)=>{ e.currentTarget.style.color="var(--slate-700)"; }}>
                            <EditIcon className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer / Pagination */}
            <nav className="flex flex-wrap items-center justify-between p-4 border-t border-slate-200 gap-4">
              <span className="text-sm text-slate-700">
                Showing <span className="font-semibold">
                  {filteredRows.length === 0 ? 0 : page * rowsPerPage + 1}
                </span>-<span className="font-semibold">
                  {Math.min((page + 1) * rowsPerPage, filteredRows.length)}
                </span> of <span className="font-semibold">{filteredRows.length}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 border border-slate-300 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  onMouseOver={(e)=>{ if(!e.currentTarget.disabled) e.currentTarget.style.background="var(--slate-100)"; }}
                  onMouseOut={(e)=>{ if(!e.currentTarget.disabled) e.currentTarget.style.background="transparent"; }}
                >Prev</button>
                <span className="text-sm text-slate-600">Page {page + 1}</span>
                <button
                  onClick={() => setPage(p => ((p + 1) * rowsPerPage < filteredRows.length) ? p + 1 : p)}
                  disabled={(page + 1) * rowsPerPage >= filteredRows.length}
                  className="px-3 py-1 border border-slate-300 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  onMouseOver={(e)=>{ if(!e.currentTarget.disabled) e.currentTarget.style.background="var(--slate-100)"; }}
                  onMouseOut={(e)=>{ if(!e.currentTarget.disabled) e.currentTarget.style.background="transparent"; }}
                >Next</button>
                <select
                  value={rowsPerPage}
                  onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
                  className="text-sm font-medium rounded-md"
                  style={{ padding: ".25rem .5rem", border:"1px solid var(--slate-300)" }}
                  onFocus={(e)=>{ e.currentTarget.style.boxShadow="0 0 0 1px rgba(124,58,237,.35)"; e.currentTarget.style.borderColor="var(--violet-600)"; }}
                  onBlur={(e)=>{ e.currentTarget.style.boxShadow="none"; e.currentTarget.style.borderColor="var(--slate-300)"; }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </nav>
          </main>

          {/* Side: Quick Stats + Totals */}
          <aside className="w-full w-80 flex-shrink-0 flex flex-col gap-6">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800">Quick Stats</h3>
              <p className="text-sm text-slate-500 mb-4">Top ingredients by remaining stock.</p>
              <SmallBarChart data={totalsByIngredient} />
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-2">Total Remaining</h3>
              <div className="flex flex-col" style={{gap:".5rem"}}>
                {Object.entries(displayTotalsByGroup).map(([key, value]) =>
                  totalsByBaseUnitGroup[key.replace('Group', '_group')] > 0 && (
                    <div key={key} className="flex justify-between items-baseline">
                      <span className="text-sm text-slate-600">{key.replace('Group', ' Group')}</span>
                      <span className="font-semibold text-slate-800">{value.amount} {value.unit}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Edit Dialog */}
      {editDialogOpen && editingRow && (
        <div className="fixed inset-0" style={{background:"rgba(0,0,0,.3)"}} >
          <div className="flex items-center justify-center" style={{height:"100%"}}>
            <div className="bg-white rounded-lg shadow-md w-full" style={{maxWidth:"40rem"}}>
              <h3 className="text-lg font-bold p-4 border-b">Edit Goods In Record</h3>
              <div className="p-4" style={{display:"grid", gridTemplateColumns:"repeat(2,minmax(0,1fr))", gap:"1rem"}}>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Ingredient</label>
                  <input type="text" value={editingRow.ingredient || ""}
                    onChange={(e) => setEditingRow({ ...editingRow, ingredient: e.target.value })}
                    className="w-full" style={{marginTop:".25rem", border:"1px solid var(--slate-300)", borderRadius:".375rem", padding:".5rem"}}
                    onFocus={(e)=>{ e.currentTarget.style.boxShadow="0 0 0 2px rgba(124,58,237,.35)"; e.currentTarget.style.borderColor="var(--violet-600)"; }}
                    onBlur={(e)=>{ e.currentTarget.style.boxShadow="none"; e.currentTarget.style.borderColor="var(--slate-300)"; }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <input type="date" value={editingRow.date || ""}
                    onChange={(e) => setEditingRow({ ...editingRow, date: e.target.value })}
                    className="w-full" style={{marginTop:".25rem", border:"1px solid var(--slate-300)", borderRadius:".375rem", padding:".5rem"}}
                    onFocus={(e)=>{ e.currentTarget.style.boxShadow="0 0 0 2px rgba(124,58,237,.35)"; e.currentTarget.style.borderColor="var(--violet-600)"; }}
                    onBlur={(e)=>{ e.currentTarget.style.boxShadow="none"; e.currentTarget.style.borderColor="var(--slate-300)"; }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Temperature (℃)</label>
                  <input type="text" value={editingRow.temperature || ""}
                    onChange={(e) => setEditingRow({ ...editingRow, temperature: e.target.value })}
                    className="w-full" style={{marginTop:".25rem", border:"1px solid var(--slate-300)", borderRadius:".375rem", padding:".5rem"}}
                    onFocus={(e)=>{ e.currentTarget.style.boxShadow="0 0 0 2px rgba(124,58,237,.35)"; e.currentTarget.style.borderColor="var(--violet-600)"; }}
                    onBlur={(e)=>{ e.currentTarget.style.boxShadow="none"; e.currentTarget.style.borderColor="var(--slate-300)"; }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Stock Received</label>
                  <input type="number" value={editingRow.stockReceived || ""}
                    onChange={(e) => setEditingRow({ ...editingRow, stockReceived: Number(e.target.value) })}
                    className="w-full" style={{marginTop:".25rem", border:"1px solid var(--slate-300)", borderRadius:".375rem", padding:".5rem"}}
                    onFocus={(e)=>{ e.currentTarget.style.boxShadow="0 0 0 2px rgba(124,58,237,.35)"; e.currentTarget.style.borderColor="var(--violet-600)"; }}
                    onBlur={(e)=>{ e.currentTarget.style.boxShadow="none"; e.currentTarget.style.borderColor="var(--slate-300)"; }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Stock Remaining</label>
                  <input type="number" value={editingRow.stockRemaining || ""}
                    onChange={(e) => setEditingRow({ ...editingRow, stockRemaining: Number(e.target.value) })}
                    className="w-full" style={{marginTop:".25rem", border:"1px solid var(--slate-300)", borderRadius:".375rem", padding:".5rem"}}
                    onFocus={(e)=>{ e.currentTarget.style.boxShadow="0 0 0 2px rgba(124,58,237,.35)"; e.currentTarget.style.borderColor="var(--violet-600)"; }}
                    onBlur={(e)=>{ e.currentTarget.style.boxShadow="none"; e.currentTarget.style.borderColor="var(--slate-300)"; }}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Unit</label>
                  <select value={editingRow.unit || ""}
                          onChange={(e) => setEditingRow({ ...editingRow, unit: e.target.value })}
                          className="w-full" style={{marginTop:".25rem", border:"1px solid var(--slate-300)", borderRadius:".375rem", padding:".5rem"}}
                          onFocus={(e)=>{ e.currentTarget.style.boxShadow="0 0 0 2px rgba(124,58,237,.35)"; e.currentTarget.style.borderColor="var(--violet-600)"; }}
                          onBlur={(e)=>{ e.currentTarget.style.boxShadow="none"; e.currentTarget.style.borderColor="var(--slate-300)"; }}
                  >
                    {unitOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Batch Code</label>
                  <input type="text" value={editingRow.barCode || ""}
                    onChange={(e) => setEditingRow({ ...editingRow, barCode: e.target.value })}
                    className="w-full" style={{marginTop:".25rem", border:"1px solid var(--slate-300)", borderRadius:".375rem", padding:".5rem"}}
                    onFocus={(e)=>{ e.currentTarget.style.boxShadow="0 0 0 2px rgba(124,58,237,.35)"; e.currentTarget.style.borderColor="var(--violet-600)"; }}
                    onBlur={(e)=>{ e.currentTarget.style.boxShadow="none"; e.currentTarget.style.borderColor="var(--slate-300)"; }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Invoice Number</label>
                  <input type="text" value={editingRow.invoiceNumber || ""}
                    onChange={(e) => setEditingRow({ ...editingRow, invoiceNumber: e.target.value })}
                    className="w-full" style={{marginTop:".25rem", border:"1px solid var(--slate-300)", borderRadius:".375rem", padding:".5rem"}}
                    onFocus={(e)=>{ e.currentTarget.style.boxShadow="0 0 0 2px rgba(124,58,237,.35)"; e.currentTarget.style.borderColor="var(--violet-600)"; }}
                    onBlur={(e)=>{ e.currentTarget.style.boxShadow="none"; e.currentTarget.style.borderColor="var(--slate-300)"; }}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Expiry Date</label>
                  <input type="date" value={editingRow.expiryDate || ""}
                    onChange={(e) => setEditingRow({ ...editingRow, expiryDate: e.target.value })}
                    className="w-full" style={{marginTop:".25rem", border:"1px solid var(--slate-300)", borderRadius:".375rem", padding:".5rem"}}
                    onFocus={(e)=>{ e.currentTarget.style.boxShadow="0 0 0 2px rgba(124,58,237,.35)"; e.currentTarget.style.borderColor="var(--violet-600)"; }}
                    onBlur={(e)=>{ e.currentTarget.style.boxShadow="none"; e.currentTarget.style.borderColor="var(--slate-300)"; }}
                  />
                </div>
              </div>
              <div className="px-4 py-3 border-t" style={{background:"var(--slate-50)", display:"flex", justifyContent:"end", gap:".5rem"}}>
                <button
                  onClick={() => { setEditDialogOpen(false); setEditingRow(null); }}
                  disabled={updating}
                  className="px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50"
                  style={{ border:"1px solid var(--slate-300)", color:"var(--slate-700)" }}
                  onMouseOver={(e)=>{ e.currentTarget.style.background="var(--slate-100)"; }}
                  onMouseOut={(e)=>{ e.currentTarget.style.background="transparent"; }}
                >Cancel</button>
                <button
                  onClick={handleConfirmEdit}
                  disabled={updating}
                  className="px-4 py-2 text-sm font-semibold rounded-lg disabled:opacity-50"
                  style={{ background:"var(--violet-600)", color:"#fff", boxShadow:"var(--shadow-sm)" }}
                  onMouseOver={(e)=>{ if(!e.currentTarget.disabled) e.currentTarget.style.background="var(--violet-700)"; }}
                  onMouseOut={(e)=>{ if(!e.currentTarget.disabled) e.currentTarget.style.background="var(--violet-600)"; }}
                >
                  {updating ? <SpinnerIcon className="w-4 h-4" /> : null} {updating ? " Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {openConfirmDialog && (
        <div className="fixed inset-0" style={{background:"rgba(0,0,0,.3)"}}>
          <div className="flex items-center justify-center" style={{height:"100%"}}>
            <div className="bg-white rounded-lg shadow-md w-full" style={{maxWidth:"28rem"}}>
              <h3 className="text-lg font-bold p-4">Confirm Deletion</h3>
              <p className="px-4 text-slate-600">
                Delete {selectedRows.length} selected record{selectedRows.length === 1 ? "" : "s"}? This is a soft-delete action.
              </p>
              <div className="px-4 py-3 border-t" style={{background:"var(--slate-50)", display:"flex", justifyContent:"end", gap:".5rem", marginTop:"1rem"}}>
                <button
                  onClick={() => setOpenConfirmDialog(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg"
                  style={{ border:"1px solid var(--slate-300)", color:"var(--slate-700)" }}
                  onMouseOver={(e)=>{ e.currentTarget.style.background="var(--slate-100)"; }}
                  onMouseOut={(e)=>{ e.currentTarget.style.background="transparent"; }}
                >Cancel</button>
                <button
                  onClick={handleDeleteSelectedRows}
                  className="px-4 py-2 text-sm font-semibold rounded-lg"
                  style={{ background:"var(--red-600)", color:"#fff", boxShadow:"var(--shadow-sm)" }}
                  onMouseOver={(e)=>{ e.currentTarget.style.background="var(--red-700)"; }}
                  onMouseOut={(e)=>{ e.currentTarget.style.background="var(--red-600)"; }}
                >Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
