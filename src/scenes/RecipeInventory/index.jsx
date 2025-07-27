import React, { useState, useEffect } from "react";
import {
  Box,
  useTheme,
  Drawer,
  Typography,
  IconButton
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import { tokens } from "../../themes";
import Header from "../../components/Header";
import BarChart from "../../components/BarChart";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";

const RecipeInventory = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { cognitoId } = useAuth();
  const { recipeInventory, setRecipeInventory } = useData();
  const [recipesMap, setRecipesMap] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 1) Fetch recipes → build recipeName → units_per_batch map
  useEffect(() => {
    if (!cognitoId) return;
    const fetchRecipes = async () => {
      try {
        const res = await fetch(
          `https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/recipes?cognito_id=${cognitoId}`
        );
        if (!res.ok) throw new Error("Failed to fetch recipes");
        const data = await res.json();
        const map = {};
        data.forEach((r, idx) => {
          const key = r.recipe_name ?? r.recipe ?? r.name ?? `unknown_${idx}`;
          map[key] = Number(r.units_per_batch) || 0;
        });
        setRecipesMap(map);
      } catch (err) {
        console.error("Error fetching recipes:", err);
      }
    };
    fetchRecipes();
  }, [cognitoId]);

  // 2) Once recipesMap is ready, fetch production-log, group & compute unitsInStock
  useEffect(() => {
    if (!cognitoId || Object.keys(recipesMap).length === 0) return;

    const fetchAndProcess = async () => {
      try {
        const response = await fetch(
          `https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/production-log?cognito_id=${cognitoId}`
        );
        if (!response.ok) throw new Error("Failed to fetch production-log");
        const data = await response.json();
        if (!Array.isArray(data)) return;

        // filter out any zero-remaining batches
        const filtered = data.filter((row) => Number(row.batchRemaining) > 0);

        // group by recipe, summing batchRemaining
        const grouped = filtered.reduce((acc, row) => {
          const rec = row.recipe;
          const rem = Number(row.batchRemaining) || 0;
          if (!acc[rec]) {
            acc[rec] = {
              date: row.date,
              recipe: rec,
              totalBatches: rem,
              batchCode: row.batchCode
            };
          } else {
            acc[rec].totalBatches += rem;
          }
          return acc;
        }, {});

        // build final array, computing unitsInStock
        const processed = Object.values(grouped).map((g) => ({
          id: g.batchCode,
          date: g.date,
          recipe: g.recipe,
          unitsInStock: g.totalBatches * (recipesMap[g.recipe] || 0),
          batchCode: g.batchCode
        }));

        setRecipeInventory(processed);
      } catch (err) {
        console.error("Error processing recipe inventory:", err);
      }
    };

    fetchAndProcess();
  }, [cognitoId, recipesMap, setRecipeInventory]);

  // define columns — no more batchesRemaining column
  const columns = [
    { field: "date", headerName: "Date", flex: 1 },
    { field: "recipe", headerName: "Recipe Name", flex: 1 },
    {
      field: "unitsInStock",
      headerName: "Units in Stock",
      type: "number",
      align: "left",
      headerAlign: "left",
      flex: 1
    },
    { field: "batchCode", headerName: "Batch Code", flex: 1 }
  ];

  // data for the bar chart
  const barChartData = recipeInventory.map((item) => ({
    recipe: item.recipe,
    units: item.unitsInStock
  }));

  return (
    <Box m="20px">
      <Header
        title="STOCK INVENTORY"
        subtitle="Track Your Stock Based on Production"
      />

      <Box display="flex" justifyContent="flex-end" mb={2}>
        <IconButton
          onClick={() => setDrawerOpen(true)}
          sx={{
            color: colors.blueAccent[300],
            "&:hover": { backgroundColor: "transparent", color: colors.blueAccent[700] }
          }}
        >
          <BarChartOutlinedIcon />
        </IconButton>
      </Box>

      <Box
        m="40px 0 0 0"
        height="75vh"
        sx={{
          overflowX: "auto",
          "& .MuiDataGrid-root": { border: "none", minWidth: "650px" },
          "& .MuiDataGrid-cell": { borderBottom: "none" },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none"
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400]
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.blueAccent[700]
          }
        }}
      >
        <DataGrid
          rows={recipeInventory}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          getRowId={(row) => row.id}
        />
      </Box>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: "90%",
            borderRadius: "20px 0 0 20px",
            overflow: "hidden"
          }
        }}
      >
        <Box sx={{ backgroundColor: colors.primary[400], height: "100%" }}>
          <Box
            sx={{
              width: "100%",
              height: "50px",
              backgroundColor: colors.blueAccent[500],
              color: colors.grey[100],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              padding: "0 10px"
            }}
          >
            <IconButton
              onClick={() => setDrawerOpen(false)}
              sx={{ color: "white", position: "absolute", left: 10 }}
            >
              <MenuOutlinedIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "white" }}>
              Units in Stock Chart
            </Typography>
          </Box>

          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{ width: "100%", height: "70%", mt: 2 }}
          >
            <BarChart
              data={barChartData}
              keys={["units"]}
              indexBy="recipe"
              height="500px"
              width="90%"
            />
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default RecipeInventory;
