// src/scenes/form/GoodsOut/index.jsx
// Nory-styled, MUI-free form with a HARD precheck against Production Log units.
// Now supports Single / Multiple tabs, and uses /add-goods-out-batch for multiple.

import React, { useState, useEffect } from "react";
import { Formik, FieldArray } from "formik";
import * as yup from "yup";
import { useAuth } from "../../../contexts/AuthContext";

const API_BASE =
  "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

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

// Validation Schema (single row)
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

// Validation Schema for multiple rows
const multiGoodsOutSchema = yup.object().shape({
  items: yup
    .array()
    .of(goodsOutSchema)
    .min(1, "At least one goods out row is required"),
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
            You’re trying to send out more{" "}
            <strong>{recipe || "this recipe"}</strong> units than are currently
            available in your Recipe Inventory.
          </p>
          <div className="gof-block-stats">
            <div className="stat">
              <div className="label">Requested</div>
              <div className="value">
                {Number(need || 0).toLocaleString()}
              </div>
            </div>
            <div className="stat">
              <div className="label">Available</div>
              <div className="value">
                {Number(have || 0).toLocaleString()}
              </div>
            </div>
          </div>
          <p className="gof-callout">
            Please produce more of{" "}
            <strong>{recipe || "this recipe"}</strong> before recording these
            goods out.
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

/** Simple toast */
function Toast({ open, children, onClose }) {
  if (!open) return null;
  return (
    <div className="gof-toast" onClick={onClose}>
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
  const [blockInfo, setBlockInfo] = useState({
    recipe: "",
    need: 0,
    have: 0,
  });

  // Single form initial values
  const [initialValues] = useState({
    date: new Date().toISOString().split("T")[0],
    recipe: "",
    stockAmount: "",
    recipients: "",
  });

  // Tab state: "single" | "multiple"
  const [view, setView] = useState("single");

  // Fetch recipes (shared by single + multiple)
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
          ? data
              .map((r) => r.recipe_name ?? r.recipe ?? r.name)
              .filter(Boolean)
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

  // Fetch available units for a recipe from active Production Log
  const fetchAvailableUnitsForRecipe = async (recipeName) => {
    if (!cognitoId || !recipeName) return 0;
    try {
      const res = await fetch(
        `${API_BASE}/production-log/active?cognito_id=${encodeURIComponent(
          cognitoId
        )}`
      );
      if (!res.ok) throw new Error("Failed to fetch production log");
      const rows = await res.json();

      let total = 0;
      (Array.isArray(rows) ? rows : []).forEach((r) => {
        const rName = r.recipe ?? r.recipe_name ?? r.name ?? "";
        if ((rName || "").toString().trim() !== recipeName.toString().trim())
          return;

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

  // Single submit with HARD precheck, calls /add-goods-out
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

  // Multiple submit with HARD precheck across the whole batch, calls /add-goods-out-batch
  const handleBatchSubmit = async (values, { resetForm }) => {
    const items = values.items || [];

    // Build aggregated needed units per recipe
    const needByRecipe = {};
    items.forEach((e) => {
      const recipeName = (e.recipe || "").toString().trim();
      if (!recipeName) return;
      const amount = Number(e.stockAmount) || 0;
      if (!needByRecipe[recipeName]) needByRecipe[recipeName] = 0;
      needByRecipe[recipeName] += amount;
    });

    try {
      // HARD precheck: aggregated per recipe vs available
      for (const [recipeName, totalNeed] of Object.entries(needByRecipe)) {
        const have = await fetchAvailableUnitsForRecipe(recipeName);
        if (totalNeed > have) {
          setBlockInfo({ recipe: recipeName, need: totalNeed, have });
          setBlockOpen(true);
          return;
        }
      }

      // Shape payload just like single route, but as entries[]
      const payload = {
        entries: items.map((e) => ({
          date: e.date,
          recipe: e.recipe,
          stockAmount: e.stockAmount,
          recipients: e.recipients,
        })),
        cognito_id: cognitoId,
      };

      const response = await fetch(`${API_BASE}/add-goods-out-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errMsg = "Failed to submit batch";
        try {
          const errJson = await response.json();
          errMsg = errJson?.error || response.statusText || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      await response.json().catch(() => null);
      resetForm();
      setOpenToast(true);
    } catch (err) {
      console.error("❌ Error submitting batch:", err?.message || err);
      alert("Batch submission failed. Check console.");
    }
  };

  return (
    <div className="gof-wrap">
      {/* Scoped CSS */}
      <style>{`
        .gof-wrap {
          padding: 20px;
          color: ${brand.text};
          background: ${brand.surfaceMuted};
          min-height: 100%;
        }
        .gof-card {
          margin-top: 12px;
          padding: 16px;
          border: 1px solid ${brand.border};
          background: ${brand.surface};
          border-radius: 16px;
          box-shadow: ${brand.shadow};
        }
        .gof-title {
          font-weight: 800;
          margin: 0 0 4px;
        }
        .gof-sub {
          color: ${brand.subtext};
          margin: 0 0 18px;
        }

        /* Tabs */
        .gof-tabs {
          display: inline-flex;
          padding: 4px;
          border-radius: 999px;
          background: #e2e8f0;
          margin-bottom: 18px;
          gap: 4px;
        }
        .gof-tab {
          border-radius: 999px;
          border: none;
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          background: transparent;
          color: ${brand.subtext};
        }
        .gof-tab.active {
          background: #ffffff;
          color: ${brand.primary};
          box-shadow: ${brand.shadow};
        }

        .gof-grid {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          gap: 20px;
        }
        .col-12 { grid-column: span 12; }
        .col-6 { grid-column: span 6; }
        @media (max-width: 900px) {
          .col-6 { grid-column: span 12; }
        }

        .gof-field {
          display: flex;
          flex-direction: column;
        }
        .gof-label {
          font-size: 13px;
          font-weight: 600;
          color: ${brand.subtext};
          margin-bottom: 6px;
        }
        .gof-input,
        .gof-select {
          background: ${brand.surfaceMuted};
          border: 1px solid ${brand.border};
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 14px;
          outline: none;
          transition: border-color .15s ease, box-shadow .15s ease;
        }
        .gof-input:focus,
        .gof-select:focus {
          border-color: ${brand.primary};
          box-shadow: 0 0 0 4px ${brand.focusRing};
        }
        .gof-error {
          color: ${brand.danger};
          font-size: 12px;
          margin-top: 6px;
        }

        /* Multiple rows */
        .gof-multi-row {
          border: 1px solid ${brand.border};
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 12px;
          background: ${brand.surfaceMuted};
        }
        .gof-multi-row-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .gof-multi-index {
          font-size: 12px;
          font-weight: 700;
          color: ${brand.subtext};
        }
        .gof-multi-remove {
          border: none;
          background: none;
          color: ${brand.danger};
          font-size: 12px;
          cursor: pointer;
        }
        .gof-multi-actions {
          margin-top: 8px;
        }
        .gof-multi-add-btn {
          border-radius: 999px;
          border: 1px dashed ${brand.border};
          background: #f1f5f9;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          color: ${brand.subtext};
        }

        /* Submit pill button */
        .gof-pill {
          position: fixed;
          right: 20px;
          bottom: 20px;
          z-index: 10;
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
        .gof-pill:hover {
          transform: scale(1.06);
          background: linear-gradient(180deg, ${brand.primaryDark}, ${brand.primaryDark});
        }

        /* Toast */
        .gof-toast {
          position: fixed;
          top: 16px;
          right: 16px;
          transform: translateY(-20px);
          opacity: 0;
          animation: gof-toast-in .2s forwards;
          z-index: 20;
        }
        .gof-toast-inner {
          background: #0f172a;
          color: #e5e7eb;
          padding: 10px 14px;
          border-radius: 999px;
          font-size: 13px;
          box-shadow: ${brand.shadow};
        }
        @keyframes gof-toast-in {
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* Modal */
        .gof-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15,23,42,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 30;
        }
        .gof-modal {
          width: 100%;
          max-width: 480px;
          background: #fff;
          border-radius: 16px;
          border: 1px solid ${brand.border};
          box-shadow: 0 20px 40px rgba(15,23,42,0.35);
          overflow: hidden;
        }
        .gof-modal-header {
          padding: 12px 16px;
          border-bottom: 1px solid ${brand.border};
        }
        .gof-modal-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
        }
        .gof-modal-body {
          padding: 16px;
        }
        .gof-warning {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 12px;
        }
        .gof-block-stats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 12px;
        }
        .gof-block-stats .stat {
          border-radius: 12px;
          border: 1px solid ${brand.border};
          padding: 10px 12px;
          background: ${brand.surfaceMuted};
        }
        .gof-block-stats .label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: ${brand.subtext};
        }
        .gof-block-stats .value {
          font-size: 16px;
          font-weight: 800;
        }
        .gof-callout {
          font-size: 13px;
          color: ${brand.subtext};
          margin: 0;
        }
        .gof-modal-footer {
          padding: 10px 16px 14px;
          border-top: 1px solid ${brand.border};
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }
        .btn {
          font-size: 13px;
          border-radius: 999px;
          padding: 6px 12px;
          border: 1px solid transparent;
          cursor: pointer;
          font-weight: 600;
        }
        .btn.danger {
          background: #fee2e2;
          color: #b91c1c;
          border-color: #fecaca;
        }
      `}</style>

      <div className="gof-card">
        <h2 className="gof-title">Goods Out Form</h2>
        <p className="gof-sub">
          Record finished units leaving the factory. Use Single for one movement
          or Multiple to batch them.
        </p>

        {/* Tabs */}
        <div className="gof-tabs" role="tablist">
          <button
            type="button"
            className={`gof-tab ${view === "single" ? "active" : ""}`}
            onClick={() => setView("single")}
          >
            Single
          </button>
          <button
            type="button"
            className={`gof-tab ${view === "multiple" ? "active" : ""}`}
            onClick={() => setView("multiple")}
          >
            Multiple
          </button>
        </div>

        {/* SINGLE VIEW */}
        {view === "single" && (
          <Formik
            key={`single-${initialValues.date}`}
            initialValues={initialValues}
            validationSchema={goodsOutSchema}
            onSubmit={handleFormSubmit}
            enableReinitialize
          >
            {({
              values,
              errors,
              touched,
              handleBlur,
              handleChange,
              handleSubmit,
            }) => (
              <form onSubmit={handleSubmit} noValidate>
                <div className="gof-grid">
                  {/* Date */}
                  <div className="gof-field col-6">
                    <label className="gof-label" htmlFor="date">
                      Date
                    </label>
                    <input
                      id="date"
                      name="date"
                      type="date"
                      className="gof-input"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.date}
                    />
                    {touched.date && errors.date && (
                      <div className="gof-error">{errors.date}</div>
                    )}
                  </div>

                  {/* Recipe */}
                  <div className="gof-field col-6">
                    <label className="gof-label" htmlFor="recipe">
                      Recipe
                    </label>
                    <select
                      id="recipe"
                      name="recipe"
                      className="gof-select"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.recipe}
                    >
                      {loading ? (
                        <option value="" disabled>
                          Loading recipes...
                        </option>
                      ) : fetchErr ? (
                        <option value="" disabled>
                          {fetchErr}
                        </option>
                      ) : filteredRecipes.length > 0 ? (
                        <>
                          <option value="" disabled>
                            Select a recipe…
                          </option>
                          {filteredRecipes.map((recipe, idx) => (
                            <option key={idx} value={recipe}>
                              {recipe}
                            </option>
                          ))}
                        </>
                      ) : (
                        <option value="" disabled>
                          No recipes available
                        </option>
                      )}
                    </select>
                    {touched.recipe && errors.recipe && (
                      <div className="gof-error">{errors.recipe}</div>
                    )}
                  </div>

                  {/* Amount of Units */}
                  <div className="gof-field col-12">
                    <label className="gof-label" htmlFor="stockAmount">
                      Amount of Units
                    </label>
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
                    <label className="gof-label" htmlFor="recipients">
                      Recipient
                    </label>
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
                <button
                  type="submit"
                  className="gof-pill"
                  aria-label="Record goods out"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 5v14M5 12h14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  Record Goods Out
                </button>
              </form>
            )}
          </Formik>
        )}

        {/* MULTIPLE VIEW */}
        {view === "multiple" && (
          <Formik
            key="multiple-goods-out"
            initialValues={{
              items: [
                {
                  date: initialValues.date,
                  recipe: "",
                  stockAmount: "",
                  recipients: "",
                },
              ],
            }}
            validationSchema={multiGoodsOutSchema}
            onSubmit={handleBatchSubmit}
          >
            {({
              values,
              errors,
              touched,
              handleBlur,
              handleChange,
              handleSubmit,
            }) => (
              <form onSubmit={handleSubmit} noValidate>
                <FieldArray name="items">
                  {({ push, remove }) => (
                    <>
                      {values.items &&
                      Array.isArray(values.items) &&
                      values.items.length > 0 ? (
                        values.items.map((item, idx) => {
                          const itemErrors =
                            (errors.items && errors.items[idx]) || {};
                          const itemTouched =
                            (touched.items && touched.items[idx]) || {};

                          return (
                            <div className="gof-multi-row" key={idx}>
                              <div className="gof-multi-row-header">
                                <span className="gof-multi-index">
                                  Goods Out {idx + 1}
                                </span>
                                {values.items.length > 1 && (
                                  <button
                                    type="button"
                                    className="gof-multi-remove"
                                    onClick={() => remove(idx)}
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>

                              <div className="gof-grid">
                                {/* Date */}
                                <div className="gof-field col-6">
                                  <label
                                    className="gof-label"
                                    htmlFor={`items-${idx}-date`}
                                  >
                                    Date
                                  </label>
                                  <input
                                    id={`items-${idx}-date`}
                                    name={`items[${idx}].date`}
                                    type="date"
                                    className="gof-input"
                                    onBlur={handleBlur}
                                    onChange={handleChange}
                                    value={item.date}
                                  />
                                  {itemTouched.date && itemErrors.date && (
                                    <div className="gof-error">
                                      {itemErrors.date}
                                    </div>
                                  )}
                                </div>

                                {/* Recipe */}
                                <div className="gof-field col-6">
                                  <label
                                    className="gof-label"
                                    htmlFor={`items-${idx}-recipe`}
                                  >
                                    Recipe
                                  </label>
                                  <select
                                    id={`items-${idx}-recipe`}
                                    name={`items[${idx}].recipe`}
                                    className="gof-select"
                                    onBlur={handleBlur}
                                    onChange={handleChange}
                                    value={item.recipe}
                                  >
                                    {loading ? (
                                      <option value="" disabled>
                                        Loading recipes...
                                      </option>
                                    ) : fetchErr ? (
                                      <option value="" disabled>
                                        {fetchErr}
                                      </option>
                                    ) : filteredRecipes.length > 0 ? (
                                      <>
                                        <option value="" disabled>
                                          Select a recipe…
                                        </option>
                                        {filteredRecipes.map(
                                          (recipe, rIdx) => (
                                            <option
                                              key={rIdx}
                                              value={recipe}
                                            >
                                              {recipe}
                                            </option>
                                          )
                                        )}
                                      </>
                                    ) : (
                                      <option value="" disabled>
                                        No recipes available
                                      </option>
                                    )}
                                  </select>
                                  {itemTouched.recipe && itemErrors.recipe && (
                                    <div className="gof-error">
                                      {itemErrors.recipe}
                                    </div>
                                  )}
                                </div>

                                {/* Amount of Units */}
                                <div className="gof-field col-12">
                                  <label
                                    className="gof-label"
                                    htmlFor={`items-${idx}-stockAmount`}
                                  >
                                    Amount of Units
                                  </label>
                                  <input
                                    id={`items-${idx}-stockAmount`}
                                    name={`items[${idx}].stockAmount`}
                                    type="number"
                                    className="gof-input"
                                    onBlur={handleBlur}
                                    onChange={handleChange}
                                    value={item.stockAmount}
                                    step="any"
                                    placeholder="0"
                                  />
                                  {itemTouched.stockAmount &&
                                    itemErrors.stockAmount && (
                                      <div className="gof-error">
                                        {itemErrors.stockAmount}
                                      </div>
                                    )}
                                </div>

                                {/* Recipient */}
                                <div className="gof-field col-12">
                                  <label
                                    className="gof-label"
                                    htmlFor={`items-${idx}-recipients`}
                                  >
                                    Recipient
                                  </label>
                                  <input
                                    id={`items-${idx}-recipients`}
                                    name={`items[${idx}].recipients`}
                                    type="text"
                                    className="gof-input"
                                    onBlur={handleBlur}
                                    onChange={handleChange}
                                    value={item.recipients}
                                    placeholder="e.g., Customer / Store / Dept"
                                  />
                                  {itemTouched.recipients &&
                                    itemErrors.recipients && (
                                      <div className="gof-error">
                                        {itemErrors.recipients}
                                      </div>
                                    )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="gof-sub">
                          No rows yet – add at least one goods out row.
                        </p>
                      )}

                      <div className="gof-multi-actions">
                        <button
                          type="button"
                          className="gof-multi-add-btn"
                          onClick={() =>
                            push({
                              date: initialValues.date,
                              recipe: "",
                              stockAmount: "",
                              recipients: "",
                            })
                          }
                        >
                          + Add another row
                        </button>
                      </div>
                    </>
                  )}
                </FieldArray>

                {/* Fixed gradient pill submit */}
                <button
                  type="submit"
                  className="gof-pill"
                  aria-label="Record multiple goods out"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 5v14M5 12h14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  Submit Multiple
                </button>
              </form>
            )}
          </Formik>
        )}
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
