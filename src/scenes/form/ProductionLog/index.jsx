import { Box, Button, TextField, MenuItem } from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from '../../../components/Header';
import { useData } from '../../../contexts/DataContext'; // Use the custom hook for DataContext

const ProductionLogForm = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const { addProductionLogRow, rows } = useData(); // Use the context to get rows (recipes)

  // Create a unique list of recipe names from rows
  const uniqueRecipes = [...new Set(rows.map(row => row.recipe))];

  const handleFormSubmit = (values, { resetForm }) => {
    console.log("Submitting Values:", values);
    addProductionLogRow(values); // Submit the production log data
    resetForm(); // Reset the form after submission
  };

  return (
    <Box m="20px">
      <Header title="RECIPE PRODUCTION" subtitle="Record your Recipe Production" />

      <Formik
        onSubmit={handleFormSubmit}
        initialValues={initialValues}
        validationSchema={productionLogSchema}
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
                variant="filled"
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
                variant="filled"
                select
                label="Recipe Name"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.recipe}
                name="recipe"
                error={!!touched.recipe && !!errors.recipe}
                helperText={touched.recipe && errors.recipe}
                sx={{ gridColumn: "span 2" }}
              >
                {uniqueRecipes.length > 0 ? ( // Ensure unique recipes are available
                  uniqueRecipes.map((recipe, index) => (
                    <MenuItem key={index} value={recipe}>
                      {recipe}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>Please add recipes in the "Recipe Form"</MenuItem>
                )}
              </TextField>
              <TextField
                fullWidth
                variant="filled"
                type="number"
                label="Batches Produced"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.batchesProduced}
                name="batchesProduced"
                error={!!touched.batchesProduced && !!errors.batchesProduced}
                helperText={touched.batchesProduced && errors.batchesProduced}
                sx={{ gridColumn: "span 2" }}
              />
              <TextField
                fullWidth
                variant="filled"
                type="text"
                label="Batch Code"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.batchCode}
                name="batchCode"
                error={!!touched.batchCode && !!errors.batchCode}
                helperText={touched.batchCode && errors.batchCode}
                sx={{ gridColumn: "span 2" }}
              />
            </Box>
            <Box display="flex" justifyContent="end" mt="20px">
              <Button type="submit" color="secondary" variant="contained">
                Record Production
              </Button>
            </Box>
          </form>
        )}
      </Formik>
    </Box>
  );
};

// Form validation schema
const productionLogSchema = yup.object().shape({
  date: yup.string().required("Date is required"),
  recipe: yup.string().required("Recipe Name is required"),
  batchesProduced: yup.number().required("Batches produced is required").positive("Must be positive"),
  batchCode: yup.string().required("Batch Code is required"),
});

// Initial values for the form
const initialValues = {
  date: "",
  recipe: "",
  batchesProduced: "",
  batchCode: "",
};

export default ProductionLogForm;
