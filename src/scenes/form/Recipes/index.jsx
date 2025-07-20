import { Box, Button, TextField, Grid, Snackbar, Alert, Fab, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { Formik, FieldArray } from "formik";
import * as yup from "yup";
import Header from "../../../components/Header";
import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import { useAuth } from "../../../contexts/AuthContext";

// Metric options
const unitOptions = [
  { value: "grams", label: "Grams (g)" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "units", label: "Units" },
];

const RecipeForm = () => {
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const { cognitoId } = useAuth();

  const handleFormSubmit = async (values, { resetForm }) => {
    if (!cognitoId) {
      console.error("Cognito ID is missing.");
      return;
    }

    const ingredients = values.ingredients.map((ing) => ing.name);
    const quantities = values.ingredients.map((ing) => ing.quantity);
    const units = values.ingredients.map((ing) => ing.unit);

    const payload = {
      recipe: values.recipe,
      upb: values.upb,
      ingredients,
      quantities,
      units,
      cognito_id: cognitoId,
    };

    try {
      const response = await fetch(
        "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/add-recipe",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error("Failed to add recipe");
      await response.json();

      resetForm();
      setOpenSnackbar(true);
    } catch (error) {
      console.error("Error submitting recipe:", error);
    }
  };

  const handleCloseSnackbar = () => setOpenSnackbar(false);

  return (
    <Box m="20px">
      <Header title="RECIPES" subtitle="Describe your Recipes" />

      <Formik
        onSubmit={handleFormSubmit}
        initialValues={initialValues}
        validationSchema={RecipeSchema}
      >
        {({ values, errors, touched, handleBlur, handleChange, handleSubmit }) => (
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Recipe"
                  name="recipe"
                  value={values.recipe}
                  onBlur={handleBlur}
                  onChange={handleChange}
                  error={!!(touched.recipe && errors.recipe)}
                  helperText={touched.recipe && errors.recipe}
                  sx={{ borderRadius: "8px" }}
                />
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Units per Batch"
                  name="upb"
                  type="number"
                  value={values.upb}
                  onBlur={handleBlur}
                  onChange={handleChange}
                  error={!!(touched.upb && errors.upb)}
                  helperText={touched.upb && errors.upb}
                  sx={{ borderRadius: "8px", mt: 3 }}
                />
              </Grid>

              <Grid item xs={12}>
                <FieldArray name="ingredients">
                  {({ push, remove }) => (
                    <>
                      {values.ingredients.map((ingredient, index) => (
                        <Grid container spacing={2} key={index} alignItems="center" sx={{ mt: index > 0 ? 1 : 0 }}>
                          <Grid item xs={12} sm={4}>
                            <TextField
                              fullWidth
                              variant="outlined"
                              label="Ingredient"
                              name={`ingredients.${index}.name`}
                              value={ingredient.name}
                              onBlur={handleBlur}
                              onChange={handleChange}
                              error={!!(touched.ingredients?.[index]?.name && errors.ingredients?.[index]?.name)}
                              helperText={touched.ingredients?.[index]?.name && errors.ingredients?.[index]?.name}
                              sx={{ borderRadius: "8px" }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <TextField
                              fullWidth
                              variant="outlined"
                              label="Quantity"
                              name={`ingredients.${index}.quantity`}
                              type="number"
                              value={ingredient.quantity}
                              onBlur={handleBlur}
                              onChange={handleChange}
                              error={!!(touched.ingredients?.[index]?.quantity && errors.ingredients?.[index]?.quantity)}
                              helperText={touched.ingredients?.[index]?.quantity && errors.ingredients?.[index]?.quantity}
                              sx={{ borderRadius: "8px" }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <FormControl fullWidth sx={{ borderRadius: "8px" }}>
                              <InputLabel id={`unit-label-${index}`}>Unit</InputLabel>
                              <Select
                                labelId={`unit-label-${index}`}
                                name={`ingredients.${index}.unit`}
                                value={ingredient.unit}
                                label="Unit"
                                onChange={handleChange}
                              >
                                {unitOptions.map(opt => (
                                  <MenuItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <Button variant="outlined" color="error" onClick={() => remove(index)}>
                              Remove
                            </Button>
                          </Grid>
                        </Grid>
                      ))}
                      <Box mt={2}>
                        <Button
                          type="button"
                          color="secondary"
                          variant="text"
                          onClick={() => push({ name: "", quantity: "", unit: "grams" })}
                          sx={{ display: "inline-flex", alignItems: "center" }}
                        >
                          <strong style={{ marginRight: "8px" }}>+</strong> Add Ingredient
                        </Button>
                      </Box>
                    </>
                  )}
                </FieldArray>
              </Grid>

              <Box display="flex" justifyContent="flex-end" mt="20px" width="100%">
                <Fab
                  color="secondary"
                  onClick={handleSubmit}
                  sx={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 10 }}
                >
                  <AddIcon fontSize="large" />
                </Fab>
              </Box>
            </Grid>
          </form>
        )}
      </Formik>

      <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert onClose={handleCloseSnackbar} severity="success">
          Recipe has been successfully recorded!
        </Alert>
      </Snackbar>
    </Box>
  );
};

const RecipeSchema = yup.object().shape({
  recipe: yup.string().required("Recipe is required"),
  upb: yup.number().required("Units per Batch is required").positive("Must be positive"),
  ingredients: yup.array().of(
    yup.object().shape({
      name: yup.string().required("Ingredient is required"),
      quantity: yup.number().required("Quantity is required").positive("Must be positive"),
      unit: yup.string().required("Unit is required"),
    })
  ),
});

const initialValues = {
  recipe: "",
  upb: "",
  ingredients: [{ name: "", quantity: "", unit: "grams" }],
};

export default RecipeForm;
