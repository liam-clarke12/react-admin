// src/scenes/form/GoodsIn/index.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
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
import Autocomplete from "@mui/material/Autocomplete";
import { Formik, FieldArray } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAuth } from "../../../contexts/AuthContext";

const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

/**
 * Nory-like tokens (Ruby/Rose)
 */
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
};

// shared input styling for TextField & Autocomplete
const inputSx = {
  "& .MuiInputLabel-root": {
    color: brand.subtext,
    fontWeight: 600,
    letterSpacing: 0.2,
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: brand.primary,
  },
  "& .MuiOutlinedInput-root": {
    backgroundColor: brand.inputBg,
    borderRadius: 12,
    "& fieldset": {
      borderColor: brand.border,
    },
    "&:hover fieldset": {
      borderColor: brand.primary,
    },
    "&.Mui-focused fieldset": {
      borderColor: brand.primary,
      boxShadow: `0 0 0 4px ${brand.focusRing}`,
    },
    "& input, & textarea": {
      paddingTop: "14px",
      paddingBottom: "14px",
    },
  },
};

// select styling to match textfields
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

const unitOptions = [
  { value: "grams", label: "Grams (g)" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "units", label: "Units" },
];

const itemSchema = yup.object().shape({
  date: yup.string().required("Date is required"),
  ingredient: yup.string().required("Ingredient is required"),
  stockReceived: yup
    .number()
    .required("Stock amount is required")
    .positive("Must be positive"),
  unit: yup.string().required("Metric unit is required"),
  barCode: yup.string().required("Bar Code is required"),
  expiryDate: yup.string().required("Expiry Date is required"),
  temperature: yup.string().required("Temperature is required"),
});

const GoodsInForm = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const { cognitoId } = useAuth();

  // master and custom ingredient lists
  const [masterIngredients, setMasterIngredients] = useState([]);
  const [customIngredients, setCustomIngredients] = useState([]);
  const [loadingMaster, setLoadingMaster] = useState(false);
  const [loadingCustom, setLoadingCustom] = useState(false);

  // merge for dropdown
  const ingredients = useMemo(
    () => [
      ...masterIngredients.map((i) => ({ ...i, source: "master" })),
      ...customIngredients.map((i) => ({ ...i, source: "custom" })),
    ],
    [masterIngredients, customIngredients]
  );

  // snackbar & dialog state
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newIngredient, setNewIngredient] = useState("");
  const [adding, setAdding] = useState(false);

  // confirm dialog (multiple)
  const [batchConfirmOpen, setBatchConfirmOpen] = useState(false);
  const [batchPreviewItems, setBatchPreviewItems] = useState([]);
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [batchResetFormFn, setBatchResetFormFn] = useState(null);

  // tab state: 0 = single, 1 = multiple
  const [tabIndex, setTabIndex] = useState(0);

  // ref to allow adding goods from a floating FAB
  const addGoodRef = useRef(null);

  // fetch global ingredients
  useEffect(() => {
    if (!cognitoId) return;
    setLoadingMaster(true);
    fetch(`${API_BASE}/ingredients?cognito_id=${cognitoId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch ingredients");
        return res.json();
      })
      .then((data) => setMasterIngredients(data))
      .catch((err) => console.error("Error fetching master:", err))
      .finally(() => setLoadingMaster(false));
  }, [cognitoId]);

  // fetch user custom ingredients
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
      .catch((err) => console.error("Error fetching custom:", err))
      .finally(() => setLoadingCustom(false));
  }, [cognitoId]);

  // dialog handlers
  const openAddDialog = () => {
    setNewIngredient("");
    setAddDialogOpen(true);
  };
  const closeAddDialog = () => setAddDialogOpen(false);

  const handleAddIngredient = async () => {
    if (!newIngredient.trim() || !cognitoId) return;
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

  // validation schemas
  const goodsInSchema = itemSchema;

  const batchSchema = yup.object().shape({
    items: yup.array().of(itemSchema).min(1, "At least one item is required"),
  });

  const initialValuesSingle = {
    date: new Date().toISOString().split("T")[0],
    ingredient: "",
    stockReceived: "",
    unit: "grams",
    barCode: "",
    expiryDate: new Date().toISOString().split("T")[0],
    temperature: "N/A",
  };

  const initialBatchItem = {
    date: new Date().toISOString().split("T")[0],
    ingredient: "",
    stockReceived: "",
    unit: "grams",
    barCode: "",
    expiryDate: new Date().toISOString().split("T")[0],
    temperature: "N/A",
  };

  const initialValuesBatch = { items: [initialBatchItem] };

  // submit helpers
  const submitSingle = async (values, { resetForm }) => {
    const selectedOpt = ingredients.find((i) => String(i.id) === String(values.ingredient)) || null;
    const payload = {
      ...values,
      ingredient: selectedOpt ? selectedOpt.name : values.ingredient,
      ingredientId: selectedOpt ? String(selectedOpt.id) : null,
      cognito_id: cognitoId,
    };

    try {
      const res = await fetch(`${API_BASE}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Submit failed");
      resetForm();
      setOpenSnackbar(true);
    } catch (err) {
      console.error("Submission error:", err);
      alert("Submission failed. Check console.");
    }
  };

  const submitBatch = async (values, { resetForm }) => {
    // Build canonical entries (expand ingredient id -> name if possible)
    const items = (values.items || []).map((it) => {
      const selectedOpt = ingredients.find((i) => String(i.id) === String(it.ingredient)) || null;
      return {
        ...it,
        ingredient: selectedOpt ? selectedOpt.name : it.ingredient,
        ingredientId: selectedOpt ? String(selectedOpt.id) : null,
      };
    });

    // First try a batch endpoint
    try {
      const res = await fetch(`${API_BASE}/submit/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: items, cognito_id: cognitoId }),
      });

      if (res.ok) {
        resetForm();
        setOpenSnackbar(true);
        return;
      }

      // If the batch endpoint isn't available, fallback to posting each item sequentially to /submit
      console.warn("Batch endpoint returned non-OK, falling back to sequential submits:", res.status);
    } catch (err) {
      console.warn("Batch endpoint failed, falling back to sequential submits:", err);
    }

    // fallback: sequentially submit each item to /submit
    try {
      for (const it of items) {
        const payload = { ...it, cognito_id: cognitoId };
        const r = await fetch(`${API_BASE}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!r.ok) {
          console.error("Failed to submit item in fallback:", await r.text().catch(() => r.status));
          // continue attempting others, but report in console
        }
      }
      resetForm();
      setOpenSnackbar(true);
    } catch (err) {
      console.error("[submitBatch] fallback submission error:", err);
      alert("Batch submission failed. Check console.");
    }
  };

  // Helper to open confirmation dialog for multiple after validating form
  const openBatchConfirmDialog = async ({ validateForm, values, setTouched, resetForm }) => {
    const errors = await validateForm();
    if (errors && Object.keys(errors).length) {
      // mark all fields as touched to show errors
      const touchedItems = (values.items || []).map(() => ({
        date: true,
        ingredient: true,
        stockReceived: true,
        unit: true,
        barCode: true,
        expiryDate: true,
        temperature: true,
      }));
      setTouched({ items: touchedItems }, false);
      return;
    }

    // set preview items and keep resetForm reference for final submit
    setBatchPreviewItems(values.items || []);
    setBatchResetFormFn(() => resetForm);
    setBatchConfirmOpen(true);
  };

  const handleConfirmBatchSubmit = async () => {
    if (!batchPreviewItems || batchPreviewItems.length === 0) {
      setBatchConfirmOpen(false);
      return;
    }
    setBatchSubmitting(true);

    try {
      await submitBatch({ items: batchPreviewItems }, { resetForm: batchResetFormFn || (() => {}) });
      setBatchConfirmOpen(false);
      setBatchPreviewItems([]);
    } catch (err) {
      console.error("Batch confirm submit error:", err);
      alert("Batch submit failed. See console.");
    } finally {
      setBatchSubmitting(false);
    }
  };

  return (
    <Box m="20px">
      <Paper
        elevation={0}
        sx={{
          mt: 2,
          p: { xs: 2, sm: 3 },
          pb: tabIndex === 1 ? "140px" : undefined, // reserve bottom space when Multiple is active so FAB won't cover submit
          borderRadius: 16,
          border: `1px solid ${brand.border}`,
          background: brand.surface,
          boxShadow: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)",
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: brand.text }}>
              Record Goods In
            </Typography>
            <Typography variant="body2" sx={{ color: brand.subtext }}>
              Fill out the details below and hit Record (single) or add multiple goods in Multiple.
            </Typography>
          </Box>

          {/* Tabs for Single / Multiple */}
          <Tabs
            value={tabIndex}
            onChange={(_, v) => setTabIndex(v)}
            sx={{ "& .MuiTab-root": { textTransform: "none", fontWeight: 700 } }}
          >
            <Tab label="Single" />
            <Tab label="Multiple" />
          </Tabs>
        </Box>

        {/* Single item form (original) */}
        {tabIndex === 0 && (
          <Formik onSubmit={submitSingle} initialValues={initialValuesSingle} validationSchema={goodsInSchema}>
            {({
              values,
              errors,
              touched,
              handleBlur,
              handleChange,
              handleSubmit,
              setFieldValue,
            }) => {
              const selected = ingredients.find((i) => String(i.id) === String(values.ingredient)) || null;

              return (
                <form onSubmit={handleSubmit}>
                  <Box
                    display="grid"
                    gap="20px"
                    gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                    sx={{ "& > div": { gridColumn: isNonMobile ? undefined : "span 4" } }}
                  >
                    {/* Date */}
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
                    />

                    {/* Ingredient */}
                    <Box sx={{ gridColumn: "span 2" }}>
                      <Autocomplete
                        options={ingredients}
                        getOptionLabel={(opt) => (typeof opt === "string" ? opt : opt?.name ?? "")}
                        loading={loadingMaster || loadingCustom}
                        value={selected}
                        onChange={(_, newVal) => setFieldValue("ingredient", newVal ? newVal.id : "")}
                        isOptionEqualToValue={(opt, val) => (opt?.id ?? opt) === (val?.id ?? val)}
                        filterSelectedOptions
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Ingredient"
                            name="ingredient"
                            onBlur={handleBlur}
                            error={!!touched.ingredient && !!errors.ingredient}
                            helperText={touched.ingredient && errors.ingredient}
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {(loadingMaster || loadingCustom) && <CircularProgress color="inherit" size={20} />}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
                            sx={inputSx}
                          />
                        )}
                      />
                      <Box textAlign="right" mt={1}>
                        <Button
                          size="small"
                          onClick={openAddDialog}
                          sx={{
                            textTransform: "none",
                            fontWeight: 700,
                            color: brand.primary,
                            "&:hover": { color: brand.primaryDark, bgColor: "transparent" },
                          }}
                        >
                          Add Ingredient +
                        </Button>
                      </Box>
                    </Box>

                    {/* Stock Received */}
                    <TextField
                      fullWidth
                      variant="outlined"
                      type="number"
                      label="Stock Received"
                      name="stockReceived"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.stockReceived}
                      error={!!touched.stockReceived && !!errors.stockReceived}
                      helperText={touched.stockReceived && errors.stockReceived}
                      sx={{ gridColumn: "span 1", ...inputSx }}
                    />

                    {/* Unit */}
                    <FormControl fullWidth sx={{ gridColumn: "span 1", ...selectSx }}>
                      <InputLabel id="unit-label">Metric</InputLabel>
                      <Select labelId="unit-label" name="unit" value={values.unit} label="Metric" onChange={handleChange}>
                        {unitOptions.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {/* Bar Code */}
                    <TextField
                      fullWidth
                      variant="outlined"
                      type="text"
                      label="Bar Code"
                      name="barCode"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.barCode}
                      error={!!touched.barCode && !!errors.barCode}
                      helperText={touched.barCode && errors.barCode}
                      sx={{ gridColumn: "span 2", ...inputSx }}
                    />

                    {/* Expiry Date */}
                    <TextField
                      fullWidth
                      variant="outlined"
                      type="date"
                      label="Expiry Date"
                      name="expiryDate"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.expiryDate}
                      error={!!touched.expiryDate && !!errors.expiryDate}
                      helperText={touched.expiryDate && errors.expiryDate}
                      sx={{ gridColumn: "span 2", ...inputSx }}
                    />

                    {/* Temperature */}
                    <TextField
                      fullWidth
                      variant="outlined"
                      type="text"
                      label="Temperature (℃)"
                      name="temperature"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.temperature}
                      error={!!touched.temperature && !!errors.temperature}
                      helperText={touched.temperature && errors.temperature}
                      sx={{ gridColumn: "span 2", ...inputSx }}
                    />
                  </Box>

                  {/* Primary action: FAB aligned to the right */}
                  <Box display="flex" justifyContent="flex-end" mt={3}>
                    <Fab
                      variant="extended"
                      onClick={handleSubmit}
                      sx={{
                        px: 4,
                        py: 1.25,
                        gap: 1,
                        borderRadius: 999,
                        fontWeight: 800,
                        textTransform: "none",
                        boxShadow: "0 8px 16px rgba(29,78,216,0.25), 0 2px 4px rgba(15,23,42,0.06)",
                        background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`,
                        color: "#fff",
                        "&:hover": { background: `linear-gradient(180deg, ${brand.primaryDark}, ${brand.primaryDark})` },
                      }}
                    >
                      <AddIcon />
                      Record Stock
                    </Fab>
                  </Box>
                </form>
              );
            }}
          </Formik>
        )}

        {/* Multiple form */}
        {tabIndex === 1 && (
          <Formik initialValues={initialValuesBatch} validationSchema={batchSchema} onSubmit={submitBatch}>
            {({ values, errors, touched, validateForm, setTouched, resetForm, setFieldValue }) => (
              <form>
                <FieldArray name="items">
                  {({ push, remove }) => {
                    // expose add-good function so floating FAB can call it regardless of scroll
                    addGoodRef.current = () => push({ ...initialBatchItem });

                    return (
                      <Box>
                        {/* Goods */}
                        <Box display="grid" gap={2}>
                          {(values.items || []).map((it, idx) => {
                            // derive selected option for this row (by id)
                            const selectedOption = ingredients.find((i) => String(i.id) === String(it.ingredient)) || null;

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
                                  <Typography sx={{ fontWeight: 800 }}>Good {idx + 1}</Typography>
                                  <Box>
                                    <IconButton
                                      size="small"
                                      onClick={() => remove(idx)}
                                      sx={{ color: brand.primary }}
                                      aria-label={`Remove good ${idx + 1}`}
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </Box>
                                </Box>

                                <Box
                                  display="grid"
                                  gap="12px"
                                  gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                                  sx={{ "& > div": { gridColumn: isNonMobile ? undefined : "span 4" } }}
                                >
                                  <TextField
                                    fullWidth
                                    variant="outlined"
                                    type="date"
                                    label="Date"
                                    name={`items.${idx}.date`}
                                    value={it.date}
                                    onChange={(e) => setFieldValue(`items.${idx}.date`, e.target.value)}
                                    sx={{ gridColumn: "span 2", ...inputSx }}
                                  />

                                  <Box sx={{ gridColumn: "span 2" }}>
                                    <Autocomplete
                                      options={ingredients}
                                      getOptionLabel={(opt) => (typeof opt === "string" ? opt : opt?.name ?? "")}
                                      loading={loadingMaster || loadingCustom}
                                      value={selectedOption}
                                      onChange={(_, newVal) => setFieldValue(`items.${idx}.ingredient`, newVal ? newVal.id : "")}
                                      isOptionEqualToValue={(opt, val) => (opt?.id ?? opt) === (val?.id ?? val)}
                                      filterSelectedOptions
                                      renderInput={(params) => (
                                        <TextField
                                          {...params}
                                          label="Ingredient"
                                          name={`items.${idx}.ingredient`}
                                          InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                              <>
                                                {(loadingMaster || loadingCustom) && <CircularProgress color="inherit" size={20} />}
                                                {params.InputProps.endAdornment}
                                              </>
                                            ),
                                          }}
                                          sx={inputSx}
                                        />
                                      )}
                                    />
                                  </Box>

                                  <TextField
                                    fullWidth
                                    variant="outlined"
                                    type="number"
                                    label="Stock Received"
                                    name={`items.${idx}.stockReceived`}
                                    value={it.stockReceived}
                                    onChange={(e) => setFieldValue(`items.${idx}.stockReceived`, e.target.value)}
                                    sx={{ gridColumn: "span 1", ...inputSx }}
                                  />

                                  <FormControl fullWidth sx={{ gridColumn: "span 1", ...selectSx }}>
                                    <InputLabel id={`unit-label-${idx}`}>Metric</InputLabel>
                                    <Select
                                      labelId={`unit-label-${idx}`}
                                      name={`items.${idx}.unit`}
                                      value={it.unit}
                                      label="Metric"
                                      onChange={(e) => setFieldValue(`items.${idx}.unit`, e.target.value)}
                                    >
                                      {unitOptions.map((opt) => (
                                        <MenuItem key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>

                                  <TextField
                                    fullWidth
                                    variant="outlined"
                                    type="text"
                                    label="Bar Code"
                                    name={`items.${idx}.barCode`}
                                    value={it.barCode}
                                    onChange={(e) => setFieldValue(`items.${idx}.barCode`, e.target.value)}
                                    sx={{ gridColumn: "span 2", ...inputSx }}
                                  />

                                  <TextField
                                    fullWidth
                                    variant="outlined"
                                    type="date"
                                    label="Expiry Date"
                                    name={`items.${idx}.expiryDate`}
                                    value={it.expiryDate}
                                    onChange={(e) => setFieldValue(`items.${idx}.expiryDate`, e.target.value)}
                                    sx={{ gridColumn: "span 2", ...inputSx }}
                                  />

                                  <TextField
                                    fullWidth
                                    variant="outlined"
                                    type="text"
                                    label="Temperature (℃)"
                                    name={`items.${idx}.temperature`}
                                    value={it.temperature}
                                    onChange={(e) => setFieldValue(`items.${idx}.temperature`, e.target.value)}
                                    sx={{ gridColumn: "span 2", ...inputSx }}
                                  />
                                </Box>
                              </Paper>
                            );
                          })}
                        </Box>

                        {/* Multiple submit (opens confirmation dialog after validate) */}
                        <Box display="flex" justifyContent="flex-end" mt={3} sx={{ mb: 2 }}>
                          <Fab
                            variant="extended"
                            onClick={() =>
                              openBatchConfirmDialog({ validateForm, values, setTouched, resetForm })
                            }
                            sx={{
                              px: 4,
                              py: 1.25,
                              gap: 1,
                              borderRadius: 999,
                              fontWeight: 800,
                              textTransform: "none",
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

      {/* Floating Add Good FAB (visible only on Multiple tab) */}
      {tabIndex === 1 && (
        <Box
          sx={{
            position: "fixed",
            right: 18,
            top: "50%",                 // vertically centered to avoid bottom overlap
            transform: "translateY(-50%)",
            zIndex: 1400,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Fab
            onClick={() => addGoodRef.current && addGoodRef.current()}
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
            aria-label="Add good"
            size="medium"
            variant="extended"
          >
            <AddIcon sx={{ mr: 1 }} />
            Add Good
          </Fab>
        </Box>
      )}

      {/* Multiple confirmation dialog */}
      <Dialog
        open={batchConfirmOpen}
        onClose={() => setBatchConfirmOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 14,
            border: `1px solid ${brand.border}`,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: brand.text }}>Confirm Multiple Submission</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ color: brand.subtext, mb: 2 }}>
            You're about to submit <strong>{batchPreviewItems.length}</strong> good(s). Review them below and confirm to proceed.
          </Typography>

          <Table size="small" aria-label="batch-summary">
            <TableHead>
              <TableRow sx={{ background: brand.surfaceMuted }}>
                <TableCell sx={{ fontWeight: 800 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Ingredient</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Quantity</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Unit</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Barcode</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Expiry</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Temp</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {batchPreviewItems.map((it, i) => (
                <TableRow key={i}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{String(it.ingredient || "—")}</TableCell>
                  <TableCell>{String(it.stockReceived ?? "—")}</TableCell>
                  <TableCell>{String(it.unit ?? "—")}</TableCell>
                  <TableCell>{String(it.barCode ?? "—")}</TableCell>
                  <TableCell>{String(it.expiryDate ?? "—")}</TableCell>
                  <TableCell>{String(it.temperature ?? "—")}</TableCell>
                  <TableCell>{String(it.date ?? "—")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setBatchConfirmOpen(false)}
            sx={{ textTransform: "none", fontWeight: 700 }}
            disabled={batchSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmBatchSubmit}
            sx={{
              textTransform: "none",
              fontWeight: 800,
              borderRadius: 999,
              px: 2,
              color: "#fff",
              background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`,
              "&:hover": { background: brand.primaryDark },
            }}
            startIcon={batchSubmitting ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : null}
            disabled={batchSubmitting}
          >
            {batchSubmitting ? "Submitting…" : "Confirm & Submit"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity="success"
          sx={{
            fontWeight: 700,
            borderRadius: 2,
            "& .MuiAlert-icon": { color: brand.primary },
          }}
        >
          Stock has been successfully recorded!
        </Alert>
      </Snackbar>

      {/* Add Ingredient Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={closeAddDialog}
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 14,
            border: `1px solid ${brand.border}`,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: brand.text }}>Add New Ingredient</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Ingredient Name"
            fullWidth
            value={newIngredient}
            onChange={(e) => setNewIngredient(e.target.value)}
            sx={inputSx}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeAddDialog} disabled={adding} sx={{ textTransform: "none", fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            onClick={handleAddIngredient}
            disabled={adding}
            variant="contained"
            sx={{
              textTransform: "none",
              fontWeight: 800,
              borderRadius: 999,
              px: 3,
              background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`,
              "&:hover": { background: brand.primaryDark },
            }}
          >
            {adding ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GoodsInForm;
