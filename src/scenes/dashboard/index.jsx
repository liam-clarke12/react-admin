import React from 'react';
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { tokens } from "../../themes";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import EggAltIcon from '@mui/icons-material/EggAlt';
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import LineChart from "../../components/LineChart";
import BarChart from "../../components/BarChart"; // Use the BarChart component from the ingredients inventory
import StatBox from "../../components/StatBox";
import ProgressCircle from "../../components/ProgressCircle";
import { useData } from '../../contexts/DataContext';
import PieChart from "../../components/PieChart"; // Import the PieChart component

const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  const { ingredientInventory, rows } = useData();

  const zeroStockCount = ingredientInventory.filter(item => item.amount === 0).length;
  const totalIngredients = ingredientInventory.length;
  const zeroStockPercentage = totalIngredients > 0 ? ((zeroStockCount / totalIngredients) * 100).toFixed(2) : 0;
  const recipeCount = rows.length;

  // Prepare data for the bar chart
  const barChartData = ingredientInventory.map(item => ({
    ingredient: item.ingredient, // Use ingredient name as the index
    amount: item.amount, // The amount of each ingredient
  }));

  return (
    <Box m="20px">
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
      </Box>

      {/* GRID & CHARTS */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(12, 1fr)"
        gridAutoRows="minmax(140px, auto)"
        gap="20px"
      >
        {/* ROW 1 */}
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title={`${zeroStockCount}`}
            subtitle="0 Stock Ingredients"
            progress={`${zeroStockPercentage / 100}`}
            increase={`${zeroStockPercentage}%`}
            icon={
              <EggAltIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title="431,225"
            subtitle="Sales Obtained"
            progress="0.50"
            increase="+21%"
            icon={
              <PointOfSaleIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title="32,441"
            subtitle="New Clients"
            progress="0.30"
            increase="+5%"
            icon={
              <PersonAddIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title={`${recipeCount}`}
            subtitle="Number of Recipes"
            progress="0"
            icon={
              <TextSnippetIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>

        {/* ROW 2 */}
        <Box
          gridColumn="span 8"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          height="100%"
          overflow="auto"
        >
          <Box
            mt="25px"
            p="0 30px"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography
                variant="h5"
                fontWeight="600"
                color={colors.grey[100]}
              >
                Ingredient Inventory
              </Typography>
            </Box>
            <Box>
              <IconButton>
                <DownloadOutlinedIcon
                  sx={{ fontSize: "26px", color: colors.greenAccent[500] }}
                />
              </IconButton>
            </Box>
          </Box>
          <Box height="250px" m="-20px 0 0 0">
            <BarChart
              data={barChartData}
              keys={["amount"]}
              indexBy="ingredient"
              height="250px" // Adjust height for the chart
              width="90%" // Adjust width for a better fit
            />
          </Box>
        </Box>
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          overflow="auto"
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            borderBottom={`4px solid ${colors.primary[400]}`}
            p="15px"
          >
            <Typography color={colors.grey[100]} variant="h5" fontWeight="600">
              Ingredient Inventory
            </Typography>
          </Box>
          <Box height="280px" overflow="auto">
            {ingredientInventory.map((ingredient, i) => (
              <Box
                key={`${ingredient.name}-${i}`}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                borderBottom={`4px solid ${colors.primary[400]}`}
                p="15px"
              >
                <Box color={colors.grey[100]}>
                  {ingredient.ingredient}
                </Box>
                <Box>
                  <Typography
                    color={colors.greenAccent[500]}
                    variant="h5"
                    fontWeight="600"
                  >
                    {ingredient.name}
                  </Typography>
                  <Typography color={colors.grey[100]}>
                    Amount: {ingredient.amount}kg
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
        {/* ROW 3 */}
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          p="30px"
          overflow="auto"
        >
          <Typography variant="h5" fontWeight="600">
            Campaign
          </Typography>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            mt="25px"
          >
            <ProgressCircle size="125" />
            <Typography
              variant="h5"
              color={colors.greenAccent[500]}
              sx={{ mt: "15px" }}
            >
              $48,352 revenue generated
            </Typography>
            <Typography>Includes extra misc expenditures and costs</Typography>
          </Box>
        </Box>
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          overflow="auto"
        >
          <Box
            mt="25px"
            p="0 30px"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography
              variant="h5"
              fontWeight="600"
              color={colors.grey[100]}
            >
              Recipe Distribution
            </Typography>
          </Box>
          <Box height="250px" m="-20px 0 0 0" overflow="auto">
            <LineChart isDashboard={true} /> {/* Retained Line Chart */}
          </Box>
        </Box>
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          padding="30px"
          overflow="auto"
        >
          <Typography
            variant="h5"
            fontWeight="600"
            sx={{ marginBottom: "15px" }}
          >
            Recipe Pie Chart
          </Typography>
          <Box height="200px">
            <PieChart /> {/* Added Pie Chart */}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
