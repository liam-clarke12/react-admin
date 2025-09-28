// src/scenes/form/RecipeForm/index.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Formik, FieldArray } from "formik";
import * as yup from "yup";
import { useAuth } from "../../../contexts/AuthContext";

const API_BASE =
  "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

/** Brand tokens (Nory-like) */
const brand = {
  text: "#0f172a",
  subtext: "#334155",
  border: "#e5e7eb",
  inputBg: "#ffffff",
  surface: "#ffffff",
  primary: "#e11d48",
  primaryDark: "#be123c",
  focusRing: "rgba(225, 29, 72, 0.35)",
  danger: "#dc2626",
  shadow: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)",
};

const unitOptions = [
  { value: "grams", label: "Grams (g)" },
  { value: "ml", label: "Milliliters (ml)" },
   { value: "kg", label: "Kilograms (Kg)" },
    { value: "l", label: "Litres (L)" },
  { value: "units", label: "Units" },
];

/** Toast (replaces MUI Snackbar) */
function Toast({ open, onClose, children }) {
  React.useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [open, onClose]);
  return (
    <div aria-live="polite" className={`rf-toast ${open ? "show" : ""}`} role="status">
      <div className="rf-toast-inner">{children}</div>
    </div>
  );
}

/** Modal (replaces MUI Dialog) */
function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="rf-modal-backdrop" onClick={onClose}>
      <div
        className="rf-modal"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="rf-modal-header">
          <h3>{title}</h3>
          <button
            type="button"
            className="rf-btn rf-btn-ghost"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="rf-modal-body">{children}</div>
        <div className="rf-modal-footer">{footer}</div>
      </div>
    </div>
  );
}

/** Lightweight Combobox for ingredient search/selection */
function ComboBox({
  options,
  value, // <-- expects the option id
  onChange,
  placeholder = "Search or select…",
  disabled = false,
  loading = false,
}) {
  const containerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);

  // derive display label for current value
  const current = options.find((o) => o.id === value);
  const display = open ? q : current?.name || "";

  const filtered = !q.trim()
    ? options.slice(0, 50)
    : options
        .filter((o) => o.name.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 50);

  // close on outside click
  useEffect(() => {
    function onDoc(e) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className={`rf-combobox ${disabled ? "disabled" : ""}`} ref={containerRef}>
      <input
        className="rf-input"
        placeholder={placeholder}
        value={display}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setHi(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
            setOpen(true);
            return;
          }
          if (e.key === "ArrowDown") setHi((h) => Math.min(h + 1, filtered.length - 1));
          if (e.key === "ArrowUp") setHi((h) => Math.max(h - 1, 0));
          if (e.key === "Enter") {
            const pick = filtered[hi];
            if (pick) {
              onChange(pick.id);
              setQ(pick.name);
              setOpen(false);
            }
          }
          if (e.key === "Escape") setOpen(false);
        }}
        disabled={disabled}
      />
      <div className="rf-combobox-icon">⌄</div>
      {open && (
        <div className="rf-combobox-popover">
          {loading ? (
            <div className="rf-combobox-item muted">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="rf-combobox-item muted">No matches</div>
          ) : (
            filtered.map((o, idx) => (
              <button
                key={o.id}
                type="button"
                className={`rf-combobox-item ${idx === hi ? "active" : ""}`}
                onMouseEnter={() => setHi(idx)}
                onClick={() => {
                  onChange(o.id);
                  setQ(o.name);
                  setOpen(false);
                }}
              >
                {o.name} {o.source === "custom" ? "· Custom" : ""}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const RecipeForm = () => {
  const { cognitoId } = useAuth();

  // master + custom ingredient lists
  const [masterIngredients, setMasterIngredients] = useState([]);
  const [customIngredients, setCustomIngredients] = useState([]);
  const [loadingMaster, setLoadingMaster] = useState(false);
  const [loadingCustom, setLoadingCustom] = useState(false);

  // merge for dropdown
  const allIngredients = useMemo(
    () => [
      ...masterIngredients.map((i) => ({ ...i, source: "master" })),
      ...customIngredients.map((i) => ({ ...i, source: "custom" })),
    ],
    [masterIngredients, customIngredients]
  );

  // toast & add-ingredient dialog state
  const [openToast, setOpenToast] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newIngredient, setNewIngredient] = useState("");
  const [adding, setAdding] = useState(false);

  // fetch global master list
  useEffect(() => {
    if (!cognitoId) return;
    setLoadingMaster(true);
    fetch(`${API_BASE}/ingredients?cognito_id=${cognitoId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch ingredients");
        return res.json();
      })
      .then((data) => setMasterIngredients(data))
      .catch((err) => console.error("Error fetching master ingredients:", err))
      .finally(() => setLoadingMaster(false));
  }, [cognitoId]);

  // fetch user custom list
  useEffect(() => {
    if (!cognitoId) return;
    setLoadingCustom(true);
    fetch(`${API_BASE}/custom-ingredients?cognito_id=${cognitoId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch custom ingredients");
        return res.json();
      })
      .then((data) =>
        setCustomIngredients(data.map((ci) => ({ id: `c-${ci.id}`, name: ci.name })))
      )
      .catch((err) => console.error("Error fetching custom ingredients:", err))
      .finally(() => setLoadingCustom(false));
  }, [cognitoId]);

  // open/close add dialog
  const openAddDialog = () => {
    setNewIngredient("");
    setAddDialogOpen(true);
  };
  const closeAddDialog = () => setAddDialogOpen(false);

  // handle adding custom ingredient
  const handleAddIngredient = async () => {
    if (!newIngredient.trim() || !cognitoId || adding) return;
    setAdding(true);
    try {
      const res = await fetch(`${API_BASE}/custom-ingredients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cognito_id: cognitoId, name: newIngredient.trim() }),
      });
      if (!res.ok) throw new Error("Failed to add ingredient");
      // refresh custom list
      const updated = await fetch(
        `${API_BASE}/custom-ingredients?cognito_id=${cognitoId}`
      ).then((r) => {
        if (!r.ok) throw new Error("Failed to fetch updated custom");
        return r.json();
      });
      setCustomIngredients(updated.map((ci) => ({ id: `c-${ci.id}`, name: ci.name })));
      closeAddDialog();
    } catch (err) {
      console.error("Error adding custom ingredient:", err);
      alert("Failed to add ingredient");
    } finally {
      setAdding(false);
    }
  };

  // submit
  const handleFormSubmit = async (values, { resetForm }) => {
    const payload = {
      recipe: values.recipe,
      upb: values.upb,
      // send the NAME strings to the backend (it looks up ingredient ids by name)
      ingredients: values.ingredients.map((i) => i.name),
      quantities: values.ingredients.map((i) => i.quantity),
      units: values.ingredients.map((i) => i.unit),
      cognito_id: cognitoId,
    };
    try {
      const res = await fetch(`${API_BASE}/add-recipe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to add recipe");
      await res.json();
      resetForm();
      setOpenToast(true);
    } catch (err) {
      console.error("Error submitting recipe:", err);
      alert("Recipe submission failed");
    }
  };

  // validation
  const RecipeSchema = yup.object().shape({
    recipe: yup.string().required("Recipe is required"),
    upb: yup
      .number()
      .typeError("Must be a number")
      .required("Units per Batch is required")
      .positive("Must be positive"),
    ingredients: yup.array().of(
      yup.object().shape({
        // we validate the NAME, which we now set when an option is picked
        name: yup.string().required("Ingredient is required"),
        quantity: yup
          .number()
          .typeError("Must be a number")
          .required("Quantity is required")
          .positive("Must be positive"),
        unit: yup.string().required("Unit is required"),
      })
    ),
  });

  const initialValues = {
    recipe: "",
    upb: "",
    // keep both id and name so display & payload are correct
    ingredients: [{ id: "", name: "", quantity: "", unit: "grams" }],
  };

  return (
    <div className="rf-wrap">
      {/* Scoped styles */}
      <style>{`
        .rf-wrap { padding: 20px; color: ${brand.text}; }
        .rf-card {
          margin-top: 12px;
          padding: 16px;
          border: 1px solid ${brand.border};
          background: ${brand.surface};
          border-radius: 16px;
          box-shadow: ${brand.shadow};
        }
        .rf-title { font-weight: 800; margin: 0 0 4px; }
        .rf-sub { color: ${brand.subtext}; margin: 0 0 18px; }

        .rf-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 20px; }
        .col-12 { grid-column: span 12; }
        .col-6 { grid-column: span 6; }
        .col-4 { grid-column: span 4; }
        .col-3 { grid-column: span 3; }
        .col-2 { grid-column: span 2; }
        @media (max-width: 900px) {
          .col-6, .col-4, .col-3, .col-2 { grid-column: span 12; }
        }

        .rf-field { display: flex; flex-direction: column; }
        .rf-label { font-size: 13px; font-weight: 600; color: ${brand.subtext}; margin-bottom: 6px; }
        .rf-input, .rf-select, .rf-textarea {
          background: ${brand.inputBg};
          border: 1px solid ${brand.border};
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 14px;
          outline: none;
          transition: border-color .15s ease, box-shadow .15s ease;
        }
        .rf-input:focus, .rf-select:focus, .rf-textarea:focus {
          border-color: ${brand.primary};
          box-shadow: 0 0 0 4px ${brand.focusRing};
        }

        .rf-error { color: ${brand.danger}; font-size: 12px; margin-top: 6px; }

        .rf-row-actions { display: flex; align-items: end; gap: 8px; }
        .rf-btn, .rf-pill {
          border: 0; cursor: pointer; font-weight: 800;
        }
        .rf-link {
          background: transparent; color: ${brand.primary};
        }
        .rf-link:hover { color: ${brand.primaryDark}; }

        .rf-pill {
          display: inline-flex; align-items: center; gap: 8px;
          border-radius: 999px; padding: 12px 20px; color: #fff;
          background: linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark});
          box-shadow: 0 8px 16px rgba(29,78,216,0.25), 0 2px 4px rgba(15,23,42,0.06);
        }
        .rf-pill:hover { background: linear-gradient(180deg, ${brand.primaryDark}, ${brand.primaryDark}); }

        .rf-actions { display: flex; justify-content: flex-end; margin-top: 20px; }

        /* Toast */
        .rf-toast {
          position: fixed; top: 16px; right: 16px;
          transform: translateY(-20px); opacity: 0;
          transition: all .2s ease; z-index: 60; pointer-events: none;
        }
        .rf-toast.show { transform: translateY(0); opacity: 1; }
        .rf-toast-inner {
          background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46;
          padding: 10px 12px; border-radius: 10px; font-weight: 700; box-shadow: ${brand.shadow};
        }

        /* Modal */
        .rf-modal-backdrop {
          position: fixed; inset: 0; background: rgba(15,23,42,.55);
          display: flex; align-items: center; justify-content: center; z-index: 70;
        }
        .rf-modal {
          width: min(560px, 92vw); background: ${brand.surface};
          border: 1px solid ${brand.border}; border-radius: 14px; box-shadow: ${brand.shadow}; overflow: hidden;
        }
        .rf-modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px; border-bottom: 1px solid ${brand.border};
        }
        .rf-modal-header h3 { margin: 0; font-weight: 800; }
        .rf-modal-body { padding: 16px; }
        .rf-modal-footer { padding: 12px 16px; display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid ${brand.border}; }
        .rf-btn-ghost { background: transparent; color: ${brand.text}; }
        .rf-btn-primary { color: #fff; background: linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark}); border-radius: 10px; padding: 10px 14px; }
        .rf-btn-primary:disabled { opacity: .6; cursor: default; }

        /* Combobox */
        .rf-combobox { position: relative; }
        .rf-combobox.disabled { opacity: .6; pointer-events: none; }
        .rf-combobox .rf-input { width: 100%; padding-right: 34px; }
        .rf-combobox-icon {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%); pointer-events: none; color: ${brand.subtext};
        }
        .rf-combobox-popover {
          position: absolute; top: calc(100% + 6px); left: 0; right: 0;
          background: #fff; border: 1px solid ${brand.border}; border-radius: 12px;
          box-shadow: ${brand.shadow}; max-height: 220px; overflow: auto; z-index: 50;
        }
        .rf-combobox-item {
          width: 100%; text-align: left; background: transparent; padding: 10px 12px; border: 0; cursor: pointer;
        }
        .rf-combobox-item:hover, .rf-combobox-item.active { background: #f1f5f9; }
        .rf-combobox-item.muted { color: ${brand.subtext}; cursor: default; }
      `}</style>

      <div className="rf-card">
        <h2 className="rf-title">Add Recipe</h2>
        <p className="rf-sub">Fill out the details and click Save.</p>

        <Formik
          onSubmit={handleFormSubmit}
          initialValues={{
            recipe: "",
            upb: "",
            // keep both fields: id (for ComboBox) and name (for payload)
            ingredients: [{ id: "", name: "", quantity: "", unit: "grams" }],
          }}
          validationSchema={RecipeSchema}
        >
          {({ values, errors, touched, handleBlur, handleChange, handleSubmit, setFieldValue }) => (
            <form onSubmit={handleSubmit} noValidate>
              <div className="rf-grid">
                <div className="rf-field col-12">
                  <label className="rf-label" htmlFor="recipe">Recipe</label>
                  <input
                    id="recipe"
                    name="recipe"
                    type="text"
                    className="rf-input"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.recipe}
                    placeholder="e.g., Margherita Pizza"
                  />
                  {touched.recipe && errors.recipe && <div className="rf-error">{errors.recipe}</div>}
                </div>

                <div className="rf-field col-12">
                  <label className="rf-label" htmlFor="upb">Units per Batch</label>
                  <input
                    id="upb"
                    name="upb"
                    type="number"
                    className="rf-input"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.upb}
                    placeholder="e.g., 8"
                  />
                  {touched.upb && errors.upb && <div className="rf-error">{errors.upb}</div>}
                </div>

                {/* FieldArray Rows */}
                <div className="col-12">
                  <FieldArray name="ingredients">
                    {({ push, remove }) => (
                      <>
                        {values.ingredients.map((ing, idx) => {
                          const t = touched.ingredients?.[idx] || {};
                          const e = errors.ingredients?.[idx] || {};
                          return (
                            <div className="rf-grid" key={idx} style={{ marginTop: idx > 0 ? 6 : 0 }}>
                              <div className="rf-field col-4">
                                <label className="rf-label">Ingredient</label>
                                <ComboBox
                                  options={allIngredients}
                                  value={ing.id} // << use id for selection
                                  onChange={(id) => {
                                    // set id and the human-readable name so payload is correct
                                    setFieldValue(`ingredients.${idx}.id`, id);
                                    const pick = allIngredients.find((o) => o.id === id);
                                    setFieldValue(`ingredients.${idx}.name`, pick?.name || "");
                                  }}
                                  loading={loadingMaster || loadingCustom}
                                  placeholder="Search or select ingredient…"
                                />
                                {t?.name && e?.name && <div className="rf-error">{e.name}</div>}
                              </div>

                              <div className="rf-field col-3">
                                <label className="rf-label">Quantity</label>
                                <input
                                  type="number"
                                  className="rf-input"
                                  name={`ingredients.${idx}.quantity`}
                                  value={ing.quantity}
                                  onBlur={handleBlur}
                                  onChange={handleChange}
                                  step="any"
                                  placeholder="0"
                                />
                                {t?.quantity && e?.quantity && <div className="rf-error">{e.quantity}</div>}
                              </div>

                              <div className="rf-field col-3">
                                <label className="rf-label">Unit</label>
                                <select
                                  className="rf-select"
                                  name={`ingredients.${idx}.unit`}
                                  value={ing.unit}
                                  onChange={handleChange}
                                >
                                  {unitOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                                {t?.unit && e?.unit && <div className="rf-error">{e.unit}</div>}
                              </div>

                              <div className="rf-row-actions col-2">
                                <button
                                  type="button"
                                  className="rf-btn rf-link"
                                  onClick={() => remove(idx)}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        <div style={{ marginTop: 12 }}>
                          <button
                            type="button"
                            className="rf-btn rf-link"
                            onClick={() => push({ id: "", name: "", quantity: "", unit: "grams" })}
                            style={{ marginRight: 16 }}
                          >
                            + Add Recipe Row
                          </button>
                          <button type="button" className="rf-btn rf-link" onClick={openAddDialog}>
                            Add Ingredient +
                          </button>
                        </div>
                      </>
                    )}
                  </FieldArray>
                </div>
              </div>

              <div className="rf-actions">
                <button type="submit" className="rf-pill">
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Save Recipe
                </button>
              </div>
            </form>
          )}
        </Formik>
      </div>

      {/* Success Toast */}
      <Toast open={openToast} onClose={() => setOpenToast(false)}>
        Recipe has been successfully recorded!
      </Toast>

      {/* Add Ingredient Modal */}
      <Modal
        open={addDialogOpen}
        onClose={closeAddDialog}
        title="Add New Ingredient"
        footer={
          <>
            <button
              type="button"
              className="rf-btn rf-btn-ghost"
              onClick={closeAddDialog}
              disabled={adding}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rf-btn rf-btn-primary"
              onClick={handleAddIngredient}
              disabled={adding}
            >
              {adding ? "Adding..." : "Add"}
            </button>
          </>
        }
      >
        <div className="rf-field">
          <label className="rf-label" htmlFor="newIngredient">Ingredient Name</label>
          <input
            id="newIngredient"
            type="text"
            className="rf-input"
            value={newIngredient}
            onChange={(e) => setNewIngredient(e.target.value)}
            autoFocus
          />
        </div>
      </Modal>
    </div>
  );
};

export default RecipeForm;
