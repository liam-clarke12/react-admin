import { Box, TextField, MenuItem, Snackbar, Alert, Fab } from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "../../../components/Header";
import { useState, useEffect } from "react";
import AddIcon from "@mui/icons-material/Add";
import { useAuth } from "../../../contexts/AuthContext";

const ProductionLogForm = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const { cognitoId } = useAuth();
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  useEffect(() => {
    const fetchRecipes = async () => {
      if (!cognitoId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/recipes?cognito_id=${cognitoId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch recipes");
        }

        const data = await response.json();
        console.log("Fetched recipes:", data);

        if (data.length > 0) {
          setFilteredRecipes(data.map((recipe) => recipe.recipe));
        } else {
          setFilteredRecipes([]);
        }
      } catch (err) {
        setError("Error fetching recipes");
        setFilteredRecipes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [cognitoId]);

  const handleFormSubmit = async (values, { resetForm }) => {
    const payload = { ...values, cognito_id: cognitoId };
    console.log("📤 Sending payload:", payload);

    try {
      const response = await fetch(
        "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/add-production-log",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit data");
      }

      console.log("✅ Data successfully sent to the backend.");
      resetForm();
      setOpenSnackbar(true);
    } catch (error) {
      console.error("❌ Error submitting data:", error);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
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

              <TextField
                fullWidth
                variant="outlined"
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
                variant="outlined"
                type="number"
                label="Units of Waste"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.unitsOfWaste}
                name="unitsOfWaste"
                error={!!touched.unitsOfWaste && !!errors.unitsOfWaste}
                helperText={touched.unitsOfWaste && errors.unitsOfWaste}
                sx={{ gridColumn: "span 2" }}
              />

              <TextField
                fullWidth
                variant="outlined"
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

            <Box display="flex" justifyContent="flex-end" mt={3}>
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
                <AddIcon />
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
          Production log form has been successfully recorded!
        </Alert>
      </Snackbar>
    </Box>
  );
};

// 🧪 Updated validation schema
const productionLogSchema = yup.object().shape({
  date: yup.string().required("Date is required"),
  recipe: yup.string().required("Recipe Name is required"),
  batchesProduced: yup
    .number()
    .required("Batches produced is required")
    .positive("Must be positive"),
  unitsOfWaste: yup
    .number()
    .required("Units of waste is required")
    .min(0, "Cannot be negative"),
  batchCode: yup.string().required("Batch Code is required"),
});

// 📦 Initial form values
const initialValues = {
  date: new Date().toISOString().split("T")[0],
  recipe: "",
  batchesProduced: "",
  unitsOfWaste: 0,
  batchCode: "",
};

export default ProductionLogForm;
