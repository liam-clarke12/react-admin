// src/scenes/form/GoodsOut/index.jsx  (rename as needed)
// Nory-styled, MUI-free version with identical behavior.
import React, { useState, useEffect } from "react";
import { Formik } from "formik";
import * as yup from "yup";
import { useAuth } from "../../../contexts/AuthContext";

// Brand tokens (Nory-like)
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

// Validation Schema (same rules)
const goodsOutSchema = yup.object().shape({
  date: yup.string().required("Date is required"),
  recipe: yup.string().required("Recipe is required"),
  stockAmount: yup
    .number()
    .typeError("Must be a number")
    .required("Stock amount is required")
    .positive("Must be positive"),
  recipients: yup.string().required("Recipient is required"),
});

const GoodsOutForm = () => {
  const { cognitoId } = useAuth();
  const [openToast, setOpenToast] = useState(false);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchErr, setFetchErr] = useState(null);

  // Keep your "reset after success" approach via local initialValues + enableReinitialize
  const [initialValues, setInitialValues] = useState({
    date: new Date().toISOString().split("T")[0],
    recipe: "",
    stockAmount: "",
    recipients: "",
  });

  // Fetch recipes (unchanged logic)
  useEffect(() => {
    const fetchRecipes = async () => {
      if (!cognitoId) return;
      setLoading(true);
      setFetchErr(null);
      try {
        const res = await fetch(
          `https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/recipes?cognito_id=${cognitoId}`
        );
        if (!res.ok) throw new Error("Failed to fetch recipes");
        const data = await res.json();
        setFilteredRecipes(Array.isArray(data) ? data.map((r) => r.recipe) : []);
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

  // When toast opens (success), refresh initial values (like your original)
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

  // Submit (same endpoint & payload)
  const handleFormSubmit = async (values, { resetForm }) => {
    const payload = { ...values, cognito_id: cognitoId };
    try {
      const response = await fetch(
        "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/add-goods-out",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
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

        /* Submit pill button (replaces MUI Fab) */
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
      `}</style>
      <div className="gof-card">
        <h2 className="gof-title">Goods Out Form</h2>
        <p className="gof-sub">Fill out the details and click Record.</p>

        <Formik
          key={initialValues.date}              // keep your re-init behavior
          initialValues={initialValues}
          validationSchema={goodsOutSchema}
          onSubmit={handleFormSubmit}
          enableReinitialize={true}
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
                    placeholder="e.g., Customer/Store/Dept"
                  />
                  {touched.recipients && errors.recipients && (
                    <div className="gof-error">{errors.recipients}</div>
                  )}
                </div>
              </div>

              {/* Fixed gradient pill submit (replaces MUI Fab) */}
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

      {/* Success Toast (replaces MUI Snackbar) */}
      <Toast open={openToast} onClose={() => setOpenToast(false)}>
        Goods Out has been successfully recorded!
      </Toast>
    </div>
  );
};

// Tiny Toast component used above
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

export default GoodsOutForm;
