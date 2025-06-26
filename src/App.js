import { Amplify } from 'aws-amplify';
import { Authenticator, CheckboxField, useAuthenticator, useTheme, Heading, Text, View, Image, Button } from '@aws-amplify/ui-react';
import awsExports from './aws-exports';
import '@aws-amplify/ui-react/styles.css';
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
import { AuthProvider } from "./contexts/AuthContext"; // Import AuthProvider


const components = {
  Header() {
    const { tokens } = useTheme();
    return (
      <View textAlign="center" padding={tokens.space.large}>
        <Image 
          alt="User Logo" 
          src="/user.png" 
          style={{ width: "130px", height: "130px", objectFit: "contain" }} 
        />
      </View>
    );
  },
  
  Footer() {
    const { tokens } = useTheme();
    return (
      <View textAlign="center" padding={tokens.space.large}>
        <Text color={tokens.colors.neutral[80]}>&copy; All Rights Reserved</Text>
      </View>
    );
  },
  
  SignIn: {
    Header() {
      const { tokens } = useTheme();
      return (
        <Heading padding={`${tokens.space.xl} 0 0 ${tokens.space.xl}`} level={3}>
          Sign in to your account
        </Heading>
      );
    },
    Footer() {
      const { toForgotPassword } = useAuthenticator();
      return (
        <View textAlign="center">
          <Button fontWeight="normal" onClick={toForgotPassword} size="small" variation="link">
            Reset Password
          </Button>
        </View>
      );
    },
  },

  SignUp: {
    Header() {
      const { tokens } = useTheme();
      return (
        <Heading padding={`${tokens.space.xl} 0 0 ${tokens.space.xl}`} level={3}>
          Create a new account
        </Heading>
      );
    },
    Footer() {
      const { toSignIn } = useAuthenticator();
      return (
        <View textAlign="center">
          <Button fontWeight="normal" onClick={toSignIn} size="small" variation="link">
            Back to Sign In
          </Button>
        </View>
      );
    },
    FormFields() {
      const { validationErrors } = useAuthenticator();
      return (
        <>
          {/* Default Sign-Up Fields */}
          <Authenticator.SignUp.FormFields />
          {/* Custom Acknowledgement Field */}
          <CheckboxField
            name="acknowledgement"
            label="I agree to the Terms and Conditions"
            errorMessage={validationErrors.acknowledgement}
            hasError={!!validationErrors.acknowledgement}
          />
        </>
      );
    },
  },
};

Amplify.configure(awsExports);

function App() {
  const [theme, colorMode] = useMode();
  return (
    <AuthProvider> {/* Wrap the entire app */}
      <Authenticator components={components}>
        {({ signOut, user }) => (
          <AuthProvider value={{ user, signOut }}>
            <ColorModeContext.Provider value={colorMode}>
              <ThemeProvider theme={theme}>
                <CssBaseline />
                <DataProvider>
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
                        <Route path="*" element={<Navigate to="/" />} />
                      </Routes>
                    </main>
                  </div>
                </DataProvider>
              </ThemeProvider>
            </ColorModeContext.Provider>
          </AuthProvider>
        )}
      </Authenticator>
    </AuthProvider>
  );
}

export default App;