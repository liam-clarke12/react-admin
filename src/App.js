import { AuthProvider, useAuth } from "./contexts/AuthContext"; // Import AuthProvider and useAuth
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
import { Routes, Route, Navigate } from "react-router-dom";
import { DataProvider } from "./contexts/DataContext";
import IngredientsInventory from "./scenes/IngredientInventory";
import LoginPage from "./login-signup/LoginPage";

function App() {
  const [theme, colorMode] = useMode();

  return (
    <AuthProvider> {/* Wrap the whole app with AuthProvider */}
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <DataProvider>
            <div className="app">
              <AuthRoutes /> {/* Use AuthRoutes to handle routing */}
              {/* Example: Displaying fetched data */}
            </div>
          </DataProvider>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </AuthProvider>
  );
}

// Create a separate component to handle routing logic based on authentication status
const AuthRoutes = () => {
  const { isAuthenticated, setIsAuthenticated } = useAuth(); // Use the authentication context

  return isAuthenticated ? (
    <>
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
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  ) : (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={() => setIsAuthenticated(true)} />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default App;
