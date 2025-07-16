// src/contexts/AuthContext.js
import { createContext, useContext, useState, useEffect } from "react";
import Auth from "@aws-amplify/auth";
import { Amplify } from "aws-amplify";
import awsExports from "../aws-exports";

// configure Amplify
Amplify.configure(awsExports);
Auth.configure(awsExports);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [cognitoId, setCognitoId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // on mount, fetch user + attributes
  useEffect(() => {
    (async () => {
      try {
        const user = await Auth.currentAuthenticatedUser();
        setCognitoId(user.username);
        setUserProfile(user.attributes);
      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateProfile = async (updates) => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      // updates is a plain { name, phone_number, ... } object
      await Auth.updateUserAttributes(user, updates);
      // merge locally
      setUserProfile((prev) => ({ ...prev, ...updates }));
    } catch (err) {
      console.error("❌ updateProfile failed:", err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ cognitoId, userProfile, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
