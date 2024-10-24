import { Box, Button, TextField, Grid } from "@mui/material";
import { Formik, FieldArray } from "formik";
import * as yup from "yup";
import Header from '../../../components/Header';
import { useData } from '../../../contexts/DataContext'; // Import useData hook

const RecipeForm = () => {
  const { addRow } = useData(); // Get addRow function from context

  const handleFormSubmit = (values, { resetForm }) => {
    // Structure ingredients and quantities as arrays
    const ingredients = values.ingredients.map(ing => ing.name);
    const quantities = values.ingredients.map(ing => ing.quantity);

    // Add the structured data to rows, keeping ingredients and quantities as arrays
    addRow({
      recipe: values.recipe,
      ingredients: ingredients, // Array of ingredients
      quantities: quantities,   // Array of quantities
    });

    // Reset the form after submission
    resetForm();
  };

  return (
    <Box m="20px">
      <Header title="RECIPES" subtitle="Describe your Recipes" />

      <Formik
        onSubmit={handleFormSubmit}
        initialValues={initialValues}
        validationSchema={RecipeSchema}
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
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  variant="filled"
                  type="text"
                  label="Recipe"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.recipe}
                  name="recipe"
                  error={!!(touched.recipe && errors.recipe)}
                  helperText={touched.recipe && errors.recipe}
                  sx={{ borderRadius: '8px' }} // Custom border radius for Recipe field
                />
              </Grid>

              <Grid container item xs={12} spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FieldArray name="ingredients">
                    {({ push, remove }) => (
                      <>
                        {values.ingredients.map((ingredient, index) => (
                          <Grid container spacing={2} key={index} alignItems="center" sx={{ mt: index > 0 ? 1 : 0 }}>
                            <Grid item xs={12} sm={5}>
                              <TextField
                                fullWidth
                                variant="filled"
                                type="text"
                                label="Ingredient"
                                name={`ingredients.${index}.name`}
                                onBlur={handleBlur}
                                onChange={handleChange}
                                value={ingredient.name}
                                error={!!(touched.ingredients?.[index]?.name && errors.ingredients?.[index]?.name)}
                                helperText={touched.ingredients?.[index]?.name && errors.ingredients?.[index]?.name}
                                sx={{ borderRadius: '8px' }} // Custom border radius for Ingredient field
                              />
                            </Grid>
                            <Grid item xs={12} sm={5}>
                              <TextField
                                fullWidth
                                variant="filled"
                                type="number"
                                label="Quantity per Batch (kg)"
                                name={`ingredients.${index}.quantity`}
                                onBlur={handleBlur}
                                onChange={handleChange}
                                value={ingredient.quantity}
                                error={!!(touched.ingredients?.[index]?.quantity && errors.ingredients?.[index]?.quantity)}
                                helperText={touched.ingredients?.[index]?.quantity && errors.ingredients?.[index]?.quantity}
                                sx={{ borderRadius: '8px' }} // Custom border radius for Quantity field
                              />
                            </Grid>
                            <Grid item xs={12} sm={2}>
                              <Button
                                variant="outlined"
                                color="error"
                                onClick={() => remove(index)}
                              >
                                Remove
                              </Button>
                            </Grid>
                          </Grid>
                        ))}
                        <Box mt={2}>
                          <Button
                            type="button"
                            color="secondary"
                            variant="contained"
                            onClick={() => push({ name: "", quantity: "" })}
                          >
                            Add Ingredient
                          </Button>
                        </Box>
                      </>
                    )}
                  </FieldArray>
                </Grid>
              </Grid>

              {/* Full-width Box to align the button to the right */}
              <Box display="flex" justifyContent="flex-end" mt="20px" width="100%">
                <Button
                  type="submit"
                  color="secondary"
                  variant="contained"
                >
                  Record Recipe
                </Button>
              </Box>
            </Grid>
          </form>
        )}
      </Formik>
    </Box>
  );
};

// Validation schema for the form
const RecipeSchema = yup.object().shape({
  recipe: yup.string().required("Recipe is required"),
  ingredients: yup.array().of(
    yup.object().shape({
      name: yup.string().required("Ingredient is required"),
      quantity: yup.number().required("Quantity per Batch is required").positive("Must be positive"),
    })
  ),
});

// Initial values for the form
const initialValues = {
  recipe: "",
  ingredients: [{ name: "", quantity: "" }], // Ingredients array should be initialized like this
};

export default RecipeForm;