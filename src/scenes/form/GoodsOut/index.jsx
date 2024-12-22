import { Box, TextField, Grid, MenuItem, Snackbar, Alert, Fab} from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import Header from "../../../components/Header";
import { useData } from "../../../contexts/DataContext";
import { useState } from "react";
import AddIcon from '@mui/icons-material/Add';  // Import the "+" icon

const GoodsOutForm = () => {
  const { addGoodsOutRow, rows } = useData();
  const uniqueRecipes = [...new Set(rows.map((row) => row.recipe))];
  
  const [openSnackbar, setOpenSnackbar] = useState(false);
  
  const handleFormSubmit = (values, { resetForm }) => {
    addGoodsOutRow(values);
    resetForm();
    setOpenSnackbar(true);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Box m="20px">
      <Header title="GOODS OUT" subtitle="Record Stock Movement (Goods Out)" />

      <Formik
        onSubmit={handleFormSubmit}
        initialValues={initialValues}
        validationSchema={goodsOutSchema}
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
                  sx={{ gridColumn: "span 2" }}
                >
                  {uniqueRecipes.length > 0 ? (
                    uniqueRecipes.map((recipe, index) => (
                      <MenuItem key={index} value={recipe}>
                        {recipe}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>Please add recipes in the "Recipe Form"</MenuItem>
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

              {/* Single Recipient */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  variant="outlined"
                  type="text"
                  label="Recipient"
                  name="recipients" // Only one recipient input
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.recipients}
                  error={!!touched.recipients && !!errors.recipients}
                  helperText={touched.recipients && errors.recipients}
                />
              </Grid>
            </Grid>

            <Box display="flex" justifyContent="flex-end" mt={3}>
              <Fab
                color="secondary"
                onClick={handleSubmit}
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

const goodsOutSchema = yup.object().shape({
  date: yup.string().required("Date is required"),
  recipe: yup.string().required("Recipe is required"),
  stockAmount: yup.number().required("Stock amount is required").positive("Must be positive"),
  recipients: yup.string().required("Recipient is required")
});

const initialValues = {
  date: new Date().toISOString().split("T")[0],
  recipe: "",
  stockAmount: "",
  recipients: "", // Only one recipient field
};

export default GoodsOutForm;
