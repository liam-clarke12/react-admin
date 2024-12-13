import { Box, Button, TextField, Grid, MenuItem } from "@mui/material";
import { Formik, FieldArray } from "formik";
import * as yup from "yup";
import Header from "../../../components/Header";
import { useData } from "../../../contexts/DataContext";

const GoodsOutForm = () => {
  const { addGoodsOutRow, rows } = useData();
  const uniqueRecipes = [...new Set(rows.map((row) => row.recipe))];

  const handleFormSubmit = (values, { resetForm }) => {
    addGoodsOutRow(values);
    resetForm();
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
                  variant="filled"
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
                  variant="filled"
                  select
                  label="Recipe"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.recipe}
                  name="recipe"
                  error={!!touched.recipe && !!errors.recipe}
                  helperText={touched.recipe && errors.recipe}
                >
                  {uniqueRecipes.length > 0 ? (
                    uniqueRecipes.map((recipe, index) => (
                      <option key={index} value={recipe}>
                        {recipe}
                      </option>
                    ))
                  ) : (
                    <option disabled>Please add recipes in the "Recipe Form"</option>
                  )}
                </TextField>
              </Grid>

              {/* Stock Amount */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  variant="filled"
                  type="number"
                  label="Stock Amount (per batch)"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.stockAmount}
                  name="stockAmount"
                  error={!!touched.stockAmount && !!errors.stockAmount}
                  helperText={touched.stockAmount && errors.stockAmount}
                />
              </Grid>

              {/* Recipients */}
              <Grid item xs={12}>
                <FieldArray name="recipients">
                  {({ push, remove }) => (
                    <>
                      {values.recipients.map((recipient, index) => (
                        <Grid container spacing={2} key={index} alignItems="center">
                          <Grid item xs={10}>
                          <TextField
                            fullWidth
                            variant="filled"
                            select
                            label="Recipe"
                            onBlur={handleBlur}
                            onChange={handleChange}
                            value={values.recipe}
                            name="recipe"
                            error={!!touched.recipe && !!errors.recipe}
                            helperText={touched.recipe && errors.recipe}
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
                          <Grid item xs={2}>
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
                          onClick={() => push("")}
                        >
                          Add Recipient
                        </Button>
                      </Box>
                    </>
                  )}
                </FieldArray>
              </Grid>
            </Grid>

            <Box display="flex" justifyContent="flex-end" mt={3}>
              <Button type="submit" color="secondary" variant="contained">
                Record Stock Out
              </Button>
            </Box>
          </form>
        )}
      </Formik>
    </Box>
  );
};

const goodsOutSchema = yup.object().shape({
  date: yup.string().required("Date is required"),
  recipe: yup.string().required("Recipe is required"),
  stockAmount: yup.number().required("Stock amount is required").positive("Must be positive"),
  recipients: yup
    .array()
    .of(yup.string().required("Recipient is required"))
    .min(1, "At least one recipient is required"),
});

const initialValues = {
  date: "",
  recipe: "",
  stockAmount: "",
  recipients: [""],
};

export default GoodsOutForm;
