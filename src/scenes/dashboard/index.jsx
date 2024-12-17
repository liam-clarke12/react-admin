import React from 'react';
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { tokens } from "../../themes";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import EggAltIcon from '@mui/icons-material/EggAlt';
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import BarChart from "../../components/BarChart"; // Use the BarChart component from the ingredients inventory
import StatBox from "../../components/StatBox";
import { useData } from '../../contexts/DataContext';

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
        {/* Add any header content here if needed */}
      </Box>

      {/* GRID & CHARTS */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(12, 1fr)"
        gridAutoRows="minmax(140px, auto)"
        gap="20px"
        sx={{
          // Mobile-first: single column layout for smaller screens
          '@media (max-width: 600px)': {
            gridTemplateColumns: 'repeat(1, 1fr)',
            gap: '10px', // Smaller gap on mobile
          },
          // Tablets or larger devices: 2 columns
          '@media (min-width: 600px) and (max-width: 960px)': {
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '15px',
          },
          // Larger screens: 4 columns
          '@media (min-width: 960px)': {
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: '20px',
          },
        }}
      >
        {/* ROW 1 */}
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          sx={{
            // Mobile first: full width for small screens
            '@media (max-width: 600px)': {
              gridColumn: 'span 12',
            },
          }}
        >
          <StatBox
            title={`${zeroStockCount}`}
            subtitle="0 Stock Ingredients"
            progress={`${zeroStockPercentage / 100}`}
            increase={`${zeroStockPercentage}%`}
            icon={
              <EggAltIcon
                sx={{ color: colors.blueAccent[600], fontSize: "26px" }}
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
          sx={{
            '@media (max-width: 600px)': {
              gridColumn: 'span 12',
            },
          }}
        >
          <StatBox
            title="431,225"
            subtitle="Sales Obtained"
            progress="0.50"
            increase="+21%"
            icon={
              <PointOfSaleIcon
                sx={{ color: colors.blueAccent[600], fontSize: "26px" }}
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
          sx={{
            '@media (max-width: 600px)': {
              gridColumn: 'span 12',
            },
          }}
        >
          <StatBox
            title="32,441"
            subtitle="New Clients"
            progress="0.30"
            increase="+5%"
            icon={
              <PersonAddIcon
                sx={{ color: colors.blueAccent[600], fontSize: "26px" }}
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
          sx={{
            '@media (max-width: 600px)': {
              gridColumn: 'span 12',
            },
          }}
        >
          <StatBox
            title={`${recipeCount}`}
            subtitle="Number of Recipes"
            progress="0"
            icon={
              <TextSnippetIcon
                sx={{ color: colors.blueAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>

        {/* ROW 2 */}
        <Box
          gridColumn="span 8"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          height="94%"
          overflow="auto"
          sx={{
            '@media (max-width: 600px)': {
              gridColumn: 'span 12',
            },
          }}
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
                  sx={{ fontSize: "26px", color: colors.blueAccent[500] }}
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
          height ="94%"
          backgroundColor={colors.primary[400]}
          overflow="auto"
          sx={{
            '@media (max-width: 600px)': {
              gridColumn: 'span 12',
            },
          }}
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
                    color={colors.blueAccent[500]}
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
      </Box>
    </Box>
  );
};

export default Dashboard;
