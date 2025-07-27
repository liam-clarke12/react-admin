// src/scenes/goods-in/GoodsInForm.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Snackbar,
  Alert,
  Fab,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  FormHelperText
} from "@mui/material";
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

  // Fetch available ingredients for the dropdown
  useEffect(() => {
    if (!cognitoId) return;
    setLoadingIngredients(true);
    fetch(
      `https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/ingredients?cognito_id=${cognitoId}`
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch ingredients");
        return res.json();
      })
      .then((data) => {
        // assuming API returns array of { id: string, name: string }
        setIngredients(data);
      })
      .catch((err) => {
        console.error("Error loading ingredients:", err);
      })
      .finally(() => setLoadingIngredients(false));
  }, [cognitoId]);

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
        }) => (
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

              {/* Ingredient dropdown */}
              <FormControl
                fullWidth
                sx={{ gridColumn: "span 2" }}
                error={!!touched.ingredient && !!errors.ingredient}
              >
                <InputLabel id="ingredient-label">
                  {loadingIngredients ? "Loading…" : "Ingredient"}
                </InputLabel>
                <Select
                  labelId="ingredient-label"
                  id="ingredient"
                  name="ingredient"
                  value={values.ingredient}
                  label="Ingredient"
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  {loadingIngredients ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} />
                    </MenuItem>
                  ) : (
                    ingredients.map(({ id, name }) => (
                      <MenuItem key={id} value={id}>
                        {name}
                      </MenuItem>
                    ))
                  )}
                </Select>
                {touched.ingredient && errors.ingredient && (
                  <FormHelperText>{errors.ingredient}</FormHelperText>
                )}
              </FormControl>

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
                sx={{ gridColumn: "span 1" }}
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
        )}
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
    </Box>
  );
};

export default GoodsInForm;
