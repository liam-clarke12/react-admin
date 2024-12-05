import { ColorModeContext, useMode } from "./themes";
import { CssBaseline, ThemeProvider } from "@mui/material";
import Topbar from "./scenes/global/Topbar";
import Sidebar from "./scenes/global/Sidebar";
import Dashboard from "./scenes/dashboard";
import GoodsIn from "./scenes/GoodsIn";
import GoodsOut from "./scenes/GoodsOut";
import ProductionLog from "./scenes/ProductionLog";
import StockUsage from "./scenes/StockUsage";
import Recipes from "./scenes/Recipes";
import RecipeInventory from "./scenes/RecipeInventory";
import GoodsInForm from "./scenes/form/GoodsIn";
import GoodsOutForm from "./scenes/form/GoodsOut";
import RecipeForm from "./scenes/form/Recipes";
import ProductionLogForm from "./scenes/form/ProductionLog";
import { Routes, Route } from "react-router-dom";
import { DataProvider } from "./contexts/DataContext"; // Import DataProvider
import IngredientsInventory from "./scenes/IngredientInventory";

function App() {
  //set theme
  const [theme, colorMode] = useMode();

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <DataProvider> {/* Wrap your component tree */}
          <div className="app">
            <Sidebar />
            <main className="content">
              <Topbar />
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/GoodsIn" element={<GoodsIn />} />
                <Route path="/GoodsInForm" element={<GoodsInForm />} />
                <Route path="/recipeform" element={<RecipeForm />} />
                <Route path="/recipes" element={<Recipes />} />
                <Route path="/IngredientsInventory" element={<IngredientsInventory />} />
                <Route path="/daily_production" element={<ProductionLog />} />
                <Route path="/recipe_production" element={<ProductionLogForm />} />
                <Route path="/stock_inventory" element={<RecipeInventory />} />
                <Route path="/stock_usage" element={<StockUsage />} />
                <Route path="/goods_out_form" element={<GoodsOutForm />} />
                <Route path="/goods_out" element={<GoodsOut />} />
                {/* Add additional routes here as needed */}
              </Routes>
            </main>
          </div>
        </DataProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
