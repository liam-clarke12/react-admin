// src/scenes/form/GoodsOut/index.jsx
// Nory-styled, MUI-free form with a HARD precheck against Production Log units.

import React, { useState, useEffect } from "react";
import { Formik } from "formik";
import * as yup from "yup";
import { useAuth } from "../../../contexts/AuthContext";

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

// Validation Schema
const goodsOutSchema = yup.object().shape({
  date: yup.string().required("Date is required"),
  recipe: yup.string().required("Recipe is required"),
  stockAmount: yup
    .number()
    .typeError("Must be a number")
    .required("Amount of units is required")
    .positive("Must be positive"),
  recipients: yup.string().required("Recipient is required"),
});

/** Serious “insufficient units” modal with NO proceed option */
function HardBlockModal({ open, onClose, recipe, need, have }) {
  if (!open) return null;
  return (
    <div className="gof-modal-backdrop" onClick={onClose}>
      <div
        className="gof-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="gof-modal-header">
          <h3>Insufficient Finished Units</h3>
        </div>
        <div className="gof-modal-body">
          <p className="gof-warning">
            You’re trying to send out more <strong>{recipe || "this recipe"}</strong> units than are currently available in your Recipe Inventory.
          </p>
          <div className="gof-block-stats">
            <div className="stat">
              <div className="label">Requested</div>
              <div className="value">{Number(need || 0).toLocaleString()}</div>
            </div>
            <div className="stat">
              <div className="label">Available</div>
              <div className="value">{Number(have || 0).toLocaleString()}</div>
            </div>
          </div>
          <p className="gof-callout">
            Please produce more of <strong>{recipe || "this recipe"}</strong> before recording these goods out.
          </p>
        </div>
        <div className="gof-modal-footer">
          <button type="button" className="btn danger" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Tiny Toast
function Toast({ open, onClose, children }) {
  React.useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [open, onClose]);
  return (
    <div aria-live="polite" className={`gof-toast ${open ? "show" : ""}`} role="status">
      <div className="gof-toast-inner">{children}</div>
    </div>
  );
}

const GoodsOutForm = () => {
  const { cognitoId } = useAuth();

  const [openToast, setOpenToast] = useState(false);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchErr, setFetchErr] = useState(null);

  // Hard-block modal state
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockInfo, setBlockInfo] = useState({ recipe: "", need: 0, have: 0 });

  // Re-init values after success
  const [initialValues, setInitialValues] = useState({
    date: new Date().toISOString().split("T")[0],
    recipe: "",
    stockAmount: "",
    recipients: "",
  });

  // Fetch recipes
  useEffect(() => {
    const fetchRecipes = async () => {
      if (!cognitoId) return;
      setLoading(true);
      setFetchErr(null);
      try {
        const res = await fetch(
          `${API_BASE}/recipes?cognito_id=${encodeURIComponent(cognitoId)}`
        );
        if (!res.ok) throw new Error("Failed to fetch recipes");
        const data = await res.json();
        const names = Array.isArray(data)
          ? data.map((r) => r.recipe_name ?? r.recipe ?? r.name).filter(Boolean)
          : [];
        setFilteredRecipes([...new Set(names)]);
      } catch (err) {
        console.error("Error fetching recipes:", err);
        setFetchErr("Error fetching recipes");
        setFilteredRecipes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipes();
  }, [cognitoId]);

  // Reset initial values when success toast opens
  useEffect(() => {
    if (openToast) {
      setInitialValues({
        date: new Date().toISOString().split("T")[0],
        recipe: "",
        stockAmount: "",
        recipients: "",
      });
    }
  }, [openToast]);

  // ---- Availability check against Production Log (ACTIVE only)
  // Sums units remaining for the chosen recipe.
  const fetchAvailableUnitsForRecipe = async (recipeName) => {
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
        if ((rName || "").toString().trim() !== recipeName.toString().trim()) return;

        // Accept several possible field names; fallback calculation if needed:
        const br = Number(
          r.batchRemaining ?? r.batch_remaining ?? r.units_per_batch_total ?? 0
        );
        const waste = Number(r.units_of_waste ?? r.unitsOfWaste ?? 0);
        const out = Number(r.units_out ?? r.unitsOut ?? 0);
        const apiUnitsRemaining = Number(
          r.units_remaining ?? r.unitsRemaining ?? NaN
        );

        let remain;
        if (Number.isFinite(apiUnitsRemaining)) {
          remain = apiUnitsRemaining;
        } else {
          // Defensive fallback: unitsRemaining = batchRemaining - waste - unitsOut
          remain = Math.max(0, br - waste - out);
        }

        if (Number.isFinite(remain)) total += remain;
      });

      return total;
    } catch (err) {
      console.error("[GoodsOut] Availability check failed:", err);
      // If we can't verify, safest is to block by returning 0
      return 0;
    }
  };

  // Submit with HARD precheck
  const handleFormSubmit = async (values, { resetForm }) => {
    const payload = { ...values, cognito_id: cognitoId };
    const need = Number(values.stockAmount) || 0;

    try {
      const have = await fetchAvailableUnitsForRecipe(values.recipe);

      if (need > have) {
        // Hard block — show modal, do NOT submit
        setBlockInfo({ recipe: values.recipe, need, have });
        setBlockOpen(true);
        return;
      }

      // OK: submit
      const response = await fetch(`${API_BASE}/add-goods-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        let errMsg = "Failed to submit data";
        try {
          const errJson = await response.json();
          errMsg = errJson?.error || response.statusText || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      await response.json().catch(() => null);
      resetForm();
      setOpenToast(true);
    } catch (error) {
      console.error("❌ Error submitting data:", error?.message || error);
      alert("Submission failed. Check console.");
    }
  };

  return (
    <div className="gof-wrap">
      {/* Scoped CSS */}
      <style>{`
        .gof-wrap { padding: 20px; color: ${brand.text}; background: ${brand.surfaceMuted}; min-height: 100%; }
        .gof-card {
          margin-top: 12px; padding: 16px;
          border: 1px solid ${brand.border}; background: ${brand.surface};
          border-radius: 16px; box-shadow: ${brand.shadow};
        }
        .gof-title { font-weight: 800; margin: 0 0 4px; }
        .gof-sub { color: ${brand.subtext}; margin: 0 0 18px; }

        .gof-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 20px; }
        .col-12 { grid-column: span 12; }
        .col-6 { grid-column: span 6; }
        @media (max-width: 900px) { .col-6 { grid-column: span 12; } }

        .gof-field { display: flex; flex-direction: column; }
        .gof-label { font-size: 13px; font-weight: 600; color: ${brand.subtext}; margin-bottom: 6px; }
        .gof-input, .gof-select {
          background: ${brand.inputBg}; border: 1px solid ${brand.border}; border-radius: 12px;
          padding: 12px 14px; font-size: 14px; outline: none;
          transition: border-color .15s ease, box-shadow .15s ease;
        }
        .gof-input:focus, .gof-select:focus { border-color: ${brand.primary}; box-shadow: 0 0 0 4px ${brand.focusRing}; }
        .gof-error { color: ${brand.danger}; font-size: 12px; margin-top: 6px; }

        /* Submit pill button */
        .gof-pill {
          position: fixed; right: 20px; bottom: 20px; z-index: 10;
          display: inline-flex; align-items: center; gap: 8px;
          border-radius: 999px; padding: 12px 18px; border: 0; cursor: pointer; font-weight: 800; color: #fff;
          background: linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark});
          box-shadow: 0 8px 16px rgba(29,78,216,0.25), 0 2px 4px rgba(15,23,42,0.06);
          transition: transform .2s ease;
        }
        .gof-pill:hover { transform: scale(1.06); background: linear-gradient(180deg, ${brand.primaryDark}, ${brand.primaryDark}); }

        /* Toast */
        .gof-toast {
          position: fixed; top: 16px; right: 16px; transform: translateY(-20px); opacity: 0;
          transition: all .2s ease; z-index: 60; pointer-events: none;
        }
        .gof-toast.show { transform: translateY(0); opacity: 1; }
        .gof-toast-inner {
          background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46;
          padding: 10px 12px; border-radius: 10px; font-weight: 700; box-shadow: ${brand.shadow};
        }

        /* Modal (hard block) */
        .gof-modal-backdrop {
          position: fixed; inset: 0; background: rgba(15,23,42,.55);
          display: flex; align-items: center; justify-content: center; z-index: 70;
        }
        .gof-modal {
          width: min(560px, 94vw); background: ${brand.surface};
          border: 1px solid ${brand.border}; border-radius: 14px; box-shadow: ${brand.shadow}; overflow: hidden;
        }
        .gof-modal-header {
          padding: 14px 16px;
          background: linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark});
          color: #fff; font-weight: 800;
        }
        .gof-modal-body { padding: 16px; }
        .gof-modal-footer {
          padding: 12px 16px; display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid ${brand.border};
        }
        .gof-warning { color: ${brand.danger}; font-weight: 800; margin-bottom: 12px; }
        .gof-block-stats {
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 10px 0 14px;
        }
        .gof-block-stats .stat {
          border: 1px solid ${brand.border}; background: ${brand.surfaceMuted};
          border-radius: 12px; padding: 10px 12px;
        }
        .gof-block-stats .label { color: ${brand.subtext}; font-size: 12px; font-weight: 700; margin-bottom: 4px; }
        .gof-block-stats .value { color: ${brand.text}; font-size: 18px; font-weight: 900; }
        .gof-callout {
          background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412;
          padding: 10px 12px; border-radius: 8px; font-weight: 700;
        }
        .btn { border: 0; cursor: pointer; font-weight: 800; padding: 10px 14px; border-radius: 10px; }
        .btn.danger { color: #fff; background: linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark}); }
        .btn.danger:hover { background: linear-gradient(180deg, ${brand.primaryDark}, ${brand.primaryDark}); }
      `}</style>

      <div className="gof-card">
        <h2 className="gof-title">Goods Out Form</h2>
        <p className="gof-sub">Fill out the details and click Record.</p>

        <Formik
          key={initialValues.date}
          initialValues={initialValues}
          validationSchema={goodsOutSchema}
          onSubmit={handleFormSubmit}
          enableReinitialize
        >
          {({ values, errors, touched, handleBlur, handleChange, handleSubmit }) => (
            <form onSubmit={handleSubmit} noValidate>
              <div className="gof-grid">
                {/* Date */}
                <div className="gof-field col-6">
                  <label className="gof-label" htmlFor="date">Date</label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    className="gof-input"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.date}
                  />
                  {touched.date && errors.date && <div className="gof-error">{errors.date}</div>}
                </div>

                {/* Recipe */}
                <div className="gof-field col-6">
                  <label className="gof-label" htmlFor="recipe">Recipe</label>
                  <select
                    id="recipe"
                    name="recipe"
                    className="gof-select"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.recipe}
                  >
                    {loading ? (
                      <option value="" disabled>Loading recipes...</option>
                    ) : fetchErr ? (
                      <option value="" disabled>{fetchErr}</option>
                    ) : filteredRecipes.length > 0 ? (
                      <>
                        <option value="" disabled>Select a recipe…</option>
                        {filteredRecipes.map((recipe, idx) => (
                          <option key={idx} value={recipe}>{recipe}</option>
                        ))}
                      </>
                    ) : (
                      <option value="" disabled>No recipes available</option>
                    )}
                  </select>
                  {touched.recipe && errors.recipe && <div className="gof-error">{errors.recipe}</div>}
                </div>

                {/* Amount of Units */}
                <div className="gof-field col-12">
                  <label className="gof-label" htmlFor="stockAmount">Amount of Units</label>
                  <input
                    id="stockAmount"
                    name="stockAmount"
                    type="number"
                    className="gof-input"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.stockAmount}
                    step="any"
                    placeholder="0"
                  />
                  {touched.stockAmount && errors.stockAmount && (
                    <div className="gof-error">{errors.stockAmount}</div>
                  )}
                </div>

                {/* Recipient */}
                <div className="gof-field col-12">
                  <label className="gof-label" htmlFor="recipients">Recipient</label>
                  <input
                    id="recipients"
                    name="recipients"
                    type="text"
                    className="gof-input"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.recipients}
                    placeholder="e.g., Customer / Store / Dept"
                  />
                  {touched.recipients && errors.recipients && (
                    <div className="gof-error">{errors.recipients}</div>
                  )}
                </div>
              </div>

              {/* Fixed gradient pill submit */}
              <button type="submit" className="gof-pill" aria-label="Record goods out">
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Record Goods Out
              </button>
            </form>
          )}
        </Formik>
      </div>

      {/* Hard-block modal (no proceed) */}
      <HardBlockModal
        open={blockOpen}
        onClose={() => setBlockOpen(false)}
        recipe={blockInfo.recipe}
        need={blockInfo.need}
        have={blockInfo.have}
      />

      {/* Success Toast */}
      <Toast open={openToast} onClose={() => setOpenToast(false)}>
        Goods Out has been successfully recorded!
      </Toast>
    </div>
  );
};

//update
export default GoodsOutForm;
