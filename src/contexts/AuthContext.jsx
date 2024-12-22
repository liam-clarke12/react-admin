// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

// Create the context for authentication
const AuthContext = createContext();

// Custom hook to use the Auth context
export const useAuth = () => useContext(AuthContext);

// AuthProvider to wrap the App and provide authentication status
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if the user is authenticated, e.g., by checking localStorage or a session cookie
    const userAuthenticated = localStorage.getItem("isAuthenticated");
    setIsAuthenticated(userAuthenticated === "true");
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
