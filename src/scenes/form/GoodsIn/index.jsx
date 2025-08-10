// src/scenes/form/GoodsIn/index.jsx
import React, { useState, useEffect, useMemo } from "react";
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
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "../../components/Header";
import AddIcon from "@mui/icons-material/Add";
import { useAuth } from "../../../contexts/AuthContext";

const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

/**
 * Visual theme tokens for a Nory-like style:
 * - Clean white card, soft shadow, 16px+ radii
 * - Neutral slate text, subtle gray borders
 * - Vivid primary blue button with slight gradient and pill shape
 */
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

  // form submit
  const handleFormSubmit = async (values, { resetForm }) => {
    const payload = { ...values, cognito_id: cognitoId };
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

  // validation
  const goodsInSchema = yup.object().shape({
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

  const initialValues = {
    date: new Date().toISOString().split("T")[0],
    ingredient: "",
    stockReceived: "",
    unit: "grams",
    barCode: "",
    expiryDate: new Date().toISOString().split("T")[0],
    temperature: "N/A",
  };

  return (
    <Box m="20px">
      {/* Card container for a clean, app-like surface */}
      <Paper
        elevation={0}
        sx={{
          mt: 2,
          p: { xs: 2, sm: 3 },
          borderRadius: 16,
          border: `1px solid ${brand.border}`,
          background: brand.surface,
          boxShadow:
            "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)",
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: 800, color: brand.text, mb: 1 }}
        >
          Record Goods In
        </Typography>
        <Typography variant="body2" sx={{ color: brand.subtext, mb: 3 }}>
          Fill out the details below and hit Record.
        </Typography>

        <Formik
          onSubmit={handleFormSubmit}
          initialValues={initialValues}
          validationSchema={goodsInSchema}
        >
          {({
            values,
            errors,
            touched,
            handleBlur,
            handleChange,
            handleSubmit,
            setFieldValue,
          }) => {
            const selected =
              ingredients.find((i) => i.id === values.ingredient) || null;

            return (
              <form onSubmit={handleSubmit}>
                <Box
                  display="grid"
                  gap="20px"
                  gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                  sx={{
                    "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
                  }}
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
                      getOptionLabel={(opt) => opt.name}
                      loading={loadingMaster || loadingCustom}
                      value={selected}
                      onChange={(_, newVal) =>
                        setFieldValue("ingredient", newVal ? newVal.id : "")
                      }
                      openOnFocus={false}
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
                                {(loadingMaster || loadingCustom) && (
                                  <CircularProgress color="inherit" size={20} />
                                )}
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
                    <Select
                      labelId="unit-label"
                      name="unit"
                      value={values.unit}
                      label="Metric"
                      onChange={handleChange}
                    >
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

                {/* Primary action: Extended FAB styled as a pill primary button */}
                <Box display="flex" justifyContent="center" mt={3}>
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
                      boxShadow:
                        "0 8px 16px rgba(29,78,216,0.25), 0 2px 4px rgba(15,23,42,0.06)",
                      background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`,
                      color: "#fff",
                      "&:hover": {
                        background: `linear-gradient(180deg, ${brand.primaryDark}, ${brand.primaryDark})`,
                      },
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
      </Paper>

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
        <DialogTitle sx={{ fontWeight: 800, color: brand.text }}>
          Add New Ingredient
        </DialogTitle>
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
          <Button
            onClick={closeAddDialog}
            disabled={adding}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
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
