import { Box, Button, TextField, Snackbar, Alert } from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from '../../../components/Header';
import { useData } from '../../../contexts/DataContext'; // Import the DataContext
import { useState } from "react"; // Import useState to manage Snackbar state

const GoodsInForm = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const { addGoodsInRow } = useData();
  
  // Snackbar state to show success message
  const [openSnackbar, setOpenSnackbar] = useState(false);
  
  const handleFormSubmit = (values, { resetForm }) => {
    console.log("Submitting Values:", values);
    addGoodsInRow(values);
    resetForm();
    setOpenSnackbar(true); // Open Snackbar on successful submit
  };

  // Close Snackbar
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
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
              <TextField
                fullWidth
                variant="outlined"
                type="text"
                label="Ingredient"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.ingredient}
                name="ingredient"
                error={!!touched.ingredient && !!errors.ingredient}
                helperText={touched.ingredient && errors.ingredient}
                sx={{ gridColumn: "span 2" }}
              />
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
                sx={{ gridColumn: "span 2" }}
              />
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
            </Box>
            <Box display="flex" justifyContent="end" mt="20px">
              <Button type="submit" color="secondary" variant="contained">
                Record Stock In
              </Button>
            </Box>
          </form>
        )}
      </Formik>

      {/* Success Snackbar */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          Stock has been successfully recorded!
        </Alert>
      </Snackbar>
    </Box>
  );
};

const goodsInSchema = yup.object().shape({
  date: yup.string().required("Date is required"),
  ingredient: yup.string().required("Ingredient is required"),
  stockReceived: yup
    .number()
    .required("Stock amount is required")
    .positive("Must be positive"),
  barCode: yup.string().required("Bar Code is required"),
  expiryDate: yup.string().required("Expiry Date is required"),
});

const initialValues = {
  date: "",
  ingredient: "",
  stockReceived: "",
  barCode: "",
  expiryDate: "",
};

export default GoodsInForm;
