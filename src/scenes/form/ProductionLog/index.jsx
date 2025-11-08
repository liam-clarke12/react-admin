// src/scenes/form/RecipeProduction/index.jsx
// Nory-styled, MUI-free version with ACTIVE-inventory precheck + serious confirm modal.
import React, { useState, useEffect } from "react";
import { Formik } from "formik";
import * as yup from "yup";
import { useAuth } from "../../../contexts/AuthContext";
import { useData } from "../../../contexts/DataContext";

const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

const brand = {
  text: "#0f172a",
  subtext: "#334155",
  border: "#e5e7eb",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  danger: "#dc2626",
  primary: "#7C3AED",
  primaryDark: "#5B21B6",
  focusRing: "rgba(124,58,237,0.18)",
  shadow: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)",
};

/* ===== Validation schema ===== */
const productionLogSchema = yup.object().shape({
  date: yup.string().required("Date is required"),
  recipe: yup.string().required("Recipe Name is required"),
  batchesProduced: yup
    .number()
    .typeError("Must be a number")
    .required("Batches produced is required")
    .positive("Must be positive"),
  unitsOfWaste: yup
    .number()
    .typeError("Must be a number")
    .required("Units of waste is required")
    .min(0, "Cannot be negative"),
  batchCode: yup.string().required("Batch Code is required"),
  producerName: yup.string().nullable(), // optional field
});

/* ===== Initial values ===== */
const initialValues = {
  date: new Date().toISOString().split("T")[0],
  recipe: "",
  batchesProduced: "",
  unitsOfWaste: 0,
  batchCode: "",
  producerName: "",
};

/* ===== Tiny toast ===== */
function Toast({ open, onClose, children }) {
  React.useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [open, onClose]);
  return (
    <div aria-live="polite" className={`plf-toast ${open ? "show" : ""}`} role="status">
      <div className="plf-toast-inner">{children}</div>
    </div>
  );
}

/* ===== Serious confirm modal ===== */
function ConfirmModal({ open, onCancel, onProceed, deficits }) {
  if (!open) return null;
  return (
    <div className="plf-modal-backdrop" onClick={onCancel}>
      <div
        className="plf-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="plf-modal-header">
          <h3>Insufficient / Missing Ingredients</h3>
        </div>
        <div className="plf-modal-body">
          <p className="plf-warning">
            You are about to record production that uses ingredients you do not currently have
            enough of in <strong>active stock</strong>. This can lead to negative or inconsistent
            inventory.
          </p>
          <div className="plf-deficits">
            {deficits.map((d, i) => (
              <div key={i} className="plf-deficit-row">
                <div className="left">
                  <div className="name">{d.ingredient}</div>
                  {d.unit ? <div className="unit">Unit: {d.unit}</div> : null}
                </div>
                <div className="right">
                  <div className="need">
                    Need: <strong>{d.need}</strong>
                  </div>
                  <div className="have">
                    Have: <strong>{d.have}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="plf-callout">
            Do you want to continue anyway? This will deduct current stock down to 0, and any
            remaining shortfall will be excused in this log.
          </p>
        </div>
        <div className="plf-modal-footer">
          <button type="button" className="btn ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn danger" onClick={onProceed}>
            Proceed anyway
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== Utils ===== */
const normalizeName = (s) =>
  (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "") // collapse whitespace
    .replace(/[^a-z0-9]/g, ""); // drop punctuation

// Canonicalize units + treat N/A/blank as empty (wildcard for recipe-only)
const normalizeUnit = (u) => {
  const raw = (u || "").toString().trim().toLowerCase();
  if (!raw || raw === "n/a" || raw === "na" || raw === "none") return "";
  if (["g", "gram", "grams"].includes(raw)) return "g";
  if (["kg", "kilogram", "kilograms"].includes(raw)) return "kg";
  if (["ml", "millilitre", "milliliter", "milliliters", "millilitres"].includes(raw)) return "ml";
  if (["l", "liter", "litre", "liters", "litres"].includes(raw)) return "l";
  if (["unit", "units", "pcs", "pc", "piece", "pieces"].includes(raw)) return "unit";
  return raw; // fallback to provided string
};

const keyNameUnit = (name, unit) => `${normalizeName(name)}|${normalizeUnit(unit)}`;

/* ===== New: unit conversion helper ===== */
// Convert canonical unit to the factor that converts that unit into the chosen "base unit"
// - mass base unit: grams (g) => kg -> *1000
// - volume base unit: milliliters (ml) => l -> *1000
// - count base unit: units => factor 1
const unitFactorToBase = (canonUnit) => {
  const u = (canonUnit || "").toString().toLowerCase();
  if (!u) return 1;
  if (u === "kg") return 1000;
  if (u === "g") return 1;
  if (u === "l") return 1000;
  if (u === "ml") return 1;
  if (u === "unit") return 1;
  return 1;
};

const ProductionLogForm = () => {
  const { cognitoId } = useAuth();
  const { setGoodsInRows, setIngredientInventory } = useData();

  /* Recipes */
  const [recipeNames, setRecipeNames] = useState([]); // select options
  const [recipesIndex, setRecipesIndex] = useState({}); // recipeName -> [{ingredient, quantity, unit}]
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  /* Confirm modal state */
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deficits, setDeficits] = useState([]);
  const [pendingPayload, setPendingPayload] = useState(null);

  /* Toast */
  const [openToast, setOpenToast] = useState(false);

  // --- Fetch recipes (FULL rows) and build index ---
  useEffect(() => {
    const fetchRecipes = async () => {
      if (!cognitoId) return;

      setLoadingRecipes(true);
      setFetchError(null);

      try {
        const res = await fetch(
          `${API_BASE}/recipes?cognito_id=${encodeURIComponent(cognitoId)}`
        );
        if (!res.ok) throw new Error("Failed to fetch recipes");
        const rows = await res.json();

        // Build: recipe -> array of { ingredient, quantity, unit? }
        const index = {};
        for (const r of Array.isArray(rows) ? rows : []) {
          const recipeName = r.recipe_name ?? r.recipe ?? "";
          if (!recipeName) continue;
          if (!index[recipeName]) index[recipeName] = [];
          index[recipeName].push({
            ingredient: r.ingredient ?? r.ingredient_name ?? "",
            quantity: Number(r.quantity) || 0,
            unit: r.unit ?? "", // if recipe_ingredients has a unit; may be empty or "N/A"
          });
        }
        setRecipesIndex(index);
        setRecipeNames(Object.keys(index).sort());
      } catch (err) {
        console.error("Error fetching recipes:", err);
        setFetchError("Error fetching recipes");
        setRecipeNames([]);
        setRecipesIndex({});
      } finally {
        setLoadingRecipes(false);
      }
    };

    fetchRecipes();
  }, [cognitoId]);

  // --- Availability check against ACTIVE inventory ---
  const checkAvailability = async (recipeName, batchesProduced) => {
    const lines = recipesIndex[recipeName] || [];
    if (!lines.length) return [];

    // 1) Compute required per (ingredient, unit) and convert to base units
    const required = []; // keep array to preserve each line
    for (const line of lines) {
      const ing = (line.ingredient || "").toString();
      const uCanon = normalizeUnit(line.unit);
      const qty = Number(line.quantity) || 0;
      const need = qty * (Number(batchesProduced) || 0);
      const needBase = need * unitFactorToBase(uCanon);
      required.push({ ingredient: ing, unit: uCanon, need, needBase });
    }

    // 2) Fetch ACTIVE inventory snapshot
    const invRes = await fetch(
      `${API_BASE}/ingredient-inventory/active?cognito_id=${encodeURIComponent(cognitoId)}`
    );
    const invRows = invRes.ok ? await invRes.json() : [];

    // Build two maps in BASE UNITS:
    //  - availableByIU: name+unit (canonical) -> amount (in base units)
    //  - availableByI:  name only -> sum of all units (in base units)
    const availableByIU = new Map();
    const availableByI = new Map();

    for (const r of Array.isArray(invRows) ? invRows : []) {
      const nameCanon = normalizeName(r?.ingredient ?? "");
      const unitCanon = normalizeUnit(r?.unit ?? "");
      const rawHave = Number(r?.totalRemaining ?? r?.stockOnHand ?? r?.unitsInStock ?? 0) || 0;
      const haveBase = rawHave * unitFactorToBase(unitCanon);

      const kIU = `${nameCanon}|${unitCanon}`;
      availableByIU.set(kIU, (availableByIU.get(kIU) || 0) + haveBase);

      availableByI.set(nameCanon, (availableByI.get(nameCanon) || 0) + haveBase);
    }

    // 3) Compare (all in base units)
    const problems = [];
    for (const { ingredient, unit, need, needBase } of required) {
      const nameCanon = normalizeName(ingredient);

      // ✅ Key change:
      // Instead of requiring an exact unit match, use the SUM across ALL units for that ingredient,
      // since both recipe need and inventory are converted to base units.
      // This fixes cases like need=500g while inventory is 3kg.
      const haveBaseAllUnits = availableByI.get(nameCanon) ?? 0;

      if (needBase > haveBaseAllUnits) {
        // For display: convert have back into the recipe unit if it exists; otherwise show base units.
        const displayFactor = unit ? unitFactorToBase(unit) : 1;
        const reportedHave = displayFactor > 0 ? haveBaseAllUnits / displayFactor : haveBaseAllUnits;
        const reportedNeed = need;

        const round = (n) => {
          if (Math.abs(n - Math.round(n)) < 1e-9) return Math.round(n);
          return Math.round(n * 1000) / 1000;
        };

        problems.push({
          ingredient,
          unit,
          need: round(reportedNeed),
          have: round(reportedHave),
        });
      }
    }

    return problems;
  };

  // --- helper: refresh goods-in active & recompute ingredient inventory client-side ---
  const refreshGoodsInAndInventory = async () => {
    if (!cognitoId) return;
    try {
      // goods-in active rows
      const res = await fetch(`${API_BASE}/goods-in/active?cognito_id=${encodeURIComponent(cognitoId)}`);
      const goodsRows = res.ok ? await res.json() : [];

      // normalize goods rows similar to other components
      const normalized = (Array.isArray(goodsRows) ? goodsRows : []).map((row, idx) => {
        const date = row.date ? String(row.date).slice(0, 10) : row.date;
        const expiryDate = row.expiryDate ? String(row.expiryDate).slice(0, 10) : row.expiryDate;
        const stockReceived = Number(row.stockReceived || 0);
        const stockRemaining = Number(row.stockRemaining || 0);
        const serverBar = row.barCode ? String(row.barCode) : null;
        const _id = serverBar ? `${serverBar}-${idx}` : `gen-${idx}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;

        return {
          ...row,
          date,
          expiryDate,
          stockReceived,
          stockRemaining,
          processed: Number(stockRemaining) === 0 ? "Yes" : "No",
          barCode: serverBar || null,
          _id,
        };
      });

      setGoodsInRows(normalized);

      // compute ingredient inventory from normalized goods (sum stockRemaining per ingredient; pick earliest date's barcode)
      const active = normalized.filter((r) => Number(r.stockRemaining) > 0);
      const map = new Map();
      for (const r of active) {
        const key = r.ingredient;
        const prev = map.get(key) || { ingredient: key, amount: 0, barcode: r.barCode, _date: r.date };
        const amount = prev.amount + Number(r.stockRemaining || 0);

        let nextBarcode = prev.barcode;
        let nextDate = prev._date;
        try {
          const prevTime = new Date(prev._date).getTime() || Infinity;
          const curTime = new Date(r.date).getTime() || Infinity;
          if (curTime < prevTime) {
            nextBarcode = r.barCode;
            nextDate = r.date;
          }
        } catch {
          // ignore
        }

        map.set(key, { ingredient: key, amount, barcode: nextBarcode, _date: nextDate });
      }
      const inventory = Array.from(map.values()).map(({ _date, ...rest }) => rest);
      setIngredientInventory(inventory);
    } catch (err) {
      console.warn("refreshGoodsInAndInventory failed:", err);
    }
  };

  // --- Final submit to API ---
  const submitToServer = async (payload, resetForm) => {
    try {
      const res = await fetch(`${API_BASE}/add-production-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to submit data");
      await res.json().catch(() => null);

      // refresh client-side goods-in snapshot so UI shows server deductions immediately
      try {
        await refreshGoodsInAndInventory();
      } catch (refreshErr) {
        console.warn("Could not refresh goods-in after production submit:", refreshErr);
      }

      resetForm();
      setOpenToast(true);
    } catch (err) {
      console.error("Error submitting data:", err);
      alert("Submission failed. Check console.");
    }
  };

  // --- Form submit with precheck ---
  const handleFormSubmit = async (values, { resetForm }) => {
    // include producerName in payload (even if empty)
    const payload = { ...values, cognito_id: cognitoId, producerName: values.producerName ?? "" };

    try {
      const problems = await checkAvailability(values.recipe, values.batchesProduced);

      if (problems.length > 0) {
        setDeficits(problems);
        setPendingPayload({ payload, resetForm });
        setConfirmOpen(true);
        return;
      }

      // All good → submit
      await submitToServer(payload, resetForm);
    } catch (err) {
      console.error("Availability check failed:", err);
      alert("Could not verify inventory availability. Please try again.");
    }
  };

  // --- Confirm handlers ---
  const handleCancel = () => {
    setConfirmOpen(false);
    setDeficits([]);
    setPendingPayload(null);
  };

  const handleProceedAnyway = async () => {
    const pp = pendingPayload;
    setConfirmOpen(false);
    setDeficits([]);
    setPendingPayload(null);
    if (pp) {
      await submitToServer(pp.payload, pp.resetForm);
    }
  };

  return (
    <div className="plf-wrap">
      {/* Scoped CSS */}
      <style>{`
        .plf-wrap { padding: 20px; color: ${brand.text}; background: ${brand.surfaceMuted}; min-height: 100%; }
        .plf-card {
          margin-top: 12px; padding: 16px;
          border: 1px solid ${brand.border}; background: ${brand.surface};
          border-radius: 16px; box-shadow: ${brand.shadow};
        }
        .plf-title { font-weight: 800; margin: 0 0 4px; }
        .plf-sub { color: ${brand.subtext}; margin: 0 0 18px; }

        .plf-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }
        .span-1 { grid-column: span 1; } .span-2 { grid-column: span 2; } .span-4 { grid-column: span 4; }
        @media (max-width: 600px) { .span-1,.span-2,.span-4 { grid-column: span 4; } }

        .plf-field { display: flex; flex-direction: column; }
        .plf-label { font-size: 13px; font-weight: 600; color: ${brand.subtext}; margin-bottom: 6px; }
        .plf-input, .plf-select {
          background: ${brand.inputBg}; border: 1px solid ${brand.border}; border-radius: 12px;
          padding: 12px 14px; font-size: 14px; outline: none;
          transition: border-color .15s ease, box-shadow .15s ease;
        }
        .plf-input:focus, .plf-select:focus { border-color: ${brand.primary}; box-shadow: 0 0 0 4px ${brand.focusRing}; }
        .plf-error { color: ${brand.danger}; font-size: 12px; margin-top: 6px; }

        .plf-fab {
          position: relative;
          margin-top: 20px;
          float: right;
          display: inline-flex; 
          align-items: center; 
          gap: 8px;
          border-radius: 999px; 
          padding: 12px 18px; 
          border: 0; 
          cursor: pointer; 
          font-weight: 800; 
          color: #fff;
          background: linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark});
          box-shadow: 0 8px 16px rgba(29,78,216,0.25), 0 2px 4px rgba(15,23,42,0.06);
          transition: transform .2s ease;
        }
        .plf-fab:hover { transform: scale(1.06); background: linear-gradient(180deg, ${brand.primaryDark}, ${brand.primaryDark}); }

        /* Toast */
        .plf-toast {
          position: fixed; top: 16px; right: 16px; transform: translateY(-20px); opacity: 0;
          transition: all .2s ease; z-index: 60; pointer-events: none;
        }
        .plf-toast.show { transform: translateY(0); opacity: 1; }
        .plf-toast-inner {
          background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46;
          padding: 10px 12px; border-radius: 10px; font-weight: 700; box-shadow: ${brand.shadow};
        }

        /* Modal */
        .plf-modal-backdrop {
          position: fixed; inset: 0; background: rgba(15,23,42,.55);
          display: flex; align-items: center; justify-content: center; z-index: 70;
        }
        .plf-modal {
          width: min(640px, 94vw); background: ${brand.surface};
          border: 1px solid ${brand.border}; border-radius: 14px; box-shadow: ${brand.shadow}; overflow: hidden;
        }
        .plf-modal-header {
          padding: 14px 16px;
          background: linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark});
          color: #fff; font-weight: 800;
        }
        .plf-modal-body { padding: 16px; }
        .plf-modal-footer {
          padding: 12px 16px; display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid ${brand.border};
        }
        .plf-warning {
          color: ${brand.danger}; font-weight: 800; margin-bottom: 12px;
        }
        .plf-deficits { display: grid; gap: 10px; margin-bottom: 12px; }
        .plf-deficit-row {
          display: flex; align-items: center; justify-content: space-between;
          border: 1px solid ${brand.border}; border-radius: 10px; padding: 10px 12px; background: ${brand.surfaceMuted};
        }
        .plf-deficit-row .name { font-weight: 800; color: ${brand.text}; }
        .plf-deficit-row .unit { font-size: 12px; color: ${brand.subtext}; }
        .plf-deficit-row .right { display: flex; gap: 14px; font-size: 14px; color: ${brand.text}; }
        .plf-callout {
          background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412;
          padding: 10px 12px; border-radius: 8px; font-weight: 700;
        }
        .btn { border: 0; cursor: pointer; font-weight: 800; padding: 10px 14px; border-radius: 10px; }
        .btn.ghost { background: transparent; color: ${brand.text}; border: 1px solid ${brand.border}; }
        .btn.danger { color: #fff; background: linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark}); }
        .btn.danger:hover { background: linear-gradient(180deg, ${brand.primaryDark}, ${brand.primaryDark}); }
      `}</style>

      <div className="plf-card">
        <h2 className="plf-title">Production Log</h2>
        <p className="plf-sub">Fill out the details and click Record.</p>

        <Formik
          onSubmit={handleFormSubmit}
          initialValues={initialValues}
          validationSchema={productionLogSchema}
        >
          {({ values, errors, touched, handleBlur, handleChange, handleSubmit }) => (
            <form onSubmit={handleSubmit} noValidate>
              <div className="plf-grid">
                {/* Date */}
                <div className="plf-field span-2">
                  <label className="plf-label" htmlFor="date">Date</label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    className="plf-input"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.date}
                  />
                  {touched.date && errors.date && <div className="plf-error">{errors.date}</div>}
                </div>

                {/* Recipe */}
                <div className="plf-field span-2">
                  <label className="plf-label" htmlFor="recipe">Recipe</label>
                  <select
                    id="recipe"
                    name="recipe"
                    className="plf-select"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.recipe}
                  >
                    {loadingRecipes ? (
                      <option value="" disabled>Loading recipes...</option>
                    ) : fetchError ? (
                      <option value="" disabled>{fetchError}</option>
                    ) : recipeNames.length > 0 ? (
                      <>
                        <option value="" disabled>Select a recipe…</option>
                        {recipeNames.map((r, idx) => (
                          <option key={idx} value={r}>{r}</option>
                        ))}
                      </>
                    ) : (
                      <option value="" disabled>No recipes available</option>
                    )}
                  </select>
                  {touched.recipe && errors.recipe && <div className="plf-error">{errors.recipe}</div>}
                </div>

                {/* Batches Produced */}
                <div className="plf-field span-2">
                  <label className="plf-label" htmlFor="batchesProduced">Batches Produced</label>
                  <input
                    id="batchesProduced"
                    name="batchesProduced"
                    type="number"
                    className="plf-input"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.batchesProduced}
                    step="any"
                    placeholder="0"
                  />
                  {touched.batchesProduced && errors.batchesProduced && (
                    <div className="plf-error">{errors.batchesProduced}</div>
                  )}
                </div>

                {/* Units of Waste */}
                <div className="plf-field span-2">
                  <label className="plf-label" htmlFor="unitsOfWaste">Units of Waste</label>
                  <input
                    id="unitsOfWaste"
                    name="unitsOfWaste"
                    type="number"
                    className="plf-input"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.unitsOfWaste}
                    step="1"
                    min="0"
                    placeholder="0"
                  />
                  {touched.unitsOfWaste && errors.unitsOfWaste && (
                    <div className="plf-error">{errors.unitsOfWaste}</div>
                  )}
                </div>

                {/* Batch Code */}
                <div className="plf-field span-4">
                  <label className="plf-label" htmlFor="batchCode">Batch Code</label>
                  <input
                    id="batchCode"
                    name="batchCode"
                    type="text"
                    className="plf-input"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.batchCode}
                    placeholder="e.g., BATCH-2025-08-10-A"
                  />
                  {touched.batchCode && errors.batchCode && (
                    <div className="plf-error">{errors.batchCode}</div>
                  )}
                </div>

                {/* Producer Name (NEW) */}
                <div className="plf-field span-4">
                  <label className="plf-label" htmlFor="producerName">Produced by (Name)</label>
                  <input
                    id="producerName"
                    name="producerName"
                    type="text"
                    className="plf-input"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.producerName}
                    placeholder="Name of person who produced this batch"
                  />
                  {touched.producerName && errors.producerName && (
                    <div className="plf-error">{errors.producerName}</div>
                  )}
                </div>
              </div>

              {/* Fixed gradient pill action */}
              <button type="submit" className="plf-fab" aria-label="Record production">
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Record Production
              </button>
            </form>
          )}
        </Formik>
      </div>

      {/* Serious confirm modal */}
      <ConfirmModal
        open={confirmOpen}
        deficits={deficits}
        onCancel={handleCancel}
        onProceed={handleProceedAnyway}
      />

      {/* Success Toast */}
      <Toast open={openToast} onClose={() => setOpenToast(false)}>
        Production log has been recorded!
      </Toast>
    </div>
  );
};

export default ProductionLogForm;
