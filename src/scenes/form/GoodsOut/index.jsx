import { Box, Button, TextField, MenuItem } from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from '../../../components/Header';
import { useData } from '../../../contexts/DataContext'; // Import the DataContext

const GoodsOutForm = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const { addGoodsInRow, rows } = useData(); // Get the addGoodsInRow function from context
  const uniqueRecipes = [...new Set(rows.map(row => row.recipe))];

  const handleFormSubmit = (values, { resetForm }) => {
    console.log("Submitting Values:", values); // Debugging log
    addGoodsInRow(values); // Call the function to add row
    resetForm(); // Reset the form after submission
  };

  return (
    <Box m="20px">
      <Header title="GOODS OUT" subtitle="Record Stock Movement (Goods Out)" />

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
                label="Recipe"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.recipe}
                name="recipe"
                error={!!touched.recipe && !!errors.recipe}
                helperText={touched.recipe && errors.recipe}
                sx={{ gridColumn: "span 2" }}>{uniqueRecipes.length > 0 ? ( // Ensure unique recipes are available
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
                label="Stock Amount (per batch)"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.stockAmount}
                name="stockAmount"
                error={!!touched.stockAmount && !!errors.stockAmount}
                helperText={touched.stockAmount && errors.stockAmount}
                sx={{ gridColumn: "span 2" }}
              />              
              <TextField
              fullWidth
              variant="filled"
              type="text"
              label="Recipient"
              onBlur={handleBlur}
              onChange={handleChange}
              value={values.recipient}
              name="recipient"
              error={!!touched.recipient && !!errors.recipient}
              helperText={touched.recipient && errors.recipient}
              sx={{ gridColumn: "span 2" }}
            />
            </Box>
            <Box display="flex" justifyContent="end" mt="20px">
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

const goodsInSchema = yup.object().shape({
  date: yup.string().required("Date is required"),
  recipe: yup.string().required("Recipe is required"),
  stockAmount: yup.number().required("Stock amount is required").positive("Must be positive"),
  recipient: yup.string().required("Recipient is required"),

});

const initialValues = {
  date: "",
  recipe: "",
  stockAmount: "",
  recipient: "",
};

export default GoodsOutForm;
