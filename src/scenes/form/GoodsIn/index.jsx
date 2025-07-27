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
  DialogActions
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "../../../components/Header";
import AddIcon from "@mui/icons-material/Add";
import { useAuth } from "../../../contexts/AuthContext";

const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

const unitOptions = [
  { value: "grams", label: "Grams (g)" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "units", label: "Units" },
];

const GoodsInForm = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const { cognitoId } = useAuth();

  // Master vs custom lists
  const [masterIngredients, setMasterIngredients] = useState([]);
  const [customIngredients, setCustomIngredients] = useState([]);
  const [loadingMaster, setLoadingMaster] = useState(false);
  const [loadingCustom, setLoadingCustom] = useState(false);

  // Combined array for dropdown
  const ingredients = useMemo(
    () => [
      ...masterIngredients.map(i => ({ ...i, source: "master" })),
      ...customIngredients.map(i => ({ ...i, source: "custom" }))
    ],
    [masterIngredients, customIngredients]
  );

  // Snackbar
  const [openSnackbar, setOpenSnackbar] = useState(false);

  // Add‑ingredient dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newIngredient, setNewIngredient] = useState("");
  const [adding, setAdding] = useState(false);

  // Fetch global master list
  useEffect(() => {
    if (!cognitoId) return;
    setLoadingMaster(true);
    fetch(`${API_BASE}/ingredients?cognito_id=${cognitoId}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch ingredients");
        return res.json();
      })
      .then(data => setMasterIngredients(data))
      .catch(err => console.error("Error fetching master:", err))
      .finally(() => setLoadingMaster(false));
  }, [cognitoId]);

  // Fetch per‑user custom list
  useEffect(() => {
    if (!cognitoId) return;
    setLoadingCustom(true);
    fetch(`${API_BASE}/custom-ingredients?cognito_id=${cognitoId}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch custom ingredients");
        return res.json();
      })
      .then(data =>
        setCustomIngredients(
          data.map(ci => ({ id: `c-${ci.id}`, name: ci.name }))
        )
      )
      .catch(err => console.error("Error fetching custom:", err))
      .finally(() => setLoadingCustom(false));
  }, [cognitoId]);

  // Dialog handlers
  const openAddDialog = () => {
    setNewIngredient("");
    setAddDialogOpen(true);
  };
  const closeAddDialog = () => setAddDialogOpen(false);

  const handleAddIngredient = async () => {
    if (!newIngredient.trim() || !cognitoId) return;
    setAdding(true);
    try {
      const response = await fetch(
        `${API_BASE}/custom-ingredients`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newIngredient.trim(),
            cognito_id: cognitoId
          }),
        }
      );
      if (!response.ok) throw new Error("Failed to add ingredient");
      // refresh custom list only
      const updated = await fetch(
        `${API_BASE}/custom-ingredients?cognito_id=${cognitoId}`
      ).then(r => r.json());
      setCustomIngredients(updated.map(ci => ({ id: `c-${ci.id}`, name: ci.name })));
      closeAddDialog();
    } catch (err) {
      console.error("Error adding custom ingredient:", err);
      alert("Failed to add ingredient");
    } finally {
      setAdding(false);
    }
  };

  // Form submission
  const handleFormSubmit = async (values, { resetForm }) => {
    const payload = { ...values, cognito_id: cognitoId };
    try {
      const res = await fetch(
        `${API_BASE}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error("Submit failed");
      resetForm();
      setOpenSnackbar(true);
    } catch (err) {
      console.error("Submission error:", err);
      alert("Submission failed. Check console.");
    }
  };

  // Validation schema
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

  // Initial form values
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
      <Header title="GOODS IN" subtitle="Record Stock Movement (Goods In)" />

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
          setFieldValue
        }) => {
          const selected = ingredients.find(i => i.id === values.ingredient) || null;

          return (
            <form onSubmit={handleSubmit}>
              <Box
                display="grid"
                gap="30px"
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
                  sx={{ gridColumn: "span 2" }}
                />

                {/* Ingredient dropdown */}
                <Box sx={{ gridColumn: "span 2" }}>
                  <Autocomplete
                    options={ingredients}
                    getOptionLabel={opt => opt.name}
                    loading={loadingMaster || loadingCustom}
                    value={selected}
                    onChange={(_, newVal) =>
                      setFieldValue("ingredient", newVal ? newVal.id : "")
                    }
                    openOnFocus={false}
                    filterSelectedOptions
                    renderInput={params => (
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
                          )
                        }}
                        sx={{ width: "100%" }}
                      />
                    )}
                  />
                  {/* Moved the add button back outside the dropdown */}
                  <Box textAlign="right" mt={1}>
                    <Button size="small" onClick={openAddDialog}>
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
                  sx={{ gridColumn: "span 1" }}
                />

                {/* Unit */}
                <FormControl fullWidth sx={{ gridColumn: "span 1" }}>
                  <InputLabel id="unit-label">Metric</InputLabel>
                  <Select
                    labelId="unit-label"
                    name="unit"
                    value={values.unit}
                    label="Metric"
                    onChange={handleChange}
                  >
                    {unitOptions.map(opt => (
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
                  sx={{ gridColumn: "span 2" }}
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
                  sx={{ gridColumn: "span 2" }}
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
                  sx={{ gridColumn: "span 2" }}
                />
              </Box>

              <Box display="flex" justifyContent="center" mt="20px">
                <Fab color="secondary" onClick={handleSubmit}>
                  <AddIcon fontSize="large" />
                </Fab>
              </Box>
            </form>
          );
        }}
      </Formik>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={() => setOpenSnackbar(false)} severity="success">
          Stock has been successfully recorded!
        </Alert>
      </Snackbar>

      {/* Add Ingredient Dialog */}
      <Dialog open={addDialogOpen} onClose={closeAddDialog} fullWidth>
        <DialogTitle>Add New Ingredient</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Ingredient Name"
            fullWidth
            value={newIngredient}
            onChange={e => setNewIngredient(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAddDialog} disabled={adding}>
            Cancel
          </Button>
          <Button onClick={handleAddIngredient} disabled={adding}>
            {adding ? <CircularProgress size={20} /> : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GoodsInForm;
