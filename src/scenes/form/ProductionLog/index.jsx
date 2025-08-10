// src/scenes/form/RecipeProduction/index.jsx (rename as needed)
// Nory-styled, MUI-free version that keeps all logic & API behavior.
import React, { useState, useEffect } from "react";
import { Formik } from "formik";
import * as yup from "yup";
import { useAuth } from "../../../contexts/AuthContext";

// ===== Brand tokens (Nory-like) =====
const brand = {
  text: "#0f172a",
  subtext: "#334155",
  border: "#e5e7eb",
  inputBg: "#ffffff",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  primary: "#2563eb",
  primaryDark: "#1d4ed8",
  focusRing: "rgba(37, 99, 235, 0.35)",
  danger: "#dc2626",
  shadow: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)",
};

// ===== Validation schema (unchanged logic) =====
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

// ===== Initial values (same behavior) =====
const initialValues = {
  date: new Date().toISOString().split("T")[0],
  recipe: "",
  batchesProduced: "",
  unitsOfWaste: 0,
  batchCode: "",
};

// ===== Tiny toast replacing MUI Snackbar =====
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

const ProductionLogForm = () => {
  const { cognitoId } = useAuth();
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [openToast, setOpenToast] = useState(false);

  // --- Fetch recipes by cognitoId (same API and logic) ---
  useEffect(() => {
    const fetchRecipes = async () => {
      if (!cognitoId) return;

      setLoading(true);
      setFetchError(null);

      try {
        const response = await fetch(
          `https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/recipes?cognito_id=${cognitoId}`
        );
        if (!response.ok) throw new Error("Failed to fetch recipes");

        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setFilteredRecipes(data.map((recipe) => recipe.recipe));
        } else {
          setFilteredRecipes([]);
        }
      } catch (err) {
        console.error("Error fetching recipes:", err);
        setFetchError("Error fetching recipes");
        setFilteredRecipes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [cognitoId]);

  // --- Submit handler (same endpoint & payload) ---
  const handleFormSubmit = async (values, { resetForm }) => {
    const payload = { ...values, cognito_id: cognitoId };
    try {
      const response = await fetch(
        "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/add-production-log",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) throw new Error("Failed to submit data");
      await response.json().catch(() => null); // in case endpoint returns no body
      resetForm();
      setOpenToast(true);
    } catch (error) {
      console.error("Error submitting data:", error);
      alert("Submission failed. Check console.");
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
                    {loading ? (
                      <option value="" disabled>Loading recipes...</option>
                    ) : fetchError ? (
                      <option value="" disabled>{fetchError}</option>
                    ) : filteredRecipes.length > 0 ? (
                      <>
                        <option value="" disabled>Select a recipe…</option>
                        {filteredRecipes.map((r, idx) => (
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

              {/* Fixed gradient pill action (replaces MUI Fab) */}
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

      {/* Success Toast */}
      <Toast open={openToast} onClose={() => setOpenToast(false)}>
        Production log form has been successfully recorded!
      </Toast>
    </div>
  );
};

export default ProductionLogForm;
