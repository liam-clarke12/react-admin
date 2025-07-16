import { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [cognitoId, setCognitoId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Grab cognitoId on mount
  useEffect(() => {
    const fetchCognitoId = async () => {
      try {
        const user = await getCurrentUser();
        if (user && user.username) {
          setCognitoId(user.username);
        } else {
          console.warn("No Cognito user found");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching Cognito ID:", err);
        setLoading(false);
      }
    };
    fetchCognitoId();
  }, []);

  // 2. When cognitoId is known, fetch full profile from your backend
  useEffect(() => {
    if (!cognitoId) return;
    const fetchProfile = async () => {
      try {
        const resp = await axios.get("/api/me", {
          headers: { Authorization: `Bearer ${cognitoId}` }
        });
        // expect { email, name, phone_number, address, company, picture }
        setUserProfile(resp.data);
      } catch (err) {
        console.error("Error fetching user profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [cognitoId]);

  // 3. Helper to update profile via your backend
  const updateProfile = async (updates) => {
    const resp = await axios.put("/api/me", updates, {
      headers: { Authorization: `Bearer ${cognitoId}` }
    });
    setUserProfile(resp.data);
    return resp.data;
  };

  return (
    <AuthContext.Provider value={{
      cognitoId,
      userProfile,
      updateProfile,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
