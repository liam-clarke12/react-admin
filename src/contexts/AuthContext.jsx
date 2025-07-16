// src/contexts/AuthContext.js
import { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser } from "aws-amplify/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [cognitoId, setCognitoId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1) Grab the CognitoUser on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          console.warn("No Cognito user found");
          setLoading(false);
          return;
        }
        setCognitoId(user.getUsername());
        // 2) Pull all attributes
        user.getUserAttributes((err, attrs) => {
          if (err) {
            console.error("getUserAttributes error", err);
            setLoading(false);
            return;
          }
          // Turn array into an object map
          const profile = attrs.reduce((acc, { Name, Value }) => {
            acc[Name] = Value;
            return acc;
          }, {});
          setUserProfile(profile);
          setLoading(false);
        });
      } catch (err) {
        console.error("Error fetching Cognito user", err);
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // 3) Helper to save edits back to Cognito
  const updateProfile = (updates) => {
    return new Promise(async (resolve, reject) => {
      try {
        const user = await getCurrentUser();
        // `updates` is { name: "...", phone_number: "...", … }
        const attributeList = Object.entries(updates).map(
          ([Name, Value]) => ({ Name, Value })
        );
        user.updateAttributes(attributeList, (err, result) => {
          if (err) return reject(err);
          // Merge new values into userProfile
          setUserProfile(p => ({ ...p, ...updates }));
          resolve(result);
        });
      } catch (err) {
        reject(err);
      }
    });
  };

  return (
    <AuthContext.Provider value={{ cognitoId, userProfile, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
