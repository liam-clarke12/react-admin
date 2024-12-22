import { Box, TextField, Snackbar, Alert, Fab, Typography } from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "../../../components/Header";
import { useData } from "../../../contexts/DataContext"; // Import the DataContext
import { useState } from "react"; // Import useState to manage Snackbar state
import AddIcon from "@mui/icons-material/Add"; // Import Add Icon for the FAB

const GoodsInForm = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const { addGoodsInRow } = useData();
  
  // Snackbar state to show success message
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const handleFormSubmit = (values, { resetForm }) => {
    console.log("Form submitted. Values before processing:", values);
  
    // Create a new row with the file included
    const rowWithFile = {
      ...values,
      file: values.fileUpload, // Add the file to the row data
    };
  
    console.log("Row data after including file:", rowWithFile);
  
    // Call the function to add the row, including the file
    addGoodsInRow(rowWithFile);
  
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
          setFieldValue
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
                value={values.Temperature} // Ensure this matches the initialValues key
                name="Temperature"
                error={!!touched.Temperature && !!errors.Temperature}
                helperText={touched.Temperature && errors.Temperature}
                sx={{ gridColumn: "span 2" }}
              />

              {/* File Upload Text Link */}
              <Box sx={{ gridColumn: "span 2", marginTop: "10px" }}>
                <Typography
                  variant="body1"
                  component="span"
                  sx={{ cursor: "pointer", color: "#6870fa", fontSize: "1.1rem", lineHeight: 1.5 }}
                  onClick={() => document.getElementById('file-upload').click()} // Trigger file input click
                >
                  <strong>+</strong> Attach File
                </Typography>
                <input
                  id="file-upload"
                  type="file"
                  name="fileUpload"
                  onChange={(event) => setFieldValue("fileUpload", event.currentTarget.files[0])}
                  accept="image/*,application/pdf" // Example: only accept images and PDFs
                  style={{ display: "none" }} // Hide the default file input
                />
                {/* Show file name when file is selected */}
                {values.fileUpload && values.fileUpload.name && (
                  <Typography variant="body2" sx={{ marginTop: "5px", color: "green" }}>
                    {values.fileUpload.name}
                  </Typography>
                )}
                {touched.fileUpload && errors.fileUpload && (
                  <div style={{ color: "red", fontSize: "12px" }}>
                    {errors.fileUpload}
                  </div>
                )}
              </Box>
            </Box>

            {/* Floating Action Button (FAB) for form submission */}
            <Box display="flex" justifyContent="center" mt="20px" sx={{ position: "relative" }}>
              <Fab
                color="secondary"
                onClick={handleSubmit} // Submit the form when FAB is clicked
                sx={{
                  position: "fixed",
                  bottom: "20px",
                  right: "20px",
                  zIndex: 10,
                  transition: "transform 0.3s",
                  "&:hover": {
                    transform: "scale(1.1)",
                  },
                }}
              >
                <AddIcon fontSize="large" />
              </Fab>
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

// Yup Validation Schema
const goodsInSchema = yup.object().shape({
  date: yup.string().required("Date is required"),
  ingredient: yup.string().required("Ingredient is required"),
  stockReceived: yup
    .number()
    .required("Stock amount is required")
    .positive("Must be positive"),
  barCode: yup.string().required("Bar Code is required"),
  expiryDate: yup.string().required("Expiry Date is required"),
  fileUpload: yup
    .mixed()
    .required("File upload is required")
    .test("fileSize", "File size too large", (value) => {
      if (value) return value.size <= 5 * 1024 * 1024; // Maximum file size of 5MB
      return true;
    })
    .test("fileType", "Unsupported file type", (value) => {
      if (value) return ["image/jpeg", "image/png", "application/pdf"].includes(value.type);
      return true;
    }),
});

// Initial Values for the Form
const initialValues = {
  date: new Date().toISOString().split("T")[0],
  ingredient: "",
  stockReceived: "",
  barCode: "",
  expiryDate: new Date().toISOString().split("T")[0],
  Temperature: "",
  fileUpload: null, // Initial value for file upload
};

export default GoodsInForm;
