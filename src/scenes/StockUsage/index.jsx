// src/scenes/usage/StockUsage.jsx  (adjust the path to your structure)
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  Button,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";

/** Nory-like brand tokens */
const brand = {
  text: "#0f172a",
  subtext: "#334155",
  border: "#e5e7eb",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  primary: "#2563eb",
  primaryDark: "#1d4ed8",
  focusRing: "rgba(37, 99, 235, 0.35)",
  shadow: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)",
};

const StockUsage = () => {
  const theme = useTheme();
  const { cognitoId } = useAuth();
  const [stockUsage, setStockUsage] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerHeader, setDrawerHeader] = useState("");
  const [drawerContent, setDrawerContent] = useState([]);

  useEffect(() => {
    if (!cognitoId) {
      console.warn("[StockUsage] ❗ Cognito ID not available. Skipping fetch.");
      return;
    }

    const fetchStockUsage = async () => {
      try {
        const url = `https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/stock-usage/${cognitoId}`;
        const response = await axios.get(url);
        if (!Array.isArray(response.data)) return;

        const groupedData = {};
        response.data.forEach((item, idx) => {
          const key = `${item.recipe_name}-${item.production_log_date}-${item.batchCode}`;
          if (!groupedData[key]) {
            groupedData[key] = {
              id: key,
              date: item.production_log_date,
              recipeName: item.recipe_name,
              batchCode: item.batchCode,
              batchesProduced: item.batchesProduced,
              ingredients: [],
              barcodes: [],
            };
          }
          if (!Array.isArray(item.ingredients)) return;
          item.ingredients.forEach((ingredient) => {
            const totalQuantity = ingredient.quantity * item.batchesProduced;
            groupedData[key].ingredients.push(
              `${ingredient.ingredient_name}: ${totalQuantity}`
            );
            groupedData[key].barcodes.push(
              `${ingredient.ingredient_name}: ${ingredient.ingredient_barcodes}`
            );
          });
        });

        const formattedData = Object.values(groupedData).map((entry) => ({
          ...entry,
          ingredients: entry.ingredients.join("; "),
          barcodes: entry.barcodes.join("; "),
        }));

        setStockUsage(formattedData);
      } catch (error) {
        console.error("[StockUsage] ❌ Error fetching stock usage:", error.message);
        if (error.response) {
          console.error(
            "[StockUsage] ❌ Backend returned error:",
            error.response.status,
            error.response.data
          );
        }
      }
    };

    fetchStockUsage();
  }, [cognitoId]);

  // Drawer helpers (same behavior, styled output)
  const handleDrawerOpen = (header, content) => {
    setDrawerHeader(header);

    if (header === "Barcodes") {
      if (Array.isArray(content)) {
        setDrawerContent(
          content.length ? (
            <ul style={{ margin: 0, paddingInlineStart: 18 }}>
              {content.map((item, i) => (
                <li key={i} style={{ color: brand.text, marginBottom: 6 }}>
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: brand.subtext }}>No data available</p>
          )
        );
      } else {
        setDrawerContent(<p style={{ color: brand.subtext }}>Error: Invalid data</p>);
      }
    } else if (header === "Ingredients") {
      if (Array.isArray(content)) {
        setDrawerContent(
          content.length ? (
            <ul style={{ margin: 0, paddingInlineStart: 18 }}>
              {content.map((item, i) => {
                const [ingredientName, quantity] = item.split(": ");
                return (
                  <li key={i} style={{ color: brand.text, marginBottom: 6 }}>
                    {ingredientName}: {quantity}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p style={{ color: brand.subtext }}>No data available</p>
          )
        );
      } else {
        setDrawerContent(<p style={{ color: brand.subtext }}>Error: Invalid data</p>);
      }
    }

    setDrawerOpen(true);
  };

  const handleDrawerClose = () => setDrawerOpen(false);

  const columns = useMemo(
    () => [
      { field: "date", headerName: "Date", flex: 1 },
      { field: "recipeName", headerName: "Recipe Name", flex: 1 },
      {
        field: "ingredients",
        headerName: "Ingredients",
        flex: 1,
        renderCell: (params) => (
          <Typography
            sx={{
              cursor: "pointer",
              color: brand.primary,
              fontWeight: 600,
              "&:hover": { color: brand.primaryDark },
            }}
            onClick={() =>
              handleDrawerOpen("Ingredients", params.row.ingredients.split("; "))
            }
          >
            Show Ingredients
          </Typography>
        ),
      },
      { field: "batchCode", headerName: "Batch Code", flex: 1 },
      {
        field: "barcodes",
        headerName: "Barcodes",
        flex: 1,
        renderCell: (params) => (
          <Typography
            sx={{
              cursor: "pointer",
              color: brand.primary,
              fontWeight: 600,
              "&:hover": { color: brand.primaryDark },
            }}
            onClick={() =>
              handleDrawerOpen("Barcodes", params.row.barcodes.split("; "))
            }
          >
            Show Barcodes
          </Typography>
        ),
      },
    ],
    []
  );

  return (
    <Box m="20px">
      {/* Scoped styles to prevent theme overrides */}
      <style>{`
        .su-card {
          border: 1px solid ${brand.border};
          background: ${brand.surface};
          border-radius: 16px;
          box-shadow: ${brand.shadow};
          overflow: hidden;
        }
        .su-toolbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px; border-bottom: 1px solid ${brand.border};
          background: ${brand.surface};
        }
        .su-clear {
          text-transform: none; font-weight: 800; border-radius: 999px; padding: 6px 12px;
          border: 1px solid ${brand.border}; color: ${brand.text}; background: #f1f5f9;
        }
        .su-clear:hover { background: #e2e8f0; }
      `}</style>

      {/* Card container */}
      <Box className="su-card" mt={2}>
        {/* Toolbar with Clear button */}
        <Box className="su-toolbar">
          <Typography sx={{ fontWeight: 800, color: brand.text }}>
            Stock Usage
          </Typography>
          <Button className="su-clear" onClick={() => setStockUsage([])}>
            Clear Stock Usage
          </Button>
        </Box>

        {/* DataGrid */}
        <Box
          sx={{
            height: "70vh",
            "& .MuiDataGrid-root": { border: "none", minWidth: "650px" },
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#fbfcfd",
              color: brand.subtext,
              borderBottom: `1px solid ${brand.border}`,
              fontWeight: 800,
            },
            "& .MuiDataGrid-columnSeparator": { display: "none" },
            "& .MuiDataGrid-cell": {
              borderBottom: `1px solid ${brand.border}`,
              color: brand.text,
            },
            "& .MuiDataGrid-row:hover": { backgroundColor: brand.surfaceMuted },
            "& .MuiDataGrid-footerContainer": {
              borderTop: `1px solid ${brand.border}`,
              background: brand.surface,
            },
          }}
        >
          <DataGrid rows={stockUsage} columns={columns} getRowId={(row) => row.id} />
        </Box>
      </Box>

      {/* Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleDrawerClose}
        PaperProps={{
          sx: {
            width: 320,
            borderRadius: "20px 0 0 20px",
            border: `1px solid ${brand.border}`,
            boxShadow: brand.shadow,
            overflow: "hidden",
          },
        }}
      >
        {/* Drawer header (gradient) */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 2,
            py: 1.25,
            color: "#fff",
            background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`,
          }}
        >
          <IconButton onClick={handleDrawerClose} sx={{ color: "#fff" }}>
            <MenuOutlinedIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#fff" }}>
            {drawerHeader}
          </Typography>
        </Box>

        <Box p={2} sx={{ background: brand.surface }}>{drawerContent}</Box>
      </Drawer>
    </Box>
  );
};

export default StockUsage;
