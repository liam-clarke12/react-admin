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
  ThemeProvider as AmplifyThemeProvider,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import awsExports from "./aws-exports";

import { ColorModeContext, useMode } from "./themes";
import { CssBaseline, ThemeProvider as MuiThemeProvider, CircularProgress, Box } from "@mui/material";

import LandingPage from "./components/LandingPage";
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

/** Brand tokens used for both Amplify UI and the hero panel */
const brand = {
  text: "#0f172a",
  subtext: "#334155",
  border: "#e5e7eb",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  primary: "#e11d48",
  primaryDark: "#be123c",
  focusRing: "rgba(225, 29, 72, 0.35)",
  shadow: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)",
};

/** Amplify UI theme overrides (unchanged from your original) */
const noryTheme = {
  name: "nory",
  tokens: {
    colors: {
      background: { primary: { value: "#ffffff" }, secondary: { value: "#f8fafc" } },
      font: { primary: { value: brand.text }, secondary: { value: brand.subtext } },
      border: { primary: { value: brand.border } },
      brand: {
        primary: {
          10: { value: "#ffe4ea" },
          20: { value: "#fecdd3" },
          60: { value: "#fb7185" },
          80: { value: brand.primary },
          90: { value: brand.primaryDark },
        },
      },
    },
    radii: { small: { value: "10px" }, medium: { value: "12px" }, large: { value: "16px" } },
    shadows: { small: { value: brand.shadow } },
    components: {
      authenticator: {
        router: {
          backgroundColor: { value: "{colors.background.primary}" },
          borderColor: { value: "{colors.border.primary}" },
          borderWidth: { value: "1px" },
          borderStyle: { value: "solid" },
          borderRadius: { value: "{radii.large}" },
          boxShadow: { value: "{shadows.small}" },
          maxWidth: { value: "420px" },
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

/** Amplify component overrides (unchanged from your original) */
const amplifyComponents = {
  Header() {
    const { tokens } = useTheme();
    return (
      <View textAlign="center" padding={`${tokens.space.medium} 0 0 0`}>
        <Image
          alt="Logo"
          src="/user.png"
          style={{ width: 60, height: 60, objectFit: "contain", margin: "0 auto" }}
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
        <Heading padding={`${tokens.space.medium} 0 0 0`} level={4} style={{ textAlign: "center" }}>
          Welcome back
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
        <Heading padding={`${tokens.space.medium} 0 0 0`} level={4} style={{ textAlign: "center" }}>
          Create your account
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

/** Left hero + right auth card (Hunter-style) */
function LoginLayout({ children }) {
  return (
    <div className="auth-split">
      <div className="auth-left">
        <div className="hero-inner">
          <div className="logo-row">
            <img src="/user.png" alt="Logo" />
          </div>
          <h1>Welcome to your kitchen command center</h1>
          <p>Track ingredients, plan production, and keep waste in check — all in one place.</p>
          <ul>
            <li>Real-time stock & barcodes</li>
            <li>Recipe-driven production</li>
            <li>Focused on product tracebility</li>
          </ul>
        </div>
      </div>

      <div className="auth-right">{children}</div>

      <style>{`
        .auth-split {
          min-height: 100dvh;
          display: grid;
          grid-template-columns: minmax(320px, 46%) 1fr;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
        }
        @media (max-width: 1000px) { .auth-split { grid-template-columns: 1fr; } }
        .auth-left {
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(800px 400px at 80% -20%, #ffe4ea 0%, rgba(255,228,234,0) 60%),
            linear-gradient(180deg, #fff 0%, #f8fafc 100%);
          border-right: 1px solid ${brand.border};
          display: grid;
          place-items: center;
          padding: 32px;
        }
        @media (max-width: 1000px) { .auth-left { display: none; } }
        .hero-inner { width: min(560px, 90%); color: ${brand.text}; }
        .logo-row img {
          width: 90px; height: 90px; object-fit: contain;
          filter: drop-shadow(0 1px 2px rgba(16,24,40,0.06));
        }
        .hero-inner h1 { margin: 16px 0 8px; font-size: clamp(26px, 4vw, 36px); line-height: 1.1; font-weight: 900; color: ${brand.text}; }
        .hero-inner p { margin: 0 0 16px; color: ${brand.subtext}; font-size: 16px; }
        .hero-inner ul { margin: 8px 0 0; padding: 0; list-style: none; display: grid; gap: 10px; }
        .hero-inner li {
          display: grid; grid-template-columns: 18px 1fr; align-items: start; gap: 10px;
          color: ${brand.text}; font-weight: 700;
        }
        .hero-inner li::before { content: "✓"; color: ${brand.primary}; font-weight: 900; line-height: 1.2; }
        .auth-right { display: grid; place-items: center; padding: clamp(16px, 4vw, 40px); }
        .auth-right .amplify-authenticator { margin-left: auto; }
      `}</style>
    </div>
  );
}

/** App content when authenticated */
function MainApp() {
  const [theme, colorMode] = useMode();
  return (
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
  );
}

/** Extract Cognito sub from Amplify user object */
function getCognitoSub(user) {
  return user?.userId || user?.username || user?.attributes?.sub || null;
}

/** Gate that decides: show login layout OR mount providers */
function AuthGate() {
  const { user } = useAuthenticator((ctx) => [ctx.user]);

  if (!user) {
    return (
      <LoginLayout>
        <Authenticator components={amplifyComponents} />
      </LoginLayout>
    );
  }

  const sub = getCognitoSub(user);
  if (!sub) {
    return (
      <Box
        sx={{
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: `linear-gradient(180deg, ${brand.surface} 0%, ${brand.surfaceMuted} 100%)`,
        }}
      >
        <Box
          sx={{
            p: 3,
            borderRadius: 2,
            border: `1px solid ${brand.border}`,
            background: brand.surface,
            boxShadow: brand.shadow,
            display: "grid",
            placeItems: "center",
            gap: 1,
          }}
        >
          <CircularProgress />
          <Text style={{ color: brand.subtext, fontWeight: 600 }}>Preparing your workspace…</Text>
        </Box>
      </Box>
    );
  }

  return (
    <AuthProvider key={sub} initialCognitoId={sub}>
      <MainApp />
    </AuthProvider>
  );
}

/** Root App */
function App() {
  return (
    <AmplifyThemeProvider theme={noryTheme}>
      <Authenticator.Provider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthGate />} />
          <Route path="/*" element={<Navigate to="/" />} />
        </Routes>
      </Authenticator.Provider>
    </AmplifyThemeProvider>
  );
}

export default App;
