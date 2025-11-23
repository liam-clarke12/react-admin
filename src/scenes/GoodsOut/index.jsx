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
  Stack,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import AddIcon from "@mui/icons-material/Add";
import { useAuth } from "../../contexts/AuthContext";
import * as yup from "yup";
import { Formik, FieldArray } from "formik";

/* =====================================================================
   Brand Styles (includes FORM + MODAL styles)
   ===================================================================== */
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

  /* Buttons */
  .r-btn-ghost {
    display:inline-flex; align-items:center; gap:8px; padding:8px 12px; font-weight:800; font-size:14px;
    color:#0f172a; border:1px solid #e5e7eb; border-radius:10px; background:#fff; cursor:pointer;
  }
  .r-btn-ghost:hover { background:#f4f1ff; }

  .r-btn-primary {
    display:inline-flex; align-items:center; gap:8px;
    padding:10px 16px; font-weight:800; color:#fff;
    background: linear-gradient(180deg, #7C3AED, #5B21B6);
    border:0; border-radius:10px; cursor:pointer;
    box-shadow:0 4px 12px rgba(124,58,237,0.25);
  }
  .r-btn-primary:hover {
    background: linear-gradient(180deg, #5B21B6, #5B21B6);
  }

  .r-btn-danger { background:#dc2626; }
  .r-btn-danger:hover { background:#b91c1c; }

  /* Search toolbar */
  .r-toolbar { background:#fff; padding:12px 16px; border:1px solid #e5e7eb; border-radius:12px; display:flex; flex-wrap:wrap; gap:10px; align-items:center; }
  .r-input { min-width:260px; flex:1; padding:10px 12px; border:1px solid #e5e7eb; border-radius:10px; outline:none; }
  .r-input:focus { border-color:#7C3AED; box-shadow:0 0 0 4px rgba(124,58,237,.18); }
  .r-select { padding:10px 12px; border:1px solid #e5e7eb; border-radius:10px; background:#fff; }
  .r-toolbar-gap { margin-top:12px; }

  /* Modal shell */
  .go-modal-dim {
    position:fixed; inset:0;
    background:rgba(0,0,0,0.55);
    display:flex; align-items:center; justify-content:center;
    z-index:9999;
    padding:20px;
  }
  .go-modal {
    background:#fff; width:100%; max-width:560px;
    max-height:92vh; overflow:hidden;
    border-radius:18px;
    display:flex; flex-direction:column;
    box-shadow:0 18px 40px rgba(15,23,42,0.35);
  }
  .go-mhdr {
    padding:20px 24px;
    border-bottom:1px solid #e5e7eb;
    display:flex; align-items:center; justify-content:space-between;
  }
  .go-mbody {
    padding:20px 24px;
    overflow:auto;
  }
  .go-mfooter {
    border-top:1px solid #e5e7eb;
    padding:14px 20px;
    display:flex; justify-content:flex-end; gap:12px;
    background:#f8fafc;
  }

  /* Tabs */
  .go-tabs { display:inline-flex; background:#e2e8f0; padding:4px; border-radius:999px; gap:4px; margin-bottom:18px; }
  .go-tab {
    border:none; background:transparent;
    padding:6px 14px; border-radius:999px;
    cursor:pointer;
    font-weight:700; font-size:13px;
    color:#64748b;
  }
  .go-tab.active {
    background:#fff; color:#7C3AED;
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
  .go-label { font-size:13px; font-weight:600; margin-bottom:6px; color:#475569; }
  .go-input, .go-select {
    padding:12px 14px; border-radius:12px;
    border:1px solid #e5e7eb; background:#f8fafc;
    font-size:14px; outline:none;
  }
  .go-input:focus, .go-select:focus {
    border-color:#7C3AED;
    box-shadow:0 0 0 4px rgba(124,58,237,.18);
  }
  .go-error { color:#dc2626; font-size:12px; margin-top:6px; }

  /* Multi rows */
  .go-row {
    border:1px solid #e5e7eb;
    background:#f8fafc;
    padding:14px;
    border-radius:12px;
    margin-bottom:14px;
  }
  .go-row-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
  .go-row-remove { border:none; background:none; color:#dc2626; cursor:pointer; font-size:12px; }

  /* Toast */
  .go-toast {
    position:fixed; top:16px; right:16px;
    background:#0f172a; color:#e5e7eb;
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
  .dg-wrap .MuiDataGrid-root { border:0; }

  /* Layout */
  .gi-layout { display:flex; gap:24px; align-items:flex-start; }
  .gi-main { flex:1 1 0%; min-width:0; }
  .gi-side { width:320px; flex:0 0 320px; position:sticky; top:16px; display:flex; flex-direction:column; gap:12px; }
  `}</style>
);

/* =====================================================================
   HARD BLOCK MODAL (NO PROCEED)
   ===================================================================== */
const HardBlockModal = ({ open, recipe, need, have, onClose }) => {
  if (!open) return null;
  return createPortal(
    <div className="go-modal-dim" onClick={onClose}>
      <div className="go-modal" onClick={(e) => e.stopPropagation()}>
        <div className="go-mhdr">
          <h3 style={{ margin:0, fontWeight:800, color:"#0f172a" }}>
            Insufficient Finished Units
          </h3>
          <button className="r-btn-ghost" onClick={onClose}>Close</button>
        </div>

        <div className="go-mbody">
          <p style={{
            background:"#fef2f2",
            border:"1px solid #fecaca",
            padding:"12px",
            borderRadius:"12px",
            color:"#b91c1c",
            fontWeight:600,
            marginBottom:"16px"
          }}>
            You’re trying to send out more <strong>{recipe}</strong> units than are currently available.
          </p>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"14px" }}>
            <div style={{ border:"1px solid #e5e7eb", borderRadius:"12px", padding:"10px 12px" }}>
              <div style={{ fontSize:11, color:"#64748b" }}>Requested</div>
              <div style={{ fontSize:20, fontWeight:900 }}>{need}</div>
            </div>
            <div style={{ border:"1px solid #e5e7eb", borderRadius:"12px", padding:"10px 12px" }}>
              <div style={{ fontSize:11, color:"#64748b" }}>Available</div>
              <div style={{ fontSize:20, fontWeight:900 }}>{have}</div>
            </div>
          </div>

          <p style={{ fontSize:13, color:"#475569" }}>
            Please produce more <strong>{recipe}</strong> before recording these goods out.
          </p>
        </div>

        <div className="go-mfooter">
          <button className="r-btn-ghost" onClick={onClose}>Close</button>
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

const API_BASE =
  "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

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
  items: yup
    .array()
    .of(goodsOutSchema)
    .min(1, "You must add at least one row"),
});

/* Fetch available units from Production Log */
const useAvailableUnitsFetcher = (cognitoId) => {
  return useCallback(
    async (recipeName) => {
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
          const rName =
            r.recipe ?? r.recipe_name ?? r.name ?? "";
          if ((rName || "").trim() !== recipeName.trim()) return;

          const br = Number(
            r.batchRemaining ??
              r.batch_remaining ??
              r.units_per_batch_total ??
              0
          );
          const waste = Number(
            r.units_of_waste ?? r.unitsOfWaste ?? 0
          );
          const out = Number(
            r.units_out ?? r.unitsOut ?? 0
          );
          const apiUnits = Number(
            r.units_remaining ??
              r.unitsRemaining ??
              NaN
          );

          let remain = Number.isFinite(apiUnits)
            ? apiUnits
            : Math.max(0, br - waste - out);

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
   MAIN COMPONENT
   ===================================================================== */
export default function GoodsOut() {
  const { cognitoId } = useAuth();

  /* ===========================
     NEW: Form Modal State
  ============================= */
  const [formOpen, setFormOpen] = useState(false);
  const [formView, setFormView] = useState("single"); // single | multiple

  const [recipes, setRecipes] = useState([]);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [recipesError, setRecipesError] = useState("");

  const [toastOpen, setToastOpen] = useState(false);

  const [blockOpen, setBlockOpen] = useState(false);
  const [blockInfo, setBlockInfo] = useState({
    recipe: "",
    need: 0,
    have: 0,
  });

  const fetchAvailableUnits = useAvailableUnitsFetcher(cognitoId);

  /* Fetch recipes for select dropdown */
  useEffect(() => {
    if (!cognitoId) return;
    const loadRecipes = async () => {
      setRecipesLoading(true);
      setRecipesError("");

      try {
        const res = await fetch(
          `${API_BASE}/recipes?cognito_id=${encodeURIComponent(
            cognitoId
          )}`
        );
        if (!res.ok) throw new Error("Failed to load recipes");
        const data = await res.json();

        const names = Array.isArray(data)
          ? data
              .map(
                (r) =>
                  r.recipe_name ??
                  r.recipe ??
                  r.name
              )
              .filter(Boolean)
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
      const payload = {
        ...values,
        cognito_id: cognitoId,
      };

      const res = await fetch(`${API_BASE}/add-goods-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Submit failed");

      helpers.resetForm();
      setFormOpen(false);
      setToastOpen(true);
      await fetchGoodsOut(); // auto refresh
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

    // aggregate needs
    const needMap = {};
    items.forEach((item) => {
      const r = item.recipe?.trim();
      if (!r) return;
      needMap[r] = (needMap[r] || 0) + Number(item.stockAmount || 0);
    });

    // HARD precheck
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

      const res = await fetch(
        `${API_BASE}/add-goods-out-batch`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Batch submit failed");

      helpers.resetForm();
      setFormOpen(false);
      setToastOpen(true);
      await fetchGoodsOut(); // refresh table
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
          {/* HEADER */}
          <div className="go-mhdr">
            <h3 style={{ margin: 0, fontWeight: 900 }}>
              Add Goods Out
            </h3>
            <button className="r-btn-ghost" onClick={() => setFormOpen(false)}>
              Close
            </button>
          </div>

          {/* BODY */}
          <div className="go-mbody">
            {/* Tabs */}
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

            {/* ===================== SINGLE FORM ===================== */}
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
                {({
                  handleSubmit,
                  values,
                  errors,
                  touched,
                  handleChange,
                  handleBlur,
                }) => (
                  <form onSubmit={handleSubmit}>

                    <div className="go-grid">
                      {/* Date */}
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
                        {touched.date && errors.date && (
                          <div className="go-error">{errors.date}</div>
                        )}
                      </div>

                      {/* Recipe */}
                      <div className="go-field col-6">
                        <label className="go-label">Recipe</label>
                        <select
                          name="recipe"
                          className="go-select"
                          value={values.recipe}
                          onChange={handleChange}
                        >
                          <option value="" disabled>
                            {recipesLoading
                              ? "Loading..."
                              : recipesError
                              ? recipesError
                              : "Select recipe…"}
                          </option>
                          {recipes.map((r, idx) => (
                            <option key={idx} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                        {touched.recipe && errors.recipe && (
                          <div className="go-error">{errors.recipe}</div>
                        )}
                      </div>

                      {/* Units */}
                      <div className="go-field col-12">
                        <label className="go-label">
                          Amount of Units
                        </label>
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

                      {/* Recipients */}
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

                    {/* FOOTER */}
                    <div className="go-mfooter">
                      <button
                        type="button"
                        className="r-btn-ghost"
                        onClick={() => setFormOpen(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="r-btn-primary"
                      >
                        Submit
                      </button>
                    </div>
                  </form>
                )}
              </Formik>
            )}

            {/* ===================== MULTIPLE FORM ===================== */}
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
                {({
                  values,
                  errors,
                  touched,
                  handleChange,
                  handleBlur,
                  handleSubmit,
                }) => (
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
                                    <button
                                      type="button"
                                      className="go-row-remove"
                                      onClick={() => remove(idx)}
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>

                                <div className="go-grid">
                                  {/* Date */}
                                  <div className="go-field col-6">
                                    <label className="go-label">
                                      Date
                                    </label>
                                    <input
                                      type="date"
                                      className="go-input"
                                      name={`items[${idx}].date`}
                                      value={item.date}
                                      onChange={handleChange}
                                    />
                                    {itemTouched.date && itemErrors.date && (
                                      <div className="go-error">
                                        {itemErrors.date}
                                      </div>
                                    )}
                                  </div>

                                  {/* Recipe */}
                                  <div className="go-field col-6">
                                    <label className="go-label">
                                      Recipe
                                    </label>
                                    <select
                                      className="go-select"
                                      name={`items[${idx}].recipe`}
                                      value={item.recipe}
                                      onChange={handleChange}
                                    >
                                      <option value="" disabled>
                                        {recipesLoading
                                          ? "Loading..."
                                          : recipesError
                                          ? recipesError
                                          : "Select recipe…"}
                                      </option>
                                      {recipes.map((r, i) => (
                                        <option key={i} value={r}>
                                          {r}
                                        </option>
                                      ))}
                                    </select>
                                    {itemTouched.recipe &&
                                      itemErrors.recipe && (
                                        <div className="go-error">
                                          {itemErrors.recipe}
                                        </div>
                                      )}
                                  </div>

                                  {/* Units */}
                                  <div className="go-field col-12">
                                    <label className="go-label">
                                      Amount of Units
                                    </label>
                                    <input
                                      type="number"
                                      className="go-input"
                                      name={`items[${idx}].stockAmount`}
                                      value={item.stockAmount}
                                      onChange={handleChange}
                                      placeholder="0"
                                    />
                                    {itemTouched.stockAmount &&
                                      itemErrors.stockAmount && (
                                        <div className="go-error">
                                          {itemErrors.stockAmount}
                                        </div>
                                      )}
                                  </div>

                                  {/* Recipients */}
                                  <div className="go-field col-12">
                                    <label className="go-label">
                                      Recipient
                                    </label>
                                    <input
                                      type="text"
                                      className="go-input"
                                      name={`items[${idx}].recipients`}
                                      value={item.recipients}
                                      placeholder="Store / Customer"
                                      onChange={handleChange}
                                    />
                                    {itemTouched.recipients &&
                                      itemErrors.recipients && (
                                        <div className="go-error">
                                          {itemErrors.recipients}
                                        </div>
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
                                date: new Date()
                                  .toISOString()
                                  .split("T")[0],
                                recipe: "",
                                stockAmount: "",
                                recipients: "",
                              })
                            }
                          >
                            + Add another row
                          </button>

                          {/* FOOTER */}
                          <div className="go-mfooter">
                            <button
                              type="button"
                              className="r-btn-ghost"
                              onClick={() => setFormOpen(false)}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="r-btn-primary"
                            >
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

const nf = (n) => new Intl.NumberFormat().format(n ?? 0);

const safeParse = (val, fallback) => {
  if (val == null) return fallback;
  try {
    const p = JSON.parse(val);
    return p ?? fallback;
  } catch {
    return fallback;
  }
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
  const rawCodes =
    row.batchcodes ?? row.batchCodes ?? row.codes ?? row.batch_codes;
  const rawQty =
    row.quantitiesUsed ??
    row.quantities ??
    row.batchesUsed ??
    row.quantities_used;

  const codes = safeParse(rawCodes, []);
  const qty = safeParse(rawQty, []);

  const out = [];

  if (Array.isArray(codes) && codes.length) {
    codes.forEach((c, i) => {
      const code =
        typeof c === "string"
          ? c
          : c?.code || c?.batchCode || `Batch ${i + 1}`;
      const units = Number(
        (Array.isArray(qty) ? qty[i] : qty?.[code]) ??
          c?.units ??
          c?.qty ??
          0
      );
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
    return qty.map((u, i) => ({
      code: `Batch ${i + 1}`,
      units: Number(u) || 0,
    }));
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
  typeof window === "undefined"
    ? null
    : createPortal(children, document.body);

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

  /* Fetch goods-out list */
  const fetchGoodsOut = useCallback(async () => {
    if (!cognitoId) return setFatalMsg("Missing cognito_id.");

    try {
      const res = await fetch(
        `${API_BASE}/goods-out?cognito_id=${encodeURIComponent(cognitoId)}`
      );
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

        const recipe =
          r.recipe ??
          r.recipe_name ??
          r.product ??
          r.product_name ??
          "Unknown";

        const recipients =
          r.recipients ?? r.customer ?? r.client ?? r.destination ?? "";

        const date =
          formatToYYYYMMDD(
            r.date ??
              r.production_log_date ??
              r.created_at ??
              r.createdAt
          ) || "";

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
      const map = new Map(
        goodsOut.map((r) => [String(r.id), r])
      );
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
      {
        field: "stockAmount",
        headerName: "Units Out",
        type: "number",
        flex: 1,
      },
      {
        field: "batchcodes",
        headerName: "Batchcodes",
        flex: 1,
        renderCell: (params) => (
          <Typography
            sx={{
              cursor: "pointer",
              color: "#7C3AED",
              fontWeight: 700,
              "&:hover": { color: "#5B21B6" },
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
      rows = rows.filter((r) =>
        Object.values(r).some((v) =>
          String(v).toLowerCase().includes(q)
        )
      );
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
    const totalUnits = filteredRows.reduce(
      (s, r) => s + (r.stockAmount || 0),
      0
    );
    const shipments = filteredRows.length;
    const uniq = (arr) =>
      Array.from(new Set(arr.filter(Boolean))).length;

    const uniqueRecipes = uniq(filteredRows.map((r) => r.recipe));
    const uniqueRecipients = uniq(
      filteredRows.map((r) => r.recipients)
    );

    return {
      totalUnits,
      shipments,
      uniqueRecipes,
      uniqueRecipients,
    };
  }, [filteredRows]);

  /* ===================================================================== */

  return (
    <div className="r-wrap">
      <BrandStyles />

      {/* Form modal */}
      {renderFormModal()}

      {/* Hard block modal */}
      <HardBlockModal
        open={blockOpen}
        recipe={blockInfo.recipe}
        need={blockInfo.need}
        have={blockInfo.have}
        onClose={() => setBlockOpen(false)}
      />

      {/* Toast */}
      <Toast open={toastOpen} onClose={() => setToastOpen(false)}>
        Goods Out recorded successfully!
      </Toast>

      {/* Errors */}
      {fatalMsg && (
        <div
          className="r-card"
          style={{
            borderColor: "#fecaca",
            background: "#fff1f2",
            color: "#b91c1c",
            marginBottom: 12,
          }}
        >
          <strong>Error:</strong> {fatalMsg}
        </div>
      )}

      {/* Layout */}
      <div className="gi-layout">
        {/* MAIN TABLE */}
        <div className="gi-main">
          <div className="r-card">
            {/* Header */}
            <div className="r-head">
              <div>
                <h2 className="r-title">Goods Out</h2>
                <p className="r-sub">
                  Log of dispatched units with batchcode details
                </p>
              </div>

              <div className="r-flex">
                {/* Add Goods Out button (Option 1) */}
                <button
                  className="r-btn-primary"
                  onClick={() => setFormOpen(true)}
                >
                  <AddIcon fontSize="small" /> Add Goods Out
                </button>

                {/* Delete selected */}
                {selectedRows.length > 0 && (
                  <button
                    className="r-btn-ghost"
                    onClick={() => setDeleteOpen(true)}
                    style={{ color: "#dc2626", borderColor: "#fecaca" }}
                  >
                    <DeleteIcon fontSize="small" /> Delete
                  </button>
                )}
              </div>
            </div>

            {/* Toolbar */}
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
                <option value="stockAmount:desc">
                  Units Out (high → low)
                </option>
                <option value="stockAmount:asc">
                  Units Out (low → high)
                </option>
                <option value="recipients:asc">
                  Recipients A→Z
                </option>
                <option value="recipients:desc">
                  Recipients Z→A
                </option>
              </select>
            </div>

            {/* DataGrid */}
            <div className="r-toolbar-gap dg-wrap">
              <DataGrid
                rows={visibleRows}
                columns={columns}
                getRowId={(row) => row.id}
                checkboxSelection
                disableRowSelectionOnClick
                rowSelectionModel={selectedRows}
                onRowSelectionModelChange={(m) =>
                  setSelectedRows(m.map(String))
                }
              />
            </div>

            {/* Footer */}
            <div className="r-footer">
              <span className="r-muted">
                Showing{" "}
                {filteredRows.length === 0
                  ? 0
                  : page * rowsPerPage + 1}
                –
                {Math.min(
                  (page + 1) * rowsPerPage,
                  filteredRows.length
                )}{" "}
                of {filteredRows.length}
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
                  disabled={
                    (page + 1) * rowsPerPage >= filteredRows.length
                  }
                  onClick={() =>
                    setPage((p) =>
                      (p + 1) * rowsPerPage < filteredRows.length
                        ? p + 1
                        : p
                    )
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

        {/* RIGHT SIDEBAR */}
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
              <span className="stat-kpi">
                {nf(stats.uniqueRecipients)}
              </span>
            </div>
          </div>
        </aside>
      </div>

      {/* DELETE CONFIRM MODAL */}
      {deleteOpen && selectedRows.length > 0 && (
        <Portal>
          <div className="go-modal-dim">
            <div className="go-modal">
              <div className="go-mhdr">
                <h3 style={{ margin: 0, fontWeight: 900 }}>
                  Confirm Deletion
                </h3>
                <button
                  className="r-btn-ghost"
                  onClick={() => setDeleteOpen(false)}
                >
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
                    background: "#fee2e2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#dc2626",
                  }}
                >
                  <DeleteIcon />
                </div>

                <h3 style={{ marginTop: 16, fontWeight: 800 }}>
                  Delete {selectedRows.length} record
                  {selectedRows.length > 1 ? "s" : ""}?
                </h3>

                <p style={{ color: "#64748b", fontSize: 13 }}>
                  This is a soft delete.
                </p>
              </div>

              <div className="go-mfooter">
                <button
                  className="r-btn-ghost"
                  onClick={() => setDeleteOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="r-btn-primary r-btn-danger"
                  onClick={handleDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* BATCHCODE DRAWER */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={closeDrawer}
        PaperProps={{
          sx: {
            width: 420,
            borderRadius: "20px 0 0 20px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 24px 48px rgba(15,23,42,0.12)",
          },
        }}
      >
        {/* HEADER */}
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
              <Typography variant="h6" fontWeight={800}>
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

        {/* CONTENT */}
        <Box sx={{ p: 2 }}>
          <Card
            variant="outlined"
            sx={{
              borderColor: "#e5e7eb",
              borderRadius: 2,
              mb: 2,
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Typography fontSize={12} color="#64748b" fontWeight={700}>
                Recipient
              </Typography>
              <Typography fontWeight={800}>
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
            sx={{ mb: 2 }}
          />

          <Divider sx={{ mb: 2 }} />

          {drawerItems
            .filter((i) =>
              i.code.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((it, idx) => (
              <Box
                key={`${it.code}-${idx}`}
                sx={{
                  border:
                    "1px solid #e5e7eb",
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
                        background: "#f1f5f9",
                        border: "1px solid #e5e7eb",
                        fontSize: 12,
                        fontWeight: 800,
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
                      fontWeight: 700,
                      color: "#0f172a",
                    }}
                  />
                </ListItem>
              </Box>
            ))}
        </Box>
      </Drawer>
    </div>
  );
}
