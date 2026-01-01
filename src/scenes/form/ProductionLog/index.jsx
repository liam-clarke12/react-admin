// src/scenes/HRP/form/ProductionLog.jsx
// ✅ Dark mode added:
// - Reads localStorage('theme-mode') + listens for window 'themeChanged'
// - Uses CSS variables for light/dark palettes (inputs, tabs, rows, toast, modals)
// - Keeps your existing logic + portals + z-index protections
//
// ✅ Update:
// - Added Expiry Date input AFTER Units of Waste (Single + Multiple)
// - Included in defaults + validation schemas + batch payloads

import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Formik, FieldArray, getIn } from "formik";
import * as yup from "yup";

const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

const brand = {
  // Light defaults (dark is handled via CSS vars in <style>)
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

// =====================================================================
// UTILS & SCHEMAS
// =====================================================================

const toNumber = (v) => (v === "" || v === null || v === undefined ? 0 : Number(v) || 0);

const formatDateYMD = (val) => {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) {
    const s = String(val);
    const m = s.match(/\d{4}-\d{2}-\d{2}/);
    return m ? m[0] : s;
  }
  return d.toISOString().split("T")[0];
};

// Normalise units (mirror backend logic, including litres/liters)
const normalizeUnit = (u) => {
  const raw = (u || "").toString().trim().toLowerCase();
  if (!raw || raw === "n/a" || raw === "na" || raw === "none") return "";
  if (["g", "gram", "grams"].includes(raw)) return "g";
  if (["kg", "kilogram", "kilograms"].includes(raw)) return "kg";
  if (["ml", "millilitre", "milliliter", "milliliters", "millilitres"].includes(raw)) return "ml";
  if (["l", "liter", "litre", "liters", "litres"].includes(raw)) return "l";
  if (["unit", "units", "pcs", "pc", "piece", "pieces"].includes(raw)) return "unit";
  return raw;
};

// factor to convert canonical unit -> base numeric unit
// base units: g, ml, unit (all become 1), kg/L become 1000 of base
const unitFactorToBase = (canonUnit) => {
  const u = (canonUnit || "").toString().toLowerCase();
  if (!u) return 1;
  if (u === "kg") return 1000; // kg -> g
  if (u === "g") return 1;
  if (u === "l") return 1000; // L -> ml
  if (u === "ml") return 1;
  if (u === "unit") return 1;
  return 1;
};

const defaultSingleLog = {
  recipe: "",
  date: formatDateYMD(new Date()),
  batchesProduced: 1,
  unitsOfWaste: 0,
  expiryDate: "", // ✅ NEW
  producerName: "",
  batchCode: "",
};

const defaultMultipleLog = {
  date: formatDateYMD(new Date()),
  producerName: "",
  logs: [
    { recipe: "", batchesProduced: 1, unitsOfWaste: 0, expiryDate: "", batchCode: "" }, // ✅ NEW
    { recipe: "", batchesProduced: 1, unitsOfWaste: 0, expiryDate: "", batchCode: "" }, // ✅ NEW
  ],
};

const singleSchema = yup.object().shape({
  recipe: yup.string().required("Recipe is required"),
  batchesProduced: yup.number().min(1, "Must be at least 1").required("Required"),
  unitsOfWaste: yup.number().min(0, "Cannot be negative").required("Required"),
  expiryDate: yup
    .string()
    .required("Expiry date is required")
    .test("is-date", "Expiry date is invalid", (v) => !v || !Number.isNaN(new Date(v).getTime())), // ✅ NEW
  producerName: yup.string(),
  date: yup.date().required("Date is required"),
  batchCode: yup.string().required("Batch code is required"),
});

const multipleSchema = yup.object().shape({
  producerName: yup.string(),
  date: yup.date().required("Date is required"),
  logs: yup
    .array()
    .of(
      yup.object().shape({
        recipe: yup.string().required("Recipe is required"),
        batchesProduced: yup.number().min(1, "Must be at least 1").required("Required"),
        unitsOfWaste: yup.number().min(0, "Cannot be negative").required("Required"),
        expiryDate: yup
          .string()
          .required("Expiry date is required")
          .test("is-date", "Expiry date is invalid", (v) => !v || !Number.isNaN(new Date(v).getTime())), // ✅ NEW
        batchCode: yup.string().required("Batch code is required"),
      })
    )
    .min(1, "Must have at least one batch"),
});

// =====================================================================
// API FUNCTIONS
// =====================================================================

const postProductionLog = async (data, cognitoId, isBatch = false, avoidExpiredGoods = false) => {
  const endpoint = isBatch ? `${API_BASE}/add-production-log/batch` : `${API_BASE}/add-production-log`;

  const body = isBatch
    ? {
        entries: data,
        cognito_id: cognitoId,
        avoidExpiredGoods: !!avoidExpiredGoods,
      }
    : {
        ...data,
        cognito_id: cognitoId,
        avoidExpiredGoods: !!avoidExpiredGoods,
      };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let message = `Server returned ${res.status}`;
    try {
      const text = await res.text();
      if (text) message = text;
    } catch (_) {}
    throw new Error(message);
  }

  return res.json();
};

const getRecipeIngredients = async (cognitoId) => {
  const res = await fetch(`${API_BASE}/recipes?cognito_id=${encodeURIComponent(cognitoId)}`);
  if (!res.ok) throw new Error("Failed to fetch recipes");
  return await res.json();
};

const getIngredientStock = async (cognitoId) => {
  const res = await fetch(`${API_BASE}/ingredient-inventory/active?cognito_id=${encodeURIComponent(cognitoId)}`);
  if (!res.ok) throw new Error("Failed to fetch ingredient stock");
  return await res.json();
};

// =====================================================================
// PORTAL
// =====================================================================
const Portal = ({ children }) => {
  if (typeof window === "undefined") return null;
  return createPortal(children, document.body);
};

// =====================================================================
// UI HELPERS – Toast + Soft Deficit Modal + Error Modal
// =====================================================================

function Toast({ open, children, onClose }) {
  if (!open) return null;
  return (
    <div className="gof-toast" onClick={onClose}>
      <div className="gof-toast-inner">{children}</div>
    </div>
  );
}

function DeficitModal({ open, info, onCancel, onProceed }) {
  if (!open) return null;
  const recipe = info?.recipe || "this recipe";
  const deficits = info?.deficits || [];

  return (
    <Portal>
      <div className="gof-modal-backdrop" onClick={onCancel}>
        <div className="gof-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
          <div className="gof-modal-header">
            <h3>Inventory Warning</h3>
          </div>
          <div className="gof-modal-body">
            <p className="gof-warning">
              Ingredient shortages for <strong>{recipe}</strong>.
            </p>

            {deficits.length > 0 && (
              <table className="pl-deficit-table">
                <thead>
                  <tr>
                    <th>Ingredient</th>
                    <th>Required</th>
                    <th>Available</th>
                    <th>Missing</th>
                  </tr>
                </thead>
                <tbody>
                  {deficits.map((d, i) => (
                    <tr key={i}>
                      <td>{d.ingredient}</td>
                      <td>
                        {d.required} {d.unit}
                      </td>
                      <td>
                        {d.available} {d.unit}
                      </td>
                      <td className="pl-missing">
                        {d.missing} {d.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <p className="gof-callout">
              You can still record this production, but your ingredient inventory will go negative for the items above.
            </p>
          </div>
          <div className="gof-modal-footer">
            <button type="button" className="btn ghost" onClick={onCancel}>
              Cancel
            </button>
            <button type="button" className="btn primary" onClick={onProceed}>
              Proceed Anyway
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

const parseBackendError = (err) => {
  const raw = String(err?.message || err || "");
  try {
    const obj = JSON.parse(raw);
    if (obj?.error) return String(obj.error);
    if (obj?.message) return String(obj.message);
  } catch (_) {}
  return raw.replace(/^Submission failed:\s*/i, "").trim();
};

const beautifyErrorMessage = (msg) => {
  let m = String(msg || "").trim();
  m = m.replace(/\bNON-EXPIRED\b/g, "non-expired");
  m = m.replace(/\(base units\):\s*/i, ": ");
  return m || "Something went wrong while recording production.";
};

function ErrorModal({ open, title, message, onClose }) {
  if (!open) return null;

  return (
    <Portal>
      <div className="gof-modal-backdrop" onClick={onClose}>
        <div className="gof-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
          <div className="gof-modal-header">
            <h3>{title || "Couldn’t record production"}</h3>
          </div>

          <div className="gof-modal-body">
            <div className="gof-warning gof-warning-amber">{message}</div>

            <p className="gof-callout">
              Tip: Add a Goods In entry, reduce batch size, or untick “Use non-expired goods only” (if permitted).
            </p>
          </div>

          <div className="gof-modal-footer">
            <button type="button" className="btn primary" onClick={onClose}>
              OK
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

// =====================================================================
// MAIN COMPONENT
// =====================================================================

export default function ProductionLogForm({
  cognitoId,
  onSubmitted,
  formId = "production-log-form",
  avoidExpiredGoods = false,
}) {
  // Theme (sync with Topbar)
  const [isDark, setIsDark] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("theme-mode") === "dark" : false
  );
  useEffect(() => {
    const onThemeChanged = () => setIsDark(localStorage.getItem("theme-mode") === "dark");
    window.addEventListener("themeChanged", onThemeChanged);
    return () => window.removeEventListener("themeChanged", onThemeChanged);
  }, []);

  // 0 = Single, 1 = Multiple
  const [tabValue, setTabValue] = useState(0);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Deficit State
  const [deficitOpen, setDeficitOpen] = useState(false);
  const deficitNextRef = useRef(null);
  const deficitInfoRef = useRef({ recipe: "", deficits: [] });

  // Error modal state
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // ✅ If any modal is open, blur the active element (best-effort for native select dropdowns)
  useEffect(() => {
    if (!deficitOpen && !errorOpen) return;
    try {
      if (document?.activeElement && typeof document.activeElement.blur === "function") {
        document.activeElement.blur();
      }
    } catch (_) {}
  }, [deficitOpen, errorOpen]);

  // ===== Fetch Recipes =====
  useEffect(() => {
    if (!cognitoId) return;
    const fetchRecipes = async () => {
      try {
        const res = await fetch(`${API_BASE}/recipes?cognito_id=${encodeURIComponent(cognitoId)}`);
        if (!res.ok) throw new Error("Failed to fetch recipes");
        const data = await res.json();

        setRecipes(
          (Array.isArray(data) ? data : []).map((r) => ({
            name: r.recipe_name ?? r.recipe ?? r.name,
            units_per_batch: toNumber(r.units_per_batch) || 0,
          }))
        );
      } catch (e) {
        console.error("Recipes fetch error:", e);
        setRecipes([]);
      }
    };
    fetchRecipes();
  }, [cognitoId]);

  const getUnitsPerBatch = useCallback(
    (recipeName) => recipes.find((r) => r.name === recipeName)?.units_per_batch ?? 0,
    [recipes]
  );

  // Snackbar auto-hide
  useEffect(() => {
    if (!openSnackbar) return;
    const t = setTimeout(() => setOpenSnackbar(false), 3000);
    return () => clearTimeout(t);
  }, [openSnackbar]);

  // ===== Submission Handlers =====

  const handleSubmit = useCallback(
    async (values, { resetForm }) => {
      setLoading(true);

      const logsToPost =
        tabValue === 0
          ? [
              {
                ...values,
                expiryDate: formatDateYMD(values.expiryDate), // ✅ NEW (normalized)
                batchesProduced: toNumber(values.batchesProduced),
                unitsOfWaste: toNumber(values.unitsOfWaste),
                unitsRemaining:
                  toNumber(values.batchesProduced) * getUnitsPerBatch(values.recipe) - toNumber(values.unitsOfWaste),
              },
            ]
          : (values.logs ?? []).map((log) => ({
              date: values.date,
              producerName: values.producerName,
              recipe: log.recipe,
              batchesProduced: toNumber(log.batchesProduced),
              unitsOfWaste: toNumber(log.unitsOfWaste),
              expiryDate: formatDateYMD(log.expiryDate), // ✅ NEW (normalized)
              batchCode: log.batchCode,
              unitsRemaining: toNumber(log.batchesProduced) * getUnitsPerBatch(log.recipe) - toNumber(log.unitsOfWaste),
            }));

      try {
        await postProductionLog(tabValue === 0 ? logsToPost[0] : logsToPost, cognitoId, tabValue === 1, avoidExpiredGoods);

        setOpenSnackbar(true);
        resetForm({ values: tabValue === 0 ? defaultSingleLog : defaultMultipleLog });
        if (onSubmitted) onSubmitted();
      } catch (e) {
        console.error("Submission error:", e);
        const parsed = parseBackendError(e);
        const pretty = beautifyErrorMessage(parsed);
        setErrorMsg(pretty);
        setErrorOpen(true);
      } finally {
        setLoading(false);
      }
    },
    [cognitoId, tabValue, onSubmitted, getUnitsPerBatch, avoidExpiredGoods]
  );

  // =====================================================================
  // handleDeficitCheck – unit-normalised (g/kg/ml/L/unit)
  // =====================================================================
  const handleDeficitCheck = useCallback(
    async (values, submitFunc) => {
      if (loading) return;

      if (tabValue === 0 && !values.recipe) {
        submitFunc();
        return;
      }

      setLoading(true);
      try {
        const recipeIngredients = await getRecipeIngredients(cognitoId);
        const stock = await getIngredientStock(cognitoId);

        // Requirements per ingredient in BASE UNITS
        const requirementsMap = new Map();

        const addRequirementBase = (ingredient, unit, amount) => {
          const canonUnit = normalizeUnit(unit);
          const factor = unitFactorToBase(canonUnit);
          const baseAmount = toNumber(amount) * factor;

          const existing = requirementsMap.get(ingredient) || {
            ingredient,
            requiredBase: 0,
            displayUnit: canonUnit || unit || "",
          };

          existing.requiredBase += baseAmount;
          requirementsMap.set(ingredient, existing);
        };

        if (tabValue === 0) {
          const recipeRows = recipeIngredients.filter((r) => (r.recipe_name ?? r.recipe ?? r.name) === values.recipe);
          const totalBatches = toNumber(values.batchesProduced);

          recipeRows.forEach((req) => {
            addRequirementBase(req.ingredient, req.unit, toNumber(req.quantity) * totalBatches);
          });
        } else {
          (values.logs ?? []).forEach((log) => {
            const recipeName = log.recipe;
            if (!recipeName) return;

            const recipeRows = recipeIngredients.filter((r) => (r.recipe_name ?? r.recipe ?? r.name) === recipeName);
            const batches = toNumber(log.batchesProduced);

            recipeRows.forEach((req) => {
              addRequirementBase(req.ingredient, req.unit, toNumber(req.quantity) * batches);
            });
          });
        }

        // Stock per ingredient in BASE UNITS
        const stockMap = new Map();
        (stock ?? []).forEach((s) => {
          const canonUnit = normalizeUnit(s.unit);
          const factor = unitFactorToBase(canonUnit);
          const baseAmount = toNumber(s.totalRemaining) * factor;
          const current = stockMap.get(s.ingredient) || 0;
          stockMap.set(s.ingredient, current + baseAmount);
        });

        const deficits = [];
        for (const { ingredient, requiredBase, displayUnit } of requirementsMap.values()) {
          const availableBase = stockMap.get(ingredient) || 0;

          if (requiredBase > availableBase) {
            const canonDisplay = normalizeUnit(displayUnit);
            const factor = unitFactorToBase(canonDisplay) || 1;

            const required = requiredBase / factor;
            const available = availableBase / factor;
            const missing = required - available;

            deficits.push({
              ingredient,
              unit: canonDisplay || displayUnit || "",
              required,
              available,
              missing,
            });
          }
        }

        if (deficits.length > 0) {
          deficitInfoRef.current = {
            recipe: tabValue === 0 ? values.recipe : "Multiple recipes",
            deficits,
          };
          deficitNextRef.current = submitFunc;
          setDeficitOpen(true);
          return;
        }

        submitFunc();
      } catch (error) {
        console.error("Ingredient Deficit Error:", error);
        const parsed = parseBackendError(error);
        const pretty = beautifyErrorMessage(parsed);
        setErrorMsg(pretty || "Ingredient check failed.");
        setErrorOpen(true);
      } finally {
        setLoading(false);
      }
    },
    [cognitoId, tabValue, loading]
  );

  // =====================================================================
  // handleSingleClick – validation + deficit check + submit
  // =====================================================================
  const handleSingleClick = useCallback(
    (validateForm, values, setTouched, submitForm) => {
      if (loading) return;

      setTouched(Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {}));

      validateForm().then((errors) => {
        if (Object.keys(errors).length === 0) {
          handleDeficitCheck(values, submitForm);
        } else {
          const firstError = Object.keys(errors)[0];
          const el = document.getElementById(firstError);
          if (el) el.focus();
        }
      });
    },
    [handleDeficitCheck, loading]
  );

  const handleDeficitProceed = useCallback(() => {
    setDeficitOpen(false);
    const next = deficitNextRef.current;
    deficitNextRef.current = null;
    if (typeof next === "function") next();
  }, []);

  const handleDeficitCancel = useCallback(() => {
    setDeficitOpen(false);
    deficitNextRef.current = null;
  }, []);

  return (
    <div className="gof-wrap">
      {/* Scoped CSS (Light + Dark via vars) */}
      <style>{`
        :root {
          --pl-bg: ${isDark ? "#0a0f1e" : brand.surfaceMuted};
          --pl-surface: ${isDark ? "#151b2e" : brand.surface};
          --pl-surface2: ${isDark ? "#1a2033" : brand.surfaceMuted};
          --pl-border: ${isDark ? "#1e2942" : brand.border};
          --pl-text: ${isDark ? "#f1f5f9" : brand.text};
          --pl-subtext: ${isDark ? "#cbd5e1" : brand.subtext};
          --pl-muted: ${isDark ? "#94a3b8" : "#64748b"};

          --pl-primary: ${brand.primary};
          --pl-primary2: ${brand.primaryDark};
          --pl-ring: ${isDark ? "rgba(124,58,237,0.30)" : brand.focusRing};

          --pl-danger: ${brand.danger};

          --pl-shadow: ${
            isDark
              ? "0 1px 2px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.25)"
              : brand.shadow
          };

          --pl-hover: ${isDark ? "rgba(99,102,241,0.10)" : "#eef2ff"};

          --pl-modal-bg: ${isDark ? "#151b2e" : "#ffffff"};
          --pl-backdrop: rgba(15,23,42,${isDark ? 0.62 : 0.4});

          --pl-warn-bg: ${isDark ? "rgba(220,38,38,0.16)" : "#fef2f2"};
          --pl-warn-border: ${isDark ? "rgba(239,68,68,0.28)" : "#fecaca"};
          --pl-warn-text: ${isDark ? "#fecaca" : "#b91c1c"};

          --pl-amber-bg: ${isDark ? "rgba(245,158,11,0.16)" : "#fff7ed"};
          --pl-amber-border: ${isDark ? "rgba(245,158,11,0.28)" : "#fed7aa"};
          --pl-amber-text: ${isDark ? "#fde68a" : "#9a3412"};

          --pl-toast-bg: ${isDark ? "#0b1222" : "#0f172a"};
          --pl-toast-text: #e5e7eb;
        }

        * { transition: background-color .15s ease, border-color .15s ease, color .15s ease; }

        .gof-wrap {
          padding: 20px;
          color: var(--pl-text);
          background: var(--pl-bg);
          height: 100%;
          max-height: 100%;
          overflow-y: auto;
          box-sizing: border-box;
        }

        .gof-sub {
          color: var(--pl-muted);
          margin: 0 0 18px;
          font-size: 13px;
          font-weight: 500;
        }

        /* Tabs */
        .gof-tabs {
          display: inline-flex;
          padding: 4px;
          border-radius: 999px;
          background: ${isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0"};
          margin-bottom: 18px;
          gap: 4px;
          border: 1px solid var(--pl-border);
          box-shadow: var(--pl-shadow);
        }
        .gof-tab {
          border-radius: 999px;
          border: none;
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          background: transparent;
          color: var(--pl-subtext);
        }
        .gof-tab.active {
          background: var(--pl-surface);
          color: var(--pl-primary);
          box-shadow: var(--pl-shadow);
          border: 1px solid var(--pl-border);
        }

        .gof-grid {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          gap: 20px;
        }
        .col-12 { grid-column: span 12; }
        .col-6 { grid-column: span 6; }
        .col-4 { grid-column: span 4; }
        .col-3 { grid-column: span 3; }
        @media (max-width: 900px) {
          .col-6, .col-4, .col-3 { grid-column: span 12; }
        }

        .gof-field { display: flex; flex-direction: column; }
        .gof-label {
          font-size: 13px;
          font-weight: 700;
          color: var(--pl-subtext);
          margin-bottom: 6px;
        }
        .gof-input,
        .gof-select {
          background: var(--pl-surface2);
          border: 1px solid var(--pl-border);
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 14px;
          outline: none;
          transition: border-color .15s ease, box-shadow .15s ease;
          color: var(--pl-text);
          position: relative;
          z-index: 1;
        }
        .gof-input::placeholder { color: var(--pl-muted); }
        .gof-input:focus,
        .gof-select:focus {
          border-color: var(--pl-primary);
          box-shadow: 0 0 0 4px var(--pl-ring);
          background: var(--pl-surface);
        }
        .gof-error { color: ${isDark ? "#fda4af" : brand.danger}; font-size: 12px; margin-top: 6px; font-weight: 600; }

        /* Multiple rows */
        .gof-multi-row {
          border: 1px solid var(--pl-border);
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 12px;
          background: var(--pl-surface2);
          box-shadow: var(--pl-shadow);
        }
        .gof-multi-row-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .gof-multi-index { font-size: 12px; font-weight: 800; color: var(--pl-muted); }
        .gof-multi-remove { border: none; background: none; color: ${isDark ? "#fecaca" : brand.danger}; font-size: 12px; cursor: pointer; font-weight: 700; }
        .gof-multi-actions { margin-top: 8px; }
        .gof-multi-add-btn {
          border-radius: 999px;
          border: 1px dashed var(--pl-border);
          background: ${isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"};
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          color: var(--pl-subtext);
        }
        .gof-multi-add-btn:hover {
          background: var(--pl-hover);
          border-color: rgba(124,58,237,0.35);
        }

        /* Toast */
        .gof-toast {
          position: fixed;
          top: 16px;
          right: 16px;
          transform: translateY(-20px);
          opacity: 0;
          animation: gof-toast-in .2s forwards;
          z-index: 999990;
        }
        .gof-toast-inner {
          background: var(--pl-toast-bg);
          color: var(--pl-toast-text);
          padding: 10px 14px;
          border-radius: 999px;
          font-size: 13px;
          box-shadow: var(--pl-shadow);
          border: 1px solid rgba(255,255,255,${isDark ? 0.08 : 0.0});
        }
        @keyframes gof-toast-in { to { transform: translateY(0); opacity: 1; } }

        /* ✅ Modal – VERY high z-index so it sits above any select/poppers */
        .gof-modal-backdrop {
          position: fixed;
          inset: 0;
          background: var(--pl-backdrop);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999999; /* backdrop */
          backdrop-filter: blur(6px);
        }
        .gof-modal {
          width: 100%;
          max-width: 480px;
          background: var(--pl-modal-bg);
          border-radius: 16px;
          border: 1px solid var(--pl-border);
          box-shadow: 0 20px 40px rgba(0,0,0,${isDark ? 0.55 : 0.35});
          overflow: hidden;
          position: relative;
          z-index: 1000000; /* modal */
          color: var(--pl-text);
        }
        .gof-modal-header { padding: 12px 16px; border-bottom: 1px solid var(--pl-border); }
        .gof-modal-header h3 { margin: 0; font-size: 16px; font-weight: 900; color: var(--pl-text); }
        .gof-modal-body { padding: 16px; }
        .gof-warning {
          background: var(--pl-warn-bg);
          border: 1px solid var(--pl-warn-border);
          color: var(--pl-warn-text);
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 12px;
        }
        .gof-warning-amber {
          background: var(--pl-amber-bg);
          border: 1px solid var(--pl-amber-border);
          color: var(--pl-amber-text);
        }
        .gof-callout { font-size: 13px; color: var(--pl-subtext); margin: 12px 0 0; font-weight: 500; }
        .gof-modal-footer {
          padding: 10px 16px 14px;
          border-top: 1px solid var(--pl-border);
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          background: ${isDark ? "rgba(255,255,255,0.02)" : "transparent"};
        }
        .btn {
          font-size: 13px;
          border-radius: 999px;
          padding: 8px 14px;
          border: 1px solid transparent;
          cursor: pointer;
          font-weight: 800;
        }
        .btn.ghost {
          background: var(--pl-surface);
          color: var(--pl-subtext);
          border-color: var(--pl-border);
        }
        .btn.ghost:hover { background: var(--pl-hover); }
        .btn.primary {
          background: linear-gradient(180deg, var(--pl-primary), var(--pl-primary2));
          color: #fff;
          box-shadow: var(--pl-shadow);
        }

        /* Deficit table */
        .pl-deficit-table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
        .pl-deficit-table th, .pl-deficit-table td { padding: 6px 8px; border-bottom: 1px solid var(--pl-border); text-align: left; }
        .pl-deficit-table th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--pl-muted); font-weight: 900; }
        .pl-deficit-table td { color: var(--pl-subtext); }
        .pl-missing { color: ${isDark ? "#fda4af" : brand.danger}; font-weight: 900; }

        /* ✅ Force common popover layers below our modal (safety net) */
        .MuiPopover-root,
        .MuiPopper-root,
        .MuiMenu-root,
        .MuiAutocomplete-popper,
        .MuiPickersPopper-root {
          z-index: 900000 !important;
        }
      `}</style>

      {/* Tabs */}
      <div className="gof-tabs" role="tablist">
        <button type="button" className={`gof-tab ${tabValue === 0 ? "active" : ""}`} onClick={() => setTabValue(0)}>
          Record Single Batch
        </button>
        <button type="button" className={`gof-tab ${tabValue === 1 ? "active" : ""}`} onClick={() => setTabValue(1)}>
          Record Multiple Batches
        </button>
      </div>

      <Formik
        initialValues={tabValue === 0 ? defaultSingleLog : defaultMultipleLog}
        validationSchema={tabValue === 0 ? singleSchema : multipleSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, errors, touched, handleBlur, handleChange, handleSubmit: formikHandleSubmit, setTouched, validateForm }) => (
          <>
            {tabValue === 0 ? (
              <form
                id={formId}
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSingleClick(validateForm, values, setTouched, formikHandleSubmit);
                }}
                noValidate
              >
                <div className="gof-grid">
                  <div className="gof-field col-6">
                    <label className="gof-label" htmlFor="recipe">
                      Recipe *
                    </label>
                    <select
                      id="recipe"
                      name="recipe"
                      className="gof-select"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.recipe}
                    >
                      <option value="" disabled>
                        Select a recipe…
                      </option>
                      {recipes.map((recipe) => (
                        <option key={recipe.name} value={recipe.name}>
                          {recipe.name}
                        </option>
                      ))}
                    </select>
                    {touched.recipe && errors.recipe && <div className="gof-error">{errors.recipe}</div>}
                  </div>

                  <div className="gof-field col-6">
                    <label className="gof-label" htmlFor="date">
                      Date *
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
                    {touched.date && errors.date && <div className="gof-error">{errors.date}</div>}
                  </div>

                  <div className="gof-field col-4">
                    <label className="gof-label" htmlFor="batchesProduced">
                      Batches Produced *
                    </label>
                    <input
                      id="batchesProduced"
                      name="batchesProduced"
                      type="number"
                      className="gof-input"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.batchesProduced}
                      min="1"
                    />
                    {touched.batchesProduced && errors.batchesProduced && (
                      <div className="gof-error">{errors.batchesProduced}</div>
                    )}
                  </div>

                  <div className="gof-field col-4">
                    <label className="gof-label" htmlFor="unitsOfWaste">
                      Units of Waste *
                    </label>
                    <input
                      id="unitsOfWaste"
                      name="unitsOfWaste"
                      type="number"
                      className="gof-input"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.unitsOfWaste}
                      min="0"
                    />
                    {touched.unitsOfWaste && errors.unitsOfWaste && (
                      <div className="gof-error">{errors.unitsOfWaste}</div>
                    )}
                  </div>

                  {/* ✅ NEW: Expiry Date (after Units of Waste) */}
                  <div className="gof-field col-4">
                    <label className="gof-label" htmlFor="expiryDate">
                      Expiry Date *
                    </label>
                    <input
                      id="expiryDate"
                      name="expiryDate"
                      type="date"
                      className="gof-input"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.expiryDate}
                    />
                    {touched.expiryDate && errors.expiryDate && <div className="gof-error">{errors.expiryDate}</div>}
                  </div>

                  <div className="gof-field col-4">
                    <label className="gof-label" htmlFor="producerName">
                      Produced By (Name)
                    </label>
                    <input
                      id="producerName"
                      name="producerName"
                      type="text"
                      className="gof-input"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.producerName}
                    />
                    {touched.producerName && errors.producerName && (
                      <div className="gof-error">{errors.producerName}</div>
                    )}
                  </div>

                  <div className="gof-field col-6">
                    <label className="gof-label" htmlFor="batchCode">
                      Batch Code *
                    </label>
                    <input
                      id="batchCode"
                      name="batchCode"
                      type="text"
                      className="gof-input"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.batchCode}
                    />
                    {touched.batchCode && errors.batchCode && <div className="gof-error">{errors.batchCode}</div>}
                  </div>
                </div>
              </form>
            ) : (
              <form
                id={formId}
                onSubmit={(e) => {
                  e.preventDefault();
                  handleDeficitCheck(values, formikHandleSubmit);
                }}
                noValidate
              >
                <div className="gof-grid" style={{ marginBottom: 16 }}>
                  <div className="gof-field col-6">
                    <label className="gof-label" htmlFor="date">
                      Date *
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
                    {touched.date && errors.date && <div className="gof-error">{errors.date}</div>}
                  </div>

                  <div className="gof-field col-6">
                    <label className="gof-label" htmlFor="producerName">
                      Produced By (Name)
                    </label>
                    <input
                      id="producerName"
                      name="producerName"
                      type="text"
                      className="gof-input"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.producerName}
                    />
                    {touched.producerName && errors.producerName && (
                      <div className="gof-error">{errors.producerName}</div>
                    )}
                  </div>
                </div>

                <p className="gof-sub">Batch Logs (different recipes allowed, each with its own batch code).</p>

                <FieldArray name="logs">
                  {({ push, remove }) => (
                    <>
                      {!!(touched.logs && errors.logs) && typeof errors.logs === "string" && (
                        <div className="gof-error" style={{ marginBottom: 8 }}>
                          {errors.logs}
                        </div>
                      )}

                      {(values.logs ?? []).map((log, index) => {
                        const recipePath = `logs[${index}].recipe`;
                        const batchesProducedPath = `logs[${index}].batchesProduced`;
                        const unitsOfWastePath = `logs[${index}].unitsOfWaste`;
                        const expiryDatePath = `logs[${index}].expiryDate`; // ✅ NEW
                        const batchCodePath = `logs[${index}].batchCode`;

                        const recipeError = getIn(touched, recipePath) && getIn(errors, recipePath);
                        const batchesError = getIn(touched, batchesProducedPath) && getIn(errors, batchesProducedPath);
                        const wasteError = getIn(touched, unitsOfWastePath) && getIn(errors, unitsOfWastePath);
                        const expiryError = getIn(touched, expiryDatePath) && getIn(errors, expiryDatePath); // ✅ NEW
                        const batchCodeError = getIn(touched, batchCodePath) && getIn(errors, batchCodePath);

                        return (
                          <div className="gof-multi-row" key={index}>
                            <div className="gof-multi-row-header">
                              <span className="gof-multi-index">Batch {index + 1}</span>
                              {values.logs.length > 1 && (
                                <button type="button" className="gof-multi-remove" onClick={() => remove(index)}>
                                  Remove
                                </button>
                              )}
                            </div>

                            <div className="gof-grid">
                              <div className="gof-field col-6">
                                <label className="gof-label" htmlFor={`logs-${index}-recipe`}>
                                  Recipe *
                                </label>
                                <select
                                  id={`logs-${index}-recipe`}
                                  name={recipePath}
                                  className="gof-select"
                                  onBlur={handleBlur}
                                  onChange={handleChange}
                                  value={log.recipe || ""}
                                >
                                  <option value="" disabled>
                                    Select a recipe…
                                  </option>
                                  {recipes.map((recipe) => (
                                    <option key={recipe.name} value={recipe.name}>
                                      {recipe.name}
                                    </option>
                                  ))}
                                </select>
                                {recipeError && <div className="gof-error">{recipeError}</div>}
                              </div>

                              <div className="gof-field col-3">
                                <label className="gof-label" htmlFor={`logs-${index}-batchesProduced`}>
                                  Batches Produced *
                                </label>
                                <input
                                  id={`logs-${index}-batchesProduced`}
                                  name={batchesProducedPath}
                                  type="number"
                                  className="gof-input"
                                  onBlur={handleBlur}
                                  onChange={handleChange}
                                  value={log.batchesProduced}
                                  min="1"
                                />
                                {batchesError && <div className="gof-error">{batchesError}</div>}
                              </div>

                              <div className="gof-field col-3">
                                <label className="gof-label" htmlFor={`logs-${index}-unitsOfWaste`}>
                                  Units of Waste *
                                </label>
                                <input
                                  id={`logs-${index}-unitsOfWaste`}
                                  name={unitsOfWastePath}
                                  type="number"
                                  className="gof-input"
                                  onBlur={handleBlur}
                                  onChange={handleChange}
                                  value={log.unitsOfWaste}
                                  min="0"
                                />
                                {wasteError && <div className="gof-error">{wasteError}</div>}
                              </div>

                              {/* ✅ NEW: Expiry Date (after Units of Waste) */}
                              <div className="gof-field col-6">
                                <label className="gof-label" htmlFor={`logs-${index}-expiryDate`}>
                                  Expiry Date *
                                </label>
                                <input
                                  id={`logs-${index}-expiryDate`}
                                  name={expiryDatePath}
                                  type="date"
                                  className="gof-input"
                                  onBlur={handleBlur}
                                  onChange={handleChange}
                                  value={log.expiryDate || ""}
                                />
                                {expiryError && <div className="gof-error">{expiryError}</div>}
                              </div>

                              <div className="gof-field col-6">
                                <label className="gof-label" htmlFor={`logs-${index}-batchCode`}>
                                  Batch Code *
                                </label>
                                <input
                                  id={`logs-${index}-batchCode`}
                                  name={batchCodePath}
                                  type="text"
                                  className="gof-input"
                                  onBlur={handleBlur}
                                  onChange={handleChange}
                                  value={log.batchCode}
                                />
                                {batchCodeError && <div className="gof-error">{batchCodeError}</div>}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      <div className="gof-multi-actions">
                        <button
                          type="button"
                          className="gof-multi-add-btn"
                          onClick={() => push({ recipe: "", batchesProduced: 1, unitsOfWaste: 0, expiryDate: "", batchCode: "" })}
                        >
                          + Add another batch
                        </button>
                      </div>
                    </>
                  )}
                </FieldArray>
              </form>
            )}
          </>
        )}
      </Formik>

      {/* Soft Deficit Warning Modal */}
      <DeficitModal open={deficitOpen} info={deficitInfoRef.current} onCancel={handleDeficitCancel} onProceed={handleDeficitProceed} />

      {/* Friendly backend error modal */}
      <ErrorModal open={errorOpen} title="Can’t record production" message={errorMsg} onClose={() => setErrorOpen(false)} />

      {/* Success Toast */}
      <Toast open={openSnackbar} onClose={() => setOpenSnackbar(false)}>
        Production recorded successfully!
      </Toast>
    </div>
  );
}
