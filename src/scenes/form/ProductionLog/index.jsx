// src/scenes/form/RecipeProduction/index.jsx
// Nory-styled, MUI-free version with pre-submit stock check + serious confirm modal.
import React, { useState, useEffect, useMemo } from "react";
import { Formik } from "formik";
import * as yup from "yup";
import { useAuth } from "../../../contexts/AuthContext";

const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

// ===== Brand tokens (Nory-like) =====
const brand = {
  text: "#0f172a",
  subtext: "#334155",
  border: "#e5e7eb",
  inputBg: "#ffffff",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  primary: "#e11d48",
  primaryDark: "#be123c",
  focusRing: "rgba(225, 29, 72, 0.35)",
  danger: "#dc2626",
  shadow: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)",
  warnBg: "#fff7ed",
  warnBorder: "#fdba74",
  warnText: "#9a3412",
};

// ===== Validation schema =====
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
});

// ===== Initial values =====
const initialValues = {
  date: new Date().toISOString().split("T")[0],
  recipe: "",
  batchesProduced: "",
  unitsOfWaste: 0,
  batchCode: "",
};

// ===== Tiny toast =====
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

// ===== Modal =====
function Modal({ open, title, children, footer, onClose }) {
  if (!open) return null;
  return (
    <div className="plf-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="plf-modal"
        onClick={(e) => e.stopPropagation()}
        role="document"
        aria-label={title}
      >
        <div className="plf-modal-header">
          <h3>{title}</h3>
          <button
            type="button"
            className="plf-btn-ghost"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="plf-modal-body">{children}</div>
        <div className="plf-modal-footer">{footer}</div>
      </div>
    </div>
  );
}

const ProductionLogForm = () => {
  const { cognitoId } = useAuth();

  // Recipes (full objects) + names list for the select
  const [recipes, setRecipes] = useState([]);
  const recipeNames = useMemo(() => {
    return recipes.map((r) => r.recipe_name ?? r.recipe ?? r.name ?? "");
  }, [recipes]);

  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Active inventory from API: [{ ingredient, unit, totalRemaining, activeBarcode }]
  const [inventory, setInventory] = useState([]);
  // Also keep a map for quick lookups
  const inventoryMap = useMemo(() => {
    const m = new Map();
    for (const r of inventory) {
      const key = `${(r.ingredient || "").toLowerCase()}|||${(r.unit || "").toLowerCase()}`;
      const v = Number(r.totalRemaining) || 0;
      m.set(key, (m.get(key) || 0) + v);
    }
    return m;
  }, [inventory]);

  // Serious confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [shortages, setShortages] = useState([]); // [{ ingredient, unit, have, need }]
  const [pendingSubmit, setPendingSubmit] = useState(null); // store last form values to submit if proceed
  const [openToast, setOpenToast] = useState(false);
  const [checking, setChecking] = useState(false);

  // --- Fetch recipes by cognitoId ---
  useEffect(() => {
    const fetchRecipes = async () => {
      if (!cognitoId) return;

      setLoadingRecipes(true);
      setFetchError(null);

      try {
        const response = await fetch(
          `${API_BASE}/recipes?cognito_id=${encodeURIComponent(cognitoId)}`
        );
        if (!response.ok) throw new Error("Failed to fetch recipes");

        const data = await response.json();
        // Expecting objects that include: recipe_name, units_per_batch (upb), ingredients[], quantities[], units[]
        const normalized = (Array.isArray(data) ? data : []).map((r) => ({
          recipe_name: r.recipe_name ?? r.recipe ?? r.name ?? "",
          upb: Number(r.units_per_batch ?? r.upb ?? r.unitsPerBatch ?? 1) || 1,
          ingredients: r.ingredients || [],
          quantities: r.quantities || [],
          units: r.units || [],
        }));
        setRecipes(normalized);
      } catch (err) {
        console.error("Error fetching recipes:", err);
        setFetchError("Error fetching recipes");
        setRecipes([]);
      } finally {
        setLoadingRecipes(false);
      }
    };

    fetchRecipes();
  }, [cognitoId]);

  // --- Fetch ACTIVE inventory upfront ---
  useEffect(() => {
    const fetchActiveInventory = async () => {
      if (!cognitoId) return;
      try {
        const res = await fetch(
          `${API_BASE}/ingredient-inventory/active?cognito_id=${encodeURIComponent(
            cognitoId
          )}`
        );
        if (!res.ok) throw new Error(`Failed to fetch active inventory (${res.status})`);
        const data = await res.json();
        setInventory(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching active inventory:", err);
        setInventory([]);
      }
    };
    fetchActiveInventory();
  }, [cognitoId]);

  // --- Preflight check for stock; returns array of shortages ---
  const computeShortages = (formValues) => {
    const { recipe, batchesProduced } = formValues;
    const bp = Number(batchesProduced) || 0;

    // find selected recipe details
    const r = recipes.find(
      (x) => (x.recipe_name || "").toLowerCase() === (recipe || "").toLowerCase()
    );
    if (!r) return []; // no data -> skip check

    const need = [];
    const len = Math.max(r.ingredients.length, r.quantities.length, r.units.length);
    for (let i = 0; i < len; i++) {
      const ing = (r.ingredients[i] || "").trim();
      const unit = (r.units[i] || "").trim();
      const perBatchQty = Number(r.quantities[i]) || 0;
      if (!ing || !unit || perBatchQty <= 0) continue;

      const totalNeeded = perBatchQty * bp; // quantities are per BATCH, multiply by batches
      const key = `${ing.toLowerCase()}|||${unit.toLowerCase()}`;
      const available = Number(inventoryMap.get(key)) || 0;

      if (totalNeeded > available) {
        need.push({
          ingredient: ing,
          unit,
          have: available,
          need: totalNeeded,
        });
      }
    }
    return need;
  };

  // --- Submit handler with preflight ---
  const handleFormSubmit = async (values, { resetForm }) => {
    // If inventory unknown, try a quick refresh before computing
    setChecking(true);
    try {
      if (inventory.length === 0 && cognitoId) {
        const res = await fetch(
          `${API_BASE}/ingredient-inventory/active?cognito_id=${encodeURIComponent(
            cognitoId
          )}`
        );
        if (res.ok) {
          const data = await res.json();
          setInventory(Array.isArray(data) ? data : []);
        }
      }
    } catch {
      // ignore refresh error; we'll compute with what we have
    } finally {
      setChecking(false);
    }

    const shortagesFound = computeShortages(values);
    if (shortagesFound.length > 0) {
      setShortages(shortagesFound);
      setPendingSubmit({ values, resetForm });
      setConfirmOpen(true);
      return; // do not submit yet
    }

    // No shortages -> submit immediately
    await actuallySubmit(values, resetForm);
  };

  const actuallySubmit = async (values, resetForm) => {
    const payload = { ...values, cognito_id: cognitoId };
    try {
      const response = await fetch(`${API_BASE}/add-production-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to submit data");
      await response.json().catch(() => null);
      resetForm();
      setOpenToast(true);
    } catch (error) {
      console.error("Error submitting data:", error);
      alert("Submission failed. Check console.");
    }
  };

  const proceedAfterWarning = async () => {
    setConfirmOpen(false);
    if (!pendingSubmit) return;
    const { values, resetForm } = pendingSubmit;
    setPendingSubmit(null);
    await actuallySubmit(values, resetForm);
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
          position: fixed; right: 20px; bottom: 20px; z-index: 10;
          display: inline-flex; align-items: center; gap: 8px;
          border-radius: 999px; padding: 12px 18px; border: 0; cursor: pointer; font-weight: 800; color: #fff;
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
          width: min(640px, 92vw); background: ${brand.surface};
          border: 1px solid ${brand.border}; border-radius: 14px; box-shadow: ${brand.shadow}; overflow: hidden;
        }
        .plf-modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px; border-bottom: 1px solid ${brand.border};
        }
        .plf-modal-header h3 { margin: 0; font-weight: 800; }
        .plf-modal-body { padding: 16px; }
        .plf-modal-footer { padding: 12px 16px; display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid ${brand.border}; }
        .plf-btn-ghost { background: transparent; color: ${brand.text}; border: 0; cursor: pointer; font-weight: 800; }
        .plf-btn-primary { color: #fff; background: linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark}); border-radius: 10px; padding: 10px 14px; border: 0; cursor: pointer; font-weight: 800; }
        .plf-btn-primary:disabled { opacity: .6; cursor: default; }

        .plf-callout {
          background: ${brand.warnBg};
          border: 1px solid ${brand.warnBorder};
          color: ${brand.warnText};
          padding: 10px 12px;
          border-radius: 10px;
          margin-bottom: 12px;
          font-weight: 700;
        }
        .plf-shortage-row {
          display: grid;
          grid-template-columns: 1.2fr .6fr .6fr .6fr;
          gap: 10px;
          padding: 10px 12px;
          border: 1px solid ${brand.border};
          border-radius: 10px;
          background: ${brand.surfaceMuted};
        }
        .plf-shortage-head {
          display: grid;
          grid-template-columns: 1.2fr .6fr .6fr .6fr;
          gap: 10px;
          margin-bottom: 6px;
          font-weight: 800;
          color: ${brand.subtext};
        }
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
              </div>

              {/* Fixed gradient pill action */}
              <button
                type="submit"
                className="plf-fab"
                aria-label="Record production"
                disabled={checking}
                title={checking ? "Checking stock…" : "Record production"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {checking ? "Checking…" : "Record Production"}
              </button>
            </form>
          )}
        </Formik>
      </div>

      {/* Serious confirmation modal */}
      <Modal
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setPendingSubmit(null);
          setShortages([]);
        }}
        title="Insufficient Stock Detected"
        footer={
          <>
            <button
              type="button"
              className="plf-btn-ghost"
              onClick={() => {
                setConfirmOpen(false);
                setPendingSubmit(null);
                setShortages([]);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="plf-btn-primary"
              onClick={proceedAfterWarning}
            >
              Proceed Anyway
            </button>
          </>
        }
      >
        <div className="plf-callout">
          You’re about to log production that uses more stock than you currently have.
          This may leave **negative stock** and break FIFO barcode tracking.
        </div>

        <div className="plf-shortage-head">
          <div>Ingredient</div>
          <div>Unit</div>
          <div>Available</div>
          <div>Required</div>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {shortages.map((s, i) => (
            <div className="plf-shortage-row" key={`${s.ingredient}-${s.unit}-${i}`}>
              <div style={{ fontWeight: 800 }}>{s.ingredient}</div>
              <div>{s.unit}</div>
              <div>{(Number(s.have) || 0).toLocaleString()}</div>
              <div style={{ color: brand.danger, fontWeight: 800 }}>
                {(Number(s.need) || 0).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Success Toast */}
      <Toast open={openToast} onClose={() => setOpenToast(false)}>
        Production log has been successfully recorded!
      </Toast>
    </div>
  );
};

export default ProductionLogForm;
