import { Box, TextField, Grid, MenuItem, Snackbar, Alert, Fab } from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import Header from "../../../components/Header";
import { useState, useEffect } from "react"; 
import AddIcon from '@mui/icons-material/Add';  
import { useAuth } from "../../../contexts/AuthContext"; 

const GoodsOutForm = () => {
  const { cognitoId } = useAuth();  
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [filteredRecipes, setFilteredRecipes] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); 

  // Ensure initial values are managed properly
  const [initialValues, setInitialValues] = useState({
    date: new Date().toISOString().split("T")[0],
    recipe: "",
    stockAmount: "",
    recipients: "",
  });

  // Form submission handler
  const handleFormSubmit = async (values, { resetForm }) => {
    const payload = { ...values, cognito_id: cognitoId };
  
    console.log("📤 Sending payload:", payload);
  
    try {
      const response = await fetch("http://localhost:5000/api/add-goods-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      console.log("🔍 Response status:", response.status);
  
      // Check if the response is OK
      if (!response.ok) {
        const errorResponse = await response.json();
        console.error("❌ Error response from server:", errorResponse);
        throw new Error(`Failed to submit data: ${errorResponse.error || response.statusText}`);
      }
  
      const responseData = await response.json();
      console.log("✅ Data successfully sent to the backend. Response:", responseData);
  
      // Reset the form after successful submission
      resetForm();
      setOpenSnackbar(true);
  
    } catch (error) {
      console.error("❌ Error submitting data:", error.message || error);
    }
  };
  
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  // Fetch unique recipe names from backend
  useEffect(() => {
    const fetchRecipes = async () => {
      if (!cognitoId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`http://localhost:5000/get-recipes?cognito_id=${cognitoId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch recipes');
        }

        const data = await response.json();
        console.log('Fetched recipes:', data);

        setFilteredRecipes(data.map((recipe) => recipe.recipe_name));

      } catch (err) {
        setError('Error fetching recipes');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [cognitoId]);

  // Reset initialValues when snackbar is open
  useEffect(() => {
    if (openSnackbar) {
      setInitialValues({
        date: new Date().toISOString().split("T")[0], // Reset date to current date
        recipe: "",
        stockAmount: "",
        recipients: "",
      });
    }
  }, [openSnackbar]);

  return (
    <Box m="20px">
      <Header title="GOODS OUT" subtitle="Record Stock Movement (Goods Out)" />

      <Formik
        key={initialValues.date} // Ensure form resets when initial values change
        initialValues={initialValues}
        validationSchema={goodsOutSchema}
        onSubmit={handleFormSubmit}
        enableReinitialize={true} // Allows form to reset when initialValues change
      >
        {({
          values,
          errors,
          touched,
          handleBlur,
          handleChange,
          handleSubmit,
          resetForm, // Ensure resetForm is accessible
        }) => (
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              
              {/* Date */}
              <Grid item xs={12} sm={6}>
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
                />
              </Grid>

              {/* Recipe */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  select
                  label="Recipe"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.recipe}
                  name="recipe"
                  error={!!touched.recipe && !!errors.recipe}
                  helperText={touched.recipe && errors.recipe}
                >
                  {loading ? (
                    <MenuItem disabled>Loading recipes...</MenuItem>
                  ) : error ? (
                    <MenuItem disabled>{error}</MenuItem>
                  ) : filteredRecipes.length > 0 ? (
                    filteredRecipes.map((recipe, index) => (
                      <MenuItem key={index} value={recipe}>
                        {recipe}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No recipes available</MenuItem>
                  )}
                </TextField>
              </Grid>

              {/* Stock Amount */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  variant="outlined"
                  type="number"
                  label="Amount of Units"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.stockAmount}
                  name="stockAmount"
                  error={!!touched.stockAmount && !!errors.stockAmount}
                  helperText={touched.stockAmount && errors.stockAmount}
                />
              </Grid>

              {/* Recipient */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  variant="outlined"
                  type="text"
                  label="Recipient"
                  name="recipients"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.recipients}
                  error={!!touched.recipients && !!errors.recipients}
                  helperText={touched.recipients && errors.recipients}
                />
              </Grid>
            </Grid>

            {/* Submit Button */}
            <Box display="flex" justifyContent="flex-end" mt={3}>
              <Fab
                color="secondary"
                type="submit"
                sx={{
                  position: 'fixed',
                  bottom: '20px',
                  right: '20px',
                  zIndex: 10,
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'scale(1.1)',
                  },
                }}
              >
                <AddIcon />
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
          Goods Out has been successfully recorded!
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Validation Schema
const goodsOutSchema = yup.object().shape({
  date: yup.string().required("Date is required"),
  recipe: yup.string().required("Recipe is required"),
  stockAmount: yup.number().required("Stock amount is required").positive("Must be positive"),
  recipients: yup.string().required("Recipient is required"),
});

export default GoodsOutForm;
