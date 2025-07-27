import React, { useState, useEffect } from "react";
import {
  Box,
  useTheme,
  Drawer,
  Typography,
  IconButton,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../themes";
import Header from "../../components/Header";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import { useAuth } from "../../contexts/AuthContext";

const GoodsOut = () => {
  const { cognitoId } = useAuth();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [goodsOut, setGoodsOut] = useState([]);
  const [recipesMap, setRecipesMap] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerHeader, setDrawerHeader] = useState("");
  const [drawerContent, setDrawerContent] = useState([]);

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

  // 2) Fetch goods-out data
  useEffect(() => {
    if (!cognitoId) return;
    const fetchGoodsOutData = async () => {
      try {
        const response = await fetch(
          `https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api/goods-out?cognito_id=${cognitoId}`
        );
        if (!response.ok) throw new Error("Failed to fetch goods out");
        const data = await response.json();
        setGoodsOut(data);
      } catch (error) {
        console.error("Error fetching goods out:", error);
      }
    };
    fetchGoodsOutData();
  }, [cognitoId]);

  const handleDrawerOpen = (header, content) => {
    let formattedContent;

    if (header === "Batchcodes") {
      const { batchcodes, quantitiesUsed, recipe } = content;
      const upb = recipesMap[recipe] || 0;

      formattedContent = batchcodes.map((batchCode, idx) => {
        const batches = quantitiesUsed[idx] || 0;
        const units = batches * upb;
        return (
          <div key={idx}>
            {batchCode}: {units.toLocaleString()} units
          </div>
        );
      });
    } else {
      formattedContent = ["No data available"];
    }

    setDrawerHeader(header);
    setDrawerContent(formattedContent);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  const columns = [
    { field: "date", headerName: "Date", flex: 1 },
    { field: "recipe", headerName: "Recipe Name", flex: 1 },
    {
      field: "stockAmount",
      headerName: "Units Going Out",
      type: "number",
      flex: 1,
      headerAlign: "left",
      align: "left",
    },
    {
      field: "batchcodes",
      headerName: "Batchcodes",
      flex: 1,
      renderCell: (params) => {
        let batchcodes = [];
        let quantitiesUsed = [];

        try {
          batchcodes = Array.isArray(params.row.batchcodes)
            ? params.row.batchcodes
            : JSON.parse(params.row.batchcodes || "[]");
          quantitiesUsed = Array.isArray(params.row.quantitiesUsed)
            ? params.row.quantitiesUsed
            : JSON.parse(params.row.quantitiesUsed || "[]");
        } catch (e) {
          console.error("Failed to parse batchcodes:", e);
        }

        return (
          <span
            style={{ cursor: "pointer", color: colors.blueAccent[500] }}
            onClick={() =>
              handleDrawerOpen("Batchcodes", {
                batchcodes,
                quantitiesUsed,
                recipe: params.row.recipe,
              })
            }
          >
            Show Batchcodes
          </span>
        );
      },
    },
    {
      field: "recipients",
      headerName: "Recipients",
      flex: 1,
      headerAlign: "left",
      align: "left",
    },
  ];

  return (
    <Box m="20px">
      <Header title="GOODS OUT" subtitle="Track Goods Out Information" />

      <Box
        m="40px 0 0 0"
        height="75vh"
        sx={{
          overflowX: "auto",
          "& .MuiDataGrid-root": { border: "none", minWidth: "650px" },
          "& .MuiDataGrid-cell": { borderBottom: "none" },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.blueAccent[700],
          },
          "& .even-row": {
            backgroundColor: colors.primary[450],
          },
          "& .odd-row": {
            backgroundColor: colors.primary[400],
          },
        }}
      >
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={handleDrawerClose}
          sx={{
            "& .MuiDrawer-paper": {
              borderRadius: "20px 0 0 20px",
              overflow: "hidden",
            },
          }}
        >
          <Box width="300px" p={0}>
            <Box
              sx={{
                width: "100%",
                backgroundColor: colors.blueAccent[500],
                color: colors.grey[100],
                padding: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconButton
                onClick={handleDrawerClose}
                sx={{ color: "white", position: "absolute", left: 10 }}
              >
                <MenuOutlinedIcon />
              </IconButton>
              <Typography
                variant="h6"
                sx={{ fontWeight: "bold", color: "white" }}
              >
                {drawerHeader}
              </Typography>
            </Box>

            <Box p={2}>
              <ul>
                {drawerContent.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </Box>
          </Box>
        </Drawer>

        <DataGrid
          rows={
            Array.isArray(goodsOut)
              ? goodsOut.map((row, idx) => ({
                  ...row,
                  id: row.id || `${row.recipe}-${idx}`,
                  rowClassName: idx % 2 === 0 ? "even-row" : "odd-row",
                }))
              : []
          }
          columns={columns}
          getRowId={(row) => row.id}
          disableSelectionOnClick
          getRowClassName={(params) =>
            params.indexRelativeToCurrentPage % 2 === 0 ? "even-row" : "odd-row"
          }
        />
      </Box>
    </Box>
  );
};

export default GoodsOut;
