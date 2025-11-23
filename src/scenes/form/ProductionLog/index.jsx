// src/scenes/form/RecipeProduction/index.jsx
// MUI-styled Production Log with Single / Multiple tabs + ACTIVE-inventory precheck & deficit warning
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react"; // <-- FIX: ADDED useCallback
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

const defaultMultipleLog = {
  recipe: "",
  date: formatDateYMD(new Date()),
  producerName: "",
  logs: [
    { batchesProduced: 1, unitsOfWaste: 0, batchCode: "" },
    { batchesProduced: 1, unitsOfWaste: 0, batchCode: "" },
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

const multipleSchema = yup.object().shape({
  recipe: yup.string().required("Recipe is required"),
  producerName: yup.string().required("Producer is required"),
  date: yup.date().required("Date is required"),
  logs: yup
    .array()
    .of(
      yup.object().shape({
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
  const endpoint = isBatch
    ? `${API_BASE}/production-log/batch`
    : `${API_BASE}/production-log`;

  const body = isBatch
    ? data.map((d) => ({ ...d, cognito_id: cognitoId }))
    : { ...data, cognito_id: cognitoId };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Server returned ${res.status}`);
  }

  return res.json();
};

const getInventory = async (cognitoId, recipe) => {
  const res = await fetch(
    `${API_BASE}/inventory/active?cognito_id=${encodeURIComponent(
      cognitoId
    )}&recipe=${encodeURIComponent(recipe)}`
  );
  if (!res.ok) throw new Error("Failed to fetch inventory");
  const data = await res.json();
  return toNumber(data[0]?.totalUnits ?? 0);
};

// =====================================================================
// MAIN COMPONENT
// =====================================================================

export default function ProductionLogForm({ cognitoId, onSubmitted }) {
  const isMobile = useMediaQuery("(max-width:600px)");
  const [tabValue, setTabValue] = useState(0); // 0 = Single, 1 = Multiple
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Deficit State
  const [deficitOpen, setDeficitOpen] = useState(false);
  const deficitNextRef = useRef(null);
  const deficitInfoRef = useRef({
    recipe: "",
    required: 0,
    available: 0,
    next: null,
  });

  // ===== Fetch Recipes =====
  useEffect(() => {
    if (!cognitoId) return;
    const fetchRecipes = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/recipes?cognito_id=${encodeURIComponent(
            cognitoId
          )}`
        );
        if (!res.ok) throw new Error("Failed to fetch recipes");
        const data = await res.json();
        setRecipes(
          (Array.isArray(data) ? data : []).map(
            (r) => r.recipe_name ?? r.recipe ?? r.name
          )
        );
      } catch (e) {
        console.error("Recipes fetch error:", e);
      }
    };
    fetchRecipes();
  }, [cognitoId]);

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
                    recipes.find((r) => r.name === values.recipe)
                      ?.units_per_batch ?? 0, // Placeholder, actual unit calc done on server
              },
            ]
          : values.logs.map((log) => ({
              ...log,
              recipe: values.recipe,
              date: values.date,
              producerName: values.producerName,
              batchesProduced: toNumber(log.batchesProduced),
              unitsOfWaste: toNumber(log.unitsOfWaste),
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
    [cognitoId, tabValue, onSubmitted, loading, recipes]
  );

  const handleDeficitCheck = useCallback(
    async (values, submitFunc) => {
      if (!values.recipe) {
        submitFunc();
        return;
      }

      setLoading(true);
      try {
        // Fetch current inventory for the recipe
        const availableUnits = await getInventory(
          cognitoId,
          values.recipe
        );

        // Calculate total units needed (unitsOfWaste)
        const totalUnitsOfWaste =
          tabValue === 0
            ? toNumber(values.unitsOfWaste)
            : values.logs.reduce(
                (sum, log) => sum + toNumber(log.unitsOfWaste),
                0
              );

        if (totalUnitsOfWaste > availableUnits) {
          // Deficit detected: open warning modal
          deficitInfoRef.current = {
            recipe: values.recipe,
            required: totalUnitsOfWaste,
            available: availableUnits,
          };
          deficitNextRef.current = submitFunc;
          setDeficitOpen(true);
        } else {
          // No deficit: proceed to submission
          submitFunc();
        }
      } catch (error) {
        console.error("Deficit Check Error:", error);
        alert(`Pre-check failed: ${error.message}`);
      } finally {
        setLoading(false);
      }
    },
    [cognitoId, tabValue]
  );

  // Custom click handler for single submission FAB
  const handleSingleClick = (validateForm, values, setTouched, submitForm) => {
    // 1. Manually mark all fields as touched for validation feedback
    setTouched(
      Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    );

    // 2. Run form validation
    validateForm().then((errors) => {
      if (Object.keys(errors).length === 0) {
        // 3. If valid, run deficit check which then calls submitForm
        handleDeficitCheck(values, submitForm);
      } else {
        // Find and focus the first invalid field
        const firstError = Object.keys(errors)[0];
        document.getElementById(firstError)?.focus();
      }
    });
  };

  // =====================================================================
  // JSX
  // =====================================================================

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
          setFieldValue,
          setTouched,
          validateForm,
          submitForm,
        }) => (
          <>
            {tabValue === 0 ? (
              // =====================================================================
              // TAB 0: SINGLE BATCH FORM
              // =====================================================================
              <form onSubmit={(e) => { e.preventDefault(); /* Submission is handled by FAB onClick */ }}>
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
                    >
                      {recipes.map((recipe) => (
                        <MenuItem key={recipe} value={recipe}>
                          {recipe}
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
                    error={!!touched.producerName && !!errors.producerName}
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
                    // FIX 1: Add type="button" to prevent redundant browser form submission
                    type="button" 
                    onClick={() =>
                      handleSingleClick(
                        validateForm,
                        values,
                        setTouched,
                        formikHandleSubmit // Use formik's own handleSubmit
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
              // TAB 1: MULTIPLE BATCHES FORM
              // =====================================================================
              <form onSubmit={(e) => { e.preventDefault(); handleDeficitCheck(values, formikHandleSubmit); }}>
                <Box
                  display="grid"
                  gap="16px"
                  gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                  mb={3}
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
                    >
                      {recipes.map((recipe) => (
                        <MenuItem key={recipe} value={recipe}>
                          {recipe}
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

                  {/* PRODUCER NAME */}
                  <TextField
                    fullWidth
                    variant="outlined"
                    label="Produced By (Name) *"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.producerName}
                    name="producerName"
                    error={!!touched.producerName && !!errors.producerName}
                    helperText={touched.producerName && errors.producerName}
                    sx={{ gridColumn: "span 4" }}
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
                  Batch Logs:
                </Typography>

                <FieldArray name="logs">
                  {({ push, remove }) => (
                    <>
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
                              "& .MuiTableCell-head": { fontWeight: 800 },
                            }}
                          >
                            <TableCell>Batches Produced *</TableCell>
                            <TableCell>Units of Waste *</TableCell>
                            <TableCell>Batch Code (Optional)</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {values.logs.map((log, index) => {
                            const batchesProducedPath = `logs[${index}].batchesProduced`;
                            const unitsOfWastePath = `logs[${index}].unitsOfWaste`;
                            const batchCodePath = `logs[${index}].batchCode`;

                            return (
                              <TableRow
                                key={index}
                                sx={{
                                  "&:nth-of-type(odd)": { bgcolor: "#fff" },
                                  "&:nth-of-type(even)": { bgcolor: "#f8fafc" },
                                }}
                              >
                                <TableCell>
                                  <TextField
                                    size="small"
                                    type="number"
                                    name={batchesProducedPath}
                                    value={log.batchesProduced}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={
                                      !!getIn(touched, batchesProducedPath) &&
                                      !!getIn(errors, batchesProducedPath)
                                    }
                                    helperText={
                                      getIn(touched, batchesProducedPath) &&
                                      getIn(errors, batchesProducedPath)
                                    }
                                    sx={{ minWidth: 120 }}
                                  />
                                </TableCell>
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
                        Add Another Batch
                      </Button>
                    </>
                  )}
                </FieldArray>

                {/* MULTIPLE SUBMIT BUTTON */}
                <Box display="flex" justifyContent="flex-end" mt={3}>
                  <Fab
                    variant="extended"
                    type="submit" // Submission is handled by form submission -> deficit check -> formikHandleSubmit
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

            {/* ERROR ALERT (for multiple tab errors not tied to a field) */}
            {tabValue === 1 &&
              !!(touched.logs && errors.logs) &&
              typeof errors.logs === "string" && (
                <Alert
                  severity="error"
                  sx={{ mt: 2, fontWeight: 700, borderRadius: 2 }}
                >
                  {errors.logs}
                </Alert>
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
            The production log records a total of{" "}
            <strong style={{ color: brand.danger }}>
              {deficitInfoRef.current.required} units of waste
            </strong>{" "}
            for recipe "{deficitInfoRef.current.recipe}".
          </Alert>
          <Alert
            severity="info"
            sx={{ fontWeight: 700, borderRadius: 2, mt: 2 }}
          >
            Only{" "}
            <strong style={{ color: brand.info }}>
              {deficitInfoRef.current.available} units
            </strong>{" "}
            of this recipe are currently in stock. Proceeding will allow stock
            to go negative.
          </Alert>
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