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

// API base
const API_BASE =
  "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

// brand style tokens
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

// MUI shared sx for inputs
const inputSx = {
  "& .MuiInputLabel-root": {
    color: brand.subtext,
    fontWeight: 600,
    letterSpacing: 0.2,
  },
  "& .MuiInputLabel-root.Mui-focused": { color: brand.primary },
  "& .MuiOutlinedInput-root": {
    borderRadius: 12,
    "& fieldset": { borderColor: brand.border },
    "&:hover fieldset": { borderColor: brand.primary },
    "&.Mui-focused fieldset": {
      borderColor: brand.primary,
      boxShadow: `0 0 0 4px ${brand.focusRing}`,
    },
    "& input, & textarea": { paddingTop: "14px", paddingBottom: "14px" },
  },
};

const selectSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 12,
    "& fieldset": { borderColor: brand.border },
    "&:hover fieldset": { borderColor: brand.primary },
    "&.Mui-focused fieldset": {
      borderColor: brand.primary,
      boxShadow: `0 0 0 4px ${brand.focusRing}`,
    },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: brand.primary },
};

// Yup validation
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

// Initial values
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


// =====================================================
// ========== FULL HELPER FUNCTIONS ADDED HERE ==========
// =====================================================

// call single-run API
const submitSingle = async (values, { resetForm }, cognitoId, setOpenSnackbar) => {
  const payload = {
    ...values,
    producerName: values.producerName ?? "",
    cognito_id: cognitoId,
  };

  try {
    const res = await fetch(`${API_BASE}/add-production-log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Single submit failed");

    resetForm();
    setOpenSnackbar(true);
  } catch (error) {
    console.error("Submit single error:", error);
    alert("Submission failed. Check console.");
  }
};

// call batch API
const submitBatch = async (items, resetForm, cognitoId, setOpenSnackbar) => {
  try {
    const res = await fetch(`${API_BASE}/add-production-log/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: items, cognito_id: cognitoId }),
    });

    if (!res.ok) throw new Error("Batch submit failed");

    resetForm();
    setOpenSnackbar(true);
  } catch (error) {
    console.error("Batch error:", error);

    // fallback: sequential single insert
    for (const it of items) {
      const payload = {
        ...it,
        producerName: it.producerName ?? "",
        cognito_id: cognitoId,
      };

      const r = await fetch(`${API_BASE}/add-production-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!r.ok)
        console.error(
          "Fallback single failed:",
          it,
          await r.text().catch(() => r.status)
        );
    }

    resetForm();
    setOpenSnackbar(true);
  }
};

// handle single-run click
const handleSingleClick = async (
  validateForm,
  values,
  setTouched,
  submitForm,
  computeDeficitsSingle,
  setDeficits,
  setDeficitOpen,
  deficitNextRef
) => {
  const errs = await validateForm();

  if (errs && Object.keys(errs).length > 0) {
    setTouched(
      {
        date: true,
        recipe: true,
        batchesProduced: true,
        unitsOfWaste: true,
        batchCode: true,
        producerName: true,
      },
      false
    );
    return;
  }

  try {
    const problems = await computeDeficitsSingle(
      values.recipe,
      values.batchesProduced
    );

    if (problems.length) {
      setDeficits(problems);
      deficitNextRef.current = async () => submitForm();
      setDeficitOpen(true);
      return;
    }
  } catch (error) {
    console.error("Single availability error:", error);
    alert("Could not verify inventory availability.");
    return;
  }

  await submitForm();
};

// handle MULTIPLE: validate → precheck → open confirm dialog
const openConfirm = async ({
  validateForm,
  values,
  setTouched,
  resetForm,
  computeDeficitsBatch,
  setDeficits,
  setDeficitOpen,
  deficitNextRef,
  setPreviewItems,
  setBatchResetForm,
  setConfirmOpen,
}) => {
  const errs = await validateForm();

  if (errs && Object.keys(errs).length > 0) {
    const touchedItems = (values.items || []).map(() => ({
      date: true,
      recipe: true,
      batchesProduced: true,
      unitsOfWaste: true,
      batchCode: true,
      producerName: true,
    }));

    setTouched({ items: touchedItems }, false);
    return;
  }

  try {
    const problems = await computeDeficitsBatch(values.items || []);

    if (problems.length) {
      setDeficits(problems);

      deficitNextRef.current = () => {
        setPreviewItems(values.items || []);
        setBatchResetForm(() => resetForm);
        setConfirmOpen(true);
      };

      setDeficitOpen(true);
      return;
    }
  } catch (error) {
    console.error("Batch availability error:", error);
    alert("Could not verify inventory availability.");
    return;
  }

  setPreviewItems(values.items || []);
  setBatchResetForm(() => resetForm);
  setConfirmOpen(true);
};

// MULTIPLE: submit after confirm dialog
const handleConfirmSubmit = async (
  previewItems,
  batchResetForm,
  cognitoId,
  setOpenSnackbar,
  setSubmittingBatch,
  setConfirmOpen,
  setPreviewItems
) => {
  if (!previewItems.length) {
    setConfirmOpen(false);
    return;
  }

  setSubmittingBatch(true);

  try {
    await submitBatch(previewItems, batchResetForm, cognitoId, setOpenSnackbar);
    setConfirmOpen(false);
    setPreviewItems([]);
  } finally {
    setSubmittingBatch(false);
  }
};


// =====================================================
// ===== END OF FULL RESTORED HELPERS (CHUNK 1 END) =====
// =====================================================
// ===============================
// ====== AVAILABILITY LOGIC ======
// ===============================

// normalize ingredient name
const normalizeName = (s) =>
  (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");

// normalize units
const normalizeUnit = (u) => {
  const raw = (u || "").toString().trim().toLowerCase();
  if (!raw || raw === "n/a" || raw === "na" || raw === "none") return "";
  if (["g", "gram", "grams"].includes(raw)) return "g";
  if (["kg", "kilogram", "kilograms"].includes(raw)) return "kg";
  if (["ml", "millilitre", "milliliter", "milliliters", "millilitres"].includes(raw))
    return "ml";
  if (["l", "liter", "litre", "liters", "litres"].includes(raw)) return "l";
  if (["unit", "units", "pcs", "pc", "piece", "pieces"].includes(raw)) return "unit";
  return raw;
};

// convert to base metric (g or ml)
const unitFactorToBase = (canon) => {
  const u = (canon || "").toLowerCase();
  if (u === "kg") return 1000;
  if (u === "g") return 1;
  if (u === "l") return 1000;
  if (u === "ml") return 1;
  if (u === "unit") return 1;
  return 1;
};

// round for display
const roundDisp = (n) => {
  if (Math.abs(n - Math.round(n)) < 1e-9) return Math.round(n);
  return Math.round(n * 1000) / 1000;
};

// pick a consistent display unit across recipe rows
const pickDisplayUnit = (unitsSet) => {
  const u = new Set(Array.from(unitsSet || []).map(normalizeUnit));
  if (u.has("g") || u.has("kg")) return "g";
  if (u.has("ml") || u.has("l")) return "ml";
  if (u.has("unit")) return "unit";
  return "";
};

// fetch ACTIVE inventory snapshot
const fetchActiveInventory = async (cognitoId) => {
  try {
    const res = await fetch(
      `${API_BASE}/ingredient-inventory/active?cognito_id=${encodeURIComponent(
        cognitoId
      )}`
    );
    return res.ok ? await res.json() : [];
  } catch (error) {
    console.error("Active inventory fetch failed:", error);
    return [];
  }
};

// ===== compute deficits (single run)
const computeDeficitsSingle = async (
  recipeName,
  batchesProduced,
  recipesIndex,
  cognitoId
) => {
  const lines = recipesIndex[recipeName] || [];
  if (!lines.length) return [];

  const needByIng = new Map();

  // compute need in base units
  for (const line of lines) {
    const name = line.ingredient || "";
    const uCanon = normalizeUnit(line.unit);
    const qty = Number(line.quantity) || 0;
    const needBase = qty * (Number(batchesProduced) || 0) * unitFactorToBase(uCanon);

    const k = normalizeName(name);
    const cur = needByIng.get(k) || { name, needBase: 0, unitsSeen: new Set() };
    cur.needBase += needBase;
    cur.unitsSeen.add(uCanon);
    needByIng.set(k, cur);
  }

  // available stock
  const invRows = await fetchActiveInventory(cognitoId);
  const haveByIng = new Map();

  for (const r of Array.isArray(invRows) ? invRows : []) {
    const k = normalizeName(r?.ingredient ?? "");
    const uCanon = normalizeUnit(r?.unit ?? "");
    const amt = Number(
      r?.totalRemaining ?? r?.stockOnHand ?? r?.unitsInStock ?? 0
    );
    const base = amt * unitFactorToBase(uCanon);
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

// ===== compute deficits (multiple)
const computeDeficitsBatch = async (items, recipesIndex, cognitoId) => {
  const needByIng = new Map();

  for (const it of items || []) {
    const recipeName = it.recipe;
    const batches = Number(it.batchesProduced) || 0;
    if (!recipeName || !batches) continue;

    const lines = recipesIndex[recipeName] || [];
    for (const line of lines) {
      const name = line.ingredient || "";
      const uCanon = normalizeUnit(line.unit);
      const qty = Number(line.quantity) || 0;
      const needBase = qty * batches * unitFactorToBase(uCanon);

      const k = normalizeName(name);
      const cur = needByIng.get(k) || { name, needBase: 0, unitsSeen: new Set() };
      cur.needBase += needBase;
      cur.unitsSeen.add(uCanon);
      needByIng.set(k, cur);
    }
  }

  // inventory
  const invRows = await fetchActiveInventory(cognitoId);
  const haveByIng = new Map();

  for (const r of Array.isArray(invRows) ? invRows : []) {
    const k = normalizeName(r?.ingredient ?? "");
    const uCanon = normalizeUnit(r?.unit ?? "");
    const amt = Number(
      r?.totalRemaining ?? r?.stockOnHand ?? r?.unitsInStock ?? 0
    );
    const base = amt * unitFactorToBase(uCanon);
    haveByIng.set(k, (haveByIng.get(k) || 0) + base);
  }

  // compare
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

// =============================
// ===== REACT COMPONENT =======
// =============================
const ProductionLogForm = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const { cognitoId } = useAuth();

  const [tabIndex, setTabIndex] = useState(0);
  const [recipes, setRecipes] = useState([]);
  const [recipesIndex, setRecipesIndex] = useState({});
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [fetchErr, setFetchErr] = useState("");

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [previewItems, setPreviewItems] = useState([]);
  const [submittingBatch, setSubmittingBatch] = useState(false);
  const [batchResetForm, setBatchResetForm] = useState(null);

  const [deficitOpen, setDeficitOpen] = useState(false);
  const [deficits, setDeficits] = useState([]);
  const deficitNextRef = useRef(null);

  const addItemRef = useRef(null);

  // ===== FETCH RECIPES FROM API
  useEffect(() => {
    if (!cognitoId) return;

    (async () => {
      setLoadingRecipes(true);
      setFetchErr("");

      try {
        const res = await fetch(
          `${API_BASE}/recipes?cognito_id=${encodeURIComponent(cognitoId)}`
        );
        if (!res.ok) throw new Error("Failed to fetch recipes");
        const rows = await res.json();

        const index = {};
        const namesSet = new Set();

        for (const r of Array.isArray(rows) ? rows : []) {
          const recipeName =
            r.recipeName ?? r.recipe_name ?? r.recipe ?? "";
          if (!recipeName) continue;

          namesSet.add(recipeName);

          if (!index[recipeName]) index[recipeName] = [];

          index[recipeName].push({
            ingredient: r.ingredient ?? r.ingredient_name ?? "",
            quantity: Number(r.quantity) || 0,
            unit: r.unit ?? "",
          });
        }

        setRecipes(Array.from(namesSet).sort());
        setRecipesIndex(index);
      } catch (err) {
        console.error(err);
        setFetchErr("Error fetching recipes");
        setRecipes([]);
        setRecipesIndex({});
      } finally {
        setLoadingRecipes(false);
      }
    })();
  }, [cognitoId]);


  // ===== Recipe dropdown menu builder
  const recipeMenu = useMemo(() => {
    if (loadingRecipes)
      return [<MenuItem key="loading" value="" disabled>Loading recipes…</MenuItem>];

    if (fetchErr)
      return [<MenuItem key="err" value="" disabled>{fetchErr}</MenuItem>];

    if (!recipes.length)
      return [<MenuItem key="none" value="" disabled>No recipes</MenuItem>];

    return [
      <MenuItem key="placeholder" value="" disabled>
        Select a recipe…
      </MenuItem>,
      ...recipes.map((r) => (
        <MenuItem key={r} value={r}>
          {r}
        </MenuItem>
      )),
    ];
  }, [recipes, loadingRecipes, fetchErr]);
  // ===========================================
  // ============= FORM RENDER =================
  // ===========================================
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
            boxShadow:
              "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)",
          }}
        >
          {/* HEADER */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={2}
          >
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, color: brand.text }}
              >
                Record Production
              </Typography>
              <Typography variant="body2" sx={{ color: brand.subtext }}>
                Use Single for one run or switch to Multiple to log several runs
                at once.
              </Typography>
            </Box>

            <Tabs
              value={tabIndex}
              onChange={(_, v) => setTabIndex(v)}
              sx={{
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 700,
                },
              }}
            >
              <Tab label="Single" />
              <Tab label="Multiple" />
            </Tabs>
          </Box>

          {/* ================================================== */}
          {/* ===================== SINGLE ===================== */}
          {/* ================================================== */}

          {tabIndex === 0 && (
            <Formik
              initialValues={initialSingle}
              validationSchema={singleSchema}
              onSubmit={(v, helpers) =>
                submitSingle(v, helpers, cognitoId, setOpenSnackbar)
              }
            >
              {({
                values,
                errors,
                touched,
                handleBlur,
                handleChange,
                handleSubmit,
                validateForm,
                setTouched,
                submitForm,
              }) => (
                <form onSubmit={handleSubmit}>
                  <Box
                    display="grid"
                    gap="20px"
                    gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                    sx={{
                      "& > div": {
                        gridColumn: isNonMobile ? undefined : "span 4",
                      },
                    }}
                  >
                    {/* DATE */}
                    <TextField
                      fullWidth
                      variant="outlined"
                      type="date"
                      label="Date"
                      name="date"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.date}
                      error={!!touched.date && !!errors.date}
                      helperText={touched.date && errors.date}
                      sx={{ gridColumn: "span 2", ...inputSx }}
                      InputProps={{
                        inputProps: { "data-field": "date" },
                      }}
                    />

                    {/* RECIPE — PATCHED */}
                    <FormControl
                      fullWidth
                      sx={{ gridColumn: "span 2", ...selectSx }}
                    >
                      <InputLabel id="recipe-label">Recipe</InputLabel>
                      <Select
                        labelId="recipe-label"
                        name="recipe"
                        value={values.recipe}
                        label="Recipe"
                        onChange={handleChange}
                        inputProps={{ "data-field": "recipe" }}
                        error={!!touched.recipe && !!errors.recipe}
                        MenuProps={{
                          disablePortal: true, // ******** PATCH ********
                        }}
                      >
                        {recipeMenu}
                      </Select>
                      {!!touched.recipe && !!errors.recipe && (
                        <Typography
                          variant="caption"
                          sx={{ color: "error.main", mt: 0.5 }}
                        >
                          {errors.recipe}
                        </Typography>
                      )}
                    </FormControl>

                    {/* BATCHES PRODUCED */}
                    <TextField
                      fullWidth
                      variant="outlined"
                      type="number"
                      label="Batches Produced"
                      name="batchesProduced"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.batchesProduced}
                      error={
                        !!touched.batchesProduced && !!errors.batchesProduced
                      }
                      helperText={
                        touched.batchesProduced && errors.batchesProduced
                      }
                      sx={{ gridColumn: "span 2", ...inputSx }}
                      InputProps={{
                        inputProps: { "data-field": "batchesProduced" },
                      }}
                    />

                    {/* WASTE */}
                    <TextField
                      fullWidth
                      variant="outlined"
                      type="number"
                      label="Units of Waste"
                      name="unitsOfWaste"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.unitsOfWaste}
                      error={!!touched.unitsOfWaste && !!errors.unitsOfWaste}
                      helperText={touched.unitsOfWaste && errors.unitsOfWaste}
                      sx={{ gridColumn: "span 2", ...inputSx }}
                      InputProps={{
                        inputProps: { "data-field": "unitsOfWaste", min: 0 },
                      }}
                    />

                    {/* BATCH CODE */}
                    <TextField
                      fullWidth
                      variant="outlined"
                      type="text"
                      label="Batch Code"
                      name="batchCode"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.batchCode}
                      error={!!touched.batchCode && !!errors.batchCode}
                      helperText={touched.batchCode && errors.batchCode}
                      sx={{ gridColumn: "span 4", ...inputSx }}
                      InputProps={{
                        inputProps: { "data-field": "batchCode" },
                      }}
                    />

                    {/* PRODUCER NAME */}
                    <TextField
                      fullWidth
                      variant="outlined"
                      type="text"
                      label="Produced by (Name) – optional"
                      name="producerName"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.producerName}
                      error={
                        !!touched.producerName && !!errors.producerName
                      }
                      helperText={
                        touched.producerName && errors.producerName
                      }
                      sx={{ gridColumn: "span 4", ...inputSx }}
                      InputProps={{
                        inputProps: { "data-field": "producerName" },
                      }}
                    />
                  </Box>

                  {/* SUBMIT SINGLE */}
                  <Box display="flex" justifyContent="flex-end" mt={3}>
                    <Fab
                      variant="extended"
                      onClick={() =>
                        handleSingleClick(
                          validateForm,
                          values,
                          setTouched,
                          submitForm,
                          (recipe, batches) =>
                            computeDeficitsSingle(
                              recipe,
                              batches,
                              recipesIndex,
                              cognitoId
                            ),
                          setDeficits,
                          setDeficitOpen,
                          deficitNextRef
                        )
                      }
                      sx={{
                        px: 4,
                        py: 1.25,
                        gap: 1,
                        borderRadius: 999,
                        fontWeight: 800,
                        textTransform: "none",
                        boxShadow:
                          "0 8px 16px rgba(29,78,216,0.25), 0 2px 4px rgba(15,23,42,0.06)",
                        background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`,
                        color: "#fff",
                        "&:hover": { background: brand.primaryDark },
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

          {/* ================================================== */}
          {/* ==================== MULTIPLE ==================== */}
          {/* ================================================== */}

          {tabIndex === 1 && (
            <Formik initialValues={initialBatch} validationSchema={batchSchema}>
              {({
                values,
                errors,
                touched,
                validateForm,
                setTouched,
                resetForm,
                setFieldValue,
              }) => (
                <form>
                  <FieldArray name="items">
                    {({ push, remove }) => {
                      // FAB handler for adding a blank item
                      addItemRef.current = () => {
                        const last =
                          (values.items || [])[values.items.length - 1];
                        const next = { ...initialBatchItem };
                        if (last?.date) next.date = last.date;
                        if (last?.producerName)
                          next.producerName = last.producerName;
                        push(next);
                      };

                      return (
                        <Box>
                          <Box display="grid" gap={2}>
                            {(values.items || []).map((it, idx) => {
                              const base = `items.${idx}`;

                              const dErr = getIn(errors, `${base}.date`);
                              const rErr = getIn(errors, `${base}.recipe`);
                              const bErr = getIn(
                                errors,
                                `${base}.batchesProduced`
                              );
                              const wErr = getIn(
                                errors,
                                `${base}.unitsOfWaste`
                              );
                              const cErr = getIn(
                                errors,
                                `${base}.batchCode`
                              );
                              const pErr = getIn(
                                errors,
                                `${base}.producerName`
                              );

                              const dTouch = getIn(
                                touched,
                                `${base}.date`
                              );
                              const rTouch = getIn(
                                touched,
                                `${base}.recipe`
                              );
                              const bTouch = getIn(
                                touched,
                                `${base}.batchesProduced`
                              );
                              const wTouch = getIn(
                                touched,
                                `${base}.unitsOfWaste`
                              );
                              const cTouch = getIn(
                                touched,
                                `${base}.batchCode`
                              );
                              const pTouch = getIn(
                                touched,
                                `${base}.producerName`
                              );

                              return (
                                <Paper
                                  key={idx}
                                  elevation={0}
                                  sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    border: `1px solid ${brand.border}`,
                                    background:
                                      idx % 2
                                        ? brand.surfaceMuted
                                        : brand.surface,
                                  }}
                                >
                                  {/* ITEM HEADER */}
                                  <Box
                                    display="flex"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    mb={1}
                                  >
                                    <Typography sx={{ fontWeight: 800 }}>
                                      Item {idx + 1}
                                    </Typography>

                                    <IconButton
                                      size="small"
                                      onClick={() => remove(idx)}
                                      sx={{ color: brand.primary }}
                                      aria-label={`Remove item ${idx + 1}`}
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </Box>

                                  {/* ITEM GRID */}
                                  <Box
                                    display="grid"
                                    gap="12px"
                                    gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                                    sx={{
                                      "& > div": {
                                        gridColumn: isNonMobile
                                          ? undefined
                                          : "span 4",
                                      },
                                    }}
                                  >
                                    {/* DATE */}
                                    <TextField
                                      fullWidth
                                      type="date"
                                      label="Date"
                                      name={`${base}.date`}
                                      value={it.date}
                                      onChange={(e) =>
                                        setFieldValue(
                                          `${base}.date`,
                                          e.target.value
                                        )
                                      }
                                      sx={{ gridColumn: "span 2", ...inputSx }}
                                      error={!!dTouch && !!dErr}
                                      helperText={dTouch && dErr ? dErr : ""}
                                      InputProps={{
                                        inputProps: {
                                          "data-field": `${base}.date`,
                                        },
                                      }}
                                    />

                                    {/* RECIPE — PATCHED */}
                                    <FormControl
                                      fullWidth
                                      sx={{
                                        gridColumn: "span 2",
                                        ...selectSx,
                                      }}
                                      error={!!rTouch && !!rErr}
                                    >
                                      <InputLabel id={`recipe-label-${idx}`}>
                                        Recipe
                                      </InputLabel>

                                      <Select
                                        labelId={`recipe-label-${idx}`}
                                        name={`${base}.recipe`}
                                        value={it.recipe}
                                        label="Recipe"
                                        onChange={(e) =>
                                          setFieldValue(
                                            `${base}.recipe`,
                                            e.target.value
                                          )
                                        }
                                        inputProps={{
                                          "data-field": `${base}.recipe`,
                                        }}
                                        MenuProps={{
                                          disablePortal: true, // ******** PATCH ********
                                        }}
                                      >
                                        {recipeMenu}
                                      </Select>

                                      {!!rTouch && !!rErr && (
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            color: "error.main",
                                            mt: 0.5,
                                          }}
                                        >
                                          {rErr}
                                        </Typography>
                                      )}
                                    </FormControl>

                                    {/* BATCHES */}
                                    <TextField
                                      fullWidth
                                      type="number"
                                      label="Batches Produced"
                                      name={`${base}.batchesProduced`}
                                      value={it.batchesProduced}
                                      onChange={(e) =>
                                        setFieldValue(
                                          `${base}.batchesProduced`,
                                          e.target.value
                                        )
                                      }
                                      sx={{ gridColumn: "span 2", ...inputSx }}
                                      error={!!bTouch && !!bErr}
                                      helperText={
                                        bTouch && bErr ? bErr : ""
                                      }
                                      InputProps={{
                                        inputProps: {
                                          "data-field": `${base}.batchesProduced`,
                                        },
                                      }}
                                    />

                                    {/* WASTE */}
                                    <TextField
                                      fullWidth
                                      type="number"
                                      label="Units of Waste"
                                      name={`${base}.unitsOfWaste`}
                                      value={it.unitsOfWaste}
                                      onChange={(e) =>
                                        setFieldValue(
                                          `${base}.unitsOfWaste`,
                                          e.target.value
                                        )
                                      }
                                      sx={{ gridColumn: "span 2", ...inputSx }}
                                      error={!!wTouch && !!wErr}
                                      helperText={
                                        wTouch && wErr ? wErr : ""
                                      }
                                      InputProps={{
                                        inputProps: {
                                          "data-field": `${base}.unitsOfWaste`,
                                          min: 0,
                                        },
                                      }}
                                    />

                                    {/* BATCH CODE */}
                                    <TextField
                                      fullWidth
                                      type="text"
                                      label="Batch Code"
                                      name={`${base}.batchCode`}
                                      value={it.batchCode}
                                      onChange={(e) =>
                                        setFieldValue(
                                          `${base}.batchCode`,
                                          e.target.value
                                        )
                                      }
                                      sx={{ gridColumn: "span 4", ...inputSx }}
                                      error={!!cTouch && !!cErr}
                                      helperText={
                                        cTouch && cErr ? cErr : ""
                                      }
                                      InputProps={{
                                        inputProps: {
                                          "data-field": `${base}.batchCode`,
                                        },
                                      }}
                                    />

                                    {/* PRODUCER */}
                                    <TextField
                                      fullWidth
                                      type="text"
                                      label="Produced by (Name) – optional"
                                      name={`${base}.producerName`}
                                      value={it.producerName}
                                      onChange={(e) =>
                                        setFieldValue(
                                          `${base}.producerName`,
                                          e.target.value
                                        )
                                      }
                                      sx={{ gridColumn: "span 4", ...inputSx }}
                                      error={!!pTouch && !!pErr}
                                      helperText={
                                        pTouch && pErr ? pErr : ""
                                      }
                                      InputProps={{
                                        inputProps: {
                                          "data-field": `${base}.producerName`,
                                        },
                                      }}
                                    />
                                  </Box>
                                </Paper>
                              );
                            })}
                          </Box>

                          {/* MULTIPLE SUBMIT BUTTON */}
                          <Box
                            display="flex"
                            justifyContent="flex-end"
                            mt={3}
                            sx={{ mb: 2 }}
                          >
                            <Fab
                              variant="extended"
                              onClick={() =>
                                openConfirm({
                                  validateForm,
                                  values,
                                  setTouched,
                                  resetForm,
                                  computeDeficitsBatch: (items) =>
                                    computeDeficitsBatch(
                                      items,
                                      recipesIndex,
                                      cognitoId
                                    ),
                                  setDeficits,
                                  setDeficitOpen,
                                  deficitNextRef,
                                  setPreviewItems,
                                  setBatchResetForm,
                                  setConfirmOpen,
                                })
                              }
                              sx={{
                                px: 4,
                                py: 1.25,
                                gap: 1,
                                borderRadius: 999,
                                fontWeight: 800,
                                textTransform: "none",
                                boxShadow:
                                  "0 8px 16px rgba(29,78,216,0.25), 0 2px 4px rgba(15,23,42,0.06)",
                                background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`,
                                color: "#fff",
                                "&:hover": { background: brand.primaryDark },
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

        {/* ================= FAB: Add Multiple Item ================= */}
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

      {/* ================= Confirm Dialog (Multiple) ================= */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 14, border: `1px solid ${brand.border}` } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: brand.text }}>
          Confirm Multiple Submission
        </DialogTitle>

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
                <TableCell sx={{ fontWeight: 800 }}>Waste</TableCell>
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
          <Button
            onClick={() => setConfirmOpen(false)}
            disabled={submittingBatch}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Cancel
          </Button>

          <Button
            onClick={() =>
              handleConfirmSubmit(
                previewItems,
                batchResetForm,
                cognitoId,
                setOpenSnackbar,
                setSubmittingBatch,
                setConfirmOpen,
                setPreviewItems
              )
            }
            disabled={submittingBatch}
            startIcon={
              submittingBatch ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : null
            }
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
            {submittingBatch ? "Submitting…" : "Confirm & Submit"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================= Deficit Warning Dialog ================= */}
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
            You're about to record production that uses ingredients you do not currently have
            enough of in <strong>active stock</strong>. This can lead to negative inventory.
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
            Proceeding will deduct stock down to 0 where possible and excuse any shortfall.
          </Alert>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeficitOpen(false)}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
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


      {/* ================= SUCCESS TOAST ================= */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity="success"
          sx={{ fontWeight: 700, borderRadius: 2 }}
        >
          Production log recorded successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};


export default ProductionLogForm;
