import React, { useState } from "react";
import { Box, useTheme, Button, Drawer, Typography, IconButton } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../themes";
import Header from "../../components/Header";
import { useData } from "../../contexts/DataContext";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";

const Recipes = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { rows, setRows } = useData();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerHeader, setDrawerHeader] = useState("");
  const [drawerContent, setDrawerContent] = useState([]);

  const columns = [
    { field: "recipe", headerName: "Recipe", flex: 1 },
    {
      field: "ingredients",
      headerName: "Ingredients",
      flex: 1,
      renderCell: (params) => (
        <span
          style={{ cursor: "pointer", color: colors.greenAccent[500] }} // Updated color
          onClick={() => handleDrawerOpen("Ingredients", params.row.ingredients)}
        >
          Show Ingredients
        </span>
      ),
    },
    {
      field: "quantities",
      headerName: "Quantities",
      flex: 1,
      renderCell: (params) => (
        <span
          style={{ cursor: "pointer", color: colors.greenAccent[500] }} // Updated color
          onClick={() =>
            handleDrawerOpen(
              "Quantities",
              params.row.ingredients.map((ingredient, index) => `${ingredient}: ${params.row.quantities[index]}`)
            )
          }
        >
          Show Quantities
        </span>
      ),
    },
  ];

  const handleDrawerOpen = (header, content) => {
    setDrawerHeader(header);
    setDrawerContent(content);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  return (
    <Box m="20px">
      <Header title="RECIPES" subtitle="Keep Track of your Recipes" />
      <Button
        onClick={() => {
          localStorage.removeItem("rows");
          setRows([]);
        }}
        color="error"
        variant="contained"
        sx={{ mb: 2 }}
      >
        Clear Data
      </Button>
      <Box
        m="40px 0 0 0"
        height="75vh"
        sx={{
          overflowX: 'auto',
          "& .MuiDataGrid-root": { 
            border: "none", minWidth: "650px" 
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
          },
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
        }}
      >
        <DataGrid checkboxSelection rows={rows} columns={columns} />
      </Box>

      {/* Drawer for displaying Ingredients or Quantities */}
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
          {/* Drawer Header */}
          <Box
            sx={{
              width: "100%",
              backgroundColor: colors.greenAccent[500],
              color: colors.grey[100],
              padding: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconButton onClick={handleDrawerClose} sx={{ color: "white", position: "absolute", left: 10 }}>
              <MenuOutlinedIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "white" }}>
              {drawerHeader}
            </Typography>
          </Box>

          {/* Drawer Content */}
          <Box p={2}>
            {drawerHeader === "Ingredients" ? (
              <ul>
                {drawerContent.map((ingredient, index) => (
                  <li key={index}>{ingredient}</li>
                ))}
              </ul>
            ) : (
              <ul>
                {drawerContent.map((content, index) => (
                  <li key={index}>{content}</li>
                ))}
              </ul>
            )}
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default Recipes;
