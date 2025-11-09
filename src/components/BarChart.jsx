// src/components/BarChart.jsx
import { ResponsiveBar } from "@nivo/bar";
import { useTheme } from "@mui/material";

// Nory / Ruby-Rose tokens (scoped here so app theme can’t override)
const brand = {
  text: "#0f172a",
  subtext: "#334155",
  border: "#e5e7eb",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  danger: "#dc2626",
  primary: "#7C3AED",     // Nory purple
  primaryDark: "#5B21B6", // darker purple
  focusRing: "rgba(124,58,237,0.18)",
  shadow: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)",
  inputBg: "#ffffff"
};

const BarChart = ({
  data,
  keys,
  indexBy,
  height = "500px",
  width = "100%",
  yLegend = "Units",
  valueFormat = ">,.0f",      // d3-format string
  unitField = "unit",         // field on each data row that holds the unit string
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const colors = {
    bg: isDark ? "#0b1220" : brand.surface,
    card: isDark ? "#111827" : brand.surface,
    border: isDark ? "rgba(148,163,184,0.25)" : brand.border,
    text: isDark ? "#e5e7eb" : brand.text,
    subtext: isDark ? "#cbd5e1" : brand.subtext,
    primary: brand.primary,
    primaryDark: brand.primaryDark,
  };

  const nivoTheme = {
    background: colors.bg,
    textColor: colors.text,
    fontSize: 12,
    axis: {
      domain: { line: { stroke: colors.border } },
      ticks: {
        line: { stroke: colors.border },
        text: { fill: colors.subtext, fontWeight: 600 },
      },
      legend: { text: { fill: colors.subtext, fontWeight: 700 } },
    },
    grid: { line: { stroke: colors.border } },
    legends: { text: { fill: colors.subtext } },
    tooltip: {
      container: {
        background: colors.card,
        color: colors.text,
        borderRadius: 12,
        boxShadow:
          "0 8px 16px rgba(15,23,42,0.12), 0 2px 4px rgba(15,23,42,0.06)",
        border: `1px solid ${colors.border}`,
      },
    },
  };

  // Single brand gradient for all bars
  const defs = [
    {
      id: "rubyGrad",
      type: "linearGradient",
      colors: [
        { offset: 0, color: colors.primary },
        { offset: 100, color: colors.primaryDark },
      ],
    },
  ];
  const fills = [{ match: "*", id: "rubyGrad" }];

  return (
    <div
      style={{
        height,
        width,
        border: `1px solid ${colors.border}`,
        borderRadius: 16,
        background: colors.card,
        boxShadow: brand.shadow,
        padding: 8,
      }}
    >
      <ResponsiveBar
        data={data}
        keys={keys}
        indexBy={indexBy}
        margin={{ top: 28, right: 24, bottom: 56, left: 64 }}
        padding={0.36}
        valueScale={{ type: "linear" }}
        indexScale={{ type: "band", round: true }}
        colors={() => colors.primary}
        defs={defs}
        fill={fills}
        borderRadius={6}
        enableGridX={false}
        enableGridY={true}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 8,
          tickRotation: 0,
          legend: indexBy,
          legendPosition: "middle",
          legendOffset: 40,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 8,
          tickRotation: 0,
          legend: yLegend,
          legendPosition: "middle",
          legendOffset: -48,
        }}
        labelSkipWidth={16}
        labelSkipHeight={16}
        labelTextColor="#ffffff"
        // Label on each bar: value + unit (e.g., "5 kg", "500 g")
        label={(bar) => {
          const nf = new Intl.NumberFormat();
          const unit = bar.data?.[unitField] ?? "";
          return `${nf.format(bar.value)}${unit ? ` ${unit}` : ""}`;
        }}
        valueFormat={valueFormat}
        legends={[]}
        animate={true}
        motionConfig="gentle"
        role="application"
        ariaLabel="Bar chart"
        barAriaLabel={(e) => `${e.id}: ${e.formattedValue} in ${e.indexValue}`}
        theme={nivoTheme}
        tooltip={({ indexValue, value, color, data }) => (
          <div
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: `1px solid ${colors.border}`,
              background: colors.card,
              color: colors.text,
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontWeight: 700,
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: 999,
                background: color,
              }}
            />
            {String(indexValue)} · {new Intl.NumberFormat().format(value)}
            {data?.[unitField] ? ` ${data[unitField]}` : ""}
          </div>
        )}
      />
    </div>
  );
};

export default BarChart;
