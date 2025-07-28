// src/scenes/form/RecipeForm/index.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  TextField,
  Grid,
  Snackbar,
  Alert,
  Fab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { Formik, FieldArray } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "../../../components/Header";
import AddIcon from "@mui/icons-material/Add";
import { useAuth } from "../../../contexts/AuthContext";

const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

const unitOptions = [
  { value: "grams", label: "Grams (g)" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "units", label: "Units" },
];

const RecipeForm = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const { cognitoId } = useAuth();

  // master + custom ingredient lists
  const [masterIngredients, setMasterIngredients] = useState([]);
  const [customIngredients, setCustomIngredients] = useState([]);
  const [loadingMaster, setLoadingMaster] = useState(false);
  const [loadingCustom, setLoadingCustom] = useState(false);

  // merge for dropdown
  const allIngredients = useMemo(
    () => [
      ...masterIngredients.map(i => ({ ...i, source: "master" })),
      ...customIngredients.map(i => ({ ...i, source: "custom" }))
    ],
    [masterIngredients, customIngredients]
  );

  // snackbar & add‑ingredient dialog state
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newIngredient, setNewIngredient] = useState("");
  const [adding, setAdding] = useState(false);

  // fetch global master list
  useEffect(() => {
    if (!cognitoId) return;
    setLoadingMaster(true);
    fetch(`${API_BASE}/ingredients?cognito_id=${cognitoId}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch ingredients");
        return res.json();
      })
      .then(data => setMasterIngredients(data))
      .catch(err => console.error("Error fetching master ingredients:", err))
      .finally(() => setLoadingMaster(false));
  }, [cognitoId]);

  // fetch user custom list
  useEffect(() => {
    if (!cognitoId) return;
    setLoadingCustom(true);
    fetch(`${API_BASE}/custom-ingredients?cognito_id=${cognitoId}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch custom ingredients");
        return res.json();
      })
      .then(data =>
        setCustomIngredients(
          data.map(ci => ({ id: `c-${ci.id}`, name: ci.name }))
        )
      )
      .catch(err => console.error("Error fetching custom ingredients:", err))
      .finally(() => setLoadingCustom(false));
  }, [cognitoId]);

  // open/close add dialog
  const openAddDialog = () => {
    setNewIngredient("");
    setAddDialogOpen(true);
  };
  const closeAddDialog = () => setAddDialogOpen(false);

  // handle adding custom ingredient
  const handleAddIngredient = async () => {
    if (!newIngredient.trim() || !cognitoId) return;
    setAdding(true);
    try {
      const res = await fetch(`${API_BASE}/custom-ingredients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cognito_id: cognitoId, name: newIngredient.trim() })
      });
      if (!res.ok) throw new Error("Failed to add ingredient");
      // refresh custom list
      const updated = await fetch(
        `${API_BASE}/custom-ingredients?cognito_id=${cognitoId}`
      ).then(r => {
        if (!r.ok) throw new Error("Failed to fetch updated custom");
        return r.json();
      });
      setCustomIngredients(updated.map(ci => ({ id: `c-${ci.id}`, name: ci.name })));
      closeAddDialog();
    } catch (err) {
      console.error("Error adding custom ingredient:", err);
      alert("Failed to add ingredient");
    } finally {
      setAdding(false);
    }
  };

  // form submit
  const handleFormSubmit = async (values, { resetForm }) => {
    const payload = {
      recipe: values.recipe,
      upb: values.upb,
      ingredients: values.ingredients.map(i => i.name),
      quantities: values.ingredients.map(i => i.quantity),
      units: values.ingredients.map(i => i.unit),
      cognito_id: cognitoId
    };
    try {
      const res = await fetch(`${API_BASE}/add-recipe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to add recipe");
      await res.json();
      resetForm();
      setOpenSnackbar(true);
    } catch (err) {
      console.error("Error submitting recipe:", err);
      alert("Recipe submission failed");
    }
  };

  const handleCloseSnackbar = () => setOpenSnackbar(false);

  // validation
  const RecipeSchema = yup.object().shape({
    recipe: yup.string().required("Recipe is required"),
    upb: yup.number().required("Units per Batch is required").positive("Must be positive"),
    ingredients: yup.array().of(
      yup.object().shape({
        name: yup.string().required("Ingredient is required"),
        quantity: yup.number().required("Quantity is required").positive("Must be positive"),
        unit: yup.string().required("Unit is required")
      })
    )
  });

  const initialValues = {
    recipe: "",
    upb: "",
    ingredients: [{ name: "", quantity: "", unit: "grams" }]
  };

  return (
    <Box m="20px">
      <Header title="RECIPES" subtitle="Describe your Recipes" />

      <Formik
        onSubmit={handleFormSubmit}
        initialValues={initialValues}
        validationSchema={RecipeSchema}
      >
        {({ values, errors, touched, handleBlur, handleChange, handleSubmit, setFieldValue }) => (
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
                  sx={{ mt: 2 }}
                />
              </Grid>

              <Grid item xs={12}>
                <FieldArray name="ingredients">
                  {({ push, remove }) => (
                    <>
                      {values.ingredients.map((ing, idx) => (
                        <Grid container spacing={2} key={idx} alignItems="center" sx={{ mt: idx > 0 ? 1 : 0 }}>
                          <Grid item xs={12} sm={4}>
                            <Autocomplete
                              options={allIngredients}
                              getOptionLabel={opt => opt.name}
                              loading={loadingMaster || loadingCustom}
                              value={allIngredients.find(i => i.id === ing.name) || null}
                              onChange={(_, newVal) =>
                                setFieldValue(`ingredients.${idx}.name`, newVal ? newVal.id : "")
                              }
                              renderInput={params => (
                                <TextField
                                  {...params}
                                  label="Ingredient"
                                  name={`ingredients.${idx}.name`}
                                  onBlur={handleBlur}
                                  error={!!(touched.ingredients?.[idx]?.name && errors.ingredients?.[idx]?.name)}
                                  helperText={touched.ingredients?.[idx]?.name && errors.ingredients?.[idx]?.name}
                                />
                              )}
                            />
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <TextField
                              fullWidth
                              variant="outlined"
                              label="Quantity"
                              name={`ingredients.${idx}.quantity`}
                              type="number"
                              value={ing.quantity}
                              onBlur={handleBlur}
                              onChange={handleChange}
                              error={!!(touched.ingredients?.[idx]?.quantity && errors.ingredients?.[idx]?.quantity)}
                              helperText={touched.ingredients?.[idx]?.quantity && errors.ingredients?.[idx]?.quantity}
                            />
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <FormControl fullWidth>
                              <InputLabel id={`unit-label-${idx}`}>Unit</InputLabel>
                              <Select
                                labelId={`unit-label-${idx}`}
                                name={`ingredients.${idx}.unit`}
                                value={ing.unit}
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
                            <Button variant="outlined" color="error" onClick={() => remove(idx)}>
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
                          sx={{ mr: 2 }}
                        >
                          + Add Recipe Row
                        </Button>
                        <Button size="small" onClick={openAddDialog}>
                          Add Ingredient +
                        </Button>
                      </Box>
                    </>
                  )}
                </FieldArray>
              </Grid>
            </Grid>

            <Box display="flex" justifyContent="flex-end" mt="20px">
              <Fab color="secondary" onClick={handleSubmit}>
                <AddIcon fontSize="large" />
              </Fab>
            </Box>
          </form>
        )}
      </Formik>

      <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert onClose={handleCloseSnackbar} severity="success">
          Recipe has been successfully recorded!
        </Alert>
      </Snackbar>

      <Dialog open={addDialogOpen} onClose={closeAddDialog} fullWidth>
        <DialogTitle>Add New Ingredient</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Ingredient Name"
            fullWidth
            value={newIngredient}
            onChange={e => setNewIngredient(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAddDialog} disabled={adding}>
            Cancel
          </Button>
          <Button onClick={handleAddIngredient} disabled={adding}>
            {adding ? <CircularProgress size={20} /> : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RecipeForm;
