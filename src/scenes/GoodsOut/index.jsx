import { Box, useTheme, Button, Drawer, Typography, IconButton } from "@mui/material";
import React, { useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../themes";
import Header from "../../components/Header";
import { useData } from "../../contexts/DataContext";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";

const GoodsOut = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { GoodsOut, clearGoodsOut, loading, addGoodsOutRow } = useData();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerHeader, setDrawerHeader] = useState("");
  const [drawerContent, setDrawerContent] = useState([]);

  const handleDrawerOpen = (header, content) => {
    console.log("Opening Drawer with Header:", header);
    console.log("Drawer Content Input:", content);
  
    // Check for content length and process accordingly
    let formattedContent;
  
    if (header === "Batchcodes") {
      formattedContent = content.length
        ? content.map((item, index) => {
            const prevBatchcode = item.prevBatchcode || "No previous batchcode";
            const currentBatchcode = item.currentBatchcode || "No current batchcode";
  
            if (prevBatchcode === currentBatchcode) {
              console.log(`Batchcode for ${item.recipe}: No change`);
              return (
                <div key={index}>
                  {item.recipe}: {currentBatchcode}
                </div>
              );
            }
  
            console.log(`Batchcode Change for ${item.recipe}: ${prevBatchcode} -> ${currentBatchcode}`);
            return (
              <div key={index}>
                {item.recipe}: {prevBatchcode}, {currentBatchcode}
              </div>
            );
          })
        : ["No batchcodes available"];
    } else {
      formattedContent = ["No data available"];
    }
  
    console.log("Formatted Drawer Content:", formattedContent);
    setDrawerHeader(header);
    setDrawerContent(formattedContent);
    setDrawerOpen(true);
  };  

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  const columns = [
    { field: "date", headerName: "Date", flex: 1, editable: false },
    { field: "recipe", headerName: "Recipe Name", flex: 1, editable: false },
    {
      field: "amount",
      headerName: "Units going Out",
      type: "number",
      flex: 1,
      headerAlign: "left",
      align: "left",
      editable: false,
    },
    {
      field: "batchcodes",
      headerName: "Batchcodes",
      flex: 1,
      renderCell: (params) => {
        // Log the params object to inspect its structure
        console.log("Batchcodes Field Params:", params);
    
        // Safely check for batchcodeChanges in the row
        const batchcodes = Array.isArray(params.row.batchcodeChanges) && params.row.batchcodeChanges.length
          ? params.row.batchcodeChanges.map((change) => ({
              recipe: change.recipe || "Unknown recipe",
              prevBatchcode: change.prevBatchcode || "No previous batchcode",
              currentBatchcode: change.currentBatchcode || "No current batchcode",
            }))
          : [];
    
        // Log the mapped batchcodes to verify what we are passing to the drawer
        console.log("Mapped Batchcodes for Drawer:", batchcodes);
    
        return (
          <span
            style={{ cursor: "pointer", color: colors.blueAccent[500] }}
            onClick={() => handleDrawerOpen("Batchcodes", batchcodes)}
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
      editable: false,
    },
      ];

  const processRowUpdate = (newRow) => {
    addGoodsOutRow(newRow);
    return newRow;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Box m="20px">
      <Header title="GOODS OUT" subtitle="Track Goods Out Information" />

      <Button
        variant="contained"
        color="secondary"
        onClick={clearGoodsOut}
        sx={{ mb: 2 }}
      >
        Clear Data
      </Button>

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
            Array.isArray(GoodsOut)
              ? GoodsOut.map((row, index) => ({
                  ...row,
                  id: row.batchCode || `${row.recipe}-${index}`,
                  rowClassName: index % 2 === 0 ? "even-row" : "odd-row",
                }))
              : []
          }
          columns={columns}
          processRowUpdate={processRowUpdate}
          getRowId={(row) => row.batchCode || row.id}
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
