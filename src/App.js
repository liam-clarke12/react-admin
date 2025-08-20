// App.jsx
import React from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import { Amplify } from "aws-amplify";
import {
  Authenticator,
  CheckboxField,
  useAuthenticator,
  useTheme,
  Heading,
  Text,
  View,
  Button,
  ThemeProvider as AmplifyThemeProvider,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import awsExports from "./aws-exports";

import { ColorModeContext, useMode } from "./themes";
import { CssBaseline, ThemeProvider as MuiThemeProvider, CircularProgress, Box } from "@mui/material";

import LandingPage from "./scenes/LandingPage";
import ContactPage from "./scenes/ContactPage"; // ✅ matches src/scenes/ContactPage/index.jsx
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

/** Brand tokens */
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

/** Amplify UI theme overrides */
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

/** Amplify component overrides */
const amplifyComponents = {
  Header() {
    return null;
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
          {/* Renders all fields defined in `formFields.signUp` */}
          <Authenticator.SignUp.FormFields />
          {/* Required T&Cs checkbox (value enforced by validateCustomSignUp) */}
          <CheckboxField
            name="acknowledgement"
            label="I agree to the Terms and Conditions"
            isRequired
            errorMessage={validationErrors.acknowledgement}
            hasError={!!validationErrors.acknowledgement}
          />
        </>
      );
    },
  },
};

/** Left hero + right auth card */
function LoginLayout({ children }) {
  return (
    <div className="auth-split">
      <div className="auth-left">
        <Link to="/" className="back-arrow-left">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            fill="none"
            stroke={brand.primary}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </Link>
        <div className="hero-inner">
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
        .hero-inner h1 { margin: 16px 0 8px; font-size: clamp(26px, 4vw, 36px); line-height: 1.1; font-weight: 900; color: ${brand.text}; }
        .hero-inner p { margin: 0 0 16px; color: ${brand.subtext}; font-size: 16px; }
        .hero-inner ul { margin: 8px 0 0; padding: 0; list-style: none; display: grid; gap: 10px; }
        .hero-inner li {
          display: grid; grid-template-columns: 18px 1fr; align-items: start; gap: 10px;
          color: ${brand.text}; font-weight: 700;
        }
        .hero-inner li::before { content: "✓"; color: ${brand.primary}; font-weight: 900; line-height: 1.2; }
        .auth-right { display: grid; place-items: center; padding: clamp(16px, 4vw, 40px); position: relative; }
        .back-arrow-left {
          position: absolute;
          top: 16px;
          left: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: ${brand.surface};
          border-radius: 50%;
          padding: 6px;
          box-shadow: ${brand.shadow};
          border: 1px solid ${brand.border};
          transition: background 0.2s ease;
          z-index: 10;
        }
        .back-arrow-left:hover { background: ${brand.surfaceMuted}; }
      `}</style>
    </div>
  );
}

/** Extract Cognito sub from Amplify user object */
function getCognitoSub(user) {
  return user?.userId || user?.username || user?.attributes?.sub || null;
}

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
                <Route path="/dashboard" element={<Dashboard />} />
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
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
          </div>
        </DataProvider>
      </MuiThemeProvider>
    </ColorModeContext.Provider>
  );
}

function LoginScreen() {
  const { user } = useAuthenticator((ctx) => [ctx.user]);
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <LoginLayout>
      <Authenticator
        components={amplifyComponents}
        loginMechanisms={["email"]}
        // Standard attributes to collect & store
        signUpAttributes={["given_name", "family_name"]}
        // Custom attributes — use the exact API names in your pool.
        formFields={{
          signUp: {
            given_name: {
              label: "First name",
              placeholder: "Jane",
              isRequired: true,
              order: 1,
            },
            family_name: {
              label: "Last name",
              placeholder: "Doe",
              isRequired: true,
              order: 2,
            },
            "custom:Company": {
              label: "Company",
              placeholder: "Acme Foods",
              isRequired: true,
              order: 3,
            },
            "custom:jobTitle": {
              label: "Job title",
              placeholder: "Operations Manager",
              isRequired: true,
              order: 4,
            },
            email: { order: 5, isRequired: true },
            password: { order: 6, isRequired: true },
            confirm_password: { order: 7, isRequired: true },
          },
        }}
        services={{
          validateCustomSignUp: async (formData) => {
            const errors = {};
            const attrs = formData?.attributes || {};
            const get = (k) =>
              attrs[k] ??
              formData?.[k] ??
              (k === "custom:Company" ? attrs["custom:company"] : undefined) ??
              (k === "custom:jobTitle" ? attrs["custom:job_title"] : undefined);

            const isBlank = (v) => !v || String(v).trim() === "";

            if (!formData?.acknowledgement) {
              errors.acknowledgement = "You must accept the Terms and Conditions.";
            }

            if (isBlank(get("given_name"))) errors["given_name"] = "First name is required.";
            if (isBlank(get("family_name"))) errors["family_name"] = "Last name is required.";
            if (isBlank(get("custom:Company"))) errors["custom:Company"] = "Company is required.";
            if (isBlank(get("custom:jobTitle"))) errors["custom:jobTitle"] = "Job title is required.";

            const emailVal = formData?.username || get("email");
            if (isBlank(emailVal)) errors["email"] = "Email is required.";
            if (isBlank(formData?.password)) errors["password"] = "Password is required.";
            if (isBlank(formData?.confirm_password)) errors["confirm_password"] = "Confirm your password.";

            return errors;
          },
        }}
      />
    </LoginLayout>
  );
}

function PublicLanding() {
  const { user } = useAuthenticator((ctx) => [ctx.user]);
  return user ? <Navigate to="/dashboard" replace /> : <LandingPage />;
}

function ProtectedApp() {
  const { user } = useAuthenticator((ctx) => [ctx.user]);

  if (!user) {
    return <Navigate to="/login" replace />;
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
          <Text style={{ color: brand.subtext, fontWeight: 600 }}>
            Preparing your workspace…
          </Text>
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

function App() {
  return (
    <AmplifyThemeProvider theme={noryTheme}>
      <Authenticator.Provider>
        <Routes>
          <Route path="/" element={<PublicLanding />} />
          <Route path="/contact" element={<ContactPage />} /> {/* ✅ Public Contact route */}
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/*" element={<ProtectedApp />} />
        </Routes>
      </Authenticator.Provider>
    </AmplifyThemeProvider>
  );
}

export default App;
