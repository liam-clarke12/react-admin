// src/scenes/form/ProductionLog/index.jsx
// MUI-styled Production Log with Single / Multiple tabs + ACTIVE-inventory precheck & deficit warning
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
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

const API_BASE =
  "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

const brand = {
  text: "#0f172a",
  subtext: "#334155",
  border: "#e5e7eb",
  surface: "#ffffff",
  primary: "#7C3AED",
  primaryDark: "#5B21B6",
  danger: "#dc2626",
  dangerSoft: "#fecaca",
  info: "#3b82f6",
  infoSoft: "#bfdbfe",
};

// =====================================================================
// UTILS & SCHEMAS
// =====================================================================

const toNumber = (v) =>
  v === "" || v === null || v === undefined ? 0 : Number(v) || 0;

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

const defaultSingleLog = {
  recipe: "",
  date: formatDateYMD(new Date()),
  batchesProduced: 1,
  unitsOfWaste: 0,
  producerName: "",
  batchCode: "",
};

// Multiple tab: each row has its own recipe
const defaultMultipleLog = {
  date: formatDateYMD(new Date()),
  producerName: "",
  logs: [
    { recipe: "", batchesProduced: 1, unitsOfWaste: 0, batchCode: "" },
    { recipe: "", batchesProduced: 1, unitsOfWaste: 0, batchCode: "" },
  ],
};

const singleSchema = yup.object().shape({
  recipe: yup.string().required("Recipe is required"),
  batchesProduced: yup
    .number()
    .min(1, "Must be at least 1")
    .required("Required"),
  unitsOfWaste: yup.number().min(0, "Cannot be negative").required("Required"),
  producerName: yup.string().required("Producer is required"),
  date: yup.date().required("Date is required"),
});

// Multiple schema: recipe per row
const multipleSchema = yup.object().shape({
  producerName: yup.string().required("Producer is required"),
  date: yup.date().required("Date is required"),
  logs: yup
    .array()
    .of(
      yup.object().shape({
        recipe: yup.string().required("Recipe is required"),
        batchesProduced: yup
          .number()
          .min(1, "Must be at least 1")
          .required("Required"),
        unitsOfWaste: yup
          .number()
          .min(0, "Cannot be negative")
          .required("Required"),
      })
    )
    .min(1, "Must have at least one batch"),
});

// =====================================================================
// API FUNCTIONS
// =====================================================================

const postProductionLog = async (data, cognitoId, isBatch = false) => {
  // Match your Express routes:
  // app.post("/api/add-production-log", ...)
  // app.post("/api/add-production-log/batch", ...)
  const endpoint = isBatch
    ? `${API_BASE}/add-production-log/batch`
    : `${API_BASE}/add-production-log`;

  // Match your Express body shape
  const body = isBatch
    ? {
        entries: data, // array of entries for batch route
        cognito_id: cognitoId,
      }
    : {
        ...data, // single-entry fields for single route
        cognito_id: cognitoId,
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
    } catch (e) {
      // ignore parse error
    }
    throw new Error(message);
  }

  return res.json();
};

// INGREDIENT INVENTORY FUNCTIONS
const getRecipeIngredients = async (cognitoId) => {
  const res = await fetch(
    `${API_BASE}/recipes?cognito_id=${encodeURIComponent(cognitoId)}`
  );
  if (!res.ok) throw new Error("Failed to fetch recipes");
  return await res.json();
};

const getIngredientStock = async (cognitoId) => {
  const res = await fetch(
    `${API_BASE}/ingredient-inventory/active?cognito_id=${encodeURIComponent(
      cognitoId
    )}`
  );
  if (!res.ok) throw new Error("Failed to fetch ingredient stock");
  return await res.json();
};

// =====================================================================
// MAIN COMPONENT
// =====================================================================

export default function ProductionLogForm({ cognitoId, onSubmitted }) {
  const isMobile = useMediaQuery("(max-width:600px)");
  const [tabValue, setTabValue] = useState(0); // 0 = Single, 1 = Multiple
  const [openSnackbar, setOpenSnackbar] = useState(false);

  // recipes state now stores objects { name, units_per_batch } instead of just strings
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Deficit State
  const [deficitOpen, setDeficitOpen] = useState(false);
  const deficitNextRef = useRef(null);
  const deficitInfoRef = useRef({
    recipe: "",
    deficits: [],
  });

  // ===== Fetch Recipes =====
  useEffect(() => {
    if (!cognitoId) return;
    const fetchRecipes = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/recipes?cognito_id=${encodeURIComponent(cognitoId)}`
        );
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
      }
    };
    fetchRecipes();
  }, [cognitoId]);

  // Utility to find the units per batch for a selected recipe name
  const getUnitsPerBatch = useCallback(
    (recipeName) =>
      recipes.find((r) => r.name === recipeName)?.units_per_batch ?? 0,
    [recipes]
  );

  // ===== Submission Handlers =====

  const handleSubmit = useCallback(
    async (values, { resetForm }) => {
      if (loading) return;
      setLoading(true);

      const logsToPost =
        tabValue === 0
          ? [
              {
                ...values,
                batchesProduced: toNumber(values.batchesProduced),
                unitsOfWaste: toNumber(values.unitsOfWaste),
                unitsRemaining:
                  toNumber(values.batchesProduced) *
                    getUnitsPerBatch(values.recipe) -
                  toNumber(values.unitsOfWaste),
              },
            ]
          : (values.logs ?? []).map((log) => ({
              date: values.date,
              producerName: values.producerName,
              recipe: log.recipe,
              batchesProduced: toNumber(log.batchesProduced),
              unitsOfWaste: toNumber(log.unitsOfWaste),
              batchCode: log.batchCode,
              unitsRemaining:
                toNumber(log.batchesProduced) *
                  getUnitsPerBatch(log.recipe) -
                toNumber(log.unitsOfWaste),
            }));

      try {
        await postProductionLog(
          tabValue === 0 ? logsToPost[0] : logsToPost,
          cognitoId,
          tabValue === 1
        );
        setOpenSnackbar(true);
        resetForm({
          values: tabValue === 0 ? defaultSingleLog : defaultMultipleLog,
        });
        if (onSubmitted) onSubmitted();
      } catch (e) {
        console.error("Submission error:", e);
        alert(`Submission failed: ${e.message}`);
      } finally {
        setLoading(false);
      }
    },
    [cognitoId, tabValue, onSubmitted, loading, getUnitsPerBatch]
  );

  // =====================================================================
  // handleDeficitCheck – supports single recipe OR many recipes in Multiple tab
  // =====================================================================
  const handleDeficitCheck = useCallback(
    async (values, submitFunc) => {
      // For Single tab, if no recipe selected, just submit
      if (tabValue === 0 && !values.recipe) {
        submitFunc();
        return;
      }

      setLoading(true);
      try {
        const recipeIngredients = await getRecipeIngredients(cognitoId);
        const stock = await getIngredientStock(cognitoId);

        // Aggregate requirements per ingredient+unit
        const requirementsMap = new Map(); // key: `${ingredient}||${unit}` -> { ingredient, unit, required }

        const addRequirement = (ingredient, unit, amount) => {
          const key = `${ingredient}||${unit}`;
          const existing = requirementsMap.get(key) || {
            ingredient,
            unit,
            required: 0,
          };
          existing.required += amount;
          requirementsMap.set(key, existing);
        };

        if (tabValue === 0) {
          // Single tab: one recipe, one batchesProduced field
          const recipeRows = recipeIngredients.filter(
            (r) =>
              (r.recipe_name ?? r.recipe ?? r.name) === values.recipe
          );
          const totalBatches = toNumber(values.batchesProduced);

          recipeRows.forEach((req) => {
            addRequirement(
              req.ingredient,
              req.unit,
              toNumber(req.quantity) * totalBatches
            );
          });
        } else {
          // Multiple tab: each log has its own recipe & batchesProduced
          (values.logs ?? []).forEach((log) => {
            const recipeName = log.recipe;
            if (!recipeName) return; // validation should catch but just in case

            const recipeRows = recipeIngredients.filter(
              (r) =>
                (r.recipe_name ?? r.recipe ?? r.name) === recipeName
            );
            const batches = toNumber(log.batchesProduced);

            recipeRows.forEach((req) => {
              addRequirement(
                req.ingredient,
                req.unit,
                toNumber(req.quantity) * batches
              );
            });
          });
        }

        const deficits = [];
        for (const { ingredient, unit, required } of requirementsMap.values()) {
          const match = stock.find(
            (s) => s.ingredient === ingredient && s.unit === unit
          );
          const available = toNumber(match?.totalRemaining ?? 0);
          if (required > available) {
            deficits.push({
              ingredient,
              unit,
              required,
              available,
              missing: required - available,
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
        alert(`Ingredient check failed: ${error.message}`);
      } finally {
        setLoading(false);
      }
    },
    [cognitoId, tabValue]
  );

  // =====================================================================
  // handleSingleClick
  // =====================================================================
  const handleSingleClick = useCallback(
    (validateForm, values, setTouched, submitForm) => {
      setTouched(
        Object.keys(values).reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {}
        )
      );

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
    [handleDeficitCheck]
  );

  return (
    <Paper elevation={0} sx={{ p: isMobile ? 1 : 2, mb: 3 }}>
      <Tabs
        value={tabValue}
        onChange={(e, newValue) => setTabValue(newValue)}
        sx={{ mb: 2 }}
      >
        <Tab label="Record Single Batch" />
        <Tab label="Record Multiple Batches" />
      </Tabs>

      <Formik
        initialValues={tabValue === 0 ? defaultSingleLog : defaultMultipleLog}
        validationSchema={tabValue === 0 ? singleSchema : multipleSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({
          values,
          errors,
          touched,
          handleBlur,
          handleChange,
          handleSubmit: formikHandleSubmit,
          setTouched,
          validateForm,
        }) => (
          <>
            {tabValue === 0 ? (
              // =====================================================================
              // TAB 0: SINGLE BATCH FORM
              // =====================================================================
              <form
                onSubmit={(e) => {
                  e.preventDefault(); // handled via FAB
                }}
              >
                <Box
                  display="grid"
                  gap="16px"
                  gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                >
                  {/* RECIPE */}
                  <FormControl
                    fullWidth
                    variant="outlined"
                    sx={{ gridColumn: isMobile ? "span 4" : "span 2" }}
                  >
                    <InputLabel id="recipe-label">Recipe *</InputLabel>
                    <Select
                      labelId="recipe-label"
                      id="recipe"
                      name="recipe"
                      value={values.recipe}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      label="Recipe *"
                      error={!!touched.recipe && !!errors.recipe}
                      MenuProps={{
                        disablePortal: false,
                        anchorOrigin: {
                          vertical: "bottom",
                          horizontal: "left",
                        },
                        transformOrigin: {
                          vertical: "top",
                          horizontal: "left",
                        },
                        PaperProps: {
                          style: { zIndex: 300000, position: "absolute" },
                        },
                      }}
                    >
                      {recipes.map((recipe) => (
                        <MenuItem key={recipe.name} value={recipe.name}>
                          {recipe.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {!!touched.recipe && !!errors.recipe && (
                      <Typography variant="caption" color="error">
                        {errors.recipe}
                      </Typography>
                    )}
                  </FormControl>

                  {/* DATE */}
                  <TextField
                    fullWidth
                    variant="outlined"
                    type="date"
                    label="Date *"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.date}
                    name="date"
                    error={!!touched.date && !!errors.date}
                    helperText={touched.date && errors.date}
                    sx={{ gridColumn: isMobile ? "span 4" : "span 2" }}
                  />

                  {/* BATCHES PRODUCED */}
                  <TextField
                    fullWidth
                    variant="outlined"
                    type="number"
                    label="Batches Produced *"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.batchesProduced}
                    name="batchesProduced"
                    error={
                      !!touched.batchesProduced && !!errors.batchesProduced
                    }
                    helperText={
                      touched.batchesProduced && errors.batchesProduced
                    }
                    sx={{ gridColumn: isMobile ? "span 4" : "span 1" }}
                  />

                  {/* UNITS OF WASTE */}
                  <TextField
                    fullWidth
                    variant="outlined"
                    type="number"
                    label="Units of Waste *"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.unitsOfWaste}
                    name="unitsOfWaste"
                    error={!!touched.unitsOfWaste && !!errors.unitsOfWaste}
                    helperText={touched.unitsOfWaste && errors.unitsOfWaste}
                    sx={{ gridColumn: isMobile ? "span 4" : "span 1" }}
                  />

                  {/* PRODUCER NAME */}
                  <TextField
                    fullWidth
                    variant="outlined"
                    label="Produced By (Name) *"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.producerName}
                    name="producerName"
                    error={
                      !!touched.producerName && !!errors.producerName
                    }
                    helperText={touched.producerName && errors.producerName}
                    sx={{ gridColumn: isMobile ? "span 4" : "span 2" }}
                  />

                  {/* BATCH CODE */}
                  <TextField
                    fullWidth
                    variant="outlined"
                    label="Batch Code (Optional)"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.batchCode}
                    name="batchCode"
                    sx={{ gridColumn: isMobile ? "span 4" : "span 2" }}
                  />
                </Box>

                {/* SINGLE SUBMIT BUTTON */}
                <Box display="flex" justifyContent="flex-end" mt={3}>
                  <Fab
                    variant="extended"
                    type="button"
                    onClick={() =>
                      handleSingleClick(
                        validateForm,
                        values,
                        setTouched,
                        formikHandleSubmit
                      )
                    }
                    disabled={loading || !cognitoId}
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
                    {loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <AddIcon />
                    )}
                    {loading ? "Processing..." : "Record Production"}
                  </Fab>
                </Box>
              </form>
            ) : (
              // =====================================================================
              // TAB 1: MULTIPLE BATCHES FORM – MULTIPLE RECIPES
              // =====================================================================
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleDeficitCheck(values, formikHandleSubmit);
                }}
              >
                <Box
                  display="grid"
                  gap="16px"
                  gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                  mb={3}
                >
                  {/* DATE */}
                  <TextField
                    fullWidth
                    variant="outlined"
                    type="date"
                    label="Date *"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.date}
                    name="date"
                    error={!!touched.date && !!errors.date}
                    helperText={touched.date && errors.date}
                    sx={{ gridColumn: isMobile ? "span 4" : "span 2" }}
                  />

                  {/* PRODUCER NAME */}
                  <TextField
                    fullWidth
                    variant="outlined"
                    label="Produced By (Name) *"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.producerName}
                    name="producerName"
                    error={
                      !!touched.producerName && !!errors.producerName
                    }
                    helperText={touched.producerName && errors.producerName}
                    sx={{ gridColumn: isMobile ? "span 4" : "span 2" }}
                  />
                </Box>

                <Typography
                  variant="h6"
                  sx={{
                    mb: 1,
                    fontWeight: 800,
                    color: brand.text,
                    fontSize: 14,
                  }}
                >
                  Batch Logs (different recipes allowed):
                </Typography>

                <FieldArray name="logs">
                  {({ push, remove }) => (
                    <>
                      {!!(touched.logs && errors.logs) &&
                        typeof errors.logs === "string" && (
                          <Alert
                            severity="error"
                            sx={{
                              mb: 2,
                              fontWeight: 700,
                              borderRadius: 2,
                            }}
                          >
                            {errors.logs}
                          </Alert>
                        )}

                      <Table
                        size="small"
                        sx={{
                          mb: 2,
                          "& .MuiTableCell-root": {
                            p: 1,
                            borderColor: brand.border,
                          },
                        }}
                      >
                        <TableHead>
                          <TableRow
                            sx={{
                              bgcolor: "#f8fafc",
                              "& .MuiTableCell-head": {
                                fontWeight: 800,
                              },
                            }}
                          >
                            <TableCell>Recipe *</TableCell>
                            <TableCell>Batches Produced *</TableCell>
                            <TableCell>Units of Waste *</TableCell>
                            <TableCell>Batch Code (Optional)</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(values.logs ?? []).map((log, index) => {
                            const recipePath = `logs[${index}].recipe`;
                            const batchesProducedPath = `logs[${index}].batchesProduced`;
                            const unitsOfWastePath = `logs[${index}].unitsOfWaste`;
                            const batchCodePath = `logs[${index}].batchCode`;

                            return (
                              <TableRow
                                key={index}
                                sx={{
                                  "&:nth-of-type(odd)": { bgcolor: "#fff" },
                                  "&:nth-of-type(even)": {
                                    bgcolor: "#f8fafc",
                                  },
                                }}
                              >
                                {/* RECIPE PER ROW */}
                                <TableCell sx={{ minWidth: 180 }}>
                                  <FormControl
                                    fullWidth
                                    size="small"
                                    variant="outlined"
                                  >
                                    <InputLabel id={`recipe-label-${index}`}>
                                      Recipe *
                                    </InputLabel>
                                    <Select
                                      labelId={`recipe-label-${index}`}
                                      name={recipePath}
                                      value={log.recipe || ""}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                      label="Recipe *"
                                      error={
                                        !!getIn(touched, recipePath) &&
                                        !!getIn(errors, recipePath)
                                      }
                                      MenuProps={{
                                        disablePortal: false,
                                        anchorOrigin: {
                                          vertical: "bottom",
                                          horizontal: "left",
                                        },
                                        transformOrigin: {
                                          vertical: "top",
                                          horizontal: "left",
                                        },
                                        PaperProps: {
                                          style: {
                                            zIndex: 300000,
                                            position: "absolute",
                                          },
                                        },
                                      }}
                                    >
                                      {recipes.map((recipe) => (
                                        <MenuItem
                                          key={recipe.name}
                                          value={recipe.name}
                                        >
                                          {recipe.name}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                  {!!getIn(touched, recipePath) &&
                                    !!getIn(errors, recipePath) && (
                                      <Typography
                                        variant="caption"
                                        color="error"
                                      >
                                        {getIn(errors, recipePath)}
                                      </Typography>
                                    )}
                                </TableCell>

                                {/* BATCHES PRODUCED */}
                                <TableCell>
                                  <TextField
                                    size="small"
                                    type="number"
                                    name={batchesProducedPath}
                                    value={log.batchesProduced}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={
                                      !!getIn(
                                        touched,
                                        batchesProducedPath
                                      ) &&
                                      !!getIn(
                                        errors,
                                        batchesProducedPath
                                      )
                                    }
                                    helperText={
                                      getIn(
                                        touched,
                                        batchesProducedPath
                                      ) &&
                                      getIn(
                                        errors,
                                        batchesProducedPath
                                      )
                                    }
                                    sx={{ minWidth: 120 }}
                                  />
                                </TableCell>

                                {/* UNITS OF WASTE */}
                                <TableCell>
                                  <TextField
                                    size="small"
                                    type="number"
                                    name={unitsOfWastePath}
                                    value={log.unitsOfWaste}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={
                                      !!getIn(touched, unitsOfWastePath) &&
                                      !!getIn(errors, unitsOfWastePath)
                                    }
                                    helperText={
                                      getIn(touched, unitsOfWastePath) &&
                                      getIn(errors, unitsOfWastePath)
                                    }
                                    sx={{ minWidth: 120 }}
                                  />
                                </TableCell>

                                {/* BATCH CODE */}
                                <TableCell>
                                  <TextField
                                    size="small"
                                    name={batchCodePath}
                                    value={log.batchCode}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    sx={{ minWidth: 150 }}
                                  />
                                </TableCell>

                                {/* ACTIONS */}
                                <TableCell align="right">
                                  <IconButton
                                    onClick={() => remove(index)}
                                    color="error"
                                    disabled={values.logs.length === 1}
                                    aria-label="Delete batch log"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>

                      <Button
                        onClick={() =>
                          push({
                            recipe: "",
                            batchesProduced: 1,
                            unitsOfWaste: 0,
                            batchCode: "",
                          })
                        }
                        variant="outlined"
                        startIcon={<AddIcon />}
                        sx={{
                          fontWeight: 700,
                          textTransform: "none",
                          borderRadius: 999,
                          borderColor: brand.border,
                          color: brand.text,
                          "&:hover": { borderColor: brand.primary },
                        }}
                      >
                        Add Another Recipe Batch
                      </Button>
                    </>
                  )}
                </FieldArray>

                {/* MULTIPLE SUBMIT BUTTON */}
                <Box display="flex" justifyContent="flex-end" mt={3}>
                  <Fab
                    variant="extended"
                    type="submit"
                    disabled={loading || !cognitoId}
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
                    {loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <AddIcon />
                    )}
                    {loading ? "Processing..." : "Record Production"}
                  </Fab>
                </Box>
              </form>
            )}
          </>
        )}
      </Formik>

      {/* DEFICIT WARNING MODAL */}
      <Dialog
        open={deficitOpen}
        onClose={() => setDeficitOpen(false)}
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 800, color: brand.text }}>
          Inventory Warning
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" sx={{ fontWeight: 700, borderRadius: 2 }}>
            Ingredient shortages for{" "}
            <strong>{deficitInfoRef.current.recipe}</strong>
          </Alert>
          <Table size="small" sx={{ mt: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Ingredient</TableCell>
                <TableCell>Required</TableCell>
                <TableCell>Available</TableCell>
                <TableCell>Missing</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(deficitInfoRef.current.deficits ?? []).map((d, i) => (
                <TableRow key={i}>
                  <TableCell>{d.ingredient}</TableCell>
                  <TableCell>
                    {d.required} {d.unit}
                  </TableCell>
                  <TableCell>
                    {d.available} {d.unit}
                  </TableCell>
                  <TableCell sx={{ color: brand.danger }}>
                    {d.missing} {d.unit}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeficitOpen(false)}
            sx={{ fontWeight: 700 }}
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
              fontWeight: 800,
              borderRadius: 999,
              px: 2,
              color: "#fff",
              background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`,
              "&:hover": { background: brand.primaryDark },
            }}
          >
            Proceed Anyway
          </Button>
        </DialogActions>
      </Dialog>

      {/* SUCCESS TOAST */}
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
          Production recorded successfully!
        </Alert>
      </Snackbar>
    </Paper>
  );
}
