import { ResponsiveBar } from "@nivo/bar";
import { useTheme } from "@mui/material";
import { tokens } from "../themes"; // Ensure this imports your color tokens

const BarChart = ({ data, keys, indexBy, height = "500px", width = "100%" }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode); // Get colors based on the current theme mode

  // Define the theme to change the axis label and tick colors
  const customTheme = {
    axis: {
      ticks: {
        text: {
          fill: theme.palette.mode === "dark" ? colors.grey[100] : "#000000", // Set to black in light mode
        },
      },
      legend: {
        text: {
          fill: theme.palette.mode === "dark" ? colors.grey[100] : "#000000", // Set to black in light mode
        },
      },
    },
  };

  return (
    <div style={{ height, width }}>
      <ResponsiveBar
        data={data}
        keys={keys}
        indexBy={indexBy}
        margin={{ top: 50, right: 50, bottom: 60, left: 60 }} // Adjust margins for bigger chart
        padding={0.3}
        valueScale={{ type: "linear" }}
        indexScale={{ type: "band", round: true }}
        colors={(bar) => "#6870fa"} // Set bars to the desired color
        borderColor={{
          from: "color",
          modifiers: [["darker", 1.6]],
        }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: indexBy, // Use index field as legend (Ingredient)
          legendPosition: "middle",
          legendOffset: 40,
          tickTextColor: theme.palette.mode === "dark" ? colors.grey[100] : "#000000", // Set to black in light mode
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: "Stock on Hand",
          legendPosition: "middle",
          legendOffset: -40,
          tickTextColor: theme.palette.mode === "dark" ? colors.grey[100] : "#000000", // Set to black in light mode
        }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor="#ffffff" // Numbers on the bars in white
        legends={[]} // Remove legends
        role="application"
        ariaLabel="Nivo bar chart"
        barAriaLabel={(e) => `${e.id}: ${e.value} in ${e.indexValue}`} // Keep it simple
        theme={customTheme} // Apply custom theme
      />
    </div>
  );
};

export default BarChart;
