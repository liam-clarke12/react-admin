import { ResponsivePie } from "@nivo/pie";
import { tokens } from "../themes";
import { useTheme } from "@mui/material";
import { useData } from "../contexts/DataContext"; // Adjust the import according to your file structure

const PieChart = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Get recipe data from the context
  const { rows } = useData(); // Assuming 'rows' contains the recipe data
  
  console.log("rows data:", rows); // Check if data is loading correctly

  // Group recipes by name and sum their quantities
  const groupedData = rows.reduce((acc, recipe) => {
    const existing = acc.find(item => item.id === recipe.name);
    const quantity = recipe.quantity || 0; // Fallback to 0 if quantity is null or undefined
    if (existing) {
      existing.value += quantity;
    } else {
      acc.push({ id: recipe.name, value: quantity });
    }
    return acc;
  }, []);
//test  
  console.log("groupedData:", groupedData); // Check if groupedData is being created as expected

  
  if (!groupedData || groupedData.length === 0) {
    return <div>No data available</div>;
  }

  return (
    <ResponsivePie
      data={groupedData}
      theme={{
        axis: {
          domain: {
            line: {
              stroke: colors.grey[100],
            },
          },
          legend: {
            text: {
              fill: colors.grey[100],
            },
          },
          ticks: {
            line: {
              stroke: colors.grey[100],
              strokeWidth: 1,
            },
            text: {
              fill: colors.grey[100],
            },
          },
        },
        legends: {
          text: {
            fill: colors.grey[100],
          },
        },
      }}
      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
      innerRadius={0.2}
      padAngle={1}
      cornerRadius={3}
      activeOuterRadiusOffset={8}
      borderColor={{
        from: "color",
        modifiers: [["darker", 0.2]],
      }}
      arcLinkLabelsSkipAngle={10}
      arcLinkLabelsTextColor={colors.grey[100]}
      arcLinkLabelsThickness={2}
      arcLinkLabelsColor={{ from: "color" }}
      enableArcLabels={false}
      arcLabelsRadiusOffset={0.4}
      arcLabelsSkipAngle={7}
      arcLabelsTextColor={{
        from: "color",
        modifiers: [["darker", 2]],
      }}
      defs={[
        {
          id: "dots",
          type: "patternDots",
          background: "inherit",
          color: "rgba(255, 255, 255, 0.3)",
          size: 4,
          padding: 1,
          stagger: true,
        },
        {
          id: "lines",
          type: "patternLines",
          background: "inherit",
          color: "rgba(255, 255, 255, 0.3)",
          rotation: -45,
          lineWidth: 6,
          spacing: 10,
        },
      ]}
      legends={[
        {
          anchor: "bottom",
          direction: "row",
          justify: false,
          translateX: 0,
          translateY: 56,
          itemsSpacing: 0,
          itemWidth: 100,
          itemHeight: 18,
          itemTextColor: "#999",
          itemDirection: "left-to-right",
          itemOpacity: 1,
          symbolSize: 18,
          symbolShape: "circle",
          effects: [
            {
              on: "hover",
              style: {
                itemTextColor: "#000",
              },
            },
          ],
        },
      ]}
    />
  );
};

export default PieChart;
