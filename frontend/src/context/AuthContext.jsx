import { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode(token);
          if (decoded.exp * 1000 > Date.now()) {
            setUser({
              userId: decoded.userId,
              username: decoded.username,
              role: decoded.role,
            });
          } else {
            localStorage.removeItem("token");
          }
        } catch {
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (token, userData) => {
    localStorage.setItem("token", token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const isAdmin = user?.role === "ADMIN";
  const isAnalyst = ["ADMIN", "ANALYST", "COACH"].includes(user?.role);
  const isLoggedIn = !!user;

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, isAdmin, isAnalyst, isLoggedIn }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export { AuthContext };
