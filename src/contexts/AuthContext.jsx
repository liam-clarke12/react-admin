// src/contexts/AuthContext.js
import { createContext, useContext, useState, useEffect } from "react";
import { Auth } from "aws-amplify";

// Create AuthContext
const AuthContext = createContext();

// AuthProvider component to wrap the entire app
export const AuthProvider = ({ children }) => {
  const [cognitoId, setCognitoId] = useState(null);
  const [userAttributes, setUserAttributes] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, load current user and their attributes
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await Auth.currentAuthenticatedUser();
        // user.username is the Cognito 'sub' / ID
        setCognitoId(user.username);
        // user.attributes contains email, name, phone_number, custom:company, picture, etc.
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

  // Helper to update user attributes in Cognito
  const updateAttributes = async (attrs) => {
    // attrs is an object like { name: "...", phone_number: "...", 'custom:company': "..." }
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

// Custom hook for easy access to context
export const useAuth = () => useContext(AuthContext);
