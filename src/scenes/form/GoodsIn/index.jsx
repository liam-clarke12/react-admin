// src/scenes/form/GoodsIn/index.jsx
import React, { useState, useEffect } from "react";
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
  FormHelperText,
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

const unitOptions = [
  { value: "grams", label: "Grams (g)" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "units", label: "Units" },
];

const GoodsInForm = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const { cognitoId } = useAuth();
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [ingredients, setIngredients] = useState([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);

  // State for add-ingredient dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newIngredient, setNewIngredient] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchIngredients = () => {
    setLoadingIngredients(true);
    fetch(
      `https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/ingredients`
    )
      .then((res) => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then((data) => setIngredients(data))
      .catch((err) => console.error("Error loading ingredients:", err))
      .finally(() => setLoadingIngredients(false));
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  // Handlers for add-ingredient dialog
  const openAddDialog = () => {
    setNewIngredient("");
    setAddDialogOpen(true);
  };
  const closeAddDialog = () => setAddDialogOpen(false);
  const handleAddIngredient = async () => {
    if (!newIngredient.trim()) return;
    setAdding(true);
    try {
      const response = await fetch(
        "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/ingredients",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newIngredient.trim() }),
        }
      );
      if (!response.ok) throw new Error(`Status ${response.status}`);
      // refresh list
      fetchIngredients();
      closeAddDialog();
    } catch (err) {
      console.error("Error adding ingredient:", err);
      alert("Failed to add ingredient");
    } finally {
      setAdding(false);
    }
  };

  const handleFormSubmit = async (values, { resetForm }) => {
    const payload = { ...values, cognito_id: cognitoId };
    try {
      const response = await fetch(
        "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/submit",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) throw new Error("Failed to submit data");
      resetForm();
      setOpenSnackbar(true);
    } catch (error) {
      console.error("Submission error:", error);
      alert("Submission failed. Check console for details.");
    }
  };

  // Validation Schema
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

  // Initial Values
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
          setFieldValue,
        }) => {
          const selectedIngredient =
            ingredients.find((i) => i.id === values.ingredient) || null;

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
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.date}
                  name="date"
                  error={!!touched.date && !!errors.date}
                  helperText={touched.date && errors.date}
                  sx={{ gridColumn: "span 2" }}
                />

                {/* Ingredient autocomplete */}
                <Box sx={{ gridColumn: "span 2" }}>
                  <Autocomplete
                    options={ingredients}
                    getOptionLabel={(opt) => opt.name}
                    loading={loadingIngredients}
                    value={selectedIngredient}
                    onChange={(_, newVal) =>
                      setFieldValue("ingredient", newVal ? newVal.id : "")
                    }
                    onBlur={handleBlur}
                    openOnFocus={false}
                    filterSelectedOptions
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Ingredient"
                        name="ingredient"
                        error={!!touched.ingredient && !!errors.ingredient}
                        helperText={touched.ingredient && errors.ingredient}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingIngredients ? (
                                <CircularProgress color="inherit" size={20} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
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
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.stockReceived}
                  name="stockReceived"
                  error={!!touched.stockReceived && !!errors.stockReceived}
                  helperText={touched.stockReceived && errors.stockReceived}
                  jsx={{ gridColumn: "span 1" }}
                />

                {/* Unit */}
                <FormControl fullWidth sx={{ gridColumn: "span 1" }}>
                  <InputLabel id="unit-label">Metric</InputLabel>
                  <Select
                    labelId="unit-label"
                    id="unit"
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
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.barCode}
                  name="barCode"
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
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.expiryDate}
                  name="expiryDate"
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
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.temperature}
                  name="temperature"
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
            onChange={(e) => setNewIngredient(e.target.value)}
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
