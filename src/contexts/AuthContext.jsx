// src/contexts/AuthContext.js
import { createContext, useContext, useState, useEffect } from "react";
import { CognitoUserPool, CognitoUserAttribute } from "amazon-cognito-identity-js";
import awsExports from "../aws-exports";

const poolData = {
  UserPoolId: awsExports.aws_user_pools_id,
  ClientId: awsExports.aws_user_pools_web_client_id,
};
const userPool = new CognitoUserPool(poolData);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [cognitoId, setCognitoId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [idToken, setIdToken] = useState(null);

  // on mount, fetch user & attributes
  useEffect(() => {
    let mounted = true;
    const user = userPool.getCurrentUser();
    if (!user) {
      if (mounted) {
        setLoading(false);
        setCognitoId(null);
        setUserProfile(null);
        setIdToken(null);
      }
      return;
    }

    setCognitoId(user.getUsername());

    user.getSession((err, session) => {
      if (err) {
        console.error("Session error:", err);
        if (mounted) {
          setLoading(false);
          setIdToken(null);
        }
        return;
      }

      try {
        const token = session.getIdToken().getJwtToken();
        if (mounted) setIdToken(token);
      } catch (e) {
        if (mounted) setIdToken(null);
      }

      user.getUserAttributes((errAttrs, attrs) => {
        if (errAttrs) {
          console.error("Attributes error:", errAttrs);
          if (mounted) setLoading(false);
          return;
        }
        const profile = attrs.reduce((acc, a) => {
          acc[a.getName()] = a.getValue();
          return acc;
        }, {});
        if (mounted) {
          setUserProfile(profile);
          setLoading(false);
        }
      });
    });

    return () => {
      mounted = false;
    };
  }, []);

  // updateProfile using CognitoUserAttribute
  const updateProfile = (updates) =>
    new Promise((resolve, reject) => {
      const user = userPool.getCurrentUser();
      if (!user) return reject(new Error("No user to update"));
      user.getSession((e1, session) => {
        if (e1) return reject(e1);
        const attributeList = Object.entries(updates).map(
          ([Name, Value]) => new CognitoUserAttribute({ Name, Value })
        );
        user.updateAttributes(attributeList, (err, result) => {
          if (err) return reject(err);
          setUserProfile((prev) => ({ ...prev, ...updates }));
          resolve(result);
        });
      });
    });

  // signOut: calls Cognito signOut if present, then does defensive cleanup
  const signOut = async () => {
    try {
      const user = userPool.getCurrentUser();
      if (user && typeof user.signOut === "function") {
        try {
          // Cognito signOut (client-side)
          user.signOut();
          console.log("[AuthContext] Cognito user.signOut() invoked");
        } catch (e) {
          console.warn("[AuthContext] user.signOut() threw:", e);
        }
      } else {
        console.warn("[AuthContext] No Cognito user to sign out");
      }
    } catch (err) {
      console.warn("[AuthContext] signOut error:", err);
    }

    // Defensive cleanup of localStorage keys commonly used by Cognito / amplify / app
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
        if (prefixes.some((p) => k.startsWith(p) || k === p)) {
          localStorage.removeItem(k);
        }
      });
    } catch (e) {
      console.warn("[AuthContext] localStorage cleanup error", e);
    }

    // Clear all cookies (best-effort)
    try {
      document.cookie.split(";").forEach((c) => {
        const name = c.split("=")[0].trim();
        // expire cookie on all common paths
        document.cookie =
          name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax";
        document.cookie =
          name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
      });
    } catch (e) {
      console.warn("[AuthContext] cookie cleanup error", e);
    }

    // Reset local React state
    setCognitoId(null);
    setUserProfile(null);
    setIdToken(null);

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
