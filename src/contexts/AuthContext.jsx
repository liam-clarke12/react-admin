import { createContext, useContext } from "react";

// Create the context
const AuthContext = createContext();

// Provider that accepts value from outside
export const AuthProvider = ({ children, value }) => {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


// Hook to use the context
export const useAuth = () => useContext(AuthContext);
