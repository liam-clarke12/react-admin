// App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Amplify } from "aws-amplify";
import {
  Authenticator,
  CheckboxField,
  useAuthenticator,
  useTheme,
  Heading,
  Text,
  View,
  Image,
  Button,
  ThemeProvider as AmplifyThemeProvider, // ✅ use Amplify UI ThemeProvider
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import awsExports from "./aws-exports";

import { ColorModeContext, useMode } from "./themes";
import { CssBaseline, ThemeProvider as MuiThemeProvider } from "@mui/material"; // ✅ alias MUI ThemeProvider

import AccountPage from "./scenes/Account/Account";
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
import IngredientsInventory from "./scenes/IngredientInventory";

import { DataProvider } from "./contexts/DataContext";
import { AuthProvider } from "./contexts/AuthContext";

Amplify.configure(awsExports);

/** Nory-like theme for Amplify UI */
const noryTheme = {
  name: "nory",
  tokens: {
    colors: {
      background: {
        primary: { value: "#ffffff" },
        secondary: { value: "#f8fafc" },
      },
      font: {
        primary: { value: "#0f172a" },
        secondary: { value: "#334155" },
      },
      border: {
        primary: { value: "#e5e7eb" },
      },
      brand: {
        primary: {
          10: { value: "#ffe4ea" },
          20: { value: "#fecdd3" },
          60: { value: "#fb7185" },
          80: { value: "#e11d48" }, // main
          90: { value: "#be123c" }, // hover
        },
      },
    },
    radii: {
      small: { value: "10px" },
      medium: { value: "14px" },
      large: { value: "16px" },
    },
    shadows: {
      small: {
        value:
          "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)",
      },
    },
    components: {
      authenticator: {
        router: {
          backgroundColor: { value: "{colors.background.primary}" },
          borderColor: { value: "{colors.border.primary}" },
          borderWidth: { value: "1px" },
          borderStyle: { value: "solid" },
          borderRadius: { value: "{radii.large}" },
          boxShadow: { value: "{shadows.small}" },
        },
      },
      fieldcontrol: {
        borderColor: { value: "{colors.border.primary}" },
        borderRadius: { value: "{radii.medium}" },
        _focus: {
          borderColor: { value: "{colors.brand.primary.80}" },
          boxShadow: { value: "0 0 0 4px rgba(225,29,72,0.35)" },
        },
      },
      button: {
        primary: {
          backgroundColor: { value: "{colors.brand.primary.80}" },
          borderRadius: { value: "999px" },
          _hover: { backgroundColor: { value: "{colors.brand.primary.90}" } },
        },
      },
      tabs: {
        item: {
          color: { value: "{colors.font.secondary}" },
          _active: {
            color: { value: "{colors.brand.primary.80}" },
            borderColor: { value: "{colors.brand.primary.80}" },
          },
        },
      },
    },
  },
};

/** Existing Amplify Auth component overrides */
const components = {
  Header() {
    const { tokens } = useTheme();
    return (
      <View textAlign="center" padding={tokens.space.large}>
        <Image
          alt="User Logo"
          src="/user.png"
          style={{ width: 120, height: 120, objectFit: "contain" }}
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
          <Button
            fontWeight="normal"
            onClick={toForgotPassword}
            size="small"
            variation="link"
          >
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
          <Authenticator.SignUp.FormFields />
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

function App() {
  const [theme, colorMode] = useMode();

  return (
    <AuthProvider>
      <AmplifyThemeProvider theme={noryTheme}>
        {/* Auth screens background */}
        <style>{`
          .auth-shell {
            min-height: 100dvh;
            display: grid;
            place-items: center;
            background:
              radial-gradient(1200px 600px at 80% -20%, #ffe4ea 0%, rgba(255,228,234,0) 60%),
              linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
            padding: 24px;
          }
          .amplify-authenticator {
            max-width: 480px;
            width: 100%;
          }
        `}</style>

        <Authenticator components={components}>
          {({ user }) =>
            user ? (
              <ColorModeContext.Provider value={colorMode}>
                <MuiThemeProvider theme={theme}>
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
                          <Route path="/account" element={<AccountPage />} />
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
                </MuiThemeProvider>
              </ColorModeContext.Provider>
            ) : (
              <div className="auth-shell" />
            )
          }
        </Authenticator>
      </AmplifyThemeProvider>
    </AuthProvider>
  );
}

export default App;
