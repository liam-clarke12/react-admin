// src/contexts/AuthContext.js
import { createContext, useContext, useState, useEffect } from "react";
import { Amplify } from "aws-amplify";
import Auth from "@aws-amplify/auth";
import awsExports from "../aws-exports";  // wherever your aws-exports.js lives

// Configure Amplify and the Auth category
Amplify.configure(awsExports);
Auth.configure(awsExports);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [cognitoId, setCognitoId] = useState(null);
  const [userAttributes, setUserAttributes] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await Auth.currentAuthenticatedUser();
        setCognitoId(user.username);
        setUserAttributes(user.attributes);
      } catch (error) {
        console.error("❌ Error fetching user:", error);
        setUserAttributes(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const updateAttributes = async (attrs) => {
    const user = await Auth.currentAuthenticatedUser();
    return Auth.updateUserAttributes(user, attrs);
  };

  return (
    <AuthContext.Provider value={{
      cognitoId,
      userAttributes,
      updateAttributes,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
