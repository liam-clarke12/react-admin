// src/contexts/AuthContext.js
import { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser } from "aws-amplify/auth";

// Create AuthContext
const AuthContext = createContext();

// AuthProvider component to wrap the entire app
export const AuthProvider = ({ children }) => {
  const [cognitoId, setCognitoId] = useState(null);

  useEffect(() => {
    const fetchCognitoId = async () => {
      try {
        const user = await getCurrentUser();
        console.log("✅ Fetched Cognito ID:", user); // Log the user object
        if (user) {
          setCognitoId(user.username);
        } else {
          console.log("❌ No user found.");
        }
      } catch (error) {
        console.error("❌ Error fetching Cognito ID:", error);
      }
    };

    fetchCognitoId();
  }, []); // This effect will run once when the component mounts

  return (
    <AuthContext.Provider value={{ cognitoId }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access to context
export const useAuth = () => useContext(AuthContext);
