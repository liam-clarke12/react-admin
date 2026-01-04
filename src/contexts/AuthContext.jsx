// src/contexts/AuthContext.js
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CognitoUserPool, CognitoUserAttribute } from "amazon-cognito-identity-js";
import awsExports from "../aws-exports";

const poolData = {
  UserPoolId: awsExports.aws_user_pools_id,
  ClientId: awsExports.aws_user_pools_web_client_id,
};
const userPool = new CognitoUserPool(poolData);

const AuthContext = createContext();

// ✅ CRA env only (remove Vite import.meta to avoid ambiguity)
const BILLING_STATUS_ENDPOINT = process.env.REACT_APP_BILLING_STATUS_ENDPOINT || "";

/**
 * ✅ Get the REAL Cognito sub from the *ID token* payload (stable UUID)
 */
function getCognitoSubFromSession(session) {
  try {
    const payload = session?.getIdToken?.()?.payload;
    return payload?.sub || null;
  } catch (e) {
    return null;
  }
}

/**
 * ✅ For API Gateway JWT authorizer:
 * Prefer the ID token for "who is the user" claims (sub),
 * and it tends to match common audience/issuer setups cleanly.
 *
 * If your authorizer is explicitly set up for access tokens, switch back.
 */
function getApiJwtFromSession(session) {
  try {
    return session?.getIdToken?.()?.getJwtToken?.() || null; // ✅ ID token
  } catch (e) {
    return null;
  }
}

/**
 * Promisified getSession
 */
function getSessionAsync(user) {
  return new Promise((resolve, reject) => {
    if (!user) return reject(new Error("No user"));
    user.getSession((err, session) => {
      if (err) return reject(err);
      // session.isValid() checks exp vs now
      if (!session?.isValid?.()) return reject(new Error("Session invalid/expired"));
      resolve(session);
    });
  });
}

/**
 * Promisified getUserAttributes
 */
function getUserAttributesAsync(user) {
  return new Promise((resolve, reject) => {
    if (!user) return reject(new Error("No user"));
    user.getUserAttributes((err, attrs) => {
      if (err) return reject(err);
      resolve(attrs || []);
    });
  });
}

export const AuthProvider = ({ children, initialCognitoId }) => {
  const [cognitoId, setCognitoId] = useState(initialCognitoId || null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ token you use for API calls
  const [apiToken, setApiToken] = useState(null);

  // ✅ billing
  const [billingStatus, setBillingStatus] = useState("unknown"); // unknown | none | trialing | active | past_due | canceled | cancelling
  const [billingLoading, setBillingLoading] = useState(true);

  const fetchBillingStatus = useCallback(async (token) => {
    if (!BILLING_STATUS_ENDPOINT) {
      console.warn("[AuthContext] Missing REACT_APP_BILLING_STATUS_ENDPOINT");
      setBillingStatus("none");
      setBillingLoading(false);
      return;
    }

    if (!token) {
      setBillingStatus("none");
      setBillingLoading(false);
      return;
    }

    setBillingLoading(true);
    try {
      const res = await fetch(BILLING_STATUS_ENDPOINT, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Some gateway errors are not JSON; handle both.
      let data = null;
      const text = await res.text();
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!res.ok || !data?.ok) {
        const msg = data?.error || `Billing status request failed (${res.status})`;
        throw new Error(msg);
      }

      // Supports:
      // { ok:true, user:{ billingStatus:"active" } }
      // { ok:true, status:"active" }
      const s = data?.user?.billingStatus || data?.status || "none";
      setBillingStatus(String(s).toLowerCase());
    } catch (e) {
      console.warn("[AuthContext] fetchBillingStatus error:", e?.message || e);
      setBillingStatus("none");
    } finally {
      setBillingLoading(false);
    }
  }, []);

  /**
   * ✅ Single bootstrap:
   * - get session
   * - extract sub from ID token payload
   * - get token for API calls
   * - fetch billing
   * - fetch attributes/profile
   */
  const bootstrap = useCallback(async () => {
    const user = userPool.getCurrentUser();

    if (!user) {
      setCognitoId(null);
      setUserProfile(null);
      setApiToken(null);

      setBillingStatus("none");
      setBillingLoading(false);
      setLoading(false);
      return;
    }

    try {
      const session = await getSessionAsync(user);

      const token = getApiJwtFromSession(session);
      setApiToken(token);

      const realSub = getCognitoSubFromSession(session);
      setCognitoId(realSub);

      // ✅ Billing ASAP
      await fetchBillingStatus(token);

      // Attributes/profile
      try {
        const attrs = await getUserAttributesAsync(user);
        const profile = attrs.reduce((acc, a) => {
          acc[a.getName()] = a.getValue();
          return acc;
        }, {});
        setUserProfile(profile);
      } catch (attrErr) {
        console.warn("[AuthContext] Attributes error:", attrErr?.message || attrErr);
      }
    } catch (err) {
      console.error("[AuthContext] bootstrap error:", err?.message || err);

      setCognitoId(null);
      setUserProfile(null);
      setApiToken(null);

      setBillingStatus("none");
      setBillingLoading(false);
    } finally {
      setLoading(false);
    }
  }, [fetchBillingStatus]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      // helpful one-time debug line
      if (BILLING_STATUS_ENDPOINT) {
        // eslint-disable-next-line no-console
        console.log("[AuthContext] Billing endpoint:", BILLING_STATUS_ENDPOINT);
      }
      await bootstrap();
    })();
    return () => {
      mounted = false;
    };
  }, [bootstrap]);

  // ✅ Allow pages to force-refresh billing status
  const refreshBilling = useCallback(async () => {
    const user = userPool.getCurrentUser();

    if (!user) {
      setBillingStatus("none");
      setBillingLoading(false);
      return;
    }

    setBillingLoading(true);
    try {
      const session = await getSessionAsync(user);
      const token = getApiJwtFromSession(session);
      const realSub = getCognitoSubFromSession(session);

      setApiToken(token);
      setCognitoId(realSub);

      await fetchBillingStatus(token);
    } catch (e) {
      console.warn("[AuthContext] refreshBilling error:", e?.message || e);
      setBillingStatus("none");
      setBillingLoading(false);
    }
  }, [fetchBillingStatus]);

  // updateProfile using CognitoUserAttribute
  const updateProfile = (updates) =>
    new Promise((resolve, reject) => {
      const user = userPool.getCurrentUser();
      if (!user) return reject(new Error("No user to update"));

      user.getSession((e1, session) => {
        if (e1) return reject(e1);
        if (!session?.isValid?.()) return reject(new Error("Session invalid/expired"));

        const attributeList = Object.entries(updates).map(([Name, Value]) => {
          return new CognitoUserAttribute({ Name, Value });
        });

        user.updateAttributes(attributeList, (err, result) => {
          if (err) return reject(err);
          setUserProfile((prev) => ({ ...(prev || {}), ...updates }));
          resolve(result);
        });
      });
    });

  // signOut
  const signOut = async () => {
    try {
      const user = userPool.getCurrentUser();
      if (user && typeof user.signOut === "function") {
        try {
          user.signOut();
          console.log("[AuthContext] Cognito user.signOut() invoked");
        } catch (e) {
          console.warn("[AuthContext] user.signOut() threw:", e);
        }
      }
    } catch (err) {
      console.warn("[AuthContext] signOut error:", err);
    }

    // local storage cleanup (best-effort)
    try {
      const prefixes = [
        "CognitoIdentityServiceProvider",
        "amplify-authenticator",
        "aws-amplify",
        "persist:",
        "idToken",
        "accessToken",
        "refreshToken",
        "authUser",
      ];
      Object.keys(localStorage).forEach((k) => {
        if (prefixes.some((p) => k.startsWith(p) || k === p)) localStorage.removeItem(k);
      });
    } catch (e) {
      console.warn("[AuthContext] localStorage cleanup error", e);
    }

    // cookie cleanup (best-effort)
    try {
      document.cookie.split(";").forEach((c) => {
        const name = c.split("=")[0].trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
      });
    } catch (e) {
      console.warn("[AuthContext] cookie cleanup error", e);
    }

    setCognitoId(null);
    setUserProfile(null);
    setApiToken(null);

    setBillingStatus("none");
    setBillingLoading(false);
    setLoading(false);

    return Promise.resolve();
  };

  return (
    <AuthContext.Provider
      value={{
        cognitoId,
        userProfile,
        updateProfile,
        loading,
        signOut,

        apiToken,

        billingStatus,
        billingLoading,
        refreshBilling,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
