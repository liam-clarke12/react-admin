import { Box, TextField, Snackbar, Alert, Fab } from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "../../../components/Header";
import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import { useAuth } from "../../../contexts/AuthContext"; // Import the useAuth hook

const GoodsInForm = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const { cognitoId } = useAuth(); // Get cognitoId from context


const handleFormSubmit = async (values, { resetForm }) => {
  const payload = { ...values, cognito_id: cognitoId };

  console.log("📤 Sending payload:", payload);

  try {
    const response = await fetch("https://612wy8dkj5.execute-api.eu-west-1.amazonaws.com/dev/api/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Don't forget this!
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to submit data");
    }

    console.log("✅ Data successfully sent to the backend.");
    resetForm();
    setOpenSnackbar(true);
  } catch (error) {
    // 👇 This is where the new error handling goes:
    console.error("❌ CORS/Network Error:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    
    if (error.message.includes("CORS") || error.name === "TypeError") {
      alert("CORS error - Check console for details");
    }
  }
};

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
              <TextField
                fullWidth
                variant="outlined"
                type="number"
                label="Temperature (℃)"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.Temperature}
                name="Temperature"
                error={!!touched.Temperature && !!errors.Temperature}
                helperText={touched.Temperature && errors.Temperature}
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

// **Validation Schema**
const goodsInSchema = yup.object().shape({
  date: yup.string().required("Date is required"),
  ingredient: yup.string().required("Ingredient is required"),
  stockReceived: yup
    .number()
    .required("Stock amount is required")
    .positive("Must be positive"),
  barCode: yup.string().required("Bar Code is required"),
  expiryDate: yup.string().required("Expiry Date is required"),
  Temperature: yup.number().required("Temperature is required"),
});

// **Initial Values**
const initialValues = {
  date: new Date().toISOString().split("T")[0],
  ingredient: "",
  stockReceived: "",
  barCode: "",
  expiryDate: new Date().toISOString().split("T")[0],
  Temperature: "",
};

export default GoodsInForm;
