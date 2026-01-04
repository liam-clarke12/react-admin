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

// ✅ Set in env
const BILLING_STATUS_ENDPOINT =
  import.meta?.env?.VITE_BILLING_STATUS_ENDPOINT ||
  process.env.REACT_APP_BILLING_STATUS_ENDPOINT ||
  "";

/**
 * ✅ Always get the REAL Cognito sub from the session token payload
 * (user.getUsername() is often email/username, NOT sub)
 */
function getCognitoSubFromSession(session) {
  try {
    const payload = session?.getIdToken?.()?.payload;
    return payload?.sub || null;
  } catch (e) {
    return null;
  }
}

function getJwtFromSession(session) {
  try {
    return session?.getIdToken?.()?.getJwtToken?.() || null;
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
  // ✅ If you pass initialCognitoId from App.jsx, start with it
  const [cognitoId, setCognitoId] = useState(initialCognitoId || null);

  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [idToken, setIdToken] = useState(null);

  // ✅ billing
  const [billingStatus, setBillingStatus] = useState("unknown"); // unknown | none | trialing | active | past_due | canceled
  const [billingLoading, setBillingLoading] = useState(true);

  const fetchBillingStatus = useCallback(async (cognitoSub, token) => {
    // NOTE: cognitoSub must be the TRUE token sub (UUID)
    if (!cognitoSub) {
      setBillingStatus("none");
      setBillingLoading(false);
      return;
    }

    if (!BILLING_STATUS_ENDPOINT) {
      console.warn("[AuthContext] Missing BILLING_STATUS_ENDPOINT env var");
      setBillingStatus("none");
      setBillingLoading(false);
      return;
    }

    setBillingLoading(true);
    try {
      const url = `${BILLING_STATUS_ENDPOINT}?cognitoSub=${encodeURIComponent(cognitoSub)}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      // If backend returns non-200, handle it cleanly
      let data = null;
      try {
        data = await res.json();
      } catch (e) {
        data = null;
      }

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Billing status request failed (${res.status})`);
      }

      const s = data?.user?.billingStatus || "none";
      setBillingStatus(s);
    } catch (e) {
      console.warn("[AuthContext] fetchBillingStatus error:", e);
      setBillingStatus("none");
    } finally {
      setBillingLoading(false);
    }
  }, []);

  /**
   * ✅ Single "bootstrap" that:
   * - gets session
   * - extracts TRUE cognito sub from token payload
   * - sets idToken
   * - fetches billing
   * - fetches attributes/profile
   */
  const bootstrap = useCallback(async () => {
    const user = userPool.getCurrentUser();

    if (!user) {
      setLoading(false);
      setCognitoId(null);
      setUserProfile(null);
      setIdToken(null);

      setBillingStatus("none");
      setBillingLoading(false);
      return;
    }

    try {
      const session = await getSessionAsync(user);

      const token = getJwtFromSession(session);
      setIdToken(token);

      const realSub = getCognitoSubFromSession(session);

      // ✅ Important: this is the ID your Dynamo + Stripe should be keyed on
      setCognitoId(realSub);

      // ✅ Fetch billing ASAP
      await fetchBillingStatus(realSub, token);

      // Fetch attributes/profile (not required for billing, but useful)
      try {
        const attrs = await getUserAttributesAsync(user);
        const profile = attrs.reduce((acc, a) => {
          acc[a.getName()] = a.getValue();
          return acc;
        }, {});
        setUserProfile(profile);
      } catch (attrErr) {
        console.warn("[AuthContext] Attributes error:", attrErr);
      }
    } catch (err) {
      console.error("[AuthContext] Session error:", err);

      setCognitoId(null);
      setUserProfile(null);
      setIdToken(null);

      setBillingStatus("none");
      setBillingLoading(false);
    } finally {
      setLoading(false);
    }
  }, [fetchBillingStatus]);

  // ✅ on mount (and when initialCognitoId changes, we still bootstrap)
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
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
      const token = getJwtFromSession(session);
      const realSub = getCognitoSubFromSession(session);

      // keep state consistent
      setIdToken(token);
      setCognitoId(realSub);

      await fetchBillingStatus(realSub, token);
    } catch (e) {
      console.warn("[AuthContext] refreshBilling error:", e);
      setBillingStatus("none");
      setBillingLoading(false);
    }
  }, [fetchBillingStatus]);

  // updateProfile using CognitoUserAttribute
  const updateProfile = (updates) =>
    new Promise((resolve, reject) => {
      const user = userPool.getCurrentUser();
      if (!user) return reject(new Error("No user to update"));
      user.getSession((e1) => {
        if (e1) return reject(e1);
        const attributeList = Object.entries(updates).map(([Name, Value]) => new CognitoUserAttribute({ Name, Value }));
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

    try {
      document.cookie.split(";").forEach((c) => {
        const name = c.split("=")[0].trim();
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax";
        document.cookie =
          name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
      });
    } catch (e) {
      console.warn("[AuthContext] cookie cleanup error", e);
    }

    setCognitoId(null);
    setUserProfile(null);
    setIdToken(null);

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
        idToken,

        // billing
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
