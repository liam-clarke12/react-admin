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
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fetch and process production log
  useEffect(() => {
    if (!cognitoId) return;

    const fetchAndProcess = async () => {
      try {
        const response = await fetch(
          `https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/production-log?cognito_id=${cognitoId}`
        );
        if (!response.ok) throw new Error("Failed to fetch production-log");
        const data = await response.json();
        if (!Array.isArray(data)) return;

        const filtered = data.filter((row) => Number(row.batchRemaining) > 0);

        const grouped = filtered.reduce((acc, row) => {
          const rec = row.recipe;
          const rem = Number(row.batchRemaining) || 0;
          const waste = Number(row.units_of_waste) || 0;
          if (!acc[rec]) {
            acc[rec] = {
              date: row.date,
              recipe: rec,
              totalUnits: rem - waste,
              batchCode: row.batchCode
            };
          } else {
            acc[rec].totalUnits += rem - waste;
          }
          return acc;
        }, {});

        const processed = Object.values(grouped).map((g) => ({
          id: g.batchCode,
          date: g.date,
          recipe: g.recipe,
          unitsInStock: g.totalUnits,
          batchCode: g.batchCode
        }));

        setRecipeInventory(processed);
      } catch (err) {
        console.error("Error processing recipe inventory:", err);
      }
    };

    fetchAndProcess();
  }, [cognitoId, setRecipeInventory]);

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
