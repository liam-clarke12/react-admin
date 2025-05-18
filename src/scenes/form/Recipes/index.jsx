import { Box, Button, TextField, Grid, Snackbar, Alert, Fab } from "@mui/material";
import { Formik, FieldArray } from "formik";
import * as yup from "yup";
import Header from "../../../components/Header";
import { useState } from "react"; // Import useState to manage Snackbar state
import AddIcon from "@mui/icons-material/Add"; // Import Add Icon for the FAB
import { useAuth } from "../../../contexts/AuthContext"; // Import the useAuth hook


const RecipeForm = () => {
  const [openSnackbar, setOpenSnackbar] = useState(false); // Snackbar state
  const { cognitoId } = useAuth(); // Get cognitoId from context
  

  const handleFormSubmit = async (values, { resetForm }) => {
    if (!cognitoId) {
      console.error("Cognito ID is missing.");
      return;
    }
  
    const ingredients = values.ingredients.map((ing) => ing.name);
    const quantities = values.ingredients.map((ing) => ing.quantity);
  
    const payload = {
      recipe: values.recipe,
      upb: values.upb,
      ingredients,
      quantities,
      cognito_id: cognitoId, // Pass Cognito ID
    };
  
    try {
      const response = await fetch("https://612wy8dkj5.execute-api.eu-west-1.amazonaws.com/dev/api/add-recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        throw new Error("Failed to add recipe");
      }
  
      const result = await response.json();
      console.log("Recipe added successfully:", result);
  
      resetForm();
      setOpenSnackbar(true); // Show success message
    } catch (error) {
      console.error("Error submitting recipe:", error);
    }
  };  

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false); // Close Snackbar
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
                  variant="outlined"
                  type="text"
                  label="Recipe"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.recipe}
                  name="recipe"
                  error={!!(touched.recipe && errors.recipe)}
                  helperText={touched.recipe && errors.recipe}
                  sx={{ borderRadius: "8px" }} // Custom border radius for Recipe field
                />
                <TextField
                  fullWidth
                  variant="outlined"
                  type="number"
                  label="Units per Batch"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.upb}
                  name="upb"
                  error={!!(touched.upb && errors.upb)}
                  helperText={touched.upb && errors.upb}
                  sx={{ borderRadius: "8px", mt: 3 }} // Add margin-top for spacing
                />
              </Grid>
              <Grid container item xs={12} spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FieldArray name="ingredients">
                    {({ push, remove }) => (
                      <>
                        {values.ingredients.map((ingredient, index) => (
                          <Grid
                            container
                            spacing={2}
                            key={index}
                            alignItems="center"
                            sx={{ mt: index > 0 ? 1 : 0 }}
                          >
                            <Grid item xs={12} sm={5}>
                              <TextField
                                fullWidth
                                variant="outlined"
                                type="text"
                                label="Ingredient"
                                name={`ingredients.${index}.name`}
                                onBlur={handleBlur}
                                onChange={handleChange}
                                value={ingredient.name}
                                error={
                                  !!(touched.ingredients?.[index]?.name && errors.ingredients?.[index]?.name)
                                }
                                helperText={
                                  touched.ingredients?.[index]?.name && errors.ingredients?.[index]?.name
                                }
                                sx={{ borderRadius: "8px" }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={5}>
                              <TextField
                                fullWidth
                                variant="outlined"
                                type="number"
                                label="Quantity per Batch (kg)"
                                name={`ingredients.${index}.quantity`}
                                onBlur={handleBlur}
                                onChange={handleChange}
                                value={ingredient.quantity}
                                error={
                                  !!(touched.ingredients?.[index]?.quantity && errors.ingredients?.[index]?.quantity)
                                }
                                helperText={
                                  touched.ingredients?.[index]?.quantity && errors.ingredients?.[index]?.quantity
                                }
                                sx={{ borderRadius: "8px" }}
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
                            variant="text"
                            onClick={() => push({ name: "", quantity: "" })}
                            sx={{
                              fontWeight: "normal",
                              display: "inline-flex",
                              alignItems: "center",
                            }}
                          >
                            <strong style={{ marginRight: "8px" }}>+</strong> Add Ingredient
                          </Button>
                        </Box>
                      </>
                    )}
                  </FieldArray>
                </Grid>
              </Grid>

              <Box display="flex" justifyContent="flex-end" mt="20px" width="100%">
                <Fab
                  color="secondary"
                  onClick={handleSubmit}
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
            </Grid>
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
          Recipe has been successfully recorded!
        </Alert>
      </Snackbar>
    </Box>
  );
};

const RecipeSchema = yup.object().shape({
  recipe: yup.string().required("Recipe is required"),
  upb: yup.string().required("Number is required"),
  ingredients: yup.array().of(
    yup.object().shape({
      name: yup.string().required("Ingredient is required"),
      quantity: yup
        .number()
        .required("Quantity per Batch is required")
        .positive("Must be positive"),
    })
  ),
});

const initialValues = {
  recipe: "",
  upb: "",
  ingredients: [{ name: "", quantity: "" }],
};

export default RecipeForm;
