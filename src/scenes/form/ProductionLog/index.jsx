// src/scenes/form/RecipeProduction/index.jsx
// MUI-styled Production Log with Single / Multiple tabs + ACTIVE-inventory precheck & deficit warning
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  TextField,
  Snackbar,
  Alert,
  Fab,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { Formik, FieldArray, getIn } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useAuth } from "../../../contexts/AuthContext";

const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

const brand = {
  text: "#0f172a",
  subtext: "#334155",
  border: "#e5e7eb",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  primary: "#7C3AED",
  primaryDark: "#5B21B6",
  focusRing: "rgba(124,58,237,0.18)",
};

// ---- shared MUI sx (same look/feel as Goods In)
const inputSx = {
  "& .MuiInputLabel-root": { color: brand.subtext, fontWeight: 600, letterSpacing: 0.2 },
  "& .MuiInputLabel-root.Mui-focused": { color: brand.primary },
  "& .MuiOutlinedInput-root": {
    borderRadius: 12,
    "& fieldset": { borderColor: brand.border },
    "&:hover fieldset": { borderColor: brand.primary },
    "&.Mui-focused fieldset": { borderColor: brand.primary, boxShadow: `0 0 0 4px ${brand.focusRing}` },
    "& input, & textarea": { paddingTop: "14px", paddingBottom: "14px" },
  },
};

const selectSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 12,
    "& fieldset": { borderColor: brand.border },
    "&:hover fieldset": { borderColor: brand.primary },
    "&.Mui-focused fieldset": { borderColor: brand.primary, boxShadow: `0 0 0 4px ${brand.focusRing}` },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: brand.primary },
};

// ===== validation
const singleSchema = yup.object().shape({
  date: yup.string().required("Date is required"),
  recipe: yup.string().required("Recipe is required"),
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
  producerName: yup.string().nullable(),
});

const itemSchema = yup.object().shape({
  date: yup.string().required("Date is required"),
  recipe: yup.string().required("Recipe is required"),
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
  producerName: yup.string().nullable(),
});

const batchSchema = yup.object().shape({
  items: yup.array().of(itemSchema).min(1, "At least one item is required"),
});

// ===== initial values
const initialSingle = {
  date: new Date().toISOString().split("T")[0],
  recipe: "",
  batchesProduced: "",
  unitsOfWaste: 0,
  batchCode: "",
  producerName: "",
};

const initialBatchItem = {
  date: new Date().toISOString().split("T")[0],
  recipe: "",
  batchesProduced: "",
  unitsOfWaste: 0,
  batchCode: "",
  producerName: "",
};

const initialBatch = { items: [initialBatchItem] };

/** ===== helpers for availability check ===== */
const normalizeName = (s) =>
  (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");

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

const roundDisp = (n) => {
  if (Math.abs(n - Math.round(n)) < 1e-9) return Math.round(n);
  return Math.round(n * 1000) / 1000;
};

// Pick a nice display unit for an ingredient across lines (prefer g > ml > unit > "")
const pickDisplayUnit = (unitsSet) => {
  const u = new Set(Array.from(unitsSet || []).map(normalizeUnit));
  if (u.has("g") || u.has("kg")) return "g";
  if (u.has("ml") || u.has("l")) return "ml";
  if (u.has("unit")) return "unit";
  return "";
};

const ProductionLogForm = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const { cognitoId } = useAuth();

  // tabs: 0 single, 1 multiple
  const [tabIndex, setTabIndex] = useState(0);

  // recipes for dropdown + index for availability check
  const [recipes, setRecipes] = useState([]);
  const [recipesIndex, setRecipesIndex] = useState({}); // recipe -> [{ingredient, quantity, unit}]
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [fetchErr, setFetchErr] = useState("");

  // snackbar
  const [openSnackbar, setOpenSnackbar] = useState(false);

  // multiple confirm dialog (preview list)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [previewItems, setPreviewItems] = useState([]);
  const [submittingBatch, setSubmittingBatch] = useState(false);
  const [batchResetForm, setBatchResetForm] = useState(null);

  // deficit warning dialog (used by single & multiple)
  const [deficitOpen, setDeficitOpen] = useState(false);
  const [deficits, setDeficits] = useState([]); // [{ingredient, unit, need, have}]
  const deficitNextRef = useRef(null); // callback to run after "Proceed anyway"

  // FAB hook to add another row
  const addItemRef = useRef(null);

  /** Fetch recipes (full rows) so we can build an index for precheck */
  useEffect(() => {
    if (!cognitoId) return;
    (async () => {
      setLoadingRecipes(true);
      setFetchErr("");
      try {
        const res = await fetch(`${API_BASE}/recipes?cognito_id=${encodeURIComponent(cognitoId)}`);
        if (!res.ok) throw new Error("Failed to fetch recipes");
        const rows = await res.json();

        // Build index: recipe name => [{ ingredient, quantity, unit }]
        const index = {};
        const namesTemp = new Set();
        for (const r of Array.isArray(rows) ? rows : []) {
          const recipeName = r.recipeName ?? r.recipe_name ?? r.recipe ?? "";
          if (!recipeName) continue;
          namesTemp.add(recipeName);
          if (!index[recipeName]) index[recipeName] = [];
          index[recipeName].push({
            ingredient: r.ingredient ?? r.ingredient_name ?? "",
            quantity: Number(r.quantity) || 0,
            unit: r.unit ?? "",
          });
        }
        const names = Array.from(namesTemp).sort();
        setRecipesIndex(index);
        setRecipes(names);
      } catch (e) {
        console.error(e);
        setRecipes([]);
        setRecipesIndex({});
        setFetchErr("Error fetching recipes");
      } finally {
        setLoadingRecipes(false);
      }
    })();
  }, [cognitoId]);

  // helpers to find/scroll to first error (same as Goods In pattern)
  const findFirstErrorPath = (errObj) => {
    if (!errObj || typeof errObj !== "object") return null;
    for (const k of Object.keys(errObj)) {
      if (!errObj[k]) continue;
      if (typeof errObj[k] === "string") return k;
      if (typeof errObj[k] === "object") {
        const child = findFirstErrorPath(errObj[k]);
        if (child) return `${k}.${child}`;
      }
    }
    return null;
  };
  const scrollToFirstError = (errors) => {
    const firstPath = findFirstErrorPath(errors);
    if (!firstPath) return;
    const selector = `[data-field="${firstPath}"]`;
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      try { el.focus({ preventScroll: true }); } catch {}
    }
  };

  /** Build menu items for Recipe select */
  const recipeMenu = useMemo(() => {
    if (loadingRecipes) return [<MenuItem key="loading" value="" disabled>Loading recipes…</MenuItem>];
    if (fetchErr) return [<MenuItem key="err" value="" disabled>{fetchErr}</MenuItem>];
    if (!recipes.length) return [<MenuItem key="none" value="" disabled>No recipes</MenuItem>];
    return [
      <MenuItem key="placeholder" value="" disabled>Select a recipe…</MenuItem>,
      ...recipes.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)
    ];
  }, [recipes, loadingRecipes, fetchErr]);

  /** ===== Availability checks ===== */

  // Load ACTIVE inventory snapshot (base-unit aware)
  const fetchActiveInventory = async () => {
    try {
      const res = await fetch(`${API_BASE}/ingredient-inventory/active?cognito_id=${encodeURIComponent(cognitoId)}`);
      return res.ok ? await res.json() : [];
    } catch (e) {
      console.error("Active inventory fetch failed:", e);
      return [];
    }
  };

  // Single: compute deficits for (recipe, batchesProduced)
  const computeDeficitsSingle = async (recipeName, batchesProduced) => {
    const lines = recipesIndex[recipeName] || [];
    if (!lines.length) return [];

    // requirements per ingredient (base units)
    const needByIng = new Map(); // name -> { needBase, unitsSeen:Set }
    for (const line of lines) {
      const name = (line.ingredient || "").toString();
      const uCanon = normalizeUnit(line.unit);
      const qty = Number(line.quantity) || 0;
      const need = qty * (Number(batchesProduced) || 0);
      const needBase = need * unitFactorToBase(uCanon);

      const k = normalizeName(name);
      const cur = needByIng.get(k) || { name, needBase: 0, unitsSeen: new Set() };
      cur.needBase += needBase;
      cur.unitsSeen.add(uCanon);
      needByIng.set(k, cur);
    }

    // available per ingredient (base units)
    const invRows = await fetchActiveInventory();
    const haveByIng = new Map(); // name -> haveBase
    for (const r of Array.isArray(invRows) ? invRows : []) {
      const k = normalizeName(r?.ingredient ?? "");
      const unitCanon = normalizeUnit(r?.unit ?? "");
      const amt = Number(r?.totalRemaining ?? r?.stockOnHand ?? r?.unitsInStock ?? 0) || 0;
      const base = amt * unitFactorToBase(unitCanon);
      haveByIng.set(k, (haveByIng.get(k) || 0) + base);
    }

    // compare
    const problems = [];
    for (const { name, needBase, unitsSeen } of needByIng.values()) {
      const haveBase = haveByIng.get(normalizeName(name)) || 0;
      if (needBase > haveBase + 1e-9) {
        const dispUnit = pickDisplayUnit(unitsSeen);
        const factor = unitFactorToBase(dispUnit || ""); // 0 → base
        const needDisp = factor ? needBase / factor : needBase;
        const haveDisp = factor ? haveBase / factor : haveBase;
        problems.push({
          ingredient: name,
          unit: dispUnit,
          need: roundDisp(needDisp),
          have: roundDisp(haveDisp),
        });
      }
    }
    return problems;
  };

  // Multiple: aggregate across items
  const computeDeficitsBatch = async (items) => {
    // aggregate need per ingredient in base units; track units seen
    const needByIng = new Map(); // name -> { needBase, unitsSeen:Set }
    for (const it of items || []) {
      const recipeName = it?.recipe;
      const batches = Number(it?.batchesProduced) || 0;
      if (!recipeName || !batches) continue;
      const lines = recipesIndex[recipeName] || [];
      for (const line of lines) {
        const name = (line.ingredient || "").toString();
        const uCanon = normalizeUnit(line.unit);
        const qty = Number(line.quantity) || 0;
        const need = qty * batches;
        const needBase = need * unitFactorToBase(uCanon);

        const k = normalizeName(name);
        const cur = needByIng.get(k) || { name, needBase: 0, unitsSeen: new Set() };
        cur.needBase += needBase;
        cur.unitsSeen.add(uCanon);
        needByIng.set(k, cur);
      }
    }

    // available per ingredient (base units)
    const invRows = await fetchActiveInventory();
    const haveByIng = new Map(); // name -> haveBase
    for (const r of Array.isArray(invRows) ? invRows : []) {
      const k = normalizeName(r?.ingredient ?? "");
      const unitCanon = normalizeUnit(r?.unit ?? "");
      const amt = Number(r?.totalRemaining ?? r?.stockOnHand ?? r?.unitsInStock ?? 0) || 0;
      const base = amt * unitFactorToBase(unitCanon);
      haveByIng.set(k, (haveByIng.get(k) || 0) + base);
    }

    const problems = [];
    for (const { name, needBase, unitsSeen } of needByIng.values()) {
      const haveBase = haveByIng.get(normalizeName(name)) || 0;
      if (needBase > haveBase + 1e-9) {
        const dispUnit = pickDisplayUnit(unitsSeen);
        const factor = unitFactorToBase(dispUnit || "");
        const needDisp = factor ? needBase / factor : needBase;
        const haveDisp = factor ? haveBase / factor : haveBase;
        problems.push({
          ingredient: name,
          unit: dispUnit,
          need: roundDisp(needDisp),
          have: roundDisp(haveDisp),
        });
      }
    }
    return problems;
  };

  /** ===== Submitters (unchanged endpoints) ===== */

  // submit single
  const submitSingle = async (values, { resetForm }) => {
    const payload = { ...values, cognito_id: cognitoId, producerName: values.producerName ?? "" };
    try {
      const res = await fetch(`${API_BASE}/add-production-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Failed");
      }
      resetForm();
      setOpenSnackbar(true);
    } catch (err) {
      console.error("Single submit failed:", err);
      alert("Submission failed. See console for details.");
    }
  };

  // submit multiple (batch)
  const submitBatch = async (items, { resetForm }) => {
    try {
      const res = await fetch(`${API_BASE}/add-production-log/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: items, cognito_id: cognitoId }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Batch submit failed");
      }
      resetForm();
      setOpenSnackbar(true);
    } catch (err) {
      console.error("Batch submit error:", err);
      // fallback: try sequential singles so ops are not blocked
      try {
        for (const it of items) {
          const payload = { ...it, cognito_id: cognitoId, producerName: it.producerName ?? "" };
          const r = await fetch(`${API_BASE}/add-production-log`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!r.ok) console.error("Fallback single failed for item:", it, await r.text().catch(() => r.status));
        }
        resetForm();
        setOpenSnackbar(true);
      } catch (fallbackErr) {
        console.error("Batch fallback failed:", fallbackErr);
        alert("Multiple submission failed. See console.");
      }
    }
  };

  /** ===== UI handlers ===== */

  // SINGLE: validate + precheck before submit
  const handleSingleClick = async (validateForm, values, setTouched, submitForm) => {
    const errs = await validateForm();
    if (errs && Object.keys(errs).length) {
      setTouched(
        { date: true, recipe: true, batchesProduced: true, unitsOfWaste: true, batchCode: true, producerName: true },
        false
      );
      scrollToFirstError(errs);
      return;
    }

    // run availability precheck
    try {
      const problems = await computeDeficitsSingle(values.recipe, values.batchesProduced);
      if (problems.length) {
        setDeficits(problems);
        deficitNextRef.current = async () => {
          // after user accepts risk, proceed with submit
          await submitForm();
        };
        setDeficitOpen(true);
        return;
      }
    } catch (e) {
      console.error("Single availability check failed:", e);
      alert("Could not verify inventory availability. Please try again.");
      return;
    }

    await submitForm();
  };

  // MULTIPLE: validate + precheck; if OK => open preview; if not => show deficit then preview
  const openConfirm = async ({ validateForm, values, setTouched, resetForm }) => {
    const errs = await validateForm();
    if (errs && Object.keys(errs).length) {
      const touchedItems = (values.items || []).map(() => ({
        date: true, recipe: true, batchesProduced: true, unitsOfWaste: true, batchCode: true, producerName: true,
      }));
      setTouched({ items: touchedItems }, false);
      scrollToFirstError(errs);
      return;
    }

    try {
      const problems = await computeDeficitsBatch(values.items || []);
      if (problems.length) {
        // after user accepts risk, continue to preview confirm
        setDeficits(problems);
        deficitNextRef.current = () => {
          setPreviewItems(values.items || []);
          setBatchResetForm(() => resetForm);
          setConfirmOpen(true);
        };
        setDeficitOpen(true);
        return;
      }
    } catch (e) {
      console.error("Batch availability check failed:", e);
      alert("Could not verify inventory availability. Please try again.");
      return;
    }

    // no problems -> open preview
    setPreviewItems(values.items || []);
    setBatchResetForm(() => resetForm);
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!previewItems.length) return setConfirmOpen(false);
    setSubmittingBatch(true);
    try {
      await submitBatch(previewItems, { resetForm: batchResetForm || (() => {}) });
      setConfirmOpen(false);
      setPreviewItems([]);
    } finally {
      setSubmittingBatch(false);
    }
  };

  return (
    <Box m="20px">
      <Box sx={{ position: "relative" }}>
        <Paper
          elevation={0}
          sx={{
            mt: 2,
            p: { xs: 2, sm: 3 },
            pb: tabIndex === 1 ? "120px" : undefined,
            borderRadius: 16,
            border: `1px solid ${brand.border}`,
            background: brand.surface,
            boxShadow: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)",
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: brand.text }}>
                Record Production
              </Typography>
              <Typography variant="body2" sx={{ color: brand.subtext }}>
                Use Single for one run or switch to Multiple to log several runs at once.
              </Typography>
            </Box>
            <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} sx={{ "& .MuiTab-root": { textTransform: "none", fontWeight: 700 } }}>
              <Tab label="Single" />
              <Tab label="Multiple" />
            </Tabs>
          </Box>

          {/* SINGLE */}
          {tabIndex === 0 && (
            <Formik initialValues={initialSingle} validationSchema={singleSchema} onSubmit={submitSingle}>
              {({ values, errors, touched, handleBlur, handleChange, handleSubmit, validateForm, setTouched, submitForm }) => (
                <form onSubmit={handleSubmit}>
                  <Box
                    display="grid"
                    gap="20px"
                    gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                    sx={{ "& > div": { gridColumn: isNonMobile ? undefined : "span 4" } }}
                  >
                    <TextField
                      fullWidth variant="outlined" type="date" label="Date" name="date"
                      onBlur={handleBlur} onChange={handleChange} value={values.date}
                      error={!!touched.date && !!errors.date} helperText={touched.date && errors.date}
                      sx={{ gridColumn: "span 2", ...inputSx }}
                      InputProps={{ inputProps: { "data-field": "date" } }}
                    />
                    <FormControl fullWidth sx={{ gridColumn: "span 2", ...selectSx }}>
                      <InputLabel id="recipe-label">Recipe</InputLabel>
                      <Select
                        labelId="recipe-label" name="recipe" value={values.recipe} label="Recipe"
                        onChange={handleChange} inputProps={{ "data-field": "recipe" }}
                        error={!!touched.recipe && !!errors.recipe}
                      >
                        {recipeMenu}
                      </Select>
                      {!!touched.recipe && !!errors.recipe && (
                        <Typography variant="caption" sx={{ color: "error.main", mt: 0.5 }}>
                          {errors.recipe}
                        </Typography>
                      )}
                    </FormControl>

                    <TextField
                      fullWidth variant="outlined" type="number" label="Batches Produced" name="batchesProduced"
                      onBlur={handleBlur} onChange={handleChange} value={values.batchesProduced}
                      error={!!touched.batchesProduced && !!errors.batchesProduced} helperText={touched.batchesProduced && errors.batchesProduced}
                      sx={{ gridColumn: "span 2", ...inputSx }}
                      InputProps={{ inputProps: { "data-field": "batchesProduced" } }}
                    />
                    <TextField
                      fullWidth variant="outlined" type="number" label="Units of Waste" name="unitsOfWaste"
                      onBlur={handleBlur} onChange={handleChange} value={values.unitsOfWaste}
                      error={!!touched.unitsOfWaste && !!errors.unitsOfWaste} helperText={touched.unitsOfWaste && errors.unitsOfWaste}
                      sx={{ gridColumn: "span 2", ...inputSx }}
                      InputProps={{ inputProps: { "data-field": "unitsOfWaste", min: 0 } }}
                    />

                    <TextField
                      fullWidth variant="outlined" type="text" label="Batch Code" name="batchCode"
                      onBlur={handleBlur} onChange={handleChange} value={values.batchCode}
                      error={!!touched.batchCode && !!errors.batchCode} helperText={touched.batchCode && errors.batchCode}
                      sx={{ gridColumn: "span 4", ...inputSx }}
                      InputProps={{ inputProps: { "data-field": "batchCode" } }}
                    />

                    <TextField
                      fullWidth variant="outlined" type="text" label="Produced by (Name) – optional" name="producerName"
                      onBlur={handleBlur} onChange={handleChange} value={values.producerName}
                      error={!!touched.producerName && !!errors.producerName} helperText={touched.producerName && errors.producerName}
                      sx={{ gridColumn: "span 4", ...inputSx }}
                      InputProps={{ inputProps: { "data-field": "producerName" } }}
                    />
                  </Box>

                  <Box display="flex" justifyContent="flex-end" mt={3}>
                    <Fab
                      variant="extended"
                      onClick={() => handleSingleClick(validateForm, values, setTouched, submitForm)}
                      sx={{
                        px: 4, py: 1.25, gap: 1, borderRadius: 999, fontWeight: 800, textTransform: "none",
                        boxShadow: "0 8px 16px rgba(29,78,216,0.25), 0 2px 4px rgba(15,23,42,0.06)",
                        background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`,
                        color: "#fff",
                        "&:hover": { background: `linear-gradient(180deg, ${brand.primaryDark}, ${brand.primaryDark})` },
                      }}
                    >
                      <AddIcon />
                      Record Production
                    </Fab>
                  </Box>
                </form>
              )}
            </Formik>
          )}

          {/* MULTIPLE */}
          {tabIndex === 1 && (
            <Formik initialValues={initialBatch} validationSchema={batchSchema} onSubmit={() => {}}>
              {({ values, errors, touched, validateForm, setTouched, resetForm, setFieldValue }) => (
                <form>
                  <FieldArray name="items">
                    {({ push, remove }) => {
                      // enable FAB to add item
                      addItemRef.current = () => {
                        const last = (values.items || [])[values.items.length - 1] || null;
                        const next = { ...initialBatchItem };
                        if (last?.date) next.date = last.date;
                        if (last?.producerName) next.producerName = last.producerName;
                        push(next);
                      };

                      return (
                        <Box>
                          <Box display="grid" gap={2}>
                            {(values.items || []).map((it, idx) => {
                              const base = `items.${idx}`;
                              const dErr = getIn(errors, `${base}.date`), dTouch = getIn(touched, `${base}.date`);
                              const rErr = getIn(errors, `${base}.recipe`), rTouch = getIn(touched, `${base}.recipe`);
                              const bErr = getIn(errors, `${base}.batchesProduced`), bTouch = getIn(touched, `${base}.batchesProduced`);
                              const wErr = getIn(errors, `${base}.unitsOfWaste`), wTouch = getIn(touched, `${base}.unitsOfWaste`);
                              const cErr = getIn(errors, `${base}.batchCode`), cTouch = getIn(touched, `${base}.batchCode`);
                              const pErr = getIn(errors, `${base}.producerName`), pTouch = getIn(touched, `${base}.producerName`);

                              return (
                                <Paper
                                  key={idx}
                                  elevation={0}
                                  sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    border: `1px solid ${brand.border}`,
                                    background: idx % 2 ? brand.surfaceMuted : brand.surface,
                                  }}
                                >
                                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography sx={{ fontWeight: 800 }}>Item {idx + 1}</Typography>
                                    <IconButton
                                      size="small"
                                      onClick={() => remove(idx)}
                                      sx={{ color: brand.primary }}
                                      aria-label={`Remove item ${idx + 1}`}
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </Box>

                                  <Box
                                    display="grid"
                                    gap="12px"
                                    gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                                    sx={{ "& > div": { gridColumn: isNonMobile ? undefined : "span 4" } }}
                                  >
                                    <TextField
                                      fullWidth type="date" label="Date"
                                      name={`${base}.date`} value={it.date}
                                      onChange={(e) => setFieldValue(`${base}.date`, e.target.value)}
                                      sx={{ gridColumn: "span 2", ...inputSx }}
                                      error={!!dTouch && !!dErr} helperText={dTouch && dErr ? dErr : ""}
                                      InputProps={{ inputProps: { "data-field": `${base}.date` } }}
                                    />

                                    <FormControl fullWidth sx={{ gridColumn: "span 2", ...selectSx }} error={!!rTouch && !!rErr}>
                                      <InputLabel id={`recipe-label-${idx}`}>Recipe</InputLabel>
                                      <Select
                                        labelId={`recipe-label-${idx}`}
                                        name={`${base}.recipe`}
                                        value={it.recipe}
                                        label="Recipe"
                                        onChange={(e) => setFieldValue(`${base}.recipe`, e.target.value)}
                                        inputProps={{ "data-field": `${base}.recipe` }}
                                      >
                                        {recipeMenu}
                                      </Select>
                                      {!!rTouch && !!rErr && (
                                        <Typography variant="caption" sx={{ color: "error.main", mt: 0.5 }}>
                                          {rErr}
                                        </Typography>
                                      )}
                                    </FormControl>

                                    <TextField
                                      fullWidth type="number" label="Batches Produced"
                                      name={`${base}.batchesProduced`} value={it.batchesProduced}
                                      onChange={(e) => setFieldValue(`${base}.batchesProduced`, e.target.value)}
                                      sx={{ gridColumn: "span 2", ...inputSx }}
                                      error={!!bTouch && !!bErr} helperText={!!bTouch && bErr ? bErr : ""}
                                      InputProps={{ inputProps: { "data-field": `${base}.batchesProduced` } }}
                                    />

                                    <TextField
                                      fullWidth type="number" label="Units of Waste"
                                      name={`${base}.unitsOfWaste`} value={it.unitsOfWaste}
                                      onChange={(e) => setFieldValue(`${base}.unitsOfWaste`, e.target.value)}
                                      sx={{ gridColumn: "span 2", ...inputSx }}
                                      error={!!wTouch && !!wErr} helperText={!!wTouch && wErr ? wErr : ""}
                                      InputProps={{ inputProps: { "data-field": `${base}.unitsOfWaste`, min: 0 } }}
                                    />

                                    <TextField
                                      fullWidth type="text" label="Batch Code"
                                      name={`${base}.batchCode`} value={it.batchCode}
                                      onChange={(e) => setFieldValue(`${base}.batchCode`, e.target.value)}
                                      sx={{ gridColumn: "span 4", ...inputSx }}
                                      error={!!cTouch && !!cErr} helperText={!!cTouch && cErr ? cErr : ""}
                                      InputProps={{ inputProps: { "data-field": `${base}.batchCode` } }}
                                    />

                                    <TextField
                                      fullWidth type="text" label="Produced by (Name) – optional"
                                      name={`${base}.producerName`} value={it.producerName}
                                      onChange={(e) => setFieldValue(`${base}.producerName`, e.target.value)}
                                      sx={{ gridColumn: "span 4", ...inputSx }}
                                      error={!!pTouch && !!pErr} helperText={!!pTouch && pErr ? pErr : ""}
                                      InputProps={{ inputProps: { "data-field": `${base}.producerName` } }}
                                    />
                                  </Box>
                                </Paper>
                              );
                            })}
                          </Box>

                          {/* Submit multiple (opens confirm, but only after precheck) */}
                          <Box display="flex" justifyContent="flex-end" mt={3} sx={{ mb: 2 }}>
                            <Fab
                              variant="extended"
                              onClick={() => openConfirm({ validateForm, values, setTouched, resetForm })}
                              sx={{
                                px: 4, py: 1.25, gap: 1, borderRadius: 999, fontWeight: 800, textTransform: "none",
                                boxShadow: "0 8px 16px rgba(29,78,216,0.25), 0 2px 4px rgba(15,23,42,0.06)",
                                background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`,
                                color: "#fff",
                                "&:hover": { background: `linear-gradient(180deg, ${brand.primaryDark}, ${brand.primaryDark})` },
                              }}
                            >
                              <AddIcon />
                              Submit Multiple ({(values.items || []).length})
                            </Fab>
                          </Box>
                        </Box>
                      );
                    }}
                  </FieldArray>
                </form>
              )}
            </Formik>
          )}
        </Paper>

        {/* FAB to add an item (Multiple tab only) */}
        {tabIndex === 1 && (
          <Box
            sx={{
              position: "absolute",
              left: 20,
              bottom: 20,
              zIndex: 1200,
              pointerEvents: "auto",
            }}
          >
            <Fab
              onClick={() => addItemRef.current && addItemRef.current()}
              sx={{
                background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`,
                color: "#fff",
                "&:hover": { background: brand.primaryDark },
                boxShadow: "0 14px 36px rgba(16,24,40,0.20)",
                width: 170,
                height: 56,
                borderRadius: 3,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontWeight: 800,
                textTransform: "none",
              }}
              aria-label="Add production item"
              size="medium"
              variant="extended"
            >
              <AddIcon sx={{ mr: 1 }} />
              Add Item
            </Fab>
          </Box>
        )}
      </Box>

      {/* Confirm dialog for batch preview */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 14, border: `1px solid ${brand.border}` } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: brand.text }}>Confirm Multiple Submission</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ color: brand.subtext, mb: 2 }}>
            You're about to submit <strong>{previewItems.length}</strong> production log item(s). Review and confirm.
          </Typography>

          <Table size="small" aria-label="batch-summary">
            <TableHead>
              <TableRow sx={{ background: brand.surfaceMuted }}>
                <TableCell sx={{ fontWeight: 800 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Recipe</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Batches</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Waste (units)</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Batch Code</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Producer</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {previewItems.map((it, i) => (
                <TableRow key={i}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{String(it.recipe || "—")}</TableCell>
                  <TableCell>{String(it.batchesProduced ?? "—")}</TableCell>
                  <TableCell>{String(it.unitsOfWaste ?? "—")}</TableCell>
                  <TableCell>{String(it.batchCode ?? "—")}</TableCell>
                  <TableCell>{String(it.producerName ?? "—")}</TableCell>
                  <TableCell>{String(it.date ?? "—")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} sx={{ textTransform: "none", fontWeight: 700 }} disabled={submittingBatch}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSubmit}
            sx={{
              textTransform: "none",
              fontWeight: 800,
              borderRadius: 999,
              px: 2,
              color: "#fff",
              background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`,
              "&:hover": { background: brand.primaryDark },
            }}
            startIcon={submittingBatch ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : null}
            disabled={submittingBatch}
          >
            {submittingBatch ? "Submitting…" : "Confirm & Submit"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deficit warning dialog (Single & Multiple) */}
      <Dialog
        open={deficitOpen}
        onClose={() => setDeficitOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 14, border: `1px solid ${brand.border}` } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: brand.text }}>
          Insufficient / Missing Ingredients
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 2 }}>
            You're about to record production that uses ingredients you do not currently have enough of in <strong>active stock</strong>.
            This can lead to negative or inconsistent inventory.
          </Alert>

          <Table size="small" aria-label="deficits">
            <TableHead>
              <TableRow sx={{ background: brand.surfaceMuted }}>
                <TableCell sx={{ fontWeight: 800 }}>Ingredient</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Need</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Have</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Unit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {deficits.map((d, i) => (
                <TableRow key={i}>
                  <TableCell>{d.ingredient}</TableCell>
                  <TableCell>{d.need}</TableCell>
                  <TableCell>{d.have}</TableCell>
                  <TableCell>{d.unit || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Alert severity="info" sx={{ mt: 2 }}>
            Proceeding will deduct current stock down to 0 where possible and excuse any remaining shortfall in this log.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeficitOpen(false)} sx={{ textTransform: "none", fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setDeficitOpen(false);
              const next = deficitNextRef.current;
              deficitNextRef.current = null;
              if (typeof next === "function") next();
            }}
            sx={{
              textTransform: "none",
              fontWeight: 800,
              borderRadius: 999,
              px: 2,
              color: "#fff",
              background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`,
              "&:hover": { background: brand.primaryDark },
            }}
          >
            Proceed anyway
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={() => setOpenSnackbar(false)} severity="success" sx={{ fontWeight: 700, borderRadius: 2 }}>
          Production log recorded successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductionLogForm;
