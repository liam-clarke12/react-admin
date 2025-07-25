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

  // on mount, fetch user & attributes
  useEffect(() => {
    const user = userPool.getCurrentUser();
    if (!user) {
      console.warn("No Cognito user found");
      setLoading(false);
      return;
    }
    setCognitoId(user.getUsername());
    user.getSession((err, session) => {
      if (err) {
        console.error("Session error:", err);
        setLoading(false);
        return;
      }
      user.getUserAttributes((err, attrs) => {
        if (err) {
          console.error("Attributes error:", err);
          setLoading(false);
          return;
        }
        const profile = attrs.reduce((acc, a) => {
          acc[a.getName()] = a.getValue();
          return acc;
        }, {});
        setUserProfile(profile);
        setLoading(false);
      });
    });
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

  return (
    <AuthContext.Provider value={{ cognitoId, userProfile, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
