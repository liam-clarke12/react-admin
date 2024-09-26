import { ResponsiveBar } from "@nivo/bar";

const BarChart = ({ data, keys, indexBy, height = "500px", width = "100%" }) => {
  // Hardcode the color you want to use for all bars and axis labels
  const hardcodedColor = "#3da58a"; // Replace with the drawer header color you want

  // Define the theme to change the axis label and tick colors
  const customTheme = {
    axis: {
      ticks: {
        text: {
          fill: hardcodedColor, // Axis tick label color
        },
      },
      legend: {
        text: {
          fill: hardcodedColor, // Axis legend (Stock on Hand and Ingredient) color
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
        // Hardcoded color for all bars
        colors={hardcodedColor}
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
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: "Stock on Hand",
          legendPosition: "middle",
          legendOffset: -40,
        }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor="#ffffff" // Numbers on the bars in white
        // Remove legends (amount key on the right)
        legends={[]}
        role="application"
        ariaLabel="Nivo bar chart"
        barAriaLabel={function (e) {
          return e.id + ": " + e.value + " in " + e.indexValue;
        }}
        // Apply the custom theme to change axis labels and legends color
        theme={customTheme}
      />
    </div>
  );
};

export default BarChart;
