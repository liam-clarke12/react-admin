import { ColorModeContext, useMode } from "./themes";
import { CssBaseline, ThemeProvider } from "@mui/material";
import Topbar from "./scenes/global/Topbar";
import Sidebar from "./scenes/global/Sidebar";
import Dashboard from "./scenes/dashboard";
import GoodsIn from "./scenes/GoodsIn";
import ProductionLog from "./scenes/ProductionLog";
import Recipes from "./scenes/Recipes";
import RecipeInventory from "./scenes/RecipeInventory";
import GoodsInForm from "./scenes/form/GoodsIn";
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
                <Route path="/production_log" element={<ProductionLog />} />
                <Route path="/recipe_production" element={<ProductionLogForm />} />
                <Route path="/recipe_inventory" element={<RecipeInventory />} />
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
